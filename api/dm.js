// Driply Messages — private 1:1 chat (text + photos). ONE serverless function: GET ?a=<action>, POST {op}.
// Authorisation is decided here (verified session); a conversation id is an opaque hash of the two account ids and is only
// honoured for its two members. Same Redis as the rest of the app. Key schema is documented in README ("Сообщения").
const crypto = require('crypto');
const { handler, send, body, err, db, dbm, rateLimit } = require('./_lib');
const push = require('./_push');

const P = 'wd:s:', M = 'wd:m:';
const VER = new Set(String(process.env.VERIFIED_NICKS || '').toLowerCase().split(/[\s,;]+/).filter(Boolean));
const MAX_IMG = 500 * 1024, MAX_TEXT = 2000, PAGE = 50;
const MAX_VID = 14 * 1024 * 1024, CHUNK = 512 * 1024, MAX_POSTER = 70 * 1024, VID_MIME = /^video\/(mp4|quicktime|webm)$/;
const RANGE_CAP = 2 * 1024 * 1024; // keep every response well below the serverless body limit
const q1 = (req, k) => { const v = req.query && req.query[k] !== undefined ? req.query[k] : new URL(req.url, 'http://x').searchParams.get(k); return Array.isArray(v) ? String(v[0] || '') : String(v == null ? '' : v); };
const jp = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const nowId = (pre) => pre + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
const idOk = (id) => /^[a-z0-9]{6,32}$/.test(String(id || ''));
const NICK = /^[a-z0-9_.]{3,20}$/;
const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‏‪-‮⁦-⁩]/g, '').replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim().slice(0, max);

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
const pubUser = (p) => ({ verified: VER.has(p.nick), nick: p.nick, name: p.name, avatar: p.avv ? '/api/social?a=avatar&nick=' + p.nick + '&v=' + p.avv : p.avatar || '' });
const getProf = async (sub) => jp(await db('GET', P + 'prof:' + sub));
const cidOf = (a, b) => crypto.createHash('sha256').update([a, b].sort().join('|')).digest('hex').slice(0, 24);
async function getConv(cid, me) {
  if (!idOk(cid)) throw err(404, 'not_found');
  const c = jp(await db('GET', M + 'conv:' + cid));
  if (!c || !c.m.includes(me)) throw err(404, 'not_found'); // never reveal whether it exists
  return c;
}
const REACTS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👎', '🙏'];
const rxView = (raw, me) => { const o = jp(raw); if (!o) return null; const cnt = {}; let mine = ''; for (const [sub, e] of Object.entries(o)) { cnt[e] = (cnt[e] || 0) + 1; if (sub === me) mine = e; } const a = Object.keys(cnt).map((e) => ({ e, n: cnt[e], me: e === mine })).sort((x, y) => y.n - x.n); return a.length ? a : null; };
const view = (m, cid, me) => (m.del ? { id: m.id, mine: m.by === me, ts: m.ts, del: true } : { id: m.id, mine: m.by === me, ts: m.ts, text: m.text || '', img: m.img ? '/api/dm?a=mimg&c=' + cid + '&id=' + m.id : null, th: m.th ? '/api/dm?a=mimg&t=1&c=' + cid + '&id=' + m.id : undefined, iw: m.iw || undefined, ih: m.ih || undefined, re: m.re ? { id: m.re.id, mine: m.re.by === me, x: m.re.x, img: !!m.re.img } : undefined, fwd: m.fwd ? 1 : undefined, vid: m.vid ? { url: '/api/dm?a=mvid&c=' + cid + '&id=' + m.id, poster: '/api/dm?a=mposter&c=' + cid + '&id=' + m.id, dur: m.vid.dur, w: m.vid.w, h: m.vid.h, size: m.vid.size } : undefined });
const preview = (m, me) => ({ by: m.by === me ? 'me' : 'them', t: m.del ? 'del' : m.vid && !m.text ? 'vid' : m.img && !m.text ? 'img' : 'text', x: m.del ? '' : (m.text || '').slice(0, 80), ts: m.ts });

