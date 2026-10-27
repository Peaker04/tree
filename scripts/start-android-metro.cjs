const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const repoRoot = path.resolve(__dirname, '..');
const logFile = path.join(repoRoot, 'tmp-android-metro.log');
const outFd = fs.openSync(logFile, 'w');

const env = {
  ...process.env,
  EXPO_PUBLIC_API_BASE_URL: 'http://127.0.0.1:3000',
  EXPO_PUBLIC_METRO_PORT: '8082',
};

const proc = spawn('node', ['scripts/expo-mobile.cjs', 'start', '--port', '8082', '--dev-client', '--host', 'localhost', '--clear'], {
  cwd: repoRoot,
  env,
  detached: true,
  stdio: ['ignore', outFd, outFd],
  windowsHide: true,
});

proc.unref();
console.log('Started Android Metro on PID:', proc.pid);
