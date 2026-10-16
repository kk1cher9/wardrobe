// Driply — the social part of Weather Wardrobe. ONE serverless function, routed by ?a=<action> (GET) or {op} (POST).
// Everything is keyed by the verified session (user.sub): authorisation is decided HERE, never in the browser.
// Storage: the same Redis (Upstash / Vercel KV) as the wardrobe sync. Key schema is documented in README ("Driply").
const crypto = require('crypto');
const { handler, send, body, err, db, dbm, rateLimit } = require('./_lib');

const P = 'wd:s:';
const VER = new Set(String(process.env.VERIFIED_NICKS || '').toLowerCase().split(/[\s,;]+/).filter(Boolean)); // accounts with the blue check (set in Vercel env)
const STYLES = ['Streetwear', 'Casual', 'Minimalism', 'Old Money', 'Techwear', 'Smart Casual', 'Sporty', 'Grunge', 'Vintage', 'Y2K', 'Preppy', 'Other'];
const NICK = /^[a-z0-9_.]{3,20}$/;
const RESERVED = new Set(['admin', 'administrator', 'driply', 'support', 'moderator', 'root', 'system', 'help', 'official', 'null', 'undefined']);
const PAGE = 12;
const MAX_IMG = 600 * 1024, MAX_THUMB = 90 * 1024, MAX_AVATAR = 60 * 1024, MAX_STORY = 420 * 1024, STORY_TTL = 24 * 3600 * 1000;
const MAX_GIF = 260 * 1024, MAX_FIT = 30 * 1024, MAX_VID = 14 * 1024 * 1024, VCHUNK = 512 * 1024, VRANGE = 2 * 1024 * 1024, VID_MIME = /^video\/(mp4|quicktime|webm)$/;
const GIF_URL = /^https:\/\/media\d*\.giphy\.com\/[A-Za-z0-9_\/.\-]+$/;
const MAX_COMMENTS = 300;
const HEX = /^#[0-9a-f]{6}$/i;

const jp = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const nowId = (pre) => pre + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
const txt = (v, max, multiline) => String(v == null ? '' : v).replace(multiline ? /[\u0000-\u0009\u000b-\u001f\u007f​-‏‪-‮⁦-⁩]/g : /[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, '').replace(multiline ? /\n{3,}/g : /\s+/g, multiline ? '\n\n' : ' ').trim().slice(0, max);
const idOk = (id) => /^[a-z0-9]{6,32}$/.test(String(id || ''));
const q1 = (req, k) => { const v = req.query && req.query[k] !== undefined ? req.query[k] : new URL(req.url, 'http://x').searchParams.get(k); return Array.isArray(v) ? String(v[0] || '') : String(v == null ? '' : v); };

/* ---------- images: type by magic bytes, size caps ---------- */
function parseImg(d, max) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(d || ''));
  if (!m) throw err(400, 'bad_image');
  const buf = Buffer.from(m[2], 'base64');
  if (!buf.length) throw err(400, 'bad_image');
  if (buf.length > max) throw err(413, 'image_too_large');
  const ok = m[1] === 'image/png' ? buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    : m[1] === 'image/jpeg' ? buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
      : buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  if (!ok) throw err(400, 'bad_image');
  return m[1] + '|' + m[2];
}

/* ---------- profile helpers ---------- */
const getProf = async (sub) => jp(await db('GET', P + 'prof:' + sub));
async function needProf(user) {
  const p = await getProf(user.sub);
  if (!p) throw err(409, 'profile_required');
  return p;
}
function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9_.]+/g, '').replace(/^[._]+/, '').slice(0, 16); }
async function suggestNick(user) {
  const base = slug((user.email || '').split('@')[0]) || slug(user.name) || 'user';
  const b = base.length >= 3 ? base : base + 'user';
  for (let i = 0; i < 8; i++) {
    const n = i ? (b.slice(0, 16) + Math.floor(Math.random() * 900 + 100)) : b;
    if (NICK.test(n) && !RESERVED.has(n) && !(await db('GET', P + 'nick:' + n))) return n;
  }
  return 'user' + crypto.randomBytes(3).toString('hex');
}
// ---- profile extras: clothing styles, optional earning status (owner decides if it is public), favourite brands
const FSTY = ['Streetwear', 'Casual', 'Minimalism', 'Old Money', 'Techwear', 'Vintage', 'Y2K', 'Grunge', 'Sportstyle', 'Smart Casual', 'High Fashion'];
const EARN = ['none', 'start', 'style', 'clients', 'designer', 'biz', 'other', 'hidden'];
const BRANDS = ['Nike', 'Adidas', 'Stüssy', 'Carhartt WIP', 'Supreme', 'Acne Studios', 'Balenciaga', 'Rick Owens', 'New Balance', 'COS', 'Zara', 'H&M', "Levi's", 'The North Face', 'Arc\'teryx', 'Stone Island', 'Palace', 'Dr. Martens'];
const cleanList = (v, max, len) => { // array of short strings, de-duplicated case-insensitively
  const out = [], seen = new Set(); if (!Array.isArray(v)) return out;
  for (const x of v) { const t = txt(x, len); if (!t) continue; const k = t.toLowerCase(); if (seen.has(k)) continue; seen.add(k); out.push(t); if (out.length >= max) break; }
  return out;
};
const profExtra = (p, own) => {
  const o = { fst: (p && p.fst) || [], brands: (p && p.brands) || [] };
  if (own) { o.earn = (p && p.earn) || ''; o.earnPub = !!(p && p.earnPub); } // the owner always sees what is stored
  else if (p && p.earnPub && p.earn && p.earn !== 'hidden') o.earn = p.earn; // others only see it when the owner made it public
  return o;
};
const pubAuthor = (p, nick) => ({ verified: !!(p && VER.has(p.nick)), nick: p ? p.nick : nick || 'deleted', name: p ? p.name : '', avatar: p ? (p.avv ? '/api/social?a=avatar&nick=' + p.nick + '&v=' + p.avv : p.avatar || '') : '' });


