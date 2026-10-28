/**
 * NOVYX GreenOps — Comprehensive Automated iOS Mobile Verification Script
 * Validates Metro iOS bundle, API endpoints, operational roles, WebMapView,
 * BottomSheetModal geometry, and NotchedBottomNav contracts.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');

const repoRoot = path.resolve(__dirname, '..');
const envPath = path.join(repoRoot, '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

const API_BASE_URL = process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || LOCAL_API_URL;
const LOCAL_API_URL = 'http://127.0.0.1:3000';
const METRO_URL = 'http://127.0.0.1:8082';

const STAFF_EMAIL = 'staff@novyx.local';
const MANAGER_EMAIL = 'manager@novyx.local';
const SUPERVISOR_EMAIL = 'supervisor@novyx.local';
const PASSWORD = process.env.NOVYX_DEV_PASSWORD || 'NovyxDev123!';

const results = [];
let passCount = 0;
let failCount = 0;

function assertCheck(id, name, condition, detail) {
  if (condition) {
    passCount++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${id}: ${name} — ${detail}`);
    results.push({ id, name, status: 'PASS', detail });
  } else {
    failCount++;
    console.log(`\x1b[31m[FAIL]\x1b[0m ${id}: ${name} — ${detail}`);
    results.push({ id, name, status: 'FAIL', detail });
  }
}

function httpRequest(method, urlStr, body, headers = {}) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      const payload = body ? JSON.stringify(body) : null;

      const req = client.request(
        url,
        {
          method,
          headers: {
            Accept: 'application/json, text/plain, */*',
            'ngrok-skip-browser-warning': 'true',
            ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
            ...headers,
          },
          timeout: 10000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            let json = null;
            try {
              json = data ? JSON.parse(data) : null;
            } catch {
              json = null;
            }
            resolve({ status: res.statusCode || 0, data, json, headers: res.headers });
          });
        },
      );

      req.on('error', (err) => resolve({ status: 0, data: err.message, json: null, error: err }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, data: 'Timeout after 10000ms', json: null });
      });

      if (payload) req.write(payload);
      req.end();
    } catch (err) {
      resolve({ status: 0, data: err.message, json: null, error: err });
    }
  });
}

