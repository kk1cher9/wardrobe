// Public (non-secret) client configuration + which optional integrations are configured on the server.
const { handler, send, syncAvailable } = require('./_lib');
module.exports = handler(async (req, res) => {
  const e = process.env;
  send(res, 200, {
    googleClientId: e.GOOGLE_CLIENT_ID || null,
    sync: syncAvailable(),
    social: !!e.GOOGLE_CLIENT_ID && syncAvailable(), // Driply needs sign-in + the database
    push: require('./_push').enabled() ? require('./_push').publicKey() : null, // VAPID public key (not secret) for message notifications
    weatherKit: !!(e.APPLE_TEAM_ID && e.APPLE_SERVICE_ID && e.APPLE_KEY_ID && e.APPLE_PRIVATE_KEY),
  });
}, { auth: false, csrf: false });
