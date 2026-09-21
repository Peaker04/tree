# Sổ Bộ Quyết Định Cấp Triển Khai (Phase 12 Implementation Decision Register)

**Dự án:** NOVYX GreenOps
**Giai đoạn:** Phase 12A — Implementation-Level Decision Review
**Trạng thái Toàn bộ Sổ bộ:** `OPEN` (Chờ Chủ quản phê duyệt — Không tự ý khóa quyết định)
**Tài liệu Nguồn:** [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/PHASE11-OWNER-ADR-DECISIONS.md`](PHASE11-OWNER-ADR-DECISIONS.md)
**Ngày lập:** 21/09/2026

---

## 1. Nguyên Tắc Quản Trị Quyết Định Cấp Triển Khai (Governance Rules)

1. **Không Tự Ý Khóa Quyết Định Tác Động Lớn:**
   Antigravity đề xuất phương án kỹ thuật tối ưu kèm mức độ tin cậy và phân tích đa chiều (sự phù hợp repo, kiến trúc, an ninh, độ tin cậy, độ phức tạp vận hành, chi phí chuyển đổi). Tuy nhiên, **toàn bộ 11 quyết định (IDB-01..11) bắt buộc phải giữ trạng thái `OPEN`** để Chủ quản (Owner) xem xét và phê duyệt chính thức tại Phase 12B.
2. **Phân Định Tính Khẩn Cấp (Decision Urgency):**
   Mỗi quyết định được phân loại rõ ràng theo mức độ chặn các đợt triển khai (Waves):
   - `BLOCKS_BACKEND`: Chặn trực tiếp việc khởi tạo mã nguồn máy chủ `apps/api` (Wave 2, Wave 3).
   - `BLOCKS_MOBILE`: Chặn trực tiếp các thành phần tích hợp sâu trên client di động `apps/mobile` (Wave 5).
   - `BLOCKS_ADMIN_WEB`: Chặn việc khởi tạo dự án web quản trị `apps/admin-web` (Wave 6).
   - `CAN_DEFER_TO_DEPLOYMENT`: Có thể hoãn lại đến thời điểm đóng gói và phát hành hạ tầng production (Wave 8).
   - `CAN_DEFER_TO_FIELD_MEASUREMENT`: Có thể hoãn lại để căn chỉnh dựa trên số liệu đo đạc thực địa thực tế.
3. **Thao tác Chủ quản Cho phép:** `APPROVE` (Phê duyệt), `REJECT` (Bác bỏ), `REQUEST_REVISION` (Yêu cầu chỉnh sửa). Cột Quyết định Chủ quản được để trống trong Phase 12A.

---

## 2. Bảng Tổng Hợp Mức Độ Khẩn Cấp (Decision Urgency Matrix)

| Mã IDB | Tên Quyết Định Cấp Triển Khai | Đợt Triển Khai Chặn (Blocked Wave) | Phân Loại Tính Khẩn Cấp | Trạng Thái Hiện Tại |
| :---: | :--- | :---: | :---: | :---: |
| **IDB-01** | Hệ quản trị Cơ sở Dữ liệu Quan hệ (RDBMS Engine) | Wave 2 (Backend Foundation) | `BLOCKS_BACKEND` | `OPEN` |
| **IDB-02** | Web Framework Máy chủ API (Backend HTTP Framework) | Wave 2 (Backend Foundation) | `BLOCKS_BACKEND` | `OPEN` |
| **IDB-03** | Công cụ Truy cập DB / ORM / Query Builder | Wave 2 (Backend Foundation) | `BLOCKS_BACKEND` | `OPEN` |
| **IDB-04** | Định dạng & Cấu trúc Thông tin Xác thực (Token Format) | Wave 3 (IAM & Authorization) | `BLOCKS_BACKEND` | `OPEN` |
| **IDB-05** | Thuật toán Băm Mật khẩu Tài khoản (Password Hashing) | Wave 3 (IAM & Authorization) | `BLOCKS_BACKEND` | `OPEN` |
| **IDB-06** | Nền tảng & Công cụ Web Quản trị (Admin Web Tooling) | Wave 6 (Dedicated Admin Web) | `BLOCKS_ADMIN_WEB` | `OPEN` |
| **IDB-07** | Hạ tầng Lưu trữ Bằng chứng Tệp Nhị phân (Object Storage)| Wave 4 (Operational Domain) | `BLOCKS_BACKEND` | `OPEN` |
| **IDB-08** | Chiến lược Đóng gói & Triển khai Hạ tầng (Hosting) | Wave 8 (Hardening & Prod) | `CAN_DEFER_TO_DEPLOYMENT` | `OPEN` |
| **IDB-09** | Chiến lược Cấu hình Thời gian Lưu vết Idempotency | Wave 2 / Wave 5 (OCC & Outbox) | `CAN_DEFER_TO_FIELD_MEASUREMENT` | `OPEN` |
| **IDB-10** | Chiến lược Dọn dẹp Ảnh Bằng chứng Rác trên Mobile (GC) | Wave 5 (Mobile Local Storage) | `CAN_DEFER_TO_FIELD_MEASUREMENT` | `OPEN` |
| **IDB-11** | Hạ tầng Quản lý Phiên & Trạng thái Thu hồi Máy chủ | Wave 3 (IAM & Freshness) | `BLOCKS_BACKEND` | `OPEN` |

---

## 3. Chi Tiết Từng Quyết Định Cấp Triển Khai (IDB-01 .. IDB-11)

---

### IDB-01: Hệ quản trị Cơ sở Dữ liệu Quan hệ Máy chủ (RDBMS Engine)

- **Câu hỏi Quyết định:** Lựa chọn hệ quản trị cơ sở dữ liệu quan hệ cụ thể nào làm engine lưu trữ tác nghiệp và nhật ký kiểm toán cho `apps/api` trong phạm vi Relational Database Family đã được chấp thuận tại ADR 0013?
- **Các Phương án Ứng viên:**
  1. **Phương án A — PostgreSQL 16+ (Khuyến nghị):** Hệ RDBMS mã nguồn mở mạnh mẽ nhất, hỗ trợ kiểu dữ liệu JSONB cực tốt cho metadata bằng chứng linh hoạt, hỗ trợ partial indexes, khóa hàng tinh vi (row-level locking) cho OCC, hỗ trợ phân tách đặc quyền chuẩn SQL (`GRANT/REVOKE`) cho bảng Audit.
  2. **Phương án B — MySQL 8.0+:** Phổ biến, hiệu năng ghi cao, tuy nhiên hỗ trợ JSON và indexing trên biểu thức kém linh hoạt hơn PostgreSQL trong các kịch bản kiểm toán và lưu trữ checklist động.
  3. **Phương án C — SQLite Nhúng (better-sqlite3) trên máy chủ:** Cực kỳ đơn giản, không cần cấu hình service ngoài, nhưng không hỗ trợ đa kết nối đồng thời cao, phân tách quyền user DB hạn chế, không phù hợp cho môi trường máy chủ sản xuất mở rộng.
- **Sự phù hợp Kho mã nguồn (Repository Fit):** Nhánh `base-setup` dùng Node.js 22; thư viện kết nối `pg` hoặc `postgres.js` hoạt động hoàn hảo và có kiểu dữ liệu TypeScript mạnh mẽ.
- **Sự phù hợp Kiến trúc (Architecture Fit):** Khớp 100% với ADR 0011 (Privilege Separation) và ADR 0013 (Relational Modular Monolith).
- **Tác động An ninh (Security Impact):** PostgreSQL hỗ trợ cấu hình phân quyền người dùng DB chi tiết đến cấp bảng và cột (`REVOKE UPDATE, DELETE ON audit_events FROM novyx_api_user`).
- **Tác động Độ tin cậy (Reliability Impact):** Chuẩn ACID nghiêm ngặt nhất, chống mất dữ liệu khi crash tiến trình máy chủ.
- **Độ phức tạp Vận hành (Operational Complexity):** Trung bình (cần 1 container Docker hoặc dịch vụ Managed DB).
- **Chi phí Chuyển đổi (Migration Cost):** Zero (dự án chưa có database backend).
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (PostgreSQL 16+)**.
- **Mức độ Tin cậy (Confidence):** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 2 để viết migration DDL).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-02: Web Framework Máy chủ API (Backend HTTP Framework)

- **Câu hỏi Quyết định:** Lựa chọn HTTP Web Framework nào cho ứng dụng `apps/api` trong môi trường Node.js / TypeScript theo ADR 0013?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Fastify 5.x (Khuyến nghị):** Hiệu năng xử lý request thuộc nhóm cao nhất hệ sinh thái Node.js, tích hợp cơ chế schema validation tự nhiên, hỗ trợ xuất sắc TypeScript với `fastify-type-provider-zod`, mô hình plugin đóng gói (`fastify-plugin`) tương thích hoàn hảo với 5 logical modules Bounded Contexts.
  2. **Phương án B — Express 4.x/5.x:** Phổ biến nhất, cộng đồng lớn nhất, nhưng không có schema validation tích hợp sẵn, xử lý async lỗi thời (cần middleware bắt lỗi thủ công), hiệu năng I/O thấp hơn Fastify.
  3. **Phương án C — NestJS:** Cấu trúc chặt chẽ kiểu Angular, dependency injection mạnh, nhưng quá cồng kềnh, boilerplate nặng nề, phụ thuộc nhiều vào decorators và reflection, đi ngược lại tôn chỉ tinh gọn của dự án.
- **Sự phù hợp Kho mã nguồn:** Monorepo đang dùng Node.js `>= 22.13.0` và TypeScript `~6.0.3`. Fastify hoạt động mượt mà với ESM/CommonJS.
- **Sự phù hợp Kiến trúc:** Kiến trúc Modular Monolith (ADR 0013) chia làm 5 module logic. Fastify plugin context phân lập phạm vi router giữa các module rất sạch sẽ.
- **Tác động An ninh:** Fastify tích hợp sẵn bảo vệ chống Prototype Pollution, JSON DoS, và cấu hình CORS/Helmet chuẩn hóa.
- **Tác động Độ tin cậy:** Cơ chế quản lý vòng đời request/response và error handler tập trung của Fastify cực kỳ ổn định.
- **Độ phức tạp Vận hành:** Thấp, không có abstraction dư thừa.
- **Chi phí Chuyển đổi:** Zero.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Fastify 5.x)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 2 để dựng skeleton máy chủ).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-03: Công cụ Truy cập Cơ sở Dữ liệu / ORM / Query Builder

- **Câu hỏi Quyết định:** Lựa chọn giải pháp truy cập dữ liệu và quản lý migration nào trong `apps/api`?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Drizzle ORM (Khuyến nghị):** Schema khai báo bằng pure TypeScript, suy diễn kiểu type-safe 100%, không sinh mã phụ thuộc runtime nặng nề, kiểm soát SQL trực tiếp (SQL-like syntax), hỗ trợ transactions linh hoạt, công cụ migration `drizzle-kit` cực kỳ tinh gọn và nhanh chóng, tích hợp tự nhiên với Zod qua `drizzle-zod`.
  2. **Phương án B — Kysely:** Type-safe SQL query builder thuần túy, rất sạch và kiểm soát tốt, nhưng không có sẵn công cụ sinh schema/migration đồng bộ như Drizzle.
  3. **Phương án C — Prisma:** Rất phổ biến, nhưng sử dụng schema DSL riêng biệt (không phải TypeScript thuần), engine nhúng bằng Rust cồng kềnh, overhead bộ nhớ cao và khả năng can thiệp raw SQL phức tạp cho phân tách quyền DB kiểm toán bị hạn chế.
- **Sự phù hợp Kho mã nguồn:** Hoàn toàn bằng TypeScript, chia sẻ kiểu dữ liệu trực tiếp với monorepo.
- **Sự phù hợp Kiến trúc:** Cho phép tách biệt tường minh schema giữa các module logic (mỗi module định nghĩa bảng của mình), ngăn chặn đột biến SQL chéo module theo ADR 0013.
- **Tác động An ninh:** Tự động tham số hóa 100% câu truy vấn (Parameterized queries), loại bỏ triệt để nguy cơ SQL Injection.
- **Tác động Độ tin cậy:** Khả năng kiểm soát giao dịch ACID chuẩn xác, xử lý Optimistic Concurrency Control (`expectedVersion`) với cú pháp `WHERE id = $1 AND version = $2` trực quan.
- **Độ phức tạp Vận hành:** Thấp.
- **Chi phí Chuyển đổi:** Zero.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Drizzle ORM + drizzle-kit)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 2 để viết schema persistence).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-04: Định dạng & Cấu trúc Thông tin Xác thực (Access Credential Representation)

- **Câu hỏi Quyết định:** Lựa chọn định dạng nào cho Access Credential trong mô hình xác thực ngắn hạn kết hợp Refresh Token xoay vòng (RTR) theo ADR 0006?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Signed Short-Lived JWT (Khuyến nghị):** Sử dụng JSON Web Token có chữ ký mật mã (thuật toán bất đối xứng RS256/ES256 hoặc đối xứng HS256), thời gian sống ngắn (15 phút). Payload chứa `sub` (userId), `role`, `authVersion`, `accountStatus`. Tầng Server Gate (Tier 2) giải mã nhanh chữ ký và so sánh `authVersion` / `AccountStatus == ACTIVE` với bộ đệm phiên để đảm bảo thu hồi tức thì theo `WF-12`.
  2. **Phương án B — Opaque Bearer Token thuần túy:** Chuỗi ngẫu nhiên 256-bit (crypto random UUID/Hex). Mỗi request bắt buộc phải truy vấn database hoặc cache tập trung để lấy thông tin tài khoản.
- **Sự phù hợp Kho mã nguồn:** Thư viện `jose` hoặc `jsonwebtoken` hoạt động chuẩn xác trong Node.js và Expo.
- **Sự phù hợp Kiến trúc:** Khớp hoàn hảo với mô hình phòng thủ 3 tầng (ADR 0007) và kiểm tra tươi phiên (ADR 0006).
- **Tác động An ninh:** JWT ngắn hạn (15 phút) giảm thiểu rủi ro khi lộ token; việc kiểm tra `authVersion` và `accountStatus` ở Tier 2 Gate loại bỏ hoàn toàn nhược điểm "không thể thu hồi" truyền thống của JWT.
- **Tác động Độ tin cậy:** Giảm tải I/O cho cơ sở dữ liệu nếu áp dụng cơ chế xác thực chữ ký kết hợp in-memory freshness cache.
- **Độ phức tạp Vận hành:** Thấp.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Signed JWT 15 phút + Opaque Refresh Token xoay vòng 30 ngày)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 3 - IAM).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-05: Thuật toán Băm Mật khẩu Tài khoản (Password Hashing Implementation)

- **Câu hỏi Quyết định:** Sử dụng thuật toán băm mật khẩu nào cho tài khoản người dùng tại cơ sở dữ liệu `apps/api`?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Argon2id (Khuyến nghị):** Đạt giải nhất Password Hashing Competition (PHC), chuẩn khuyến nghị số 1 hiện nay của OWASP (OWASP Password Storage Cheat Sheet). Kháng tấn công GPU/ASIC nhờ thuật toán kết hợp bộ nhớ cứng (memory-hard) và thời gian (time-hard). Thư viện Node.js: `@node-rs/argon2` (native Rust binding, cực nhanh).
  2. **Phương án B — bcrypt:** Cổ điển, rất phổ biến, nhưng kháng tấn công phần cứng GPU chuyên dụng kém hơn Argon2id, giới hạn độ dài mật khẩu 72 bytes.
  3. **Phương án C — PBKDF2:** Tiêu chuẩn NIST cũ, tốn nhiều chu kỳ CPU nhưng kháng GPU kém.
- **Sự phù hợp Kho mã nguồn:** Node.js 22 hỗ trợ thư viện native `@node-rs/argon2` với hiệu năng tối ưu.
- **Sự phù hợp Kiến trúc:** Nằm trọn vẹn trong module IAM của `apps/api`.
- **Tác động An ninh:** Cao nhất trong các chuẩn công nghiệp hiện đại, bảo vệ an toàn danh tính người dùng trước rò rỉ cơ sở dữ liệu.
- **Tác động Độ tin cậy:** Tinh chỉnh thông số (memory cost: 64MB, time cost: 3 iterations, parallelism: 1) đảm bảo thời gian băm $\le 150\text{ms}$, không làm nghẽn Event Loop.
- **Độ phức tạp Vận hành:** Thấp.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Argon2id qua `@node-rs/argon2`)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 3 - IAM).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-06: Nền tảng & Công cụ Web Quản trị (Admin Web Tooling)

- **Câu hỏi Quyết định:** Khởi tạo workspace `apps/admin-web` theo kiến trúc và bộ công cụ nào theo ADR 0005?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Vite + React 19 SPA (Khuyến nghị):** Single Page Application thuần túy, tốc độ khởi động và build cực nhanh, chia sẻ trực tiếp các gói nội bộ monorepo (`@novyx/contracts`, `@novyx/ui`), không có độ phức tạp của server-side rendering (SSR), triển khai đơn giản dưới dạng tệp tĩnh (Static Assets qua Nginx/S3/CDN).
  2. **Phương án B — Next.js 15 (App Router):** Hỗ trợ SSR và Server Actions, tuy nhiên tạo ra độ phức tạp vận hành không cần thiết cho một cổng quản trị nội bộ B2B/Enterprise được bảo vệ sau đăng nhập, khó chia sẻ cấu hình build hơn với monorepo React Native.
- **Sự phù hợp Kho mã nguồn:** Monorepo đã cấu hình sẵn React 19 và TypeScript. Vite tích hợp rất tự nhiên vào cấu trúc workspace npm hiện tại.
- **Sự phù hợp Kiến trúc:** Phục vụ riêng Platform Administrator theo ADR 0005; chỉ đọc và quản trị chính sách, không can thiệp tác vụ hiện trường.
- **Tác động An ninh:** Đóng gói tĩnh (Static SPA) loại bỏ bề mặt tấn công SSR (Server-Side Request Forgery).
- **Tác động Độ tin cậy:** Độc lập hoàn toàn với runtime di động, lỗi web không ảnh hưởng đến ứng dụng mobile.
- **Độ phức tạp Vận hành:** Cực kỳ thấp (chỉ cần host HTML/JS/CSS tĩnh).
- **Chi phí Chuyển đổi:** Zero.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Vite + React 19 SPA)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_ADMIN_WEB` (Cần quyết định trước Wave 6).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-07: Hạ tầng Lưu trữ Bằng chứng Tệp Nhị phân (Binary Object Storage)

- **Câu hỏi Quyết định:** Lựa chọn giải pháp lưu trữ các tệp ảnh bằng chứng hiện trường có dung lượng lớn (Binary Proof Photos) như thế nào để tách rời khỏi cơ sở dữ liệu quan hệ theo ADR 0013?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Giao diện Cổng S3-Compatible (MinIO cục bộ + AWS S3 / Cloudflare R2 sản xuất) (Khuyến nghị):** Định nghĩa Port lưu trữ `IObjectStoragePort`. Môi trường phát triển cục bộ và CI sử dụng container MinIO (S3 API tương thích 100%). Môi trường sản xuất cắm trực tiếp AWS S3 hoặc Cloudflare R2 (tiết kiệm chi phí băng thông egress).
  2. **Phương án B — Lưu trữ Tệp Cục bộ trên Ổ đĩa Máy chủ (Local Filesystem):** Lưu ảnh vào thư mục máy chủ và phục vụ qua HTTP static router. Nhược điểm: khó scale nhiều instance máy chủ sau này, rủi ro mất dữ liệu nếu ổ đĩa server bị hỏng.
  3. **Phương án C — Lưu trực tiếp nhị phân vào Database (BYTEA / BLOB):** Khiến database phình to nhanh chóng, làm chậm nghiêm trọng việc backup, restore và suy giảm hiệu năng bộ nhớ đệm DB.
- **Sự phù hợp Kho mã nguồn:** SDK S3 client của AWS (`@aws-sdk/client-s3`) hoặc `minio-js` rất phổ biến trong Node.js.
- **Sự phù hợp Kiến trúc:** Phù hợp nguyên lý Clean Architecture: Domain chỉ lưu URL/URI và hash của ảnh; Infrastructure Adapter lo việc lưu trữ tệp vật lý.
- **Tác động An ninh:** Cho phép sử dụng Pre-signed URLs hoặc private bucket với API gateway xác thực quyền truy cập ảnh.
- **Tác động Độ tin cậy:** Đảm bảo cơ sở dữ liệu tác nghiệp luôn thanh thoát, tốc độ query và backup ở mức tối đa.
- **Độ phức tạp Vận hành:** Thấp khi dùng Docker Compose MinIO cho dev và Managed Object Storage cho production.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (S3-Compatible Port: MinIO cho Dev, S3/R2 cho Prod)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 4 - Work Management).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-08: Chiến lược Đóng gói & Triển khai Hạ tầng (Deployment & Hosting)

