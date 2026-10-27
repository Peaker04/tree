const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_FUD ?? process.env.EXPO_PUBLIC_API_HOME;
const METRO_PORT = process.env.EXPO_PUBLIC_METRO_PORT || '8082';
const STAFF_EMAIL = process.env.NOVYX_DEV_STAFF_EMAIL || 'staff@novyx.local';
const STAFF_PASSWORD = process.env.NOVYX_DEV_PASSWORD;

if (!API_BASE_URL) {
  console.error('FAIL no public API URL is configured.');
  process.exit(1);
}

const configuredApiUrl = new URL(API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`);
const apiOrigin = configuredApiUrl.origin;
const apiBase = configuredApiUrl.pathname.replace(/\/$/, '').endsWith('/v1')
  ? configuredApiUrl
  : new URL('/v1/', apiOrigin);
const results = [];

const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}: ${detail}`);
};

const request = (method, url, body, token) =>
  new Promise((resolve) => {
    const target = new URL(url);
    const client = target.protocol === 'https:' ? https : http;
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = client.request(
      target,
      {
        method,
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 5000,
      },
      (response) => {
        let raw = '';
        response.on('data', (chunk) => {
          raw += chunk;
        });
        response.on('end', () => {
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            // Keep raw response for diagnostics.
          }
          resolve({
            ok: Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 300),
            status: response.statusCode || 0,
            json,
            raw: raw.trim(),
          });
        });
      },
    );
    req.on('error', (error) => resolve({ ok: false, status: 0, json: null, raw: error.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, json: null, raw: 'Request timed out' });
    });
    if (payload) req.write(payload);
    req.end();
  });

const collectionCount = (response) => {
  const data = response.json?.data;
  return Array.isArray(data) ? data.length : null;
};

const getAdbDevices = () => {
  try {
    const output = execFileSync('adb', ['devices'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return output
      .split(/\r?\n/)
      .slice(1)
      .filter((line) => /\tdevice$/.test(line));
  } catch {
    return [];
  }
};

(async () => {
  console.log('NOVYX mobile runtime preflight');
  console.log(`API origin: ${apiOrigin}`);
  console.log(`API base: ${apiBase.pathname.replace(/\/$/, '')}`);
  console.log('');

  const metro = await request('GET', `http://127.0.0.1:${METRO_PORT}/status`);
  record('Metro', metro.ok && metro.raw.includes('packager-status:running'), metro.raw || `HTTP ${metro.status}`);

  const health = await request('GET', `${apiOrigin}/health`);
  record('API liveness', health.ok && health.json?.status === 'ok', `HTTP ${health.status} ${health.raw}`);

  const ready = await request('GET', `${apiOrigin}/ready`);
  record(
    'API readiness',
    ready.ok && ready.json?.status === 'ok' && ready.json?.database === 'connected',
    `HTTP ${ready.status} ${ready.raw}`,
  );

  let token = null;
  let user = null;
  if (!STAFF_PASSWORD) {
    record('Staff login', false, 'NOVYX_DEV_PASSWORD is not configured.');
  } else {
    const login = await request('POST', new URL('auth/login', apiBase), {
      identifier: STAFF_EMAIL,
      password: STAFF_PASSWORD,
    });
    const session = login.json?.data?.session ?? login.json?.session;
    token = session?.accessToken ?? null;
    user = session?.user ?? null;
    record(
      'Staff login',
      login.ok && Boolean(token) && user?.role === 'staff',
      `HTTP ${login.status}, session=${token ? 'yes' : 'no'}, role=${user?.role || 'none'}, userId=${user?.id || 'none'}`,
    );
  }

  if (token) {
    const trees = await request('GET', new URL('trees', apiBase), undefined, token);
    record('Authenticated trees', trees.ok, `HTTP ${trees.status}, count=${collectionCount(trees) ?? 'n/a'}`);

    const tasks = await request('GET', new URL('tasks', apiBase), undefined, token);
    record('Authenticated staff tasks', tasks.ok, `HTTP ${tasks.status}, count=${collectionCount(tasks) ?? 'n/a'}`);
  } else {
    record('Authenticated trees', false, 'Skipped because login failed.');
    record('Authenticated staff tasks', false, 'Skipped because login failed.');
  }

  const adbDevices = getAdbDevices();
  console.log('');
  console.log(
    adbDevices.length > 0
      ? `Android devices: ${adbDevices.length} connected.`
      : 'Android devices: none (not required for physical iPhone + Expo Go).',
  );
  console.log('iPhone device checks remain interactive in Expo Go; this script does not claim device PASS.');

  if (results.some((result) => !result.ok)) process.exitCode = 1;
})();
