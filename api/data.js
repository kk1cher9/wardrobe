// Per-account storage. Keys come ONLY from the verified session (user.sub) -> users can never touch each other's data.
const { handler, send, body, err, db } = require('./_lib');
const ID = /^[\w-]{1,40}$/;
const MAX_ITEM_BYTES = 900 * 1024;

function cleanItem(it) {
  if (!it || !ID.test(String(it.id)) || typeof it.img !== 'string' || !it.img.startsWith('data:image/')) throw err(400, 'bad_item');
  const out = {
    id: String(it.id), name: String(it.name || '').slice(0, 120), cat: String(it.cat || '').slice(0, 40), color: String(it.color || '').slice(0, 40),
    season: String(it.season || '').slice(0, 20), warm: Math.max(1, Math.min(5, Number(it.warm) || 2)), rain: !!it.rain,
    wind: it.wind == null ? null : !!it.wind, tmin: it.tmin == null ? null : Number(it.tmin), tmax: it.tmax == null ? null : Number(it.tmax),
    gen: !!it.gen,
    cut: !!it.cut,
    hexManual: /^#[0-9a-f]{6}$/i.test(it.hexManual || '') ? it.hexManual : null,
    ai: it.ai && typeof it.ai === 'object' && JSON.stringify(it.ai).length < 4000 ? it.ai : null,
    img: it.img, ts: Number(it.ts) || Date.now(),
  };
  if (Buffer.byteLength(JSON.stringify(out)) > MAX_ITEM_BYTES) throw err(413, 'item_too_large');
  return out;
}

module.exports = handler(async (req, res, user) => {
  const k = `wd:${user.sub}:`;
  if (req.method === 'GET') {
    const flat = (await db('HGETALL', k + 'idx')) || [];
    const index = {};
    for (let i = 0; i < flat.length; i += 2) index[flat[i]] = Number(flat[i + 1]);
    const m = await db('GET', k + 'meta');
    return send(res, 200, { index, meta: m ? JSON.parse(m) : null });
  }
  if (req.method === 'POST') {
    const b = body(req);
    if (b.op === 'putItems') {
      const items = (Array.isArray(b.items) ? b.items : []).slice(0, 10).map(cleanItem);
      if (items.length) {
        await db('HSET', k + 'items', ...items.flatMap((i) => [i.id, JSON.stringify(i)]));
        await db('HSET', k + 'idx', ...items.flatMap((i) => [i.id, String(i.ts)]));
      }
      return send(res, 200, { ok: true, n: items.length });
    }
    if (b.op === 'delItems') {
      const ids = (Array.isArray(b.ids) ? b.ids : []).map(String).filter((x) => ID.test(x)).slice(0, 200);
      if (ids.length) { await db('HDEL', k + 'items', ...ids); await db('HDEL', k + 'idx', ...ids); }
      return send(res, 200, { ok: true, n: ids.length });
    }
    if (b.op === 'meta') {
      const ts = Number(b.ts) || Date.now();
      const raw = await db('GET', k + 'meta');
      const cur = raw ? JSON.parse(raw) : null;
      if (cur && cur.ts > ts) return send(res, 200, { ok: true, ignored: true, ts: cur.ts }); // last write wins
      const m = b.meta || {};
      const meta = {
        ts,
        outfits: Array.isArray(m.outfits) ? m.outfits.slice(0, 1000) : [],
        hist: Array.isArray(m.hist) ? m.hist.slice(0, 200) : [],
        settings: m.settings && typeof m.settings === 'object' ? m.settings : {},
        pos: m.pos && typeof m.pos === 'object' ? m.pos : {},
      };
      const json = JSON.stringify(meta);
      if (Buffer.byteLength(json) > 400 * 1024) throw err(413, 'meta_too_large');
      await db('SET', k + 'meta', json);
      return send(res, 200, { ok: true, ts });
    }
    throw err(400, 'bad_op');
  }
  res.setHeader('Allow', 'GET, POST');
  send(res, 405, { error: 'method_not_allowed' });
});