- **Câu hỏi Quyết định:** Cấu trúc đóng gói và môi trường vận hành giai đoạn MVP của hệ thống là gì?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Docker Compose trên Linux VM Đơn lẻ (Khuyến nghị cho MVP):** Đóng gói toàn bộ hệ thống gồm 4 dịch vụ: `novyx-api` (Node.js), `novyx-postgres` (PostgreSQL), `novyx-minio` (S3 Storage), và `novyx-admin-web` (Nginx tĩnh) trong một file `docker-compose.yml`. Triển khai trên 1 máy chủ ảo đám mây (Cloud VM RAM 4GB–8GB).
  2. **Phương án B — Nền tảng PaaS (Render / Fly.io / Railway):** Đẩy mã nguồn trực tiếp lên PaaS. Tiện lợi nhưng chi phí tăng nhanh và khả năng kiểm soát mạng nội bộ, phân quyền DB bị phụ thuộc vào nhà cung cấp.
  3. **Phương án C — Kubernetes (K8s):** Quá phức tạp, chi phí vận hành và nhân lực quản trị vượt xa nhu cầu của một ứng dụng Modular Monolith ở giai đoạn MVP.
- **Sự phù hợp Kho mã nguồn:** Monorepo sẵn sàng cho multi-stage Dockerfile cho `apps/api` và `apps/admin-web`.
- **Sự phù hợp Kiến trúc:** Phù hợp với quyết định Modular Monolith triển khai đơn khối duy nhất (ADR 0013).
- **Tác động An ninh:** Mạng Docker nội bộ (bridge network) cô lập hoàn toàn database và object storage khỏi internet công cộng; chỉ phơi bày cổng API và Web qua Reverse Proxy SSL.
- **Độ phức tạp Vận hành:** Cực kỳ thấp, dễ dàng sao lưu toàn bộ máy chủ bằng snapshot ổ đĩa.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Docker Compose trên Linux VM cho MVP)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `CAN_DEFER_TO_DEPLOYMENT` (Không ảnh hưởng đến mã nguồn domain, có thể chốt tại Wave 8).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-09: Chiến lược Cấu hình Thời gian Lưu vết Idempotency

