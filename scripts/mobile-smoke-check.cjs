const { execFileSync } = require('node:child_process');
const http = require('node:http');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000/v1';
const METRO_PORT = process.env.EXPO_PUBLIC_METRO_PORT || '8082';
const apiHost = new URL(API_BASE_URL).hostname;
const isLocalDevApi = ['127.0.0.1', 'localhost'].includes(apiHost);

const run = (command, args) => {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    return error.stderr?.toString().trim() || error.message;
  }
};

const requestText = (url) =>
  new Promise((resolve) => {
    const request = http.get(url, (response) => {
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () =>
        resolve({
          body: body.trim(),
          ok: response.statusCode >= 200 && response.statusCode < 300,
          statusCode: response.statusCode,
          url,
        }),
      );
    });
    request.on('error', (error) => resolve({ body: error.message, ok: false, statusCode: 0, url }));
    request.setTimeout(3000, () => {
      request.destroy();
      resolve({ body: 'Request timed out', ok: false, statusCode: 0, url });
    });
  });

const requestJson = (method, pathname, body) =>
  new Promise((resolve) => {
    const base = new URL(API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`);
    const url = new URL(pathname.replace(/^\//, ''), base);
    const payload = body ? JSON.stringify(body) : undefined;
    const request = http.request(
      url,
      {
        method,
        headers: {
          Accept: 'application/json',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
        timeout: 3000,
      },
      (response) => {
        let raw = '';
        response.on('data', (chunk) => {
          raw += chunk;
        });
        response.on('end', () => {
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = null;
          }

          resolve({
            body: parsed,
            ok: response.statusCode >= 200 && response.statusCode < 300,
            raw: raw.trim(),
            statusCode: response.statusCode,
            url: url.toString(),
          });
        });
      },
    );
    request.on('error', (error) =>
      resolve({ body: null, ok: false, raw: error.message, statusCode: 0, url: url.toString() }),
    );
    request.on('timeout', () => {
      request.destroy();
      resolve({ body: null, ok: false, raw: 'Request timed out', statusCode: 0, url: url.toString() });
    });
    if (payload) {
      request.write(payload);
    }
    request.end();
  });

const getMetroStatus = async () => {
  const candidates = [`http://127.0.0.1:${METRO_PORT}/status`, `http://localhost:${METRO_PORT}/status`];
  const results = [];

  for (const url of candidates) {
    const result = await requestText(url);
    results.push(result);
    if (result.ok) {
      return `OK ${result.body} (${url})`;
    }
  }

  return results.map((result) => `FAIL ${result.url}: ${result.body}`).join('; ');
};

const describeCollection = (result, name) => {
  const count = Array.isArray(result.body?.data) ? result.body.data.length : 'n/a';
  return `${result.ok ? 'OK' : 'FAIL'} ${name}: HTTP ${result.statusCode}, count=${count}`;
};

const getApiStatus = async () => {
  if (isLocalDevApi) {
    await requestJson('POST', 'dev/reset');
  }

  const health = await requestJson('GET', 'health');
  if (!health.ok) {
    return [`FAIL health: ${health.url}: ${health.raw || `HTTP ${health.statusCode}`}`];
  }

  const login = await requestJson('POST', 'auth/login', {
    identifier: 'hung.nguyen@novyx.vn',
    password: 'demo123',
  });
  const trees = await requestJson('GET', 'trees');
  const qrLookup = await requestJson('GET', 'trees?q=NOVYX-TRE-0824&limit=1');
  const tasks = await requestJson('GET', 'tasks?staffId=STF-01');
  const notifications = await requestJson('GET', 'notifications');
  const progress = await requestJson('PATCH', 'tasks/TSK-101/progress', {
    gpsCheck: {
      verified: true,
      distance: 4.2,
      timestamp: new Date().toISOString(),
      lat: 10.77421,
      lng: 106.69101,
    },
  });
  const createdNotification = await requestJson('POST', 'notifications', {
    title: 'Smoke test',
    body: 'Kiểm tra API dev mobile.',
    type: 'info',
  });
  const notificationId = createdNotification.body?.data?.id;
  const readNotification = notificationId
    ? await requestJson('PATCH', `notifications/${encodeURIComponent(notificationId)}/read`)
    : { ok: false, statusCode: 0, raw: 'Notification create did not return id' };

  const lines = [
    `OK health: ${health.body?.data?.service || 'unknown'}`,
    `${login.ok ? 'OK' : 'FAIL'} login: HTTP ${login.statusCode}, token=${login.body?.data?.session?.accessToken ? 'yes' : 'no'}`,
    describeCollection(trees, 'trees'),
    describeCollection(qrLookup, 'qr lookup'),
    describeCollection(tasks, 'staff tasks'),
    describeCollection(notifications, 'notifications'),
    `${progress.ok ? 'OK' : 'FAIL'} task progress mutation: HTTP ${progress.statusCode}`,
    `${createdNotification.ok ? 'OK' : 'FAIL'} notification create mutation: HTTP ${createdNotification.statusCode}`,
    `${readNotification.ok ? 'OK' : 'FAIL'} notification read mutation: HTTP ${readNotification.statusCode}`,
  ];

  if (isLocalDevApi) {
    const reset = await requestJson('POST', 'dev/reset');
    lines.push(`${reset.ok ? 'OK' : 'FAIL'} local dev reset after smoke: HTTP ${reset.statusCode}`);
  }

  return lines;
};

const ensureAdbReverse = () => {
  run('adb', ['reverse', `tcp:${METRO_PORT}`, `tcp:${METRO_PORT}`]);
  run('adb', ['reverse', 'tcp:3000', 'tcp:3000']);
};

(async () => {
  console.log('NOVYX mobile smoke preflight');
  console.log('');
  ensureAdbReverse();
  console.log(`Metro: ${await getMetroStatus()}`);
  console.log('API:');
  console.log((await getApiStatus()).map((line) => `  ${line}`).join('\n'));
  console.log('');
  console.log('ADB devices:');
  console.log(run('adb', ['devices']) || '(none)');
  console.log('');
  console.log('ADB reverse:');
  console.log(run('adb', ['reverse', '--list']) || '(none)');
  console.log('');
  console.log('Recent crash markers:');
  const logcat = run('adb', ['logcat', '-d', '-t', '300']);
  const crashLines = logcat
    .split(/\r?\n/)
    .filter((line) =>
      /FATAL EXCEPTION|ReactNativeJS|Unable to load script|ViewManagerAdapter|TurboModuleRegistry|getEnforcing/.test(
        line,
      ),
    );
  console.log(crashLines.length > 0 ? crashLines.join('\n') : 'No recent crash markers found.');
  console.log('');
  console.log('Next manual smoke steps: docs/MOBILE_SMOKE_TEST.md');
})();