async function resolveTarget(b, me) {
  let other, cid;
  if (b.id) { const c = await getConv(String(b.id), me); other = c.m.find((x) => x !== me) || me; cid = c.id; }
  else {
    const nick = String(b.nick || '').toLowerCase(); if (!NICK.test(nick)) throw err(404, 'not_found');
    other = await db('GET', P + 'nick:' + nick); if (!other) throw err(404, 'not_found');
    cid = cidOf(me, other);
  }
  return checkPair(me, other, cid);
}
async function checkPair(me, other, cid) {
  if (other === me) return { other, cid, cj: await db('GET', M + 'conv:' + cid) }; // "Saved messages": a chat with yourself
  const [op_, b1, b2, cj] = await dbm([['GET', P + 'prof:' + other], ['SISMEMBER', M + 'blocked:' + me, other], ['SISMEMBER', M + 'blocked:' + other, me], ['GET', M + 'conv:' + cid]]);
  if (!op_) throw err(404, 'not_found');
  if (b1) throw err(403, 'blocked_by_you');
  if (b2) throw err(403, 'blocked');
  return { other, cid, cj };
}
async function commit(me, other, cid, cj, m, extra) {
  const old = jp(cj); m.ts = Math.max(Date.now(), old ? old.ts + 1 : 0);
  const kind = m.vid && !m.text ? 'vid' : m.img && !m.text ? 'img' : 'text';
  const conv = { id: cid, m: [me, other].sort(), ts: m.ts, lastId: m.id, last: { by: me, t: kind, x: (m.text || '').slice(0, 80), ts: m.ts } };
  await dbm([['SET', M + 'conv:' + cid, JSON.stringify(conv)], ['HSET', M + 'msg:' + cid, m.id, JSON.stringify(m)], ['ZADD', M + 'msgs:' + cid, m.ts, m.id],
    ['ZADD', M + 'inbox:' + me, m.ts, cid], ['ZADD', M + 'inbox:' + other, m.ts, cid], ...(other === me ? [] : [['HINCRBY', M + 'unread:' + other, cid, 1]]), ['HSET', M + 'read:' + cid, me, String(m.ts)], ...(extra || [])]);
  return kind;
}
const dataUrlParts = (d) => { const m = /^data:([a-z\/+-]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(d || '')); return m ? { mime: m[1], b64: m[2] } : null; };

async function removeSub(me, endpoint) {
  const cur = (await db('SMEMBERS', M + 'push:' + me)) || [];
  for (const c of cur) { const o = jp(c); if (o && o.endpoint === endpoint) await db('SREM', M + 'push:' + me, c); }
}
// Web Push to the recipient's devices (no-op until VAPID keys are configured). Skipped while they are actively in the app.
async function notifyPush(req, other, me, prof, m, cid) {
  if (!push.enabled() || other === me) return;
  const [subs, seen, muted] = await dbm([['SMEMBERS', M + 'push:' + other], ['GET', M + 'vis:' + other], ['SISMEMBER', M + 'blocked:' + other, me]]);
  if (muted || !subs || !subs.length) return;
  if (Date.now() - (Number(seen) || 0) < 6000) return; // skipped only while the recipient has the app VISIBLE on screen (a background tab/other device does not block pushes)
  const payload = { t: 'msg', nick: prof.nick, name: prof.name || prof.nick, kind: m.vid ? 'vid' : m.img ? 'img' : 'text', text: (m.text || '').slice(0, 140), cid };
  await Promise.all(subs.map(async (raw) => {
    const sub = jp(raw); if (!sub) return;
    const r = await push.send(sub, payload, req);
    if (r && !(r.status >= 200 && r.status < 300)) console.error('push failed', r.status, String(sub.endpoint).slice(0, 40));
    if (r && r.gone) await db('SREM', M + 'push:' + other, raw);
  }));
}

