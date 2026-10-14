// GET /api/items?ids=a,b,c -> full items (with photos) of the signed-in user, max 10 per call
const { handler, send, db } = require('./_lib');
const ID = /^[\w-]{1,40}$/;
module.exports = handler(async (req, res, user) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  const q = req.query && req.query.ids !== undefined ? req.query.ids : new URL(req.url, 'http://x').searchParams.get('ids') || '';
  const ids = String(Array.isArray(q) ? q.join(',') : q).split(',').filter((x) => ID.test(x)).slice(0, 10);
  if (!ids.length) return send(res, 200, { items: [] });
  const rows = await db('HMGET', `wd:${user.sub}:items`, ...ids);
  send(res, 200, { items: (rows || []).filter(Boolean).map((r) => JSON.parse(r)) });
}, { csrf: false });