/* ---------- editor extras: GIF stickers (overlay layer), "what I wear" strip, video ---------- */
function parseGif(d) {
  const m = /^data:image\/gif;base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(d || '')); if (!m) throw err(400, 'bad_image');
  const buf = Buffer.from(m[1], 'base64'); if (!buf.length || buf.length > MAX_GIF) throw err(413, 'image_too_large');
  if (buf.subarray(0, 4).toString() !== 'GIF8') throw err(400, 'bad_image');
  return 'image/gif|' + m[1];
}
const cleanGifs = (a) => (Array.isArray(a) ? a : []).slice(0, 3).map(parseGif);
const clampN = (v, lo, hi, d) => { v = Number(v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
function cleanOv(a, nGifs) { // sticker layer: [{u|g, x, y, w, r}] positions in % of the picture
  const out = [];
  for (const o of (Array.isArray(a) ? a : []).slice(0, 8)) {
    if (!o || typeof o !== 'object') continue; const e = { x: +clampN(o.x, 0, 100, 50).toFixed(2), y: +clampN(o.y, 0, 100, 50).toFixed(2), w: +clampN(o.w, 4, 100, 30).toFixed(2), r: Math.round(clampN(o.r, -180, 180, 0)) };
    if (typeof o.u === 'string' && o.u.length < 300 && GIF_URL.test(o.u)) e.u = o.u; else if (Number.isInteger(o.g) && o.g >= 0 && o.g < nGifs) e.g = o.g; else continue;
    out.push(e);
  }
  return out;
}
function cleanFit(a) { return (Array.isArray(a) ? a : []).slice(0, 6).map((i) => ({ n: txt(i && i.n, 60), c: txt(i && i.c, 30), img: parseImg(i && i.img, MAX_FIT) })).filter((i) => i.n); }
const ovPub = (ov, base) => (ov || []).map((o) => ({ x: o.x, y: o.y, w: o.w, r: o.r, u: o.u || base + '&k=' + o.g }));
const bin = (res, v, maxAge) => { const [mime, b64] = v.split('|'); res.statusCode = 200; res.setHeader('Content-Type', mime); res.setHeader('Cache-Control', 'private, max-age=' + maxAge + ', immutable'); res.setHeader('X-Content-Type-Options', 'nosniff'); return res.end(Buffer.from(b64, 'base64')); };
const vidKeys = (k, n) => Array.from({ length: n }, (_, i) => P + 'pvc:' + k + ':' + i);
function postKeysToDelete(cur) { // every key that belongs to one post
  const k = [P + 'post:' + cur.id, P + 'img:' + cur.id, P + 'th:' + cur.id, P + 'likes:' + cur.id, P + 'savers:' + cur.id, P + 'cm:' + cur.id, P + 'rps:' + cur.id];
  (cur.fit || []).forEach((_, i) => k.push(P + 'ft:' + cur.id + ':' + i)); for (let i = 0; i < 3; i++) k.push(P + 'ovg:' + cur.id + ':' + i);
  if (cur.vid) k.push(...vidKeys(cur.vid.k, cur.vid.n));
  return k;
}

/* ---------- post -> public JSON (counts + my flags are read in ONE pipeline) ---------- */
async function hydrate(posts, me) {
  posts = posts.filter(Boolean);
  if (!posts.length) return [];
  // a repost shows the ORIGINAL post (with the reposter on top); reposts of deleted originals vanish
  const rpI = posts.map((p, i) => (p.of ? i : -1)).filter((i) => i >= 0), wraps = posts.map(() => null);
  if (rpI.length) { const origs = await getPosts(rpI.map((i) => posts[i].of)); rpI.forEach((i, k) => { wraps[i] = posts[i]; posts[i] = origs[k]; }); }
  const keep = posts.map((p, i) => (p ? i : -1)).filter((i) => i >= 0); posts = keep.map((i) => posts[i]); const wr = keep.map((i) => wraps[i]);
  if (!posts.length) return [];
  const authors = [...new Set([...posts.map((p) => p.by), ...wr.filter(Boolean).map((w) => w.by)])];
  const cmds = [];
  authors.forEach((a) => { cmds.push(['GET', P + 'prof:' + a]); cmds.push(['SISMEMBER', P + 'following:' + me, a]); });
  posts.forEach((p) => {
    cmds.push(['SCARD', P + 'likes:' + p.id]); cmds.push(['SCARD', P + 'savers:' + p.id]); cmds.push(['HLEN', P + 'cm:' + p.id]);
    cmds.push(['SISMEMBER', P + 'likes:' + p.id, me]); cmds.push(['SISMEMBER', P + 'savers:' + p.id, me]);
    cmds.push(['HLEN', P + 'rps:' + p.id]); cmds.push(['HEXISTS', P + 'rps:' + p.id, me]);
  });
  const r = await dbm(cmds);
  const prof = {}, fol = {};
  authors.forEach((a, i) => { prof[a] = jp(r[i * 2]); fol[a] = !!r[i * 2 + 1]; });
  const o = authors.length * 2;
  return posts.map((p, i) => {
    const b = o + i * 7, au = pubAuthor(prof[p.by]), w = wr[i];
    const out = {
      id: p.id, ts: p.ts, title: p.title, caption: p.caption, style: p.style, items: p.items, palette: p.palette, wx: p.wx,
      author: { ...au, following: !!fol[p.by], me: p.by === me },
      likes: r[b], saves: r[b + 1], comments: r[b + 2], liked: !!r[b + 3], saved: !!r[b + 4], mine: p.by === me, reposts: Number(r[b + 5]) || 0, reposted: !!r[b + 6],
      img: `/api/social?a=img&id=${p.id}`, th: `/api/social?a=img&id=${p.id}&s=th`,
    };
    if (p.vid) out.vid = { url: `/api/social?a=pvid&id=${p.id}`, dur: p.vid.dur, w: p.vid.w, h: p.vid.h, mime: p.vid.mime };
    if (p.ov && p.ov.length) out.ov = ovPub(p.ov, `/api/social?a=ovg&id=${p.id}`);
    if (p.fit && p.fit.length) out.fit = p.fit.map((f, k) => ({ n: f.n, c: f.c, u: `/api/social?a=fit&id=${p.id}&k=${k}` }));
    if (w) { out.rid = w.id; out.rts = w.ts; out.rcap = w.cap || undefined; out.rby = { ...pubAuthor(prof[w.by]), me: w.by === me }; out.mine = false; }
    return out;
  });
}
const getPosts = async (ids) => (ids.length ? (await db('MGET', ...ids.map((i) => P + 'post:' + i))).map(jp) : []);
async function hotScore(id) {
  const [l, s, c] = await dbm([['SCARD', P + 'likes:' + id], ['SCARD', P + 'savers:' + id], ['HLEN', P + 'cm:' + id]]);
  return l * 3 + c * 2 + s * 2;
}
async function touchHot(post) { // keeps the trending index in sync with the real counters
  const sc = await hotScore(post.id);
  await db('ZADD', P + 'hot', sc + post.ts / 1e13, post.id); // ts tie-break: newer first among equals
}
async function notify(toSub, n) { // one notification per (type, actor, post); never to yourself
  if (toSub === n.by) return;
  const k = P + 'nz:' + toSub;
  if (await db('ZSCORE', k, n.id) !== null) return;
  await dbm([['HSET', P + 'nh:' + toSub, n.id, JSON.stringify({ id: n.id, type: n.type, by: n.by, post: n.post || null, text: n.text || '', ts: Date.now() })], ['ZADD', k, Date.now(), n.id]]);
  const cnt = await db('ZCARD', k);
  if (cnt > 150) { const old = await db('ZRANGE', k, 0, cnt - 101); if (old && old.length) await dbm([['ZREM', k, ...old], ['HDEL', P + 'nh:' + toSub, ...old]]); }
}

/* ---------- input cleaning ---------- */
function cleanPostFields(b) {
  const style = STYLES.includes(b.style) ? b.style : '';
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 12).map((i) => ({ n: txt(i && i.n, 60), c: txt(i && i.c, 30), col: txt(i && i.col, 30) })).filter((i) => i.n);
  const palette = (Array.isArray(b.palette) ? b.palette : []).slice(0, 6).map((c) => String(c || '').trim()).filter((c) => HEX.test(c) || /^[\p{L} -]{2,24}$/u.test(c)).map((c) => (HEX.test(c) ? c.toLowerCase() : txt(c, 24)));
  const w = b.wx && typeof b.wx === 'object' ? b.wx : null;
  const num = (v) => (v === null || v === undefined || v === '' || !isFinite(Number(v)) ? null : Math.max(-60, Math.min(60, Math.round(Number(v)))));
  const wx = w && (num(w.tmin) !== null || num(w.tmax) !== null) ? { tmin: num(w.tmin), tmax: num(w.tmax), txt: txt(w.txt, 24) } : null;
  return { title: txt(b.title, 80), caption: txt(b.caption, 600, true), style, items, palette, wx };
}

/* ---------- feeds ---------- */
async function feedIds(me, tab, off) {
  if (tab === 'following') {
    const subs = ((await db('SMEMBERS', P + 'following:' + me)) || []).slice(0, 100);
    if (!subs.length) return { ids: [], more: false, nofollow: true };
    const lists = await dbm(subs.map((s) => ['ZREVRANGE', P + 'uposts:' + s, 0, 14, 'WITHSCORES']));
    const all = lists.flatMap((l) => { const o = []; for (let i = 0; i < (l || []).length; i += 2) o.push([l[i], Number(l[i + 1])]); return o; }).sort((a, b) => b[1] - a[1]);
    return { ids: all.slice(off, off + PAGE).map((x) => x[0]), more: all.length > off + PAGE };
  }
  if (tab === 'trending') {
    const rows = (await db('ZREVRANGE', P + 'hot', 0, 199, 'WITHSCORES')) || [];
    const ids = rows.filter((_, i) => i % 2 === 0);
    const posts = await getPosts(ids), cut = Date.now() - 14 * 864e5;
    const keep = ids.filter((id, i) => posts[i] && posts[i].ts > cut);
    const use = keep.length >= PAGE || !ids.length ? keep : ids.filter((id, i) => posts[i]); // young app: fall back to all-time
    return { ids: use.slice(off, off + PAGE), more: use.length > off + PAGE };
  }
  // for you: latest 80 posts, ranked by engagement + freshness + the styles this user liked/saved + people they follow
  const ids = (await db('ZREVRANGE', P + 'feed', 0, 79)) || [];
  if (!ids.length) return { ids: [], more: false };
  const [posts, aff, fol, ...hs] = await Promise.all([getPosts(ids), db('HGETALL', P + 'aff:' + me), db('SMEMBERS', P + 'following:' + me), ...ids.map((i) => db('ZSCORE', P + 'hot', i))]);
  const A = {}; for (let i = 0; i < (aff || []).length; i += 2) A[aff[i]] = Number(aff[i + 1]);
  const F = new Set(fol || []), tot = Object.values(A).reduce((a, b) => a + b, 0) || 1;
  const rank = ids.map((id, i) => {
    const p = posts[i]; if (!p) return null;
    const age = (Date.now() - p.ts) / 36e5, eng = Math.floor(Number(hs[i]) || 0);
    return { id, s: (1 + eng + (F.has(p.by) ? 4 : 0) + 4 * ((A[p.style] || 0) / tot)) / Math.pow(2 + age / 12, 1.3) };
  }).filter(Boolean).sort((a, b) => b.s - a.s);
  return { ids: rank.slice(off, off + PAGE).map((x) => x.id), more: rank.length > off + PAGE };
}

/* ---------- main router ---------- */
module.exports = handler(async (req, res, user) => {
  const me = user.sub;
  if (req.method === 'GET') {
    const a = q1(req, 'a');
    if (a === 'img') { // photos are served only to signed-in users and never change -> cache hard
      const id = q1(req, 'id');
      if (!idOk(id)) throw err(404, 'not_found');
      const v = await db('GET', P + (q1(req, 's') === 'th' ? 'th:' : 'img:') + id);
      if (!v) throw err(404, 'not_found');
      const [mime, b64] = v.split('|');
      res.statusCode = 200;
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.end(Buffer.from(b64, 'base64'));
    }
    if (a === 'ovg' || a === 'fit') { // own GIF stickers / outfit tiles of a post (immutable)
      const id = q1(req, 'id'), k = Number(q1(req, 'k')); if (!idOk(id) || !(k >= 0 && k < 6)) throw err(404, 'not_found');
      const v = await db('GET', P + (a === 'ovg' ? 'ovg:' : 'ft:') + id + ':' + k); if (!v) throw err(404, 'not_found');
      return bin(res, v, 31536000);
    }
    if (a === 'sovg') { // GIF stickers of a story: same audience as the story itself
      const id = q1(req, 'id'), k = Number(q1(req, 'k')); if (!idOk(id) || !(k >= 0 && k < 3)) throw err(404, 'not_found');
      const st = jp(await db('GET', P + 'story:' + id)); if (!st || Date.now() - st.ts >= STORY_TTL) throw err(404, 'not_found');
      if (st.by !== me && !(await db('SISMEMBER', P + 'following:' + me, st.by))) throw err(404, 'not_found');
      const v = await db('GET', P + 'sovg:' + id + ':' + k); if (!v) throw err(404, 'not_found');
      return bin(res, v, 86400);
    }
    if (a === 'gifs') { // GIPHY search through the server (the API key never reaches the browser). Without GIPHY_API_KEY the picker just offers file upload.
      await rateLimit(user, 'gifq', 240);
      const key = String(process.env.GIPHY_API_KEY || '').trim(); if (!key) return send(res, 200, { gifs: [], off: true });
      const qq = q1(req, 'q').trim().slice(0, 60), url = 'https://api.giphy.com/v1/gifs/' + (qq ? 'search' : 'trending') + '?api_key=' + encodeURIComponent(key) + '&limit=24&rating=pg-13' + (qq ? '&q=' + encodeURIComponent(qq) : '');
      try {
        const r = await fetch(url, { headers: { Accept: 'application/json' } }); if (!r.ok) return send(res, 200, { gifs: [], err: r.status });
        const j = await r.json(), out = [];
        for (const g of (j.data || [])) { const f = g.images && (g.images.fixed_height || g.images.downsized), pv = g.images && (g.images.fixed_height_small || f); if (f && GIF_URL.test(String(f.url || '').split('?')[0]) && pv) out.push({ id: g.id, u: String(f.url).split('?')[0], p: String(pv.url).split('?')[0], w: Number(f.width) || 200, h: Number(f.height) || 200 }); }
        return send(res, 200, { gifs: out });
      } catch { return send(res, 200, { gifs: [], err: 'net' }); }
    }
    if (a === 'pvid') { // post video: byte-range streaming from stored chunks (Safari needs 206)
      const id = q1(req, 'id'); if (!idOk(id)) throw err(404, 'not_found');
      const pst = jp(await db('GET', P + 'post:' + id)); if (!pst || !pst.vid) throw err(404, 'not_found');
      const V = pst.vid, total = V.size, rm = /^bytes=(\d*)-(\d*)$/.exec(String((req.headers && req.headers.range) || ''));
      let start = 0, end = total - 1;
      if (rm) { if (rm[1] === '' && rm[2] !== '') start = Math.max(0, total - Number(rm[2])); else { start = Number(rm[1]) || 0; if (rm[2] !== '') end = Math.min(end, Number(rm[2])); } }
      if (start >= total || start > end) { res.statusCode = 416; res.setHeader('Content-Range', 'bytes */' + total); return res.end(); }
      end = Math.min(end, start + VRANGE - 1);
      const c0 = Math.floor(start / VCHUNK), c1 = Math.floor(end / VCHUNK);
      const parts = await dbm(Array.from({ length: c1 - c0 + 1 }, (_, k) => ['GET', P + 'pvc:' + V.k + ':' + (c0 + k)])); if (parts.some((x) => !x)) throw err(404, 'not_found');
      const buf = Buffer.concat(parts.map((x) => Buffer.from(x, 'base64'))), off = start - c0 * VCHUNK, out = buf.subarray(off, off + (end - start + 1));
      res.statusCode = 206; res.setHeader('Content-Type', V.mime); res.setHeader('Accept-Ranges', 'bytes'); res.setHeader('Content-Range', 'bytes ' + start + '-' + (start + out.length - 1) + '/' + total); res.setHeader('Content-Length', out.length);
      res.setHeader('Cache-Control', 'private, max-age=31536000, immutable'); res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.end(out);
    }
    if (a === 'avatar') { // custom profile picture (public to signed-in users; URL carries a version so it can be cached hard)
      const nk = q1(req, 'nick').toLowerCase();
      if (!NICK.test(nk)) throw err(404, 'not_found');
      const sub = await db('GET', P + 'nick:' + nk);
      const v = sub && await db('GET', P + 'av:' + sub);
      if (!v) throw err(404, 'not_found');
      const [mime, b64] = v.split('|');
      res.statusCode = 200;
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.end(Buffer.from(b64, 'base64'));
    }
    if (a === 'stories' || a === 'simg' || a === 'sviewers') {
      const live = (ts) => Date.now() - ts < STORY_TTL;
      if (a === 'simg') {
        const id = q1(req, 'id'); if (!idOk(id)) throw err(404, 'not_found');
        const st = jp(await db('GET', P + 'story:' + id));
        if (!st || !live(st.ts)) throw err(404, 'not_found');
        if (st.by !== me && !(await db('SISMEMBER', P + 'following:' + me, st.by))) throw err(404, 'not_found');
        const v = await db('GET', P + 'simg:' + id); if (!v) throw err(404, 'not_found');
        const [mime, b64] = v.split('|');
        res.statusCode = 200; res.setHeader('Content-Type', mime); res.setHeader('Cache-Control', 'private, max-age=86400, immutable'); res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.end(Buffer.from(b64, 'base64'));
      }
      if (a === 'sviewers') {
        const id = q1(req, 'id'); if (!idOk(id)) throw err(404, 'not_found');
        const st = jp(await db('GET', P + 'story:' + id));
        if (!st || st.by !== me) throw err(404, 'not_found'); // only the author sees who looked
        const subs = ((await db('SMEMBERS', P + 'sviews:' + id)) || []).slice(0, 100);
        const r = subs.length ? await dbm(subs.map((x) => ['GET', P + 'prof:' + x])) : [];
        return send(res, 200, { users: subs.map((x, i) => { const pr = jp(r[i]); return pr ? pubAuthor(pr) : null; }).filter(Boolean) });
      }
      const fol = ((await db('SMEMBERS', P + 'following:' + me)) || []).slice(0, 100);
      const subs = [me, ...fol.filter((x) => x !== me)];
      const lists = await dbm(subs.map((x) => ['ZREVRANGE', P + 'ustories:' + x, 0, 19, 'WITHSCORES']));
      const items = [];
      lists.forEach((l, k) => { for (let i = 0; i < (l || []).length; i += 2) if (live(Number(l[i + 1]))) items.push({ by: subs[k], id: l[i] }); });
      const authors = [...new Set(items.map((x) => x.by))];
      if (!authors.length) return send(res, 200, { groups: [] });
      const cmds = [];
      items.forEach((x) => { cmds.push(['GET', P + 'story:' + x.id]); cmds.push(['SISMEMBER', P + 'sviews:' + x.id, me]); cmds.push(['SCARD', P + 'sviews:' + x.id]); cmds.push(['SISMEMBER', P + 'slikes:' + x.id, me]); cmds.push(['SCARD', P + 'slikes:' + x.id]); });
      authors.forEach((x) => cmds.push(['GET', P + 'prof:' + x]));
      const r = await dbm(cmds), groups = {}, SS = 5;
      items.forEach((x, i) => {
        const st = jp(r[i * SS]); if (!st || !live(st.ts)) return;
        (groups[x.by] = groups[x.by] || []).push({ id: st.id, ts: st.ts, cap: st.cap || '', ov: st.ov && st.ov.length ? ovPub(st.ov, '/api/social?a=sovg&id=' + st.id) : undefined, img: '/api/social?a=simg&id=' + st.id, seen: x.by === me || !!r[i * SS + 1], views: x.by === me ? Number(r[i * SS + 2]) || 0 : undefined, liked: !!r[i * SS + 3], likes: Number(r[i * SS + 4]) || 0 });
      });
      const out = authors.map((x, k) => {
        const pr = jp(r[items.length * SS + k]); const list = (groups[x] || []).sort((m, n) => m.ts - n.ts);
        return pr && list.length ? { author: { ...pubAuthor(pr), me: x === me }, stories: list, allSeen: list.every((y) => y.seen), last: list[list.length - 1].ts } : null;
      }).filter(Boolean).sort((m, n) => (m.author.me ? -1 : 0) - (n.author.me ? -1 : 0) || (m.allSeen ? 1 : 0) - (n.allSeen ? 1 : 0) || n.last - m.last);
      return send(res, 200, { groups: out });
    }
    if (a === 'me') {
      const p = await getProf(me);
      const seen = Number(await db('GET', P + 'ns:' + me)) || 0;
      const unread = await db('ZCOUNT', P + 'nz:' + me, '(' + seen, '+inf');
      if (!p) return send(res, 200, { profile: null, suggest: await suggestNick(user), name: txt(user.name, 40), unread, styles: STYLES });
      const [fr, fg, pc] = await dbm([['SCARD', P + 'followers:' + me], ['SCARD', P + 'following:' + me], ['ZCARD', P + 'uposts:' + me]]);
      return send(res, 200, { profile: { ...pubAuthor(p), ...profExtra(p, true), bio: p.bio, posts: pc, followers: fr, following: fg, me: true }, unread, styles: STYLES, fstyles: FSTY, brands: BRANDS });
    }
    await needProf(user);
    if (a === 'feed') {
      const tab = ['foryou', 'following', 'trending'].includes(q1(req, 'tab')) ? q1(req, 'tab') : 'foryou';
      const off = Math.max(0, Math.min(1000, parseInt(q1(req, 'cursor'), 10) || 0));
      const f = await feedIds(me, tab, off);
      const posts = await hydrate(await getPosts(f.ids), me);
      return send(res, 200, { posts, next: f.more ? off + PAGE : null, nofollow: !!f.nofollow });
    }
    if (a === 'post') {
      const id = q1(req, 'id'); if (!idOk(id)) throw err(404, 'not_found');
      const p = jp(await db('GET', P + 'post:' + id)); if (!p) throw err(404, 'not_found');
      return send(res, 200, { post: (await hydrate([p], me))[0] });
    }
    if (a === 'comments') {
      const id = q1(req, 'id'); if (!idOk(id)) throw err(404, 'not_found');
      const p = jp(await db('GET', P + 'post:' + id)); if (!p) throw err(404, 'not_found');
      const flat = (await db('HGETALL', P + 'cm:' + id)) || [];
      const list = []; for (let i = 1; i < flat.length; i += 2) { const c = jp(flat[i]); if (c) list.push(c); }
      list.sort((x, y) => x.ts - y.ts);
      const use = list.slice(-100), subs = [...new Set(use.map((c) => c.by))];
      const profs = await dbm(subs.map((s) => ['GET', P + 'prof:' + s])), pm = {}; subs.forEach((s, i) => { pm[s] = jp(profs[i]); });
      return send(res, 200, { comments: use.map((c) => ({ id: c.id, ts: c.ts, text: c.text, author: pubAuthor(pm[c.by]), mine: c.by === me, canDelete: c.by === me || p.by === me })), total: list.length });
    }
    if (a === 'saved') {
      const off = Math.max(0, parseInt(q1(req, 'cursor'), 10) || 0);
      const ids = (await db('ZREVRANGE', P + 'saved:' + me, off, off + PAGE)) || [];
      const posts = await getPosts(ids.slice(0, PAGE)), dead = ids.slice(0, PAGE).filter((_, i) => !posts[i]);
      if (dead.length) await db('ZREM', P + 'saved:' + me, ...dead);
      return send(res, 200, { posts: await hydrate(posts, me), next: ids.length > PAGE ? off + PAGE : null });
    }
    if (a === 'user' || a === 'uposts') {
      const nick = q1(req, 'nick').toLowerCase();
      const sub = NICK.test(nick) ? await db('GET', P + 'nick:' + nick) : null;
      if (!sub) throw err(404, 'not_found');
      const off = Math.max(0, parseInt(q1(req, 'cursor'), 10) || 0);
      const ids = (await db('ZREVRANGE', P + 'uposts:' + sub, off, off + PAGE)) || [];
      const posts = await hydrate(await getPosts(ids.slice(0, PAGE)), me);
      const next = ids.length > PAGE ? off + PAGE : null;
      if (a === 'uposts') return send(res, 200, { posts, next });
      const [p, fr, fg, pc, isf] = await Promise.all([getProf(sub), db('SCARD', P + 'followers:' + sub), db('SCARD', P + 'following:' + sub), db('ZCARD', P + 'uposts:' + sub), db('SISMEMBER', P + 'following:' + me, sub)]);
      return send(res, 200, { profile: { ...pubAuthor(p), ...profExtra(p, sub === me), bio: p.bio, posts: pc, followers: fr, following: fg, isFollowing: !!isf, me: sub === me }, posts, next });
    }
    if (a === 'follows') {
      const nick = q1(req, 'nick').toLowerCase(), kind = q1(req, 'kind') === 'following' ? 'following' : 'followers';
      const sub = NICK.test(nick) ? await db('GET', P + 'nick:' + nick) : null; if (!sub) throw err(404, 'not_found');
      const subs = ((await db('SMEMBERS', P + kind + ':' + sub)) || []).slice(0, 200);
      const r = await dbm([...subs.map((s) => ['GET', P + 'prof:' + s]), ...subs.map((s) => ['SISMEMBER', P + 'following:' + me, s])]);
      return send(res, 200, { users: subs.map((s, i) => { const p = jp(r[i]); return p ? { ...pubAuthor(p), bio: p.bio, isFollowing: !!r[subs.length + i], me: s === me } : null; }).filter(Boolean) });
    }
    if (a === 'search') {
      await rateLimit(user, 'ssearch', 400);
      const q = txt(q1(req, 'q'), 40).toLowerCase();
      if (q.length < 2) return send(res, 200, { users: [], posts: [] });
      const nicks = ((await db('SMEMBERS', P + 'nicks')) || []).filter((n) => n.includes(q.replace(/^@/, ''))).sort((x, y) => (x.startsWith(q) ? 0 : 1) - (y.startsWith(q) ? 0 : 1) || x.length - y.length).slice(0, 15);
      const subs = (await dbm(nicks.map((n) => ['GET', P + 'nick:' + n]))).filter(Boolean);
      const r = await dbm([...subs.map((s) => ['GET', P + 'prof:' + s]), ...subs.map((s) => ['SISMEMBER', P + 'following:' + me, s])]);
      const users = subs.map((s, i) => { const p = jp(r[i]); return p ? { ...pubAuthor(p), bio: p.bio, isFollowing: !!r[subs.length + i], me: s === me } : null; }).filter(Boolean);
      const ids = (await db('ZREVRANGE', P + 'feed', 0, 299)) || [];
      const all = await getPosts(ids);
      const hit = all.filter((p) => p && [p.title, p.caption, p.style, ...(p.items || []).map((i) => i.n)].join(' ').toLowerCase().includes(q)).slice(0, 20);
      return send(res, 200, { users, posts: await hydrate(hit, me) });
    }
    if (a === 'discover') {
      const [hotRows, ids] = await Promise.all([db('ZREVRANGE', P + 'hot', 0, 29), db('ZREVRANGE', P + 'feed', 0, 79)]);
      const hp = await getPosts(hotRows || []), lp = await getPosts(ids || []);
      const trending = await hydrate(hp.filter(Boolean).slice(0, 12), me);
      const by = {}; lp.filter(Boolean).forEach((p) => { if (p.style) (by[p.style] = by[p.style] || []).push(p); });
      const styles = Object.entries(by).sort((x, y) => y[1].length - x[1].length).slice(0, 4);
      const sec = []; for (const [style, ps] of styles) sec.push({ style, posts: await hydrate(ps.slice(0, 6), me) });
      // authors worth following: people behind trending posts that you don't follow yet
      const seen = new Set([me]), cand = [];
      for (const p of [...hp, ...lp]) { if (p && !seen.has(p.by)) { seen.add(p.by); cand.push(p.by); } if (cand.length >= 12) break; }
      const r = cand.length ? await dbm([...cand.map((s) => ['GET', P + 'prof:' + s]), ...cand.map((s) => ['SISMEMBER', P + 'following:' + me, s]), ...cand.map((s) => ['SCARD', P + 'followers:' + s])]) : [];
      const authors = cand.map((s, i) => { const p = jp(r[i]); return p && !r[cand.length + i] ? { ...pubAuthor(p), bio: p.bio, followers: r[cand.length * 2 + i], isFollowing: false } : null; }).filter(Boolean).slice(0, 8);
      return send(res, 200, { trending, sections: sec, authors });
    }
    if (a === 'notifs') {
      const k = P + 'nz:' + me;
      const ids = (await db('ZREVRANGE', k, 0, 49)) || [];
      const seen = Number(await db('GET', P + 'ns:' + me)) || 0;
      const rows = ids.length ? (await db('HMGET', P + 'nh:' + me, ...ids)).map(jp).filter(Boolean) : [];
      const subs = [...new Set(rows.map((n) => n.by))], pids = [...new Set(rows.map((n) => n.post).filter(Boolean))];
      const r = await dbm([...subs.map((s) => ['GET', P + 'prof:' + s]), ...pids.map((i) => ['EXISTS', P + 'post:' + i])]);
      const pm = {}; subs.forEach((s, i) => { pm[s] = jp(r[i]); });
      const pe = {}; pids.forEach((i, j) => { pe[i] = !!r[subs.length + j]; });
      return send(res, 200, { notifs: rows.map((n) => ({ id: n.id, type: n.type, ts: n.ts, text: n.text, unread: n.ts > seen, post: n.post && pe[n.post] ? n.post : null, actor: pubAuthor(pm[n.by]) })) });
    }
    throw err(400, 'bad_action');
  }

  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, 405, { error: 'method_not_allowed' }); }
  const b = body(req), op = String(b.op || '');

  if (op === 'profile') { // create or edit the caller's own profile
    await rateLimit(user, 'sprof', 40);
    const old = await getProf(me);
    const nick = String(b.nick || (old && old.nick) || '').toLowerCase().trim();
    if (!NICK.test(nick) || RESERVED.has(nick)) throw err(400, 'bad_nick');
    if (!old || old.nick !== nick) {
      if ((await db('SET', P + 'nick:' + nick, me, 'NX')) !== 'OK') throw err(409, 'nick_taken');
    }
    const prof = { nick, name: txt(b.name != null ? b.name : (old ? old.name : user.name), 40) || nick, bio: txt(b.bio != null ? b.bio : (old ? old.bio : ''), 160, true), avatar: /^https:\/\//.test(user.picture || '') ? String(user.picture).slice(0, 300) : '', created: old ? old.created : Date.now() };
    if (old && old.avv) prof.avv = old.avv;
    // extras are updated only when the request carries them: a partial update never wipes stored values
    prof.fst = b.fstyles !== undefined ? cleanList(b.fstyles, 12, 24) : (old && old.fst) || [];
    prof.brands = b.brands !== undefined ? cleanList(b.brands, 20, 32) : (old && old.brands) || [];
    prof.earn = b.earn !== undefined ? (EARN.includes(b.earn) ? b.earn : '') : (old && old.earn) || '';
    prof.earnPub = b.earnPub !== undefined ? !!b.earnPub : !!(old && old.earnPub);
    const cmds = [];
    if (b.avatar) { prof.avv = Date.now(); cmds.push(['SET', P + 'av:' + me, parseImg(b.avatar, MAX_AVATAR)]); }
    else if (b.resetAvatar) { delete prof.avv; cmds.push(['DEL', P + 'av:' + me]); }
    cmds.push(['SET', P + 'prof:' + me, JSON.stringify(prof)], ['SADD', P + 'nicks', nick]);
    if (old && old.nick !== nick) cmds.push(['DEL', P + 'nick:' + old.nick], ['SREM', P + 'nicks', old.nick]);
    await dbm(cmds);
    return send(res, 200, { profile: { ...pubAuthor(prof), ...profExtra(prof, true) }, bio: prof.bio });
  }

  const prof = await needProf(user); // every other write requires a profile

  if (op === 'story') { // 24-hour story: one photo, short caption
    await rateLimit(user, 'sstory', 40);
    const img = parseImg(b.image, MAX_STORY);
    const gifs = cleanGifs(b.gifs), st = { id: nowId('s'), by: me, ts: Date.now(), cap: txt(b.caption, 120), ov: cleanOv(b.ov, gifs.length) };
    for (let i = 0; i < gifs.length; i++) await db('SET', P + 'sovg:' + st.id + ':' + i, gifs[i], 'EX', 90000);
    await dbm([['SET', P + 'story:' + st.id, JSON.stringify(st)], ['SET', P + 'simg:' + st.id, img], ['ZADD', P + 'ustories:' + me, st.ts, st.id],
      ['EXPIRE', P + 'story:' + st.id, 90000], ['EXPIRE', P + 'simg:' + st.id, 90000], ['ZREMRANGEBYRANK', P + 'ustories:' + me, 0, -41]]);
    return send(res, 200, { story: { id: st.id, ts: st.ts, cap: st.cap, ov: st.ov.length ? ovPub(st.ov, '/api/social?a=sovg&id=' + st.id) : undefined, img: '/api/social?a=simg&id=' + st.id, seen: true, views: 0 } });
  }
  if (op === 'purgeBanned') { // admin only (ACTIVITY_ADMIN_USER_ID): permanently removes banned accounts. dry-run unless {confirm:true}. The ban marker itself is kept, so they stay locked out.
    const adm = String(process.env.ACTIVITY_ADMIN_USER_ID || '').trim(); if (!adm || adm !== me) throw err(404, 'not_found');
    await rateLimit(user, 'purge', 10);
    const M = 'wd:m:', dry = b.confirm !== true, subs = new Set(((await db('SMEMBERS', P + 'bans')) || []).map(String));
    for (const n of (process.env.BANNED_NICKS || '').split(/[\s,]+/).map((x) => x.trim().toLowerCase().replace(/^@/, '')).filter(Boolean)) { const v = await db('GET', P + 'nick:' + n); if (v) subs.add(String(v)); }
    subs.delete(me); // never the caller
    const report = [];
    for (const sub of subs) {
      const prof = await getProf(sub), r = { nick: prof ? prof.nick : null, posts: 0, stories: 0, chats: 0, follows: 0 };
      const postIds = (await db('ZRANGE', P + 'uposts:' + sub, 0, -1)) || [], storyIds = (await db('ZRANGE', P + 'ustories:' + sub, 0, -1)) || [];
      const fr = (await db('SMEMBERS', P + 'followers:' + sub)) || [], fg = (await db('SMEMBERS', P + 'following:' + sub)) || [], cids = (await db('ZRANGE', M + 'inbox:' + sub, 0, -1)) || [];
      r.posts = postIds.length; r.stories = storyIds.length; r.chats = cids.length; r.follows = fr.length + fg.length;
      if (!prof && !r.posts && !r.stories && !r.chats && !r.follows) continue; // already clean
      report.push(r); if (dry) continue;
      const cmds = [['SET', P + 'ban:' + sub, prof && prof.nick ? prof.nick : '1'], ['SADD', P + 'bans', sub]]; // keep them locked out for good
      for (const id of postIds) { const pj = jp(await db('GET', P + 'post:' + id)) || { id }, savers = ((await db('SMEMBERS', P + 'savers:' + id)) || []).slice(0, 5000); cmds.push(['DEL', ...postKeysToDelete(pj)], ['ZREM', P + 'feed', id], ['ZREM', P + 'hot', id], ...savers.map((x) => ['ZREM', P + 'saved:' + x, id])); if (pj.of) cmds.push(['HDEL', P + 'rps:' + pj.of, sub]); }
      for (const id of storyIds) cmds.push(['DEL', P + 'story:' + id, P + 'simg:' + id, P + 'sviews:' + id, P + 'slikes:' + id]);
      for (const f of fr) cmds.push(['SREM', P + 'following:' + f, sub]); for (const g of fg) cmds.push(['SREM', P + 'followers:' + g, sub]);
      for (const cid of cids) {
        const c = jp(await db('GET', M + 'conv:' + cid)), other = c && c.m ? c.m.find((x) => x !== sub) : null;
        const rows = (await db('HGETALL', M + 'msg:' + cid)) || [];
        for (let i = 0; i + 1 < rows.length; i += 2) { const mid = rows[i], m = jp(rows[i + 1]); cmds.push(['DEL', M + 'img:' + cid + ':' + mid, M + 'th:' + cid + ':' + mid]); if (m && m.vid) { for (let k = 0; k < (m.vid.n || 0); k++) cmds.push(['DEL', M + 'vc:' + cid + ':' + mid + ':' + k]); cmds.push(['DEL', M + 'vp:' + cid + ':' + mid]); } }
        cmds.push(['DEL', M + 'conv:' + cid, M + 'msg:' + cid, M + 'msgs:' + cid, M + 'rx:' + cid, M + 'read:' + cid]);
        if (other && other !== sub) cmds.push(['ZREM', M + 'inbox:' + other, cid], ['HDEL', M + 'unread:' + other, cid], ['SREM', M + 'blocked:' + other, sub]);
      }
      cmds.push(['DEL', P + 'prof:' + sub, P + 'av:' + sub, P + 'aff:' + sub, P + 'saved:' + sub, P + 'following:' + sub, P + 'followers:' + sub, P + 'uposts:' + sub, P + 'ustories:' + sub, M + 'inbox:' + sub, M + 'unread:' + sub, M + 'blocked:' + sub, M + 'push:' + sub, M + 'seen:' + sub, M + 'vis:' + sub, M + 'off:' + sub]);
      if (prof) cmds.push(['DEL', P + 'nick:' + prof.nick], ['SREM', P + 'nicks', prof.nick]);
      for (let i = 0; i < cmds.length; i += 200) await dbm(cmds.slice(i, i + 200));
    }
    return send(res, 200, { dry, accounts: report, count: report.length });
  }
  if (op === 'delStory') {
    const id = String(b.id || ''); if (!idOk(id)) throw err(404, 'not_found');
    const st = jp(await db('GET', P + 'story:' + id));
    if (!st) throw err(404, 'not_found');
    if (st.by !== me) throw err(403, 'forbidden');
    await dbm([['DEL', P + 'story:' + id], ['DEL', P + 'simg:' + id], ['DEL', P + 'sviews:' + id], ['DEL', P + 'slikes:' + id], ['DEL', P + 'sovg:' + id + ':0', P + 'sovg:' + id + ':1', P + 'sovg:' + id + ':2'], ['ZREM', P + 'ustories:' + me, id]]);
    return send(res, 200, { ok: true });
  }
  if (op === 'storyLike') { // heart a story you may see (author or follower); idempotent on/off
    await rateLimit(user, 'slike', 300);
    const id = String(b.id || ''); if (!idOk(id)) throw err(404, 'not_found');
    const st = jp(await db('GET', P + 'story:' + id));
    if (!st || Date.now() - st.ts >= STORY_TTL) throw err(404, 'not_found');
    if (st.by !== me && !(await db('SISMEMBER', P + 'following:' + me, st.by))) throw err(404, 'not_found');
    const on = b.on !== false;
    await dbm([[on ? 'SADD' : 'SREM', P + 'slikes:' + id, me], ['EXPIRE', P + 'slikes:' + id, 90000]]);
    return send(res, 200, { liked: on, likes: Number(await db('SCARD', P + 'slikes:' + id)) || 0 });
  }
  if (op === 'storySeen') {
    const id = String(b.id || ''); if (!idOk(id)) throw err(404, 'not_found');
    const st = jp(await db('GET', P + 'story:' + id));
    if (!st || Date.now() - st.ts >= STORY_TTL) throw err(404, 'not_found');
    if (st.by !== me) {
      if (!(await db('SISMEMBER', P + 'following:' + me, st.by))) throw err(404, 'not_found');
      await dbm([['SADD', P + 'sviews:' + id, me], ['EXPIRE', P + 'sviews:' + id, 90000]]);
    }
    return send(res, 200, { ok: true });
  }

  if (op === 'post' || op === 'editPost') {
    let post;
    if (op === 'post') {
      await rateLimit(user, 'spost', 30);
      const img = parseImg(b.image, MAX_IMG), th = parseImg(b.thumb, MAX_THUMB);
      const f = cleanPostFields(b), gifs = cleanGifs(b.gifs), fit = cleanFit(b.fit), ov = cleanOv(b.ov, gifs.length);
      post = { id: nowId('p'), by: me, ts: Date.now(), ...f };
      if (ov.length) post.ov = ov; if (fit.length) post.fit = fit.map((x) => ({ n: x.n, c: x.c }));
      const extra = [];
      if (b.vid) { // video: the chunks were uploaded before (pvstart/pvchunk); poster = the image above
        const uid = String(b.vid || ''); if (!idOk(uid)) throw err(404, 'not_found');
        const rec = jp(await db('GET', P + 'pvup:' + uid)); if (!rec || rec.by !== me) throw err(404, 'not_found');
        const keys = vidKeys(uid, rec.n), have = await dbm(keys.map((k) => ['EXISTS', k])); if (have.some((x) => !x)) throw err(409, 'incomplete');
        post.vid = { k: uid, mime: rec.mime, size: rec.size, n: rec.n, dur: rec.dur, w: rec.w, h: rec.h };
        extra.push(...keys.map((k) => ['PERSIST', k]), ['DEL', P + 'pvup:' + uid]);
      }
      gifs.forEach((g, i) => extra.push(['SET', P + 'ovg:' + post.id + ':' + i, g])); fit.forEach((x, i) => extra.push(['SET', P + 'ft:' + post.id + ':' + i, x.img]));
      await dbm([['SET', P + 'post:' + post.id, JSON.stringify(post)], ['SET', P + 'img:' + post.id, img], ['SET', P + 'th:' + post.id, th],
        ['ZADD', P + 'feed', post.ts, post.id], ['ZADD', P + 'uposts:' + me, post.ts, post.id], ['ZADD', P + 'hot', post.ts / 1e13, post.id], ...extra]);
    } else {
      if (!idOk(b.id)) throw err(404, 'not_found');
      const cur = jp(await db('GET', P + 'post:' + b.id)); if (!cur) throw err(404, 'not_found');
      if (cur.by !== me) throw err(403, 'forbidden'); // only the author edits
      post = { ...cur, ...cleanPostFields({ ...cur, ...b }) }; // media (ov/fit/vid) stay as published
      await db('SET', P + 'post:' + post.id, JSON.stringify(post));
    }
    return send(res, 200, { post: (await hydrate([post], me))[0] });
  }
  if (op === 'pvstart') { // video post, step 1: announce the upload
    await rateLimit(user, 'pvid', 30);
    const mime = String(b.mime || '').toLowerCase().split(';')[0], size = Number(b.size) | 0;
    if (!VID_MIME.test(mime)) throw err(400, 'bad_video'); if (size < 1 || size > MAX_VID) throw err(413, 'video_too_large');
    const uid = nowId('v'), n = Math.ceil(size / VCHUNK), rec = { by: me, mime, size, n, dur: Math.min(3600, Math.max(0, Number(b.dur) || 0)), w: Math.min(4096, Number(b.w) | 0), h: Math.min(4096, Number(b.h) | 0) };
    await db('SET', P + 'pvup:' + uid, JSON.stringify(rec), 'EX', 86400);
    return send(res, 200, { vid: uid, n, chunk: VCHUNK });
  }
  if (op === 'pvchunk') {
    await rateLimit(user, 'pvc', 6000);
    const uid = String(b.vid || ''); if (!idOk(uid)) throw err(404, 'not_found');
    const rec = jp(await db('GET', P + 'pvup:' + uid)); if (!rec || rec.by !== me) throw err(404, 'not_found');
    const i = Number(b.i); if (!(i >= 0 && i < rec.n) || i !== Math.floor(i)) throw err(400, 'bad_chunk');
    const d = String(b.data || ''); if (!/^[A-Za-z0-9+/]+={0,2}$/.test(d) || d.length > Math.ceil(VCHUNK / 3) * 4 + 8) throw err(400, 'bad_chunk');
    await db('SET', P + 'pvc:' + uid + ':' + i, d, 'EX', 86400);
    return send(res, 200, { ok: true, i });
  }
  if (op === 'repost' || op === 'unrepost') { // share somebody else's photo/video post on your own profile and to your followers
    await rateLimit(user, 'srp', 60);
    if (!idOk(b.id)) throw err(404, 'not_found');
    const orig = jp(await db('GET', P + 'post:' + b.id)); if (!orig || orig.of) throw err(404, 'not_found');
    const mineId = await db('HGET', P + 'rps:' + orig.id, me);
    if (op === 'unrepost') {
      if (mineId) await dbm([['DEL', P + 'post:' + mineId], ['ZREM', P + 'feed', mineId], ['ZREM', P + 'uposts:' + me, mineId], ['HDEL', P + 'rps:' + orig.id, me]]);
      return send(res, 200, { ok: true, reposts: Number(await db('HLEN', P + 'rps:' + orig.id)) || 0, reposted: false });
    }
    if (orig.by === me) throw err(400, 'own_post');
    if (!mineId) {
      const rp = { id: nowId('p'), by: me, ts: Date.now(), of: orig.id }, rcap = txt(b.cap, 300, true); if (rcap) rp.cap = rcap;
      await dbm([['SET', P + 'post:' + rp.id, JSON.stringify(rp)], ['ZADD', P + 'feed', rp.ts, rp.id], ['ZADD', P + 'uposts:' + me, rp.ts, rp.id], ['HSET', P + 'rps:' + orig.id, me, rp.id]]);
      await notify(orig.by, { id: 'rp:' + me + ':' + orig.id, type: 'repost', by: me, post: orig.id }).catch(() => {});
    }
    return send(res, 200, { ok: true, reposts: Number(await db('HLEN', P + 'rps:' + orig.id)) || 0, reposted: true });
  }
  if (op === 'delPost') {
    if (!idOk(b.id)) throw err(404, 'not_found');
    const cur = jp(await db('GET', P + 'post:' + b.id)); if (!cur) throw err(404, 'not_found');
    if (cur.by !== me) throw err(403, 'forbidden');
    const savers = ((await db('SMEMBERS', P + 'savers:' + cur.id)) || []).slice(0, 5000);
    const extra = [];
    if (cur.of) extra.push(['HDEL', P + 'rps:' + cur.of, cur.by]); // deleting a repost frees the original for a new repost
    await dbm([['DEL', ...postKeysToDelete(cur)],
      ['ZREM', P + 'feed', cur.id], ['ZREM', P + 'uposts:' + cur.by, cur.id], ['ZREM', P + 'hot', cur.id], ...savers.map((s) => ['ZREM', P + 'saved:' + s, cur.id]), ...extra]);
    return send(res, 200, { ok: true });
  }

  if (op === 'like' || op === 'save') {
    await rateLimit(user, 'sreact', 1500);
    if (!idOk(b.id)) throw err(404, 'not_found');
    const post = jp(await db('GET', P + 'post:' + b.id)); if (!post) throw err(404, 'not_found');
    const on = !!b.on, set = P + (op === 'like' ? 'likes:' : 'savers:') + post.id;
    const added = on ? await db('SADD', set, me) : await db('SREM', set, me); // SADD/SREM are idempotent: a user can never like twice
    if (op === 'save') await (on ? db('ZADD', P + 'saved:' + me, Date.now(), post.id) : db('ZREM', P + 'saved:' + me, post.id));
    if (on && added && post.style) await db('HINCRBY', P + 'aff:' + me, post.style, 1);
    if (on && added && op === 'like') await notify(post.by, { id: 'like:' + post.id + ':' + me, type: 'like', by: me, post: post.id });
    await touchHot(post);
    const [likes, saves, comments] = await dbm([['SCARD', P + 'likes:' + post.id], ['SCARD', P + 'savers:' + post.id], ['HLEN', P + 'cm:' + post.id]]);
    return send(res, 200, { likes, saves, comments, liked: op === 'like' ? on : undefined, saved: op === 'save' ? on : undefined });
  }

  if (op === 'comment') {
    await rateLimit(user, 'scomment', 200);
    if (!idOk(b.id)) throw err(404, 'not_found');
    const post = jp(await db('GET', P + 'post:' + b.id)); if (!post) throw err(404, 'not_found');
    const text = txt(b.text, 500, true); if (!text) throw err(400, 'empty');
    if ((await db('HLEN', P + 'cm:' + post.id)) >= MAX_COMMENTS) throw err(429, 'too_many_comments');
    const c = { id: nowId('c'), by: me, ts: Date.now(), text };
    await db('HSET', P + 'cm:' + post.id, c.id, JSON.stringify(c));
    await notify(post.by, { id: 'cm:' + c.id, type: 'comment', by: me, post: post.id, text: text.slice(0, 80) });
    await touchHot(post);
    return send(res, 200, { comment: { id: c.id, ts: c.ts, text, author: pubAuthor(prof), mine: true, canDelete: true }, total: await db('HLEN', P + 'cm:' + post.id) });
  }
  if (op === 'delComment') {
    if (!idOk(b.id) || !idOk(b.cid)) throw err(404, 'not_found');
    const post = jp(await db('GET', P + 'post:' + b.id)); if (!post) throw err(404, 'not_found');
    const c = jp(await db('HGET', P + 'cm:' + post.id, b.cid)); if (!c) throw err(404, 'not_found');
    if (c.by !== me && post.by !== me) throw err(403, 'forbidden'); // own comment, or any comment under your own post
    await db('HDEL', P + 'cm:' + post.id, c.id);
    await dbm([['ZREM', P + 'nz:' + post.by, 'cm:' + c.id], ['HDEL', P + 'nh:' + post.by, 'cm:' + c.id]]);
    await touchHot(post);
    return send(res, 200, { ok: true, total: await db('HLEN', P + 'cm:' + post.id) });
  }

  if (op === 'follow') {
    await rateLimit(user, 'sfollow', 300);
    const nick = String(b.nick || '').toLowerCase();
    const sub = NICK.test(nick) ? await db('GET', P + 'nick:' + nick) : null;
    if (!sub) throw err(404, 'not_found');
    if (sub === me) throw err(400, 'self_follow');
    const on = !!b.on;
    if (on) {
      const [added] = await dbm([['SADD', P + 'following:' + me, sub], ['SADD', P + 'followers:' + sub, me]]);
      if (added) await notify(sub, { id: 'follow:' + me, type: 'follow', by: me });
    } else {
      await dbm([['SREM', P + 'following:' + me, sub], ['SREM', P + 'followers:' + sub, me]]);
    }
    const [fr, fg] = await dbm([['SCARD', P + 'followers:' + sub], ['SCARD', P + 'following:' + me]]);
    return send(res, 200, { isFollowing: on, followers: fr, myFollowing: fg });
  }

  if (op === 'notifSeen') {
    await db('SET', P + 'ns:' + me, String(Date.now()));
    return send(res, 200, { ok: true });
  }
  throw err(400, 'bad_op');
});
module.exports.STYLES = STYLES;