// ---- activity status. Exact last-visit time is a privilege of ONE account (ACTIVITY_ADMIN_USER_ID = its permanent account id).
// Everybody else gets only a coarse label ("online / recently / today ..."), and only for people who follow each other. Never a timestamp.
const isAdmin = (sub) => { const a = String(process.env.ACTIVITY_ADMIN_USER_ID || '').trim(); return !!a && a === sub; };
function stateOf(seen, off, req) {
  seen = Number(seen) || 0; if (!seen) return null;
  const now = Date.now(), day = 86400000;
  if (now - seen < 70000 && !(Number(off) >= seen)) return 'online'; // closed/logged-out apps stop counting after ~1 minute
  const tz = Math.max(-840, Math.min(840, parseInt(req && req.headers && req.headers['x-tz'], 10) || 0)); // minutes, as Date.getTimezoneOffset()
  const t0 = Math.floor((now - tz * 60000) / day) * day + tz * 60000;
  if (now - seen < 3 * 3600000) return 'recent';
  if (seen >= t0) return 'today';
  if (seen >= t0 - day) return 'yesterday';
  return now - seen < 7 * day ? 'week' : 'long';
}
const presOf = (admin, mutual, seen, off, req) => {
  if (!admin && !mutual) return null;
  const st = stateOf(seen, off, req); if (!st) return null;
  return admin ? { st, seen: Number(seen) } : { st };
};
async function presence(req, me, other) {
  const [f1, f2, seen, off] = await dbm([['SISMEMBER', P + 'following:' + me, other], ['SISMEMBER', P + 'following:' + other, me], ['GET', M + 'seen:' + other], ['GET', M + 'off:' + other]]);
  const mutual = !!(f1 && f2);
  return { mutual, pres: presOf(isAdmin(me), mutual, seen, off, req) };
}

