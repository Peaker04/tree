const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const { spawn, execSync, spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

// Find ngrok executable (prioritize modern v3 binaries from WinGet / WindowsApps)
function resolveNgrokBin() {
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'ngrok.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'ngrok.exe'),
    'ngrok',
    path.join(process.env.ProgramFiles || '', 'ngrok', 'ngrok.exe'),
    path.join(process.env.USERPROFILE || '', 'bin', 'ngrok.exe'),
  ];

  for (const candidate of candidates) {
    try {
      const res = spawnSync(candidate, ['version'], { encoding: 'utf8' });
      if (res.status === 0) {
        return candidate;
      }
    } catch {
      // continue checking
    }
  }
  return null;
}

// Command Line Flags
const rawArgs = process.argv.slice(2);
const isCheckOnly = rawArgs.includes('--check-only');
const portArg = rawArgs.find((a) => a.startsWith('--port='));
const metroPortArg = rawArgs.find((a) => a.startsWith('--metro-port='));

const API_PORT = portArg ? parseInt(portArg.split('=')[1], 10) : parseInt(process.env.PORT || '3000', 10);
const METRO_PORT = metroPortArg ? parseInt(metroPortArg.split('=')[1], 10) : 8082;
const NGROK_BIN = resolveNgrokBin();

// Check-only mode for plan / verification
if (isCheckOnly) {
  console.log('--- FIELD TUNNEL PRE-FLIGHT CHECK ---');
  console.log(`Ngrok executable: ${NGROK_BIN || 'NOT FOUND'}`);
  console.log(`API Target Port: ${API_PORT}`);
  console.log(`Metro Target Port: ${METRO_PORT}`);
  console.log(
    `Ngrok Authtoken in .env: ${process.env.NGROK_AUTHTOKEN ? 'Configured' : 'Missing (Optional for local test, Recommended for field)'}`,
  );

  if (!NGROK_BIN) {
    console.error('[FAIL] Không tìm thấy tệp nhị phân ngrok trên hệ thống.');
    process.exit(1);
  }

  try {
    require.resolve('@expo/ngrok');
    console.log('@expo/ngrok module: OK');
  } catch {
    console.warn('@expo/ngrok module: NOT FOUND in local node_modules (Expo might download when running --tunnel)');
  }

  console.log('[PASS] Pre-flight check hoàn tất thành công!');
  process.exit(0);
}

if (!NGROK_BIN) {
  console.error('\x1b[31m[LỖI] Không tìm thấy ngrok trên hệ thống!\x1b[0m');
  console.error('Vui lòng cài đặt ngrok bằng lệnh: winget install Ngrok.Ngrok');
  process.exit(1);
}

// Active child processes for cleanup
const childProcesses = [];

