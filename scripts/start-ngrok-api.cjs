const { spawn, execSync } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const logFile = path.join(repoRoot, 'tmp-ngrok.log');
const outFd = fs.openSync(logFile, 'w');

// Terminate old ngrok processes
try {
  if (process.platform === 'win32') {
    execSync('taskkill /F /IM ngrok.exe >nul 2>&1');
  }
} catch {
  // ignore
}

const proc = spawn('ngrok', ['http', '3000', '--log=stdout'], {
  detached: true,
  stdio: ['ignore', outFd, outFd],
  windowsHide: true,
});

proc.unref();

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      })
      .on('error', reject);
  });
}

async function getTunnel() {
  const start = Date.now();
  while (Date.now() - start < 20000) {
    try {
      const res = await httpGet('http://127.0.0.1:4040/api/tunnels');
      if (res.status === 200) {
        const payload = JSON.parse(res.data);
        const tunnels = payload.tunnels || [];
        const httpsTunnel = tunnels.find((t) => t.proto === 'https') || tunnels[0];
        if (httpsTunnel && httpsTunnel.public_url) {
          fs.writeFileSync(path.join(repoRoot, 'tmp-ngrok.json'), JSON.stringify(httpsTunnel, null, 2));
          console.log('PUBLIC_URL=' + httpsTunnel.public_url);
          return;
        }
      }
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  console.error('Timed out waiting for ngrok tunnel');
  process.exit(1);
}

getTunnel();