- **Câu hỏi Quyết định:** Thiết lập tham số và chiến lược dọn dẹp (cleanup) thời gian sống (TTL) của bản ghi idempotency tại máy chủ như thế nào để tuân thủ bất biến tại ADR 0009?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Cấu hình Linh hoạt qua Biến Môi trường (Khuyến nghị):** Khai báo biến `IDEMPOTENCY_RETENTION_HOURS` (giá trị mặc định cơ sở: 72 giờ). Bảng `idempotency_records` có cột `expires_at = created_at + interval`. Một worker định kỳ (hoặc pg_cron) chạy lệnh xóa bản ghi quá hạn: `DELETE FROM idempotency_records WHERE expires_at < NOW()`.
  2. **Phương án B — Khóa Cứng 72 Giờ Bất biến trong Code:** Gán cứng `const TTL = 72 * 3600`. Nhược điểm: không thể điều chỉnh tăng lên (ví dụ 7 ngày) khi triển khai tại các nông trường lâm nghiệp vùng sâu vùng xa có chu kỳ ngoại tuyến dài hơn dự kiến.
- **Sự phù hợp Kho mã nguồn:** Thư viện `packages/config` sẵn sàng xác thực biến môi trường này.
- **Sự phù hợp Kiến trúc:** Tuân thủ triệt để bất biến ADR 0009: *Thời gian lưu vết idempotency tại máy chủ bắt buộc $\ge$ Chân trời thử lại ngoại tuyến tối đa của thiết bị di động*.
- **Tác động An ninh:** Đảm bảo không cho phép gửi trùng lặp tác vụ khi thiết bị thử lại sau nhiều ngày mất sóng.
- **Độ phức tạp Vận hành:** Thấp.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Biến môi trường `IDEMPOTENCY_RETENTION_HOURS`, mặc định 72h, dọn dẹp định kỳ)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `CAN_DEFER_TO_FIELD_MEASUREMENT` (Cần cấu hình trước Wave 5, giá trị tối ưu đo đạc thực tế).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-10: Chiến lược Dọn dẹp Ảnh Bằng chứng Rác trên Mobile (Garbage Collection)

