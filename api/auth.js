// GET /api/auth (me) | POST /api/auth {credential} (Google ID token -> session cookie) | DELETE /api/auth (logout)
const { handler, send, body, err, verifyGoogle, makeSession, cookieHeader, assertNotBanned } = require('./_lib');
module.exports = handler(async (req, res, user) => {
  if (req.method === 'GET') {
    if (!user) return send(res, 401, { error: 'unauthorized' });
    return send(res, 200, { user: { sub: user.sub, name: user.name, email: user.email, picture: user.picture } });
  }
  if (req.method === 'POST') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw err(500, 'google_not_configured');
    const c = await verifyGoogle(body(req).credential, clientId);
    await assertNotBanned(c.sub); // banned accounts never get a session
    const u = { sub: c.sub, name: String(c.name || c.email || 'User').slice(0, 120), email: String(c.email || '').slice(0, 200), picture: /^https:\/\//.test(c.picture || '') ? String(c.picture).slice(0, 300) : '' };
    res.setHeader('Set-Cookie', cookieHeader(req, makeSession(u), 30 * 86400));
    return send(res, 200, { user: u });
  }
  if (req.method === 'DELETE') {
    if (user) { try { await require('./_lib').db('SET', 'wd:m:off:' + user.sub, String(Date.now())); } catch { /* ignore */ } } // logged out = not online any more
    res.setHeader('Set-Cookie', cookieHeader(req, '', 0));
    return send(res, 200, { ok: true });
  }
  res.setHeader('Allow', 'GET, POST, DELETE');
  send(res, 405, { error: 'method_not_allowed' });
}, { auth: false, csrf: true });