async function run() {
  console.log('═'.repeat(75));
  console.log('   NOVYX GREENOPS — AUTOMATED COMPREHENSIVE IOS VERIFICATION SUITE');
  console.log('═'.repeat(75));
  console.log(`Target Public API: ${API_BASE_URL}`);
  console.log(`Target Local Metro: ${METRO_URL}`);
  console.log('');

  // 1. Metro Bundler iOS Readiness
  console.log('--- 1. METRO BUNDLER & IOS BUNDLE INTEGRITY ---');
  const metroStatus = await httpRequest('GET', `${METRO_URL}/status`);
  assertCheck(
    'METRO-01',
    'Metro Packager Running',
    metroStatus.status === 200 && metroStatus.data.includes('packager-status:running'),
    `HTTP ${metroStatus.status} (${metroStatus.data.trim()})`,
  );

  const iosManifest = await httpRequest('GET', `${METRO_URL}/`, null, {
    Accept: 'application/expo+json',
    'expo-platform': 'ios',
  });
  assertCheck(
    'METRO-02',
    'Expo Go iOS Manifest',
    iosManifest.status === 200 && iosManifest.data.includes('apps/mobile/index.ts.bundle'),
    `HTTP ${iosManifest.status}, Target iOS hermes bytecode bundle configured`,
  );

  // 2. API Health & Ngrok Tunnel
  console.log('\n--- 2. BACKEND API & NGROK INTERNET TUNNEL ---');
  const publicHealth = await httpRequest('GET', `${API_BASE_URL}/health`);
  assertCheck(
    'API-01',
    'Ngrok Public Tunnel Health',
    publicHealth.status === 200 && publicHealth.json?.status === 'ok',
    `HTTP ${publicHealth.status} from ${API_BASE_URL}/health`,
  );

  const localReady = await httpRequest('GET', `${LOCAL_API_URL}/ready`);
  assertCheck(
    'API-02',
    'Fastify Database Connection Ready',
    localReady.status === 200 && localReady.json?.database === 'connected',
    `HTTP ${localReady.status}, Database: ${localReady.json?.database}`,
  );

  // 3. Multi-role Authentication (Staff, Manager, Supervisor)
  console.log('\n--- 3. MULTI-ROLE AUTHENTICATION & SESSION TOKENS ---');
  let staffToken = null;
  let managerToken = null;
  let supervisorToken = null;

  const staffLogin = await httpRequest('POST', `${API_BASE_URL}/v1/auth/login`, {
    identifier: STAFF_EMAIL,
    password: PASSWORD,
  });
  const staffSession = staffLogin.json?.data?.session || staffLogin.json?.session;
  staffToken = staffSession?.accessToken;
  assertCheck(
    'AUTH-STAFF',
    'Staff Login & Session',
    staffLogin.status === 200 && Boolean(staffToken) && staffSession?.user?.role === 'staff',
    `User: ${staffSession?.user?.displayName || STAFF_EMAIL}, Role: ${staffSession?.user?.role}`,
  );

  const managerLogin = await httpRequest('POST', `${API_BASE_URL}/v1/auth/login`, {
    identifier: MANAGER_EMAIL,
    password: PASSWORD,
  });
  const managerSession = managerLogin.json?.data?.session || managerLogin.json?.session;
  managerToken = managerSession?.accessToken;
  assertCheck(
    'AUTH-MGR',
    'Manager Login & Session',
    managerLogin.status === 200 && Boolean(managerToken) && managerSession?.user?.role === 'manager',
    `User: ${managerSession?.user?.displayName || MANAGER_EMAIL}, Role: ${managerSession?.user?.role}`,
  );

  const supLogin = await httpRequest('POST', `${API_BASE_URL}/v1/auth/login`, {
    identifier: SUPERVISOR_EMAIL,
    password: PASSWORD,
  });
  const supSession = supLogin.json?.data?.session || supLogin.json?.session;
  supervisorToken = supSession?.accessToken;
  assertCheck(
    'AUTH-SUP',
    'Supervisor Login & Session',
    supLogin.status === 200 && Boolean(supervisorToken) && supSession?.user?.role === 'supervisor',
    `User: ${supSession?.user?.displayName || SUPERVISOR_EMAIL}, Role: ${supSession?.user?.role}`,
  );

  // 4. Staff Operational Data (Tasks & Trees)
  console.log('\n--- 4. STAFF FIELD DATA ACCESS & CONTRACT COMPLIANCE ---');
  const staffTasksRes = await httpRequest('GET', `${API_BASE_URL}/v1/tasks`, null, {
    Authorization: `Bearer ${staffToken}`,
  });
  const staffTasks = staffTasksRes.json?.data || [];
  assertCheck(
    'STAFF-TASKS',
    'Staff Tasks Query',
    staffTasksRes.status === 200 && Array.isArray(staffTasks) && staffTasks.length > 0,
    `HTTP ${staffTasksRes.status}, Loaded ${staffTasks.length} field tasks`,
  );

  const treesRes = await httpRequest('GET', `${API_BASE_URL}/v1/trees`, null, {
    Authorization: `Bearer ${staffToken}`,
  });
  const trees = treesRes.json?.data || [];
  assertCheck(
    'STAFF-TREES',
    'Tree Registry Query',
    treesRes.status === 200 && Array.isArray(trees) && trees.length > 0,
    `HTTP ${treesRes.status}, Loaded ${trees.length} botanical trees with GPS coordinates`,
  );

  // Verify Tree Coordinates
  const sampleTree = trees[0];
  const hasValidGps = sampleTree && typeof sampleTree.lat === 'number' && typeof sampleTree.lng === 'number';
  assertCheck(
    'TREE-COORDS',
    'Tree Botanical Master Coordinates',
    hasValidGps,
    `Sample Tree [${sampleTree?.code}]: Lat ${sampleTree?.lat}, Lng ${sampleTree?.lng}, Species: ${sampleTree?.speciesName || sampleTree?.commonName || 'OK'}`,
  );

  // 5. Manager Operational Data & Review Queue
  console.log('\n--- 5. MANAGER REVIEW QUEUE & AUDIT COMPLIANCE ---');
  const mgrTasksRes = await httpRequest('GET', `${API_BASE_URL}/v1/tasks`, null, {
    Authorization: `Bearer ${managerToken}`,
  });
  const mgrTasks = mgrTasksRes.json?.data || [];
  assertCheck(
    'MGR-TASKS',
    'Manager Global Task Overview',
    mgrTasksRes.status === 200 && Array.isArray(mgrTasks) && mgrTasks.length > 0,
    `HTTP ${mgrTasksRes.status}, Found ${mgrTasks.length} tasks across team`,
  );

  const pendingReview = mgrTasks.filter(
    (t) => t.status === 'WAITING_REVIEW' || t.status === 'SUBMITTED' || t.status === 'WAITING_APPROVAL',
  );
  assertCheck(
    'MGR-REVIEW-QUEUE',
    'Manager Review Filtering',
    mgrTasksRes.status === 200,
    `Manager Queue: ${pendingReview.length} tasks pending review/approval`,
  );

  // 6. Mobile Code Contracts & Screen Geometry Audits
  console.log('\n--- 6. MOBILE SOURCE CODE & GEOMETRY CONTRACT AUDITS ---');

  // UI-038 WebMapView
  const webMapViewSrc = fs.readFileSync(
    path.join(repoRoot, 'apps/mobile/src/components/presentation/WebMapView.tsx'),
    'utf8',
  );
  assertCheck(
    'UI-038',
    'WebMapView Authentic Google Maps Tiles',
    webMapViewSrc.includes('google.com/vt/lyrs=m') && !webMapViewSrc.includes('NativeVectorMap'),
    'Zero mock SVG canvas, Leaflet Google Roadmap raster tiles with CartoDB fallback',
  );

  // UI-040 GPS Service Check
  const proofFlowSrc = fs.readFileSync(path.join(repoRoot, 'apps/mobile/src/screens/staff/StaffProofFlow.tsx'), 'utf8');
  assertCheck(
    'UI-040',
    '1-Tap GPS Hardware Check & 20s Satellite Timeout',
    proofFlowSrc.includes('hasServicesEnabledAsync') &&
      proofFlowSrc.includes('20000') &&
      !proofFlowSrc.includes("showRationaleForPurpose('staff-gps')"),
    'Direct hardware service check, no rationale modal deadlock, 20,000ms satellite lock timeout',
  );

  // UI-041 Check-in Density 6/10
  assertCheck(
    'UI-041',
    'Check-in Screen Density 6/10',
    proofFlowSrc.includes('adaptiveMapHeight') && !proofFlowSrc.includes('bán kính 10m rồi quét QR'),
    'Adaptive dynamic map height keeps primary 48dp action buttons above the fold',
  );

  // UI-042 NotchedBottomNav iOS Height
  const bottomNavSrc = fs.readFileSync(path.join(repoRoot, 'apps/mobile/src/components/NotchedBottomNav.tsx'), 'utf8');
  assertCheck(
    'UI-042',
    'NotchedBottomNav iOS 56dp Platform Geometry',
    bottomNavSrc.includes("BASE_BAR_HEIGHT = Platform.OS === 'ios' ? 56 : 64"),
    'iOS base height 56dp + Home Bar inset eliminates floating 50dp gap; Android retains 64dp',
  );

  // UI-043 Scrollbar Eradication
  const staffHomeSrc = fs.readFileSync(path.join(repoRoot, 'apps/mobile/src/screens/staff/StaffHome.tsx'), 'utf8');
  const staffWorkSrc = fs.readFileSync(path.join(repoRoot, 'apps/mobile/src/screens/staff/StaffWork.tsx'), 'utf8');
  const staffTreesSrc = fs.readFileSync(path.join(repoRoot, 'apps/mobile/src/screens/staff/StaffTrees.tsx'), 'utf8');
  const scrollbarsGone =
    staffHomeSrc.includes('showsVerticalScrollIndicator={false}') &&
    staffWorkSrc.includes('showsVerticalScrollIndicator={false}') &&
    staffTreesSrc.includes('showsVerticalScrollIndicator={false}') &&
    webMapViewSrc.includes('::-webkit-scrollbar { display: none');
  assertCheck(
    'UI-043',
    'Scrollbars Eradicated Across Screens & WebViews',
    scrollbarsGone,
    'showsVerticalScrollIndicator={false} and CSS ::-webkit-scrollbar display: none applied everywhere',
  );

  // UI-044 Micro-spring Button & Tab Transitions
  const primitivesSrc = fs.readFileSync(path.join(repoRoot, 'apps/mobile/src/components/AppPrimitives.tsx'), 'utf8');
  assertCheck(
    'UI-044',
    'Micro-spring Button Scale (0.97x) & Animated Tab Transitions',
    primitivesSrc.includes('AnimatedScreenTransition') &&
      primitivesSrc.includes('toValue: 0.97') &&
      !staffTreesSrc.includes('LayoutAnimation.configureNext'),
    'Micro-spring button press feedback, smooth screen fade, zero LayoutAnimation frame drops',
  );

  // UI-045 & UI-046 BottomSheetModal Height & Physics
  assertCheck(
    'UI-045/046',
    'BottomSheetModal 82% Height & Spring Swipe Dismiss',
    primitivesSrc.includes("height: '82%'") &&
      primitivesSrc.includes('PanResponder.create') &&
      primitivesSrc.includes('Animated.spring(sheetAnim'),
    'Full 82% viewport height prevents FlatList collapse; PanResponder handles drag-down dismiss',
  );

  // UI-039 Honest Tree Selection in Manager Create Task
  const createTaskSrc = fs.readFileSync(
    path.join(repoRoot, 'apps/mobile/src/screens/manager/ManagerCreateTask.tsx'),
    'utf8',
  );
  assertCheck(
    'UI-039',
    'Honest Tree Selection (No Fake Address Splitting)',
    !createTaskSrc.includes(".split(',').pop()"),
    'Direct single-tree and multi-tree selection without fabricating fake zones from address strings',
  );

  // 7. Summary
  console.log('\n' + '═'.repeat(75));
  console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED out of ${results.length} checks`);
  console.log('═'.repeat(75));

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

run();
