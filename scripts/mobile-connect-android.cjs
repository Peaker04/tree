const { execFileSync, spawnSync } = require('child_process');

const APP_ID = process.env.NOVYX_ANDROID_APP_ID || 'com.novyx.greenops';
const METRO_PORT = process.env.NOVYX_METRO_PORT || '8082';
const API_PORT = process.env.NOVYX_API_PORT || '3000';
const DEV_SERVER_URL = process.env.NOVYX_DEV_SERVER_URL || `127.0.0.1:${METRO_PORT}`;

function adb(args, options = {}) {
  return execFileSync('adb', args, {
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function adbTry(args, options = {}) {
  const result = spawnSync('adb', args, {
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  });

  return {
    ok: result.status === 0,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
    status: result.status,
  };
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function assertDevice() {
  const devices = adb(['devices'])
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /\bdevice\b/.test(line));

  if (devices.length === 0) {
    throw new Error('No Android device is connected over ADB.');
  }

  console.log(`Android device: ${devices[0].split(/\s+/)[0]}`);
}

function setReverse(port) {
  const result = adbTry(['reverse', `tcp:${port}`, `tcp:${port}`]);
  if (!result.ok) {
    throw new Error(`adb reverse tcp:${port} failed: ${result.stderr || result.stdout}`);
  }
}

function launchApp() {
  adbTry(['shell', 'am', 'force-stop', APP_ID]);
  adb(['shell', 'monkey', '-p', APP_ID, '-c', 'android.intent.category.LAUNCHER', '1'], { stdio: 'pipe' });
}

function dumpUi() {
  adbTry(['shell', 'uiautomator', 'dump', '/sdcard/novyx-window.xml']);
  return adb(['shell', 'cat', '/sdcard/novyx-window.xml']);
}

function decodeXml(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function center(bounds) {
  const match = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return null;

  const [, left, top, right, bottom] = match.map(Number);
  return {
    x: Math.round((left + right) / 2),
    y: Math.round((top + bottom) / 2),
  };
}

function findNodeBounds(xml, predicate) {
  const nodes = xml.match(/<node\b[^>]*>/g) || [];
  for (const rawNode of nodes) {
    const node = decodeXml(rawNode);
    if (!predicate(node)) continue;

    const bounds = node.match(/bounds="([^"]+)"/)?.[1];
    if (bounds) return bounds;
  }

  return null;
}

function tapBounds(bounds, label) {
  const point = center(bounds);
  if (!point) {
    throw new Error(`Could not tap ${label}: invalid bounds ${bounds}`);
  }

  adb(['shell', 'input', 'tap', String(point.x), String(point.y)]);
}

function connectFromDevLauncher(xml) {
  if (xml.includes('There was a problem loading the project.')) {
    const goHomeBounds = findNodeBounds(xml, (node) => /text="Go home"/.test(node));
    if (goHomeBounds) {
      tapBounds(goHomeBounds, 'Go home');
      sleep(1200);
      xml = dumpUi();
    }
  }

  const inputBounds = findNodeBounds(xml, (node) => /class="android\.widget\.EditText"/.test(node));
  if (!inputBounds) {
    throw new Error('Dev Launcher URL input was not found.');
  }

  tapBounds(inputBounds, 'URL input');
  sleep(300);
  adb(['shell', 'input', 'text', DEV_SERVER_URL]);
  sleep(500);

  const nextXml = dumpUi();
  const connectBounds =
    findNodeBounds(nextXml, (node) => /text="Connect"/.test(node)) ??
    findNodeBounds(nextXml, (node) => /content-desc="Connect"/.test(node));

  if (!connectBounds) {
    throw new Error('Dev Launcher Connect button was not found.');
  }

  tapBounds(connectBounds, 'Connect');
}

function main() {
  assertDevice();
  setReverse(METRO_PORT);
  setReverse(API_PORT);
  console.log(`adb reverse ready: ${METRO_PORT}, ${API_PORT}`);

  launchApp();
  sleep(2500);

  let xml = dumpUi();
  if (xml.includes('Development Build') || xml.includes('DEVELOPMENT SERVERS')) {
    connectFromDevLauncher(xml);
    sleep(9000);
    xml = dumpUi();
  }

  if (xml.includes('Development Build') || xml.includes('There was a problem loading the project.')) {
    throw new Error(`NOVYX did not reach MainActivity. Current screen still looks like Expo Dev Launcher.`);
  }

  console.log(`NOVYX connected to ${DEV_SERVER_URL} on Android.`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