function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${pid} >nul 2>&1`);
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    // Already exited
  }
}

function cleanup() {
  console.log('\n\x1b[33m[NOVYX FIELD TUNNEL] Đang đóng các tiến trình con an toàn...\x1b[0m');
  for (const proc of childProcesses) {
    if (proc && proc.pid) {
      killProcessTree(proc.pid);
    }
  }
  console.log('\x1b[32m[NOVYX FIELD TUNNEL] Đã dọn dẹp sạch sẽ toàn bộ phiên làm việc.\x1b[0m');
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('exit', () => {
  cleanup();
});

// Configure Authtoken supporting both ngrok v3 (config add-authtoken) and v2 (authtoken)
function configureAuthtoken(ngrokBin, token) {
  if (!token) {
    console.log(
      '\x1b[33m[LƯU Ý] Chưa cấu hình NGROK_AUTHTOKEN trong .env. Nếu gặp giới hạn phiên, hãy thêm NGROK_AUTHTOKEN=... vào file .env\x1b[0m',
    );
    return;
  }

  console.log('\x1b[36m[Cấu hình] Đang cập nhật NGROK_AUTHTOKEN từ .env...\x1b[0m');
  // Thử cú pháp v3 trước
  const resV3 = spawnSync(ngrokBin, ['config', 'add-authtoken', token.trim()], { encoding: 'utf8' });
  if (resV3.status === 0) {
    console.log('\x1b[32m[Cấu hình] Cập nhật NGROK_AUTHTOKEN thành công (chuẩn v3).\x1b[0m');
    return;
  }

  // Dự phòng cú pháp v2
  const resV2 = spawnSync(ngrokBin, ['authtoken', token.trim()], { encoding: 'utf8' });
  if (resV2.status === 0) {
    console.log('\x1b[32m[Cấu hình] Cập nhật NGROK_AUTHTOKEN thành công (chuẩn v2).\x1b[0m');
    return;
  }

  console.warn('[Cảnh báo] Lỗi lưu authtoken tự động, tiếp tục khởi chạy với token hiện tại.');
}

configureAuthtoken(NGROK_BIN, process.env.NGROK_AUTHTOKEN);

// Helper: HTTP GET with promise
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const req = client.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('HTTP request timeout'));
    });
  });
}

// Step 1: Start Fastify API Server
async function startApiServer() {
  console.log(`\x1b[34m[1/3 API Server] Đang khởi động Fastify API trên cổng ${API_PORT}...\x1b[0m`);
  const tsxCli = path.join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const apiCwd = path.join(repoRoot, 'apps', 'api');

  const apiProc = spawn(process.execPath, ['--env-file-if-exists=' + envPath, tsxCli, 'watch', 'src/index.ts'], {
    cwd: apiCwd,
    env: { ...process.env, PORT: String(API_PORT), HOST: '0.0.0.0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  childProcesses.push(apiProc);

  apiProc.stdout.on('data', (d) => {
    const str = d.toString();
    if (str.includes('listening on') || str.includes('Error')) {
      process.stdout.write(`\x1b[90m[API] ${str.trim()}\x1b[0m\n`);
    }
  });

  apiProc.stderr.on('data', (d) => {
    process.stderr.write(`\x1b[31m[API ERR] ${d.toString().trim()}\x1b[0m\n`);
  });

  // Polling /health (Route chính xác của Fastify: GET /health)
  const healthUrl = `http://127.0.0.1:${API_PORT}/health`;
  const startTime = Date.now();
  while (Date.now() - startTime < 45000) {
    try {
      const res = await httpGet(healthUrl);
      if (res.statusCode === 200) {
        console.log(`\x1b[32m[1/3 API Server] Fastify API đã sẵn sàng tại ${healthUrl} [200 OK]\x1b[0m`);
        return;
      }
    } catch {
      // Đợi server khởi động
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`API server không thể khởi động sau 45s tại ${healthUrl}`);
}

// Step 2: Start Ngrok Tunnel
async function startNgrokTunnel() {
  console.log(`\x1b[34m[2/3 Ngrok Tunnel] Đang mở đường hầm trực tuyến cho cổng ${API_PORT}...\x1b[0m`);

  // Dọn dẹp tiến trình ngrok cũ còn sót để tránh lỗi ERR_NGROK_334
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM ngrok.exe >nul 2>&1');
    }
  } catch {
    // Bỏ qua lỗi nếu không có tiến trình ngrok nào đang chạy
  }

  const ngrokProc = spawn(NGROK_BIN, ['http', String(API_PORT), '--log=stdout'], {
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  childProcesses.push(ngrokProc);

  ngrokProc.stdout.on('data', (d) => {
    const str = d.toString();
    if (str.includes('started tunnel') || str.includes('lvl=eror') || str.includes('ERR_') || str.includes('error')) {
      process.stdout.write(`\x1b[90m[Ngrok] ${str.trim()}\x1b[0m\n`);
    }
  });

  ngrokProc.stderr.on('data', (d) => {
    process.stderr.write(`\x1b[31m[Ngrok ERR] ${d.toString().trim()}\x1b[0m\n`);
  });

  // Poll ngrok local inspection API at 127.0.0.1:4040/api/tunnels
  const inspectionUrl = 'http://127.0.0.1:4040/api/tunnels';
  const startTime = Date.now();
  let publicUrl = null;

  while (Date.now() - startTime < 25000) {
    try {
      const res = await httpGet(inspectionUrl);
      if (res.statusCode === 200) {
        const payload = JSON.parse(res.data);
        const tunnels = payload.tunnels || [];
        const httpsTunnel = tunnels.find((t) => t.proto === 'https') || tunnels[0];
        if (httpsTunnel && httpsTunnel.public_url) {
          publicUrl = httpsTunnel.public_url;
          break;
        }
      }
    } catch {
      // Chờ ngrok sẵn sàng
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!publicUrl) {
    throw new Error('Không thể kết nối đến ngrok hoặc trích xuất URL công khai từ http://127.0.0.1:4040/api/tunnels');
  }

  console.log(`\x1b[32m[2/3 Ngrok Tunnel] Đường hầm trực tuyến thành công: \x1b[1m\x1b[36m${publicUrl}\x1b[0m`);

  // Verify public endpoint connectivity with bypass header (/health)
  try {
    const verifyUrl = `${publicUrl}/health`;
    const checkRes = await httpGet(verifyUrl, { 'ngrok-skip-browser-warning': 'true' });
    console.log(
      `\x1b[32m[2/3 Ngrok Tunnel] Kiểm tra thông tuyến qua Internet: ${verifyUrl} [HTTP ${checkRes.statusCode}]\x1b[0m`,
    );
  } catch (err) {
    console.warn(`[Cảnh báo] Ping thử nghiệm qua ngrok trả về lỗi: ${err.message}. Tiếp tục quy trình...`);
  }

  return publicUrl;
}

// Step 3: Start Metro Bundler with Tunnel
function startMetroTunnel(publicApiUrl) {
  console.log(`\x1b[34m[3/3 Metro Bundler] Khởi chạy Metro Tunnel cho ứng dụng iOS Expo Go...\x1b[0m`);
  console.log(`\x1b[35m[Cấu hình] EXPO_PUBLIC_API_BASE_URL = ${publicApiUrl}\x1b[0m`);
  console.log(`\x1b[35m[Cấu hình] EXPO_PUBLIC_METRO_PORT = ${METRO_PORT}\x1b[0m\n`);

  console.log('═'.repeat(70));
  console.log(' \x1b[1m\x1b[32mHƯỚNG DẪN KẾT NỐI CHO IPHONE NGOÀI HIỆN TRƯỜNG (4G/5G):\x1b[0m');
  console.log(' 1. Cài đặt app "Expo Go" từ App Store trên iPhone.');
  console.log(' 2. Mở Camera mặc định của iPhone quét mã QR hiển thị bên dưới.');
  console.log(' 3. Nhấn vào thông báo "Open in Expo Go".');
  console.log(' 4. Bật 4G/5G và đăng nhập tài khoản thực địa:');
  console.log('    - Nhân viên: staff@novyx.local / NovyxDev123!');
  console.log('    - Quản lý:   manager@novyx.local / NovyxDev123!');
  console.log(' [Lưu ý iOS] Khi quét bằng Camera iPhone, sử dụng link an toàn ATS: exps://<tunnel>.exp.direct');
  console.log('═'.repeat(70) + '\n');

  const metroEnv = {
    ...process.env,
    EXPO_PUBLIC_API_BASE_URL: publicApiUrl,
    EXPO_PUBLIC_METRO_PORT: String(METRO_PORT),
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID:
      process.env.GOOGLE_MAPS_API_KEY_ANDROID || process.env.GOOGLE_MAPS_API_KEY || '',
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS: process.env.GOOGLE_MAPS_API_KEY_IOS || '',
  };

  const metroProc = spawn(
    process.execPath,
    ['scripts/expo-mobile.cjs', 'start', '--go', '--tunnel', '--clear', '--port', String(METRO_PORT)],
    {
      cwd: repoRoot,
      env: metroEnv,
      stdio: 'inherit',
    },
  );

  childProcesses.push(metroProc);

  metroProc.on('exit', (code) => {
    console.log(`Metro Bundler exited with code ${code}`);
    cleanup();
    process.exit(code || 0);
  });
}

// Main Execution
async function main() {
  try {
    await startApiServer();
    const publicUrl = await startNgrokTunnel();
    startMetroTunnel(publicUrl);
  } catch (err) {
    console.error(`\x1b[31m[LỖI NGHIÊM TRỌNG] ${err.message}\x1b[0m`);
    cleanup();
    process.exit(1);
  }
}

main();
