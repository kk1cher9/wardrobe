// Apple WeatherKit (REST API) proxy. The Apple private key NEVER reaches the browser:
// this function signs a short-lived ES256 JWT server-side and returns normalized weather.
//   GET /api/weather?lat=..&lon=..&tz=Europe/Kyiv&cc=UA&lang=ru
// Docs: https://developer.apple.com/documentation/weatherkitrestapi
const crypto = require('crypto');
const { handler, send, err } = require('./_lib');

const BASE = process.env.WEATHERKIT_BASE || 'https://weatherkit.apple.com';
const b64u = (v) => Buffer.from(v).toString('base64url');
let tok = { v: null, exp: 0 };

function appleToken() {
  const { APPLE_TEAM_ID: team, APPLE_SERVICE_ID: svc, APPLE_KEY_ID: kid } = process.env;
  let pem = process.env.APPLE_PRIVATE_KEY;
  if (!team || !svc || !kid || !pem) throw err(503, 'weatherkit_not_configured');
  if (tok.v && tok.exp > Date.now() + 60e3) return tok.v;
  pem = pem.replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: 'ES256', kid, id: `${team}.${svc}`, typ: 'JWT' }));
  const p = b64u(JSON.stringify({ iss: team, iat: now, exp: now + 3600, sub: svc }));
  const sig = crypto.sign('sha256', Buffer.from(h + '.' + p), { key: pem, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  tok = { v: `${h}.${p}.${sig}`, exp: (now + 3600) * 1000 };
  return tok.v;
}

const KMH = 1 / 3.6; // WeatherKit wind is km/h
function kind(code, type) {
  const c = String(code || '');
  const snow = type === 'snow' || /Snow|Flurr|Blizzard|Sleet|WintryMix/.test(c);
  const rain = !snow && (['rain', 'mixed', 'hail', 'sleet'].includes(type) || /Rain|Drizzle|Shower|Thunder|Storm/.test(c));
  return { rain, snow };
}
function normalize(raw) {
  const cw = raw.currentWeather || {};
  const hrs = (raw.forecastHourly && raw.forecastHourly.hours) || [];
  const days = (raw.forecastDaily && raw.forecastDaily.days) || [];
  const al = (raw.weatherAlerts && raw.weatherAlerts.alerts) || [];
  return {
    source: 'weatherkit', fetchedAt: Date.now(), asOf: cw.asOf || null,
    current: { temp: cw.temperature, feels: cw.temperatureApparent, wind: (cw.windSpeed || 0) * KMH, humidity: Math.round((cw.humidity || 0) * 100), code: cw.conditionCode, ...kind(cw.conditionCode, cw.precipitationType) },
    hourly: hrs.slice(0, 96).map((h) => ({ time: h.forecastStart, t: h.temperature, f: h.temperatureApparent, pop: Math.round((h.precipitationChance || 0) * 100), wind: (h.windSpeed || 0) * KMH, gust: (h.windGust || 0) * KMH, code: h.conditionCode, ...kind(h.conditionCode, h.precipitationType) })),
    daily: days.slice(0, 7).map((d) => ({ time: d.forecastStart, tmax: d.temperatureMax, tmin: d.temperatureMin, pop: Math.round((d.precipitationChance || 0) * 100), code: d.conditionCode })),
    alerts: al.slice(0, 5).map((a) => ({ title: a.description || a.phenomenon || 'Weather alert', severity: a.severity || '', source: a.source || '', url: a.detailsUrl || '' })),
  };
}

const cache = new Map();
module.exports = handler(async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  const q = req.query || Object.fromEntries(new URL(req.url, 'http://x').searchParams);
  const lat = Number(q.lat), lon = Number(q.lon);
  if (!(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180) || q.lat === undefined) throw err(400, 'bad_coordinates');
  const tz = /^[A-Za-z_]+(\/[A-Za-z_+\-0-9]+){0,2}$/.test(q.tz || '') ? q.tz : 'UTC';
  const cc = /^[A-Za-z]{2}$/.test(q.cc || '') ? String(q.cc).toUpperCase() : '';
  const lang = /^[a-z]{2}(-[A-Za-z]{2})?$/.test(q.lang || '') ? q.lang : 'en';
  const key = `${lat.toFixed(2)},${lon.toFixed(2)},${tz},${lang}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60e3) return send(res, 200, hit.data);
  const params = new URLSearchParams({ dataSets: 'currentWeather,forecastHourly,forecastDaily,weatherAlerts', timezone: tz,
    hourlyStart: new Date(Date.now() - 24 * 3600e3).toISOString().replace(/\.\d+Z$/, 'Z'), hourlyEnd: new Date(Date.now() + 72 * 3600e3).toISOString().replace(/\.\d+Z$/, 'Z') });
  if (cc) params.set('countryCode', cc);
  const r = await fetch(`${BASE}/api/v1/weather/${lang}/${lat.toFixed(4)}/${lon.toFixed(4)}?${params}`, { headers: { Authorization: 'Bearer ' + appleToken() } });
  if (r.status === 401 || r.status === 403) throw err(502, 'weatherkit_auth_failed');
  if (r.status === 429) throw err(429, 'weatherkit_rate_limited');
  if (!r.ok) throw err(502, 'weatherkit_error');
  const data = normalize(await r.json());
  cache.set(key, { at: Date.now(), data });
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  send(res, 200, data);
}, { auth: false, csrf: false });
module.exports.normalize = normalize;
