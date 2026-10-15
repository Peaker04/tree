# Kế Hoạch Triển Khai: Cài Đặt iOS & Tự Động Hóa Đường Hầm Ngrok Cho Kiểm Thử Thực Địa

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cung cấp lệnh tự động hóa `npm run field:dev` để mở đường hầm trực tuyến kép (Ngrok cho Fastify API + Metro Tunnel cho Expo Go iOS), xử lý bypass trang chặn của Ngrok, và chuẩn hóa quyền iOS trên thiết bị iPhone ngoài mạng 4G/5G.

**Architecture:** Kết nối thiết bị thực địa iPhone qua mạng di động 4G/5G tới máy chủ cục bộ bằng Ngrok TLS tunnel cho API Fastify và Expo tunnel cho Metro Bundler. Script điều phối tự động kiểm tra sức khỏe hệ thống, trích xuất URL ngrok động, cấu hình biến môi trường và dọn dẹp tiến trình sạch sẽ.

**Tech Stack:** Node.js, Fastify, React Native Expo SDK 57, Ngrok CLI, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-07-ios-field-ngrok-tunnel-design.md`

## Global Constraints

- Không cài đặt thêm các thư viện giao diện web (`shadcn`, `tailwind`, `radix`).
- Bảo toàn 100% bản địa hóa Tiếng Việt chuẩn mực trên iOS (không dùng emoji AI).
- Không sửa đè hay làm bẩn cấu hình môi trường gốc trong `.env`; truyền `EXPO_PUBLIC_API_BASE_URL` động qua tiến trình con.
- Đảm bảo dọn dẹp (kill) sạch sẽ tất cả tiến trình con khi nhấn `Ctrl+C`.

## Review Focus

1. Ngrok free tier gửi trang cảnh báo HTML `ERR_NGROK_6024` nếu thiếu header `ngrok-skip-browser-warning`.
2. Trích xuất URL ngrok thất bại nếu tiến trình ngrok khởi động chậm hơn kịch bản thăm dò API cổng 4040.
3. Tiến trình Fastify API chưa kịp kết nối PostgreSQL mà ngrok đã công khai URL cho mobile client.
4. Thoát kịch bản (Ctrl+C / SIGINT) bỏ quên các tiến trình ngầm Fastify hoặc Ngrok chiếm dụng cổng 3000 / 4040.
5. Cấp quyền Camera/GPS trên iOS bị từ chối nếu thiếu mô tả mục đích tiếng Việt trong `infoPlist`.

---

### Task 1: Ngrok Bypass Header Trong MobileApiClient

**Files:**
- Modify: `apps/mobile/src/services/mobileApiClient.ts`
- Test: `tests/mobile/wave5b-rest-sync.spec.ts`

**Interfaces:**
- Consumes: `RequestOptions.headers`
- Produces: Header `ngrok-skip-browser-warning: 'true'` tự động đính kèm vào mọi HTTP request.

- [ ] **Step 1: Viết test kiểm tra header ngrok-skip-browser-warning**
Cập nhật `tests/mobile/wave5b-rest-sync.spec.ts` để khẳng định request từ `MobileApiClient` luôn mang header `ngrok-skip-browser-warning`.

- [ ] **Step 2: Chạy test để xác nhận kết quả thất bại**
Run: `npx vitest run tests/mobile/wave5b-rest-sync.spec.ts`

- [ ] **Step 3: Cập nhật `MobileApiClient.ts` để tự động chèn header**
Thêm `'ngrok-skip-browser-warning': 'true'` vào `headers` trong phương thức `executeWithRefresh`.

- [ ] **Step 4: Chạy lại test xác nhận đạt**
Run: `npx vitest run tests/mobile/wave5b-rest-sync.spec.ts`
Expected: PASS

---

### Task 2: Chuẩn Hóa Cấu Hình iOS Quyền Camera & GPS

**Files:**
- Modify: `apps/mobile/app.json`

**Interfaces:**
- Consumes: Cấu hình `expo.ios`
- Produces: `bundleIdentifier: "com.novyx.greenops"` và `infoPlist` chứa `NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription`.

- [ ] **Step 1: Bổ sung bundleIdentifier và infoPlist vào `apps/mobile/app.json`**
Khai báo đầy đủ quyền tiếng Việt để iOS hiển thị popup xin cấp quyền khi mở Camera hoặc GPS.

- [ ] **Step 2: Kiểm tra tính hợp lệ của cấu hình Expo**
Run: `npm run typecheck --workspace @novyx/mobile`
Expected: PASS

---

### Task 3: Kịch Bản Điều Phối Tự Động `scripts/field-tunnel.cjs`

**Files:**
- Create: `scripts/field-tunnel.cjs`

**Interfaces:**
- Consumes: `.env` (`NGROK_AUTHTOKEN`, `PORT=3000`), Ngrok Inspection API `http://127.0.0.1:4040/api/tunnels`
- Produces: Kịch bản điều phối đồng bộ Fastify API $\to$ Ngrok Tunnel $\to$ Metro Tunnel $\to$ Cleanup handler.

- [ ] **Step 1: Viết kịch bản `scripts/field-tunnel.cjs`**
Bao gồm:
- Kiểm tra `NGROK_AUTHTOKEN` và cấu hình token ngrok nếu có.
- Khởi động Fastify API (chạy `npm run --workspace @novyx/api dev`) và polling đợi cổng 3000 trả về 200 tại `/api/health`.
- Khởi động Ngrok nhị phân (`ngrok http 3000`) và polling lấy URL từ `http://127.0.0.1:4040/api/tunnels`.
- Kiểm tra kết nối HTTPS qua ngrok: ping `<ngrok-url>/api/health` với header `ngrok-skip-browser-warning: true`.
- Khởi động Metro Bundler với cờ `--tunnel` và biến `EXPO_PUBLIC_API_BASE_URL=<ngrok-url>`.
- Cơ chế dọn dẹp tiến trình an toàn khi nhận `SIGINT`, `SIGTERM`, `exit`.

- [ ] **Step 2: Chạy thử kịch bản ở chế độ kiểm tra tham số / dry-run**
Run: `node scripts/field-tunnel.cjs --check-only`
Expected: Xác thực thành công các thành phần dependency.

---

### Task 4: Khai Báo Lệnh `npm run field:dev` & Kiểm Thử Toàn Cục

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: `node scripts/field-tunnel.cjs`
- Produces: Lệnh npm `npm run field:dev`

- [ ] **Step 1: Thêm script vào `package.json`**
Thêm `"field:dev": "node scripts/field-tunnel.cjs"` vào phần `"scripts"`.

- [ ] **Step 2: Kiểm tra Lint và Test toàn dự án**
Run: `npm run lint` và `npm test`
Expected: 100% PASS (0 errors, 316+ tests pass).