module.exports = handler(async (req, res, user) => {
  const me = user.sub;
  const mine = await getProf(me);
  if (req.method === 'GET') {
    const a = q1(req, 'a');
    if (a !== 'mimg') { const now = String(Date.now()); if (String(req.headers['x-vis'] || '1') === '1') await dbm([['SET', M + 'seen:' + me, now], ['SET', M + 'vis:' + me, now]]); else await db('SET', M + 'seen:' + me, now); } // presence: any request counts as "online"; only visible-screen requests suppress pushes

    if (a === 'unread') {
      const h = (await db('HGETALL', M + 'unread:' + me)) || []; let n = 0;
      for (let i = 1; i < h.length; i += 2) n += Number(h[i]) || 0;
      return send(res, 200, { unread: n, admin: isAdmin(me) });
    }
    if (!mine) throw err(409, 'profile_required');
    if (a === 'activity') { // exact activity of any user: only for the privileged account, everybody else gets 404
      if (!isAdmin(me)) throw err(404, 'not_found');
      const nick = q1(req, 'nick').toLowerCase(); if (!NICK.test(nick)) throw err(404, 'not_found');
      const sub = await db('GET', P + 'nick:' + nick); if (!sub) throw err(404, 'not_found');
      const [seen, off] = await dbm([['GET', M + 'seen:' + sub], ['GET', M + 'off:' + sub]]);
      return send(res, 200, { pres: presOf(true, true, seen, off, req) });
    }
    if (a === 'mimg') {
      const cid = q1(req, 'c'), id = q1(req, 'id'); if (!idOk(id)) throw err(404, 'not_found');
      await getConv(cid, me);
      const m = jp(await db('HGET', M + 'msg:' + cid, id)); if (!m || m.del || !m.img) throw err(404, 'not_found');
      const v = (q1(req, 't') === '1' && m.th && (await db('GET', M + 'th:' + cid + ':' + id))) || await db('GET', M + 'img:' + cid + ':' + id); if (!v) throw err(404, 'not_found');
      const [mime, b64] = v.split('|');
      res.statusCode = 200; res.setHeader('Content-Type', mime); res.setHeader('Cache-Control', 'private, max-age=31536000, immutable'); res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.end(Buffer.from(b64, 'base64'));
    }
    if (a === 'mposter') {
      const cid = q1(req, 'c'), id = q1(req, 'id'); if (!idOk(id)) throw err(404, 'not_found');
      await getConv(cid, me);
      const m = jp(await db('HGET', M + 'msg:' + cid, id)); if (!m || m.del || !m.vid) throw err(404, 'not_found');
      const v = await db('GET', M + 'vp:' + cid + ':' + id); if (!v) throw err(404, 'not_found');
      const [mime, b64] = v.split('|');
      res.statusCode = 200; res.setHeader('Content-Type', mime); res.setHeader('Cache-Control', 'private, max-age=31536000, immutable'); res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.end(Buffer.from(b64, 'base64'));
    }
    if (a === 'mvid') { // byte-range streaming from the stored chunks (Safari needs 206 responses)
      const cid = q1(req, 'c'), id = q1(req, 'id'); if (!idOk(id)) throw err(404, 'not_found');
      await getConv(cid, me);
      const m = jp(await db('HGET', M + 'msg:' + cid, id)); if (!m || m.del || !m.vid) throw err(404, 'not_found');
      const total = m.vid.size, rm = /^bytes=(\d*)-(\d*)$/.exec(String((req.headers && req.headers.range) || ''));
      let start = 0, end = total - 1;
      if (rm) { if (rm[1] === '' && rm[2] !== '') { start = Math.max(0, total - Number(rm[2])); } else { start = Number(rm[1]) || 0; if (rm[2] !== '') end = Math.min(end, Number(rm[2])); } }
      if (start >= total || start > end) { res.statusCode = 416; res.setHeader('Content-Range', 'bytes */' + total); return res.end(); }
      end = Math.min(end, start + RANGE_CAP - 1);
      const c0 = Math.floor(start / CHUNK), c1 = Math.floor(end / CHUNK);
      const parts = await dbm(Array.from({ length: c1 - c0 + 1 }, (_, k) => ['GET', M + 'vc:' + cid + ':' + id + ':' + (c0 + k)]));
      if (parts.some((x) => !x)) throw err(404, 'not_found');
      const buf = Buffer.concat(parts.map((x) => Buffer.from(x, 'base64'))), off = start - c0 * CHUNK;
      const out = buf.subarray(off, off + (end - start + 1));
      res.statusCode = 206; res.setHeader('Content-Type', m.vid.mime); res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Range', 'bytes ' + start + '-' + (start + out.length - 1) + '/' + total); res.setHeader('Content-Length', out.length);
      res.setHeader('Cache-Control', 'private, max-age=31536000, immutable'); res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.end(out);
    }
    if (a === 'convs') {
      const cids = (await db('ZREVRANGE', M + 'inbox:' + me, 0, 59)) || [];
      const convs = (await dbm(cids.map((c) => ['GET', M + 'conv:' + c]))).map(jp);
      const others = convs.map((c) => (c ? c.m.find((x) => x !== me) || me : null));
      const r = cids.length ? await dbm([...others.map((o) => ['GET', P + 'prof:' + o]), ...cids.map((c) => ['HGET', M + 'unread:' + me, c]), ...others.map((o) => ['SISMEMBER', M + 'blocked:' + me, o])]) : [];
      // last-seen for mutual followers, so a chat can show it the moment it opens
      const pz = cids.length ? await dbm(others.flatMap((o) => (o && o !== me ? [['SISMEMBER', P + 'following:' + me, o], ['SISMEMBER', P + 'following:' + o, me], ['GET', M + 'seen:' + o], ['GET', M + 'off:' + o]] : [['GET', M + 'none'], ['GET', M + 'none'], ['GET', M + 'none'], ['GET', M + 'none']]))) : [];
      const out = [];
      convs.forEach((c, i) => {
        const pr = jp(r[i]); if (!c || !pr) return;
        out.push({ id: cids[i], user: pubUser(pr), last: c.last ? { ...c.last, by: c.last.by === me ? 'me' : 'them' } : null, unread: Number(r[cids.length + i]) || 0, ts: c.ts, blocked: !!r[cids.length * 2 + i], mutual: !!(pz[i * 4] && pz[i * 4 + 1]), pres: presOf(isAdmin(me), !!(pz[i * 4] && pz[i * 4 + 1]), pz[i * 4 + 2], pz[i * 4 + 3], req) });
      });
      const h = (await db('HGETALL', M + 'unread:' + me)) || []; let n = 0;
      for (let i = 1; i < h.length; i += 2) n += Number(h[i]) || 0;
      return send(res, 200, { convs: out, unread: n });
    }
    if (a === 'open') { // find/prepare the chat with a user (nothing is stored until the first message)
      const nick = q1(req, 'nick').toLowerCase(); if (!NICK.test(nick)) throw err(404, 'not_found');
      const sub = await db('GET', P + 'nick:' + nick); const pr = sub && await getProf(sub);
      if (!pr) throw err(404, 'not_found');
      const cid = cidOf(me, sub);
      const [c, b1, b2] = await dbm([['GET', M + 'conv:' + cid], ['SISMEMBER', M + 'blocked:' + me, sub], ['SISMEMBER', M + 'blocked:' + sub, me]]);
      return send(res, 200, { id: cid, exists: !!c, user: pubUser(pr), blockedByMe: !!b1, blockedMe: !!b2, ...(sub === me ? { mutual: false, pres: null, self: true } : await presence(req, me, sub)) });
    }
    if (a === 'msgs') {
      const cid = q1(req, 'id'), c = await getConv(cid, me), other = c.m.find((x) => x !== me) || me;
      const before = Number(q1(req, 'before')) || 0, after = Number(q1(req, 'after')) || 0;
      let ids;
      if (after) ids = ((await db('ZREVRANGEBYSCORE', M + 'msgs:' + cid, '+inf', '(' + after, 'LIMIT', 0, 100)) || []).reverse();
      else ids = ((await db('ZREVRANGEBYSCORE', M + 'msgs:' + cid, before ? '(' + before : '+inf', '-inf', 'LIMIT', 0, PAGE + 1)) || []);
      let more = false;
      if (!after) { if (ids.length > PAGE) { more = true; ids = ids.slice(0, PAGE); } ids = ids.reverse(); }
      const rows = ids.length ? (await db('HMGET', M + 'msg:' + cid, ...ids)).map(jp).filter(Boolean) : [];
      if (q1(req, 'mark') === '1') await dbm([['HDEL', M + 'unread:' + me, cid], ['HSET', M + 'read:' + cid, me, String(Date.now())]]);
      const [pr, peerRead, b1, b2] = await dbm([['GET', P + 'prof:' + other], ['HGET', M + 'read:' + cid, other], ['SISMEMBER', M + 'blocked:' + me, other], ['SISMEMBER', M + 'blocked:' + other, me]]);
      const rxAll = (await db('HGETALL', M + 'rx:' + cid)) || [], rx = {}; // reactions of the whole chat (small: only reacted messages), keyed by message id
      const rxo = Array.isArray(rxAll) ? rxAll : Object.entries(rxAll).flat(); for (let i = 0; i + 1 < rxo.length; i += 2) { const v = rxView(rxo[i + 1], me); if (v) rx[rxo[i]] = v; }
      return send(res, 200, { rx, msgs: rows.map((m) => view(m, cid, me)), more, peerRead: Number(peerRead) || 0, user: pr ? pubUser(jp(pr)) : null, blockedByMe: !!b1, blockedMe: !!b2, ...(other === me ? { mutual: false, pres: null, self: true } : await presence(req, me, other)) });
    }
    throw err(400, 'bad_action');
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, 405, { error: 'method_not_allowed' }); }
  if (!mine) throw err(409, 'profile_required');
  const b = body(req), op = String(b.op || '');

  if (op === 'send') {
    await rateLimit(user, 'dmsend', 800);
    const { other, cid, cj } = await resolveTarget(b, me);
    const text = clean(b.text, MAX_TEXT), img = b.image ? parseImg(b.image, MAX_IMG) : null;
    if (!text && !img) throw err(400, 'empty');
    const m = { id: nowId('m'), by: me, ts: 0, text };
    if (img) m.img = 1;
    const th = img && b.thumb ? parseImg(b.thumb, 90 * 1024) : null; if (th) { m.th = 1; m.iw = Math.min(8192, Number(b.iw) | 0); m.ih = Math.min(8192, Number(b.ih) | 0); }
    if (b.fwd) m.fwd = 1;
    if (b.reply && idOk(String(b.reply))) { // quote of an earlier message in the same chat
      const q = jp(await db('HGET', M + 'msg:' + cid, String(b.reply)));
      if (q && !q.del) m.re = { id: q.id, by: q.by, x: (q.text || '').slice(0, 80), img: q.img ? 1 : 0, vid: q.vid ? 1 : 0 };
    }
    await commit(me, other, cid, cj, m, img ? [['SET', M + 'img:' + cid + ':' + m.id, img], ...(th ? [['SET', M + 'th:' + cid + ':' + m.id, th]] : [])] : []);
    await Promise.race([notifyPush(req, other, me, mine, m, cid).catch(() => {}), new Promise((r) => setTimeout(r, 6000))]); // serverless: finish before the response
    return send(res, 200, { id: cid, msg: view(m, cid, me) });
  }
  // --- video: chunked upload (start -> chunk x n -> done); stored forever next to the photos
  if (op === 'vstart') {
    await rateLimit(user, 'dmvid', 60);
    const { cid, other } = await resolveTarget(b, me);
    const mime = String(b.mime || '').toLowerCase().split(';')[0], size = Number(b.size) | 0;
    if (!VID_MIME.test(mime)) throw err(400, 'bad_video');
    if (size < 1 || size > MAX_VID) throw err(413, 'video_too_large');
    const pj = dataUrlParts(b.poster); if (!pj || !/^image\/(jpeg|png|webp)$/.test(pj.mime) || pj.b64.length > MAX_POSTER * 1.4) throw err(400, 'bad_image');
    const mid = nowId('m'), n = Math.ceil(size / CHUNK);
    const rec = { by: me, other, mime, size, n, dur: Math.min(3600, Math.max(0, Number(b.dur) || 0)), w: Math.min(4096, Number(b.w) | 0), h: Math.min(4096, Number(b.h) | 0) };
    await dbm([['SET', M + 'vup:' + cid + ':' + mid, JSON.stringify(rec), 'EX', 86400], ['SET', M + 'vp:' + cid + ':' + mid, pj.mime + '|' + pj.b64, 'EX', 86400]]);
    return send(res, 200, { id: cid, mid, n, chunk: CHUNK });
  }
  if (op === 'vchunk') {
    await rateLimit(user, 'dmvc', 6000);
    const cid = String(b.id || ''), mid = String(b.mid || ''); if (!idOk(cid) || !idOk(mid)) throw err(404, 'not_found');
    const rec = jp(await db('GET', M + 'vup:' + cid + ':' + mid)); if (!rec || rec.by !== me) throw err(404, 'not_found');
    const i = Number(b.i); if (!(i >= 0 && i < rec.n) || i !== Math.floor(i)) throw err(400, 'bad_chunk');
    const d = String(b.data || ''); if (!/^[A-Za-z0-9+/]+={0,2}$/.test(d) || d.length > Math.ceil(CHUNK / 3) * 4 + 8) throw err(400, 'bad_chunk');
    await db('SET', M + 'vc:' + cid + ':' + mid + ':' + i, d, 'EX', 86400);
    return send(res, 200, { ok: true, i });
  }
  if (op === 'vdone') {
    const cid = String(b.id || ''), mid = String(b.mid || ''); if (!idOk(mid)) throw err(404, 'not_found');
    const rec = jp(await db('GET', M + 'vup:' + cid + ':' + mid)); if (!rec || rec.by !== me) throw err(404, 'not_found');
    const { other, cj } = await checkPair(me, rec.other, cid); if (cidOf(me, other) !== cid) throw err(404, 'not_found');
    const keys = Array.from({ length: rec.n }, (_, i) => M + 'vc:' + cid + ':' + mid + ':' + i);
    const have = await dbm(keys.map((k) => ['EXISTS', k])); if (have.some((x) => !x)) throw err(409, 'incomplete');
    const m = { id: mid, by: me, ts: 0, text: clean(b.text, MAX_TEXT), vid: { mime: rec.mime, size: rec.size, n: rec.n, dur: rec.dur, w: rec.w, h: rec.h } };
    if (b.reply && idOk(String(b.reply))) { const q = jp(await db('HGET', M + 'msg:' + cid, String(b.reply))); if (q && !q.del) m.re = { id: q.id, by: q.by, x: (q.text || '').slice(0, 80), img: q.img ? 1 : 0, vid: q.vid ? 1 : 0 }; }
    await commit(me, other, cid, cj, m, [...keys.map((k) => ['PERSIST', k]), ['PERSIST', M + 'vp:' + cid + ':' + mid], ['DEL', M + 'vup:' + cid + ':' + mid]]);
    await Promise.race([notifyPush(req, other, me, mine, m, cid).catch(() => {}), new Promise((r) => setTimeout(r, 6000))]); // serverless: finish before the response
    return send(res, 200, { id: cid, msg: view(m, cid, me) });
  }
  if (op === 'pushtest') { // sends a test notification to the caller's own devices and reports what the push service answered
    if (!push.enabled()) return send(res, 200, { ok: false, devices: 0, codes: ['no_vapid'] });
    await rateLimit(user, 'ptest', 10);
    const subs = ((await db('SMEMBERS', M + 'push:' + me)) || []).map(jp).filter(Boolean), codes = [];
    await Promise.all(subs.map(async (sub) => { const r = await push.send(sub, { t: 'msg', nick: '', name: 'Driply', kind: 'text', text: 'Test ✓', cid: 'test' }, req); codes.push(r ? r.status : 0); if (r && r.gone) await removeSub(me, String(sub.endpoint)); }));
    return send(res, 200, { ok: codes.length > 0 && codes.every((c) => c >= 200 && c < 300), devices: subs.length, codes });
  }
  if (op === 'push') { // register / remove this device for message notifications
    const sub = b.sub && typeof b.sub === 'object' ? b.sub : null;
    if (b.off) { if (sub && sub.endpoint) await removeSub(me, String(sub.endpoint)); return send(res, 200, { ok: true }); }
    if (!sub || !/^https:\/\//.test(String(sub.endpoint || '')) || String(sub.endpoint).length > 600 || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) throw err(400, 'bad_sub');
    const rec = JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh: String(sub.keys.p256dh).slice(0, 120), auth: String(sub.keys.auth).slice(0, 40) } });
    const cur = (await db('SMEMBERS', M + 'push:' + me)) || [];
    for (const c of cur) { const o = jp(c); if (o && o.endpoint === sub.endpoint) await db('SREM', M + 'push:' + me, c); }
    await db('SADD', M + 'push:' + me, rec);
    if (cur.length > 6) await db('SREM', M + 'push:' + me, cur[0]);
    return send(res, 200, { ok: true });
  }
  if (op === 'react') { // one reaction per person per message; the same emoji again (or an empty one) removes it
    await rateLimit(user, 'react', 300);
    const cid = String(b.id || ''), mid = String(b.mid || ''); await getConv(cid, me); if (!idOk(mid)) throw err(404, 'not_found');
    const m = jp(await db('HGET', M + 'msg:' + cid, mid)); if (!m || m.del) throw err(404, 'not_found');
    const e = String(b.e || ''); if (e && !REACTS.includes(e)) throw err(400, 'bad_reaction');
    const cur = jp(await db('HGET', M + 'rx:' + cid, mid)) || {};
    if (!e || cur[me] === e) delete cur[me]; else cur[me] = e;
    if (Object.keys(cur).length) await db('HSET', M + 'rx:' + cid, mid, JSON.stringify(cur)); else await db('HDEL', M + 'rx:' + cid, mid);
    return send(res, 200, { ok: true, rx: rxView(JSON.stringify(cur), me) || [] });
  }
  if (op === 'delMsg') { // unsend your own message
    const cid = String(b.id || ''), c = await getConv(cid, me), mid = String(b.mid || ''); if (!idOk(mid)) throw err(404, 'not_found');
    const m = jp(await db('HGET', M + 'msg:' + cid, mid)); if (!m) throw err(404, 'not_found');
    if (m.by !== me) throw err(403, 'forbidden');
    const cmds = [['HSET', M + 'msg:' + cid, mid, JSON.stringify({ id: m.id, by: m.by, ts: m.ts, del: true })], ['DEL', M + 'img:' + cid + ':' + mid], ['DEL', M + 'th:' + cid + ':' + mid], ['HDEL', M + 'rx:' + cid, mid]];
    if (m.vid) { for (let i = 0; i < (m.vid.n || 0); i++) cmds.push(['DEL', M + 'vc:' + cid + ':' + mid + ':' + i]); cmds.push(['DEL', M + 'vp:' + cid + ':' + mid]); }
    if (c.lastId === mid) { c.last = { by: me, t: 'del', x: '', ts: m.ts }; cmds.push(['SET', M + 'conv:' + cid, JSON.stringify(c)]); }
    await dbm(cmds);
    return send(res, 200, { ok: true });
  }
  if (op === 'read') { const cid = String(b.id || ''); await getConv(cid, me); await dbm([['HDEL', M + 'unread:' + me, cid], ['HSET', M + 'read:' + cid, me, String(Date.now())]]); return send(res, 200, { ok: true }); }
  if (op === 'block') {
    const nick = String(b.nick || '').toLowerCase(); if (!NICK.test(nick)) throw err(404, 'not_found');
    const sub = await db('GET', P + 'nick:' + nick); if (!sub) throw err(404, 'not_found');
    if (sub === me) throw err(400, 'self_block'); // you cannot block your own account (checked here, not only in the UI)
    await db(b.on ? 'SADD' : 'SREM', M + 'blocked:' + me, sub);
    return send(res, 200, { ok: true, blocked: !!b.on });
  }
  throw err(400, 'bad_op');
});