- **Câu hỏi Quyết định:** Khi nào và theo tiêu chí nào thì ứng dụng di động `apps/mobile` được phép xóa các tệp ảnh bằng chứng gốc đã lưu trong Sandbox Filesystem để tránh tràn bộ nhớ máy theo ADR 0008?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Lưu Bền Vững 14 Ngày Sau Khi Máy Chủ Xác Nhận COMPLETED (Khuyến nghị):** Ảnh gốc chỉ được đánh dấu có thể xóa khi tác vụ đã nhận phản hồi chính thức từ Server là `TaskStatus = COMPLETED`. Giữ ảnh thêm 14 ngày làm bộ đệm đối soát thực địa, sau đó tác vụ nền kiểm tra và xóa các tệp ảnh đã đủ 14 ngày nếu dung lượng trống của máy $< 300\text{MB}$.
  2. **Phương án B — Xóa Ngay Lập Tức Khi Nhận ACK Thành Công:** Tiết kiệm bộ nhớ tức thì nhưng nhân viên không thể xem lại ảnh chất lượng cao trên máy khi kiểm tra lịch sử ngoại tuyến.
  3. **Phương án C — Không Bao Giờ Xóa:** Dẫn đến nguy cơ làm tràn bộ nhớ (Disk Full / OOM) trên các thiết bị Android giá rẻ sau vài tháng hoạt động.
