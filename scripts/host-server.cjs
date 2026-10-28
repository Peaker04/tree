const { spawn, execSync } = require('node:child_process');
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const pidFile = path.join(repoRoot, '.server-pids.json');
const apiLogFile = path.join(repoRoot, 'tmp-api.log');
const ngrokLogFile = path.join(repoRoot, 'tmp-ngrok.log');

const PUBLIC_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://cannot-gutter-retry.ngrok-free.dev';
const API_PORT = parseInt(process.env.PORT || '3000', 10);

function checkPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1200);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    client
      .get(url, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      })
      .on('error', reject);
  });
}

function killProcessOnPort(port) {
  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const state = parts[3];
        const pid = parts[parts.length - 1];
        if (state === 'LISTENING' && pid && pid !== '0' && pid !== String(process.pid)) {
          try {
            execSync(`taskkill /F /PID ${pid} >nul 2>&1`);
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  }
}

function killNgrok() {
  if (process.platform === 'win32') {
    try {
      execSync('taskkill /F /IM ngrok.exe >nul 2>&1');
    } catch {
      // ignore
    }
  }
}

async function stopServer() {
  console.log('\n\x1b[33m[NOVYX] Đang tắt máy chủ trung tâm...\x1b[0m');

  if (fs.existsSync(pidFile)) {
    try {
      const pids = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
      if (pids.api) {
        try {
          process.kill(pids.api);
        } catch {
          // ignore
        }
      }
      if (pids.ngrok) {
        try {
          process.kill(pids.ngrok);
        } catch {
          // ignore
        }
      }
      fs.unlinkSync(pidFile);
    } catch {
      // ignore
    }
  }

  killProcessOnPort(API_PORT);
  killNgrok();

  console.log('======================================================================');
  console.log('\x1b[32m [NOVYX] ĐÃ TẮT MÁY CHỦ TRUNG TÂM THÀNH CÔNG\x1b[0m');
  console.log('======================================================================');
  console.log(' - Đã ngắt tiến trình Fastify API (cổng 3000).');
  console.log(' - Đã đóng Ngrok Tunnel (https://cannot-gutter-retry.ngrok-free.dev).');
  console.log(' - Mọi ứng dụng ngoài hiện trường sẽ tạm ngưng kết nối.');
  console.log(' - Khi muốn tiếp tục hoạt động, bạn chỉ cần chạy: npm run server:on');
  console.log('======================================================================\n');
}

async function startServer() {
  console.log('\n\x1b[36m[NOVYX] Đang khởi động máy chủ trung tâm cho toàn bộ ứng dụng mobile...\x1b[0m\n');

  // 1. Kiểm tra PostgreSQL
  const isPostgresUp = await checkPortOpen(5432);
  if (!isPostgresUp) {
    console.error('\x1b[31m[LỖI] Không thể kết nối tới PostgreSQL trên cổng 5432!\x1b[0m');
    console.error('Vui lòng đảm bảo dịch vụ PostgreSQL trên máy tính đã được bật trước khi mở server.\n');
    process.exit(1);
  }
  console.log('\x1b[32m✓ PostgreSQL 18:\x1b[0m Đang hoạt động trên cổng 5432.');

  // 2. Dọn dẹp tiến trình cũ nếu có xung đột
  killProcessOnPort(API_PORT);
  killNgrok();
  await new Promise((r) => setTimeout(r, 600));

  // 3. Khởi chạy Fastify API
  const apiOutFd = fs.openSync(apiLogFile, 'w');
  const apiProc = spawn(
    'node',
    ['--env-file-if-exists=.env', 'node_modules/tsx/dist/cli.mjs', 'watch', 'apps/api/src/index.ts'],
    {
      cwd: repoRoot,
      detached: true,
      stdio: ['ignore', apiOutFd, apiOutFd],
      windowsHide: true,
    },
  );
  apiProc.unref();
  console.log(`\x1b[32m✓ Fastify Backend API:\x1b[0m Đã khởi chạy (PID: ${apiProc.pid}).`);

  // Đợi API sẵn sàng
  let apiReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await httpGet(`http://127.0.0.1:${API_PORT}/health`);
      if (res.status === 200) {
        apiReady = true;
        break;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!apiReady) {
    console.error(
      '\x1b[31m[LỖI] Fastify API không phản hồi sau 12 giây. Kiểm tra tmp-api.log để biết chi tiết.\x1b[0m',
    );
    process.exit(1);
  }
  console.log(`\x1b[32m✓ API Health Check:\x1b[0m Phản hồi 200 OK trên http://localhost:${API_PORT}/health.`);

  // 4. Khởi chạy Ngrok Tunnel với URL cố định
  const ngrokOutFd = fs.openSync(ngrokLogFile, 'w');
  const ngrokProc = spawn('ngrok', ['http', String(API_PORT), `--url=${PUBLIC_URL}`, '--log=stdout'], {
    cwd: repoRoot,
    detached: true,
    stdio: ['ignore', ngrokOutFd, ngrokOutFd],
    windowsHide: true,
  });
  ngrokProc.unref();
  console.log(`\x1b[32m✓ Ngrok Tunnel:\x1b[0m Đang định tuyến tới ${PUBLIC_URL}...`);

  // Đợi Ngrok thông suốt
  let ngrokReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await httpGet(`${PUBLIC_URL}/health`);
      if (res.status === 200) {
        ngrokReady = true;
        break;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  if (!ngrokReady) {
    console.error(
      `\x1b[31m[LỖI] Không thể kích hoạt đường truyền công khai ${PUBLIC_URL}. Kiểm tra tmp-ngrok.log.\x1b[0m`,
    );
    process.exit(1);
  }

  // 5. Lưu thông tin PIDs
  fs.writeFileSync(
    pidFile,
    JSON.stringify(
      {
        api: apiProc.pid,
        ngrok: ngrokProc.pid,
        publicUrl: PUBLIC_URL,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.log('\n======================================================================');
  console.log('\x1b[32;1m [NOVYX GREENOPS] MÁY CHỦ TRUNG TÂM ĐÃ HOẠT ĐỘNG SẴN SÀNG \x1b[0m');
  console.log('======================================================================');
  console.log(` * API nội bộ:   http://localhost:${API_PORT}`);
  console.log(` * Public Cloud: ${PUBLIC_URL}`);
  console.log(' * Cơ sở dữ liệu: PostgreSQL 18 (Cổng 5432)');
  console.log(' * Quyền truy cập: CÁC THIẾT BỊ CÀI ĐẶT APK ĐÃ CÓ THỂ ĐĂNG NHẬP & HOẠT ĐỘNG');
  console.log('----------------------------------------------------------------------');
  console.log(' 👉 Để kiểm tra trạng thái: npm run server:status');
  console.log(' 👉 Để tắt máy chủ:         npm run server:off');
  console.log('======================================================================\n');
}

async function statusServer() {
  console.log('\n[NOVYX] Kiểm tra trạng thái máy chủ trung tâm:');
  const isPostgresUp = await checkPortOpen(5432);
  console.log(` - PostgreSQL 5432: ${isPostgresUp ? '\x1b[32mHOẠT ĐỘNG\x1b[0m' : '\x1b[31mKHÔNG PHẢN HỒI\x1b[0m'}`);

  let apiLocal = false;
  try {
    const res = await httpGet(`http://127.0.0.1:${API_PORT}/health`);
    apiLocal = res.status === 200;
  } catch {
    apiLocal = false;
  }
  console.log(` - Fastify Local (3000): ${apiLocal ? '\x1b[32mHOẠT ĐỘNG (200 OK)\x1b[0m' : '\x1b[31mCHƯA BẬT\x1b[0m'}`);

  let publicTunnel = false;
  try {
    const res = await httpGet(`${PUBLIC_URL}/health`);
    publicTunnel = res.status === 200;
  } catch {
    publicTunnel = false;
  }
  console.log(
    ` - Ngrok Tunnel (${PUBLIC_URL}): ${publicTunnel ? '\x1b[32mHOẠT ĐỘNG (200 OK)\x1b[0m' : '\x1b[31mCHƯA KẾT NỐI\x1b[0m'}`,
  );

  if (apiLocal && publicTunnel) {
    console.log('\n\x1b[32m==> Máy chủ đang hoạt động. Các thành viên có thể sử dụng ứng dụng.\x1b[0m\n');
  } else {
    console.log('\n\x1b[33m==> Máy chủ hiện chưa được bật đầy đủ. Chạy "npm run server:on" để bật.\x1b[0m\n');
  }
}

const command = process.argv[2] || 'on';
if (command === 'on' || command === 'start') {
  startServer();
} else if (command === 'off' || command === 'stop') {
  stopServer();
} else if (command === 'status') {
  statusServer();
} else {
  console.log('Sử dụng: node scripts/host-server.cjs [on|off|status]');
}
