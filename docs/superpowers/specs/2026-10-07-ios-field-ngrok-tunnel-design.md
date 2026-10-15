# Đặc Tả Kỹ Thuật: Thiết Lập Ứng Dụng iOS & Đường Hầm Ngrok Cho Kiểm Thử Thực Địa (Field Testing)

**Ngày tạo:** 07-10-2026  
**Mục tiêu:** Cho phép cài đặt và chạy ứng dụng NOVYX GreenOps trên thiết bị iOS (iPhone) thông qua Expo Go và thiết lập đường hầm trực tuyến kép (Ngrok + Expo Tunnel) để máy chủ cục bộ (Fastify API, PostgreSQL, Cloudflare R2) có thể phục vụ kiểm thử thực địa ngoài mạng di động 4G/5G.

---

## 1. Bối Cảnh & Vấn Đề (Context & Problem)

1. **Thực địa ngoài 4G/5G:**
   - Ứng dụng di động NOVYX GreenOps hiện chạy trong mạng nội bộ (`192.168.0.x`).
   - Khi kỹ sư ra công viên / thực địa quét mã QR, check-in GPS và chụp ảnh cây xanh bằng mạng di động (4G/5G), điện thoại không thể kết nối tới IP cục bộ của máy tính phát triển (`192.168.0.109`).
2. **Nền tảng iOS & Máy phát triển Windows:**
   - Máy trạm phát triển là Windows 11 x64, không có môi trường Xcode cục bộ để build file `.ipa` trực tiếp bằng dây cáp.
   - Giải pháp tối ưu, tức thì và miễn phí (không đòi hỏi tài khoản Apple Developer 99$/năm) là sử dụng ứng dụng **Expo Go** tải từ App Store kết hợp với tính năng Expo Tunnel.
3. **Cơ chế chặn của Ngrok Free Tier:**
   - Ngrok tài khoản miễn phí tự động chặn các lượt truy cập đầu tiên bằng trang cảnh báo HTML (`ERR_NGROK_6024`). Điều này làm hỏng các request API dạng JSON của ứng dụng di động nếu không được cấu hình header bỏ qua cảnh báo (`ngrok-skip-browser-warning`).

---

## 2. Kiến Trúc Hệ Thống & Luồng Mạng (System Architecture & Network Flow)

```
┌──────────────────────────────────────────────────────────────┐
│                    THIẾT BỊ THỰC ĐỊA                         │
│                 iPhone (Mạng di động 4G / 5G)                │
└──────────────┬───────────────────────────────┬───────────────┘
               │ 1. Tải Bundle App (Expo Go)   │ 2. Gọi API Nghiệp vụ
               │ (Quét mã QR Tunnel)           │ (Auth, Giao việc, Minh chứng)
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│      Expo Tunnel Relay       │ │       Ngrok Cloud Edge       │
│   (expo.dev / cloudflare)    │ │   (*.ngrok-free.app / TLS)   │
└──────────────┬───────────────┘ └──────────────┬───────────────┘
               │                                │
               │ Outbound TLS Tunnels           │ Outbound TLS Tunnels
               ▼                                ▼
┌──────────────────────────────────────────────────────────────┐
│                    MÁY TRẠM WINDOWS (LOCAL)                  │
│                                                              │
│  ┌─────────────────────────┐    ┌─────────────────────────┐  │
│  │ Metro Bundler (:8082)   │    │ Ngrok Client Process    │  │
│  │ (expo start --tunnel)   │    │ (ngrok http 3000)       │  │
│  └─────────────────────────┘    └────────────┬────────────┘  │
│                                              │ Forward        │
│                                              ▼                │
│                                 ┌─────────────────────────┐  │
│                                 │ Fastify API (:3000)     │  │
│                                 └───────┬───────────┬─────┘  │
│                                         │           │        │
└─────────────────────────────────────────┼───────────┼────────┘
                                          ▼           ▼
                                   PostgreSQL:5432  Cloudflare R2
                                   (Local DB)       (Cloud Storage)
```