- **Sự phù hợp Kho mã nguồn:** Sử dụng API `expo-file-system` để kiểm tra dung lượng và xóa tệp.
- **Sự phù hợp Kiến trúc:** Phù hợp với ADR 0008 (bảo tồn bằng chứng tối đa, không để mất dữ liệu trước khi nghiệm thu).
- **Tác động Độ tin cậy:** Bảo vệ thiết bị khỏi tình trạng hết dung lượng ổ đĩa gây crash ứng dụng.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Giữ 14 ngày sau COMPLETED ACK, kích hoạt dọn dẹp khi bộ nhớ khả dụng $< 300\text{MB}$)**.
- **Mức độ Tin cậy:** `MEDIUM` (Cần đo đạc dung lượng ảnh thực tế ngoài hiện trường).
- **Tính Khẩn cấp:** `CAN_DEFER_TO_FIELD_MEASUREMENT` (Áp dụng trong Wave 5).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-11: Hạ tầng Quản lý Phiên & Trạng thái Thu hồi Máy chủ (Session Cache Strategy)

- **Câu hỏi Quyết định:** Lưu trữ và kiểm tra trạng thái phiên làm việc (Session), token làm mới và cờ thu hồi tức thời (`authVersion`) ở máy chủ `apps/api` bằng cơ chế nào?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Bảng `sessions` trong CSDL Quan hệ Tác nghiệp (Khuyến nghị cho MVP):** Lưu trữ phiên trong bảng quan hệ có đánh chỉ mục trên `user_id` và `token_hash`. Truy vấn kiểm tra độ tươi tài khoản (`AccountStatus == ACTIVE`) và `authVersion` chỉ mất $< 1\text{ms}$ trên chỉ mục B-tree. Tận dụng giao dịch ACID để hủy toàn bộ phiên khi khóa tài khoản.
  2. **Phương án B — Redis In-Memory Key-Value Store:** Tốc độ truy vấn siêu việt ($\approx 0.1\text{ms}$), tuy nhiên đưa thêm một thành phần hạ tầng độc lập (cần cấu hình cluster, snapshot, failover) vi phạm tiêu chí tinh giản hạ tầng của ADR 0013 ở giai đoạn MVP.
