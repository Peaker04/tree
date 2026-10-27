const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const repoRoot = path.resolve(__dirname, '..');
const logFile = path.join(repoRoot, 'tmp-api.log');
const outFd = fs.openSync(logFile, 'w');

const proc = spawn('node', ['--env-file-if-exists=.env', 'node_modules/tsx/dist/cli.mjs', 'watch', 'apps/api/src/index.ts'], {
  cwd: repoRoot,
  detached: true,
  stdio: ['ignore', outFd, outFd],
  windowsHide: true,
});

proc.unref();
console.log('Started API on PID:', proc.pid);
