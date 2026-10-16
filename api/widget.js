// Home-screen widget feed (Scriptable on iPhone). The signed-in app stores a small snapshot (weather + today's outfit) under a secret token;
// the widget reads it with GET /api/widget?t=<token> (no cookie needed, the token IS the key). Rotating the token revokes the old link.
const crypto = require('crypto');
const { handler, send, body, err, db, rateLimit, who } = require('./_lib');
const TOK = /^[A-Za-z0-9_-]{20,40}$/;
const num = (v, d) => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 10) / 10 : d);
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n);

function cleanSnap(b, host) {
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 4).map((i) => {
    const o = { n: str(i && i.n, 60) };
    if (i && typeof i.u === 'string') { let u; try { u = new URL(i.u); } catch { u = null; } if (u && (u.protocol === 'https:' || /^(localhost|127\.0\.0\.1)(:|$)/.test(u.host)) && u.host === host && u.pathname.startsWith('/demo/')) o.u = u.href.slice(0, 200); }
    else if (i && typeof i.b === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(i.b) && i.b.length <= 40000) o.b = i.b;
    return o.u || o.b ? o : null;
  }).filter(Boolean);
  return { ts: Date.now(), city: str(b.city, 40), temp: num(b.temp, 0), feels: num(b.feels, null), txt: str(b.txt, 30), rain: !!b.rain, label: str(b.label, 60), items };
}

module.exports = handler(async (req, res, user) => {
  if (req.method === 'GET') {
    const t = new URL(req.url, 'http://x').searchParams.get('t') || '';
    if (!TOK.test(t)) throw err(404, 'not_found');
    await rateLimit(who(req, null), 'wdg', 3000);
    const v = await db('GET', 'wd:wg:' + t); if (!v) throw err(404, 'not_found');
    return send(res, 200, JSON.parse(v));
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(res, 405, { error: 'method_not_allowed' }); }
  if (!user) throw err(401, 'unauthorized');
  const b = body(req), k = `wd:${user.sub}:wtok`;
  let tok = await db('GET', k);
  if (b.op === 'token' || b.op === 'reset') {
    if (b.op === 'reset' && tok) { await db('DEL', 'wd:wg:' + tok); tok = null; }
    if (!tok) { tok = crypto.randomBytes(18).toString('base64url'); await db('SET', k, tok); }
    return send(res, 200, { token: tok });
  }
  if (b.op === 'off') { if (tok) await db('DEL', 'wd:wg:' + tok, k); return send(res, 200, { ok: true }); }
  if (b.op === 'snap') {
    if (!tok) throw err(409, 'no_token');
    await rateLimit(user, 'wdgsnap', 600);
    const snap = cleanSnap(b, String(req.headers.host || ''));
    const json = JSON.stringify(snap); if (json.length > 150000) throw err(413, 'too_large');
    await db('SET', 'wd:wg:' + tok, json, 'EX', 60 * 86400);
    return send(res, 200, { ok: true, n: snap.items.length });
  }
  throw err(400, 'bad_op');
}, { auth: false });