- **Sự phù hợp Kho mã nguồn:** Tích hợp trực tiếp vào schema CSDL của `apps/api`.
- **Sự phù hợp Kiến trúc:** Tuân thủ ADR 0013: Modular Monolith không bắt buộc phụ thuộc vào Redis cho MVP.
- **Tác động An ninh:** Thu hồi phiên ngay lập tức trong cùng 1 transaction khi Admin thực thi lệnh `SuspendAccount` hoặc `DisableAccount`.
- **Độ phức tạp Vận hành:** Tối giản (không cần quản trị thêm Redis instance).
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Bảng `sessions` trong PostgreSQL cho MVP; dành cổng mở rộng sang Redis khi tải hệ thống vượt ngưỡng đo đạc)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 3 - IAM).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

## 4. Gói Trình Duyệt Quyết Định của Chủ Quản (Owner Decision Packet)

Bảng dưới đây tóm tắt các quyết định quan trọng nhất cần Chủ quản xem xét và chốt định hướng trước khi bắt đầu triển khai các đợt mã nguồn tương ứng:

| Mã IDB | Hạng Mục Quyết Định | Phương Án Khuyến Nghị | Mức Độ Tin Cậy | Lý Do Cần Chốt Sớm | Rủi Ro Kỹ Thuật Nếu Trì Hoãn | Quyết Định Của Chủ Quản |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: |
| **IDB-01** | CSDL Quan hệ Máy chủ | **PostgreSQL 16+** | `HIGH` | Chặn viết schema DDL và migrations ở Wave 2 | Phải viết lại cú pháp migration nếu đổi engine | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-02** | Web Framework Máy chủ | **Fastify 5.x** | `HIGH` | Chặn khởi tạo skeleton và router máy chủ ở Wave 2 | Chậm trễ tiến độ toàn bộ đợt Wave 2 | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-03** | ORM / Truy cập DB | **Drizzle ORM** | `HIGH` | Chặn định nghĩa entity models và quan hệ ở Wave 2 | Phải chuyển đổi toàn bộ repository models | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-04** | Cấu trúc Token Xác thực | **Signed JWT 15m + RTR** | `HIGH` | Chặn middleware bảo mật và hợp đồng xác thực ở Wave 3 | Thiết kế auth bị treo, không thể test tích hợp | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-05** | Băm Mật khẩu | **Argon2id** | `HIGH` | Chặn logic đăng nhập và seed dữ liệu tài khoản ở Wave 3 | Không thể lưu trữ an toàn tài khoản người dùng | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-06** | Web Quản trị Admin | **Vite + React SPA** | `HIGH` | Chặn tạo workspace `apps/admin-web` ở Wave 6 | Không ảnh hưởng backend sớm nhưng cần chốt trước Wave 6 | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-07** | Lưu trữ File Bằng chứng | **S3 Port (MinIO/S3)** | `HIGH` | Chặn luồng upload bằng chứng ảnh ở Wave 4 | Phải lưu tạm vào ổ đĩa máy chủ không tối ưu | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-11** | Quản lý Phiên Máy chủ | **Bảng `sessions` DB** | `HIGH` | Chặn middleware kiểm tra tươi tài khoản ở Wave 3 | Nguy cơ lạm dụng thêm hạ tầng Redis không cần thiết | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