### Các Thành Phần Kiến Trúc:
- **Fastify API Server:** Lắng nghe trên cổng `3000` (host `0.0.0.0`).
- **Ngrok Tunnel:** Tạo kênh TLS outbound từ máy trạm đến `https://<unique-id>.ngrok-free.app`, chuyển tiếp lưu lượng về `http://127.0.0.1:3000`.
- **Dynamic Variable Injection:** Kịch bản tự động đọc URL ngrok từ cổng quản lý `http://127.0.0.1:4040/api/tunnels`, sau đó truyền trực tiếp `EXPO_PUBLIC_API_BASE_URL` vào tiến trình Metro Bundler mà không làm bẩn file cấu hình gốc.
- **Metro Bundler Tunnel:** Chạy cờ `--tunnel`, cung cấp mã QR và địa chỉ `exp://...` để Expo Go trên iPhone tải bundle từ bất kỳ đâu trên thế giới.
- **Cloudflare R2 Storage:** Ảnh bằng chứng tải trực tiếp lên Cloud qua presigned URL public, không chiếm dụng băng thông ngrok.

---

## 3. Cấu Hình & Thay Đổi Mã Nguồn (Codebase Modifications)

### 3.1. Bổ sung Header Bypass Ngrok (`apps/mobile/src/services/mobileApiClient.ts`)
Thêm header `ngrok-skip-browser-warning: true` vào mọi request gửi đi:
```typescript
const headers: Record<string, string> = {
  'ngrok-skip-browser-warning': 'true',
  ...(options?.headers ?? {}),
};
```
Header này giúp bỏ qua trang cảnh báo HTML của gói miễn phí, đảm bảo API luôn trả về JSON sạch.

### 3.2. Cấu hình Quyền & Định danh iOS (`apps/mobile/app.json`)
Bổ sung cấu hình quyền truy cập Camera và Vị trí rõ ràng theo chuẩn Tiếng Việt cho hệ điều hành iOS:
```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.novyx.greenops",
  "infoPlist": {
    "NSCameraUsageDescription": "Cho phép NOVYX dùng camera để quét QR cây và chụp ảnh bằng chứng hiện trường.",
    "NSLocationWhenInUseUsageDescription": "Cho phép NOVYX dùng vị trí khi sử dụng ứng dụng để xác minh hiện trường và lưu đúng vị trí cây."
  }
}
```

### 3.3. Kịch Bản Điều Phối Tự Động (`scripts/field-tunnel.cjs`)
Kịch bản quản lý toàn bộ vòng đời (lifecycle) của phiên kiểm thử thực địa:
1. Đọc và xác thực `NGROK_AUTHTOKEN` từ `.env`.
2. Đảm bảo ngrok nhị phân có sẵn (hỗ trợ kiểm tra qua `winget`, PATH, hoặc npx/ngrok).
3. Khởi động Fastify API và polling kiểm tra sức khỏe tại `http://127.0.0.1:3000/api/health` cho đến khi sẵn sàng.
4. Khởi động tiến trình `ngrok http 3000`.
5. Đọc URL HTTPS công khai từ cổng quản trị ngrok (`http://127.0.0.1:4040/api/tunnels`).
6. Kiểm tra thông tuyến bằng cách gửi yêu cầu thử nghiệm đến `<ngrok-url>/api/health` kèm header bypass.
7. Khởi động Metro Bundler với tham số `--tunnel` và biến môi trường `EXPO_PUBLIC_API_BASE_URL=<ngrok-url>`.
8. Đăng ký các bộ lắng nghe `SIGINT`, `SIGTERM` và `exit` để tiêu diệt sạch sẽ tất cả tiến trình con khi dừng lệnh.

### 3.4. Bổ Sung Lệnh Điều Khiển (`package.json`)
Thêm script vào root `package.json`:
```json
"scripts": {
  "field:dev": "node scripts/field-tunnel.cjs"
}
```

---

## 4. Kế Hoạch Kiểm Thử & Nghiệm Thu (Verification & Acceptance)

1. **Kiểm tra biên dịch & Lint:**
   - `npm run typecheck --workspace @novyx/mobile` đạt 0 lỗi.
   - `npm run lint` đạt 0 lỗi.
   - `npm test` đạt 100% test suites (316/316 tests pass).
2. **Kiểm tra thông tuyến API qua Ngrok:**
   - Script chạy thành công, ping `https://<id>.ngrok-free.app/api/health` trả về HTTP 200 `{ status: "ok" }`.
3. **Kiểm tra kết nối trên iPhone ngoài thực địa:**
   - Quét mã QR từ Camera iPhone mở app mượt mà trên Expo Go.
   - Ngắt kết nối Wi-Fi, bật 4G/5G.
   - Đăng nhập thành công bằng tài khoản `staff@novyx.local`.
   - Xem danh sách cây, quét mã QR cây, tải ảnh minh chứng thực địa thành công lên Cloudflare R2.
