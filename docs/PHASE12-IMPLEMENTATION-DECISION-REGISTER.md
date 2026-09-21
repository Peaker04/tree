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
   - `BLOCKS_BACKEND`: Chặn trực tiếp việc khởi tạo mã nguồn máy chủ `apps/api` (Wave 2, Wave 3, Wave 4).
   - `BLOCKS_MOBILE`: Chặn trực tiếp các thành phần tích hợp sâu trên client di động `apps/mobile` (Wave 5).
   - `BLOCKS_ADMIN_WEB`: Chặn việc khởi tạo dự án web quản trị `apps/admin-web` (Wave 6).
   - `CAN_DEFER_TO_DEPLOYMENT`: Có thể hoãn lại đến thời điểm đóng gói và phát hành hạ tầng production (Wave 8).
   - `CAN_DEFER_TO_FIELD_MEASUREMENT`: Có thể hoãn lại để căn chỉnh dựa trên số liệu đo đạc thực tế.
3. **Thao tác Chủ quản Cho phép:** `APPROVE` (Phê duyệt), `REJECT` (Bác bỏ), `REQUEST_REVISION` (Yêu cầu chỉnh sửa). Cột Quyết định Chủ quản được để trống trong Phase 12A.
4. **Kỷ Luật Bằng Chứng Kỹ Thuật (Evidence Discipline):**
   Loại bỏ toàn bộ các tuyên bố tiếp thị tuyệt đối ("tốt nhất", "hoàn hảo 100%", "loại bỏ hoàn toàn SQLi", "luôn < 1ms"). Mọi đánh giá phải dựa trên bằng chứng kỹ thuật khách quan từ tài liệu gốc (Primary Sources).

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
  1. **Phương án A — PostgreSQL 16+ (Khuyến nghị):** Hệ RDBMS mã nguồn mở phổ biến, hỗ trợ kiểu dữ liệu JSONB mạnh mẽ cho metadata bằng chứng linh hoạt, hỗ trợ partial indexes, row-level locking phục vụ kiểm soát đồng thời (OCC), và phân tách đặc quyền chuẩn SQL (`GRANT/REVOKE`) chi tiết ở cấp bảng/cột cho bảng Audit.
  2. **Phương án B — MySQL 8.0+:** Phổ biến, hiệu năng ghi tốt, nhưng hỗ trợ biểu thức indexing và tính năng JSON hạn chế hơn PostgreSQL trong các kịch bản kiểm toán và lưu trữ cấu trúc động.
  3. **Phương án C — SQLite Nhúng (better-sqlite3) trên máy chủ:** Rất đơn giản, không cần dịch vụ ngoài, nhưng hạn chế về xử lý đa kết nối đồng thời và cơ chế phân tách quyền người dùng DB, không phù hợp làm máy chủ tác nghiệp trung tâm.
- **Sự phù hợp Kho mã nguồn:** Nhánh `base-setup` dùng Node.js 22; các thư viện kết nối PostgreSQL như `pg` hoặc `postgres.js` tích hợp chuẩn xác với TypeScript.
- **Sự phù hợp Kiến trúc:** Khớp với ADR 0011 (Privilege Separation) và ADR 0013 (Relational Modular Monolith).
- **Tác động An ninh:** PostgreSQL cho phép cấu hình phân quyền người dùng DB chi tiết (`REVOKE UPDATE, DELETE ON audit_events FROM novyx_api_user`).
- **Tác động Độ tin cậy:** Hỗ trợ đầy đủ giao dịch ACID theo chuẩn SQL, bảo vệ dữ liệu khỏi trạng thái bất nhất khi xảy ra sự cố máy chủ.
- **Độ phức tạp Vận hành:** Trung bình (cần 1 container Docker hoặc dịch vụ Managed DB).
- **Chi phí Chuyển đổi:** Thấp do chưa có dữ liệu sản xuất (dự án chưa triển khai database backend).
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (PostgreSQL 16+)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 2 để viết migration DDL).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-02: Web Framework Máy chủ API (Backend HTTP Framework)

- **Câu hỏi Quyết định:** Lựa chọn HTTP Web Framework nào cho ứng dụng `apps/api` trong môi trường Node.js / TypeScript theo ADR 0013?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Fastify 5.x (Khuyến nghị):** Kiến trúc bất đồng bộ và router hiệu năng cao, tích hợp cơ chế schema validation tự nhiên, hỗ trợ TypeScript với `fastify-type-provider-zod`, mô hình plugin đóng gói (`fastify-plugin`) phân lập phạm vi router cho 5 module logic.
  2. **Phương án B — Express 4.x/5.x:** Phổ biến, cộng đồng rộng, nhưng không có schema validation tích hợp sẵn, xử lý async cần bọc bắt lỗi thủ công, chi phí định tuyến cao hơn khi mở rộng nhiều module.
  3. **Phương án C — NestJS:** Cấu trúc phân tầng chặt chẽ kiểu Angular, dependency injection mạnh, nhưng boilerplate nặng nề, phụ thuộc nhiều vào decorators và reflection, làm tăng độ phức tạp so với định hướng tinh gọn.
- **Sự phù hợp Kho mã nguồn:** Monorepo đang dùng Node.js `>= 22.13.0` và TypeScript `~6.0.3`. Fastify hoạt động tốt với chuẩn module hiện hành.
- **Sự phù hợp Kiến trúc:** Kiến trúc Modular Monolith (ADR 0013) chia 5 module logic; Fastify plugin context phân lập phạm vi router giữa các module rõ ràng.
- **Tác động An ninh:** Fastify tích hợp sẵn xử lý JSON an toàn, hỗ trợ dễ dàng CORS và Helmet.
- **Tác động Độ tin cậy:** Cơ chế quản lý vòng đời request/response và error handler tập trung của Fastify đã được kiểm chứng trên diện rộng.
- **Độ phức tạp Vận hành:** Thấp, hạn chế abstraction dư thừa.
- **Chi phí Chuyển đổi:** Thấp (chưa có mã nguồn API trước đó).
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Fastify 5.x)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 2 để dựng skeleton máy chủ).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-03: Công cụ Truy cập Cơ sở Dữ liệu / ORM / Query Builder

- **Câu hỏi Quyết định:** Lựa chọn giải pháp truy cập dữ liệu và quản lý migration nào trong `apps/api`?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Drizzle ORM (Khuyến nghị):** Schema khai báo bằng pure TypeScript, kiểm tra kiểu tĩnh lúc biên dịch (compile-time type-safety), không sinh mã phụ thuộc runtime nặng nề, cú pháp hướng SQL (SQL-like syntax), hỗ trợ transactions tường minh, công cụ migration `drizzle-kit` tinh gọn, tích hợp tự nhiên với Zod qua `drizzle-zod`.
  2. **Phương án B — Kysely:** Type-safe SQL query builder thuần túy, sạch và kiểm soát tốt, nhưng không có công cụ sinh schema/migration đồng bộ trọn gói như Drizzle.
  3. **Phương án C — Prisma:** Phổ biến, nhưng sử dụng schema DSL riêng biệt (không phải TypeScript thuần), engine nhúng bằng Rust cồng kềnh, chi phí bộ nhớ cao và khả năng can thiệp raw SQL phức tạp cho phân tách quyền DB kiểm toán bị hạn chế.
- **Sự phù hợp Kho mã nguồn:** Hoàn toàn bằng TypeScript, chia sẻ kiểu dữ liệu trực tiếp với monorepo.
- **Sự phù hợp Kiến trúc:** Cho phép tách biệt tường minh schema giữa các module logic (mỗi module định nghĩa bảng riêng), hỗ trợ ngăn chặn đột biến SQL chéo module theo ADR 0013.
- **Tác động An ninh:** Mặc định sử dụng Parameterized queries, giảm thiểu nguy cơ SQL Injection khi tuân thủ API.
- **Tác động Độ tin cậy:** Khả năng kiểm soát giao dịch ACID chuẩn xác, xử lý Optimistic Concurrency Control (`expectedVersion`) với cú pháp `WHERE id = $1 AND version = $2` trực quan.
- **Độ phức tạp Vận hành:** Thấp.
- **Chi phí Chuyển đổi:** Thấp.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Drizzle ORM + drizzle-kit)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 2 để viết schema persistence).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-04: Định dạng & Cấu trúc Thông tin Xác thực (Access Credential Representation)

- **Câu hỏi Quyết định:** Lựa chọn giải pháp nào cho Access Credential trong mô hình xác thực kết hợp phiên làm việc và kiểm tra độ tươi tài khoản theo ADR 0006?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Signed Short-Lived JWT:**
     - *Đặc điểm:* Token tự chứa thông tin (self-contained claims) có chữ ký số (HMAC hoặc asymmetric).
     - *Ưu điểm:* Cho phép client và các tầng biên kiểm tra chữ ký và trích xuất claims mà không cần giải mã token từ bên ngoài; giảm tải giải mã định danh.
     - *Nhược điểm & Ràng buộc:* Theo bất biến bắt buộc của ADR 0006 (`WF-12`), **mọi request có bảo vệ tại máy chủ đều bắt buộc phải kiểm tra tính tươi (authoritative freshness lookup)** của `AccountStatus == ACTIVE` và `authVersion`. Do đó, JWT **KHÔNG loại bỏ được bước tra cứu trạng thái máy chủ**. Ngoài ra, JWT có rủi ro trễ dữ liệu trong claims (claim-staleness) trong khoảng thời gian hiệu lực và đòi hỏi quy trình quản lý khóa ký (key management).
  2. **Phương án B — Opaque Bearer Token thuần túy:**
     - *Đặc điểm:* Chuỗi ký tự ngẫu nhiên bảo mật cao (cryptographically secure random string, ví dụ 256-bit).
     - *Ưu điểm:* Không trùng lặp dữ liệu claims; ngữ nghĩa thu hồi (revocation) triệt để và tức thì tại điểm tra cứu phiên; không có rủi ro claim-staleness; không cần quản lý cặp khóa ký mã hóa phức tạp.
     - *Nhược điểm & Ràng buộc:* Bắt buộc phải thực hiện truy vấn trạng thái phiên (database hoặc session store) để phân giải thông tin tài khoản trên mỗi request (nhưng như đã phân tích, Signed JWT cũng vẫn phải tra cứu tính tươi tài khoản theo ADR 0006).
- **So sánh Khách quan:** Cả hai phương án đều bắt buộc phải tra cứu trạng thái máy chủ (DB hoặc cache) để thỏa mãn yêu cầu kiểm tra tính tươi tài khoản tức thì của ADR 0006. Khác biệt cốt lõi nằm ở chi phí quản lý khóa ký và độ tự chứa claims (JWT) đối trọng với tính tinh gọn và thu hồi tức thì trực tiếp (Opaque Token).
- **Sự phù hợp Kho mã nguồn:** Cả hai đều được hỗ trợ tốt trong Node.js (thư viện `jose`/`jsonwebtoken` cho JWT; module chuẩn `crypto` cho Opaque token).
- **Sự phù hợp Kiến trúc:** Cả hai phương án đều tương thích với mô hình phòng thủ 3 tầng (ADR 0007) và kiểm tra tính tươi tài khoản (ADR 0006).
- **Khuyến nghị Kỹ thuật (Mở):** Đề xuất Signed JWT ngắn hạn (thời gian cơ sở ứng viên: 15 phút) kết hợp Refresh Token xoay vòng (thời gian cơ sở ứng viên: 30 ngày) HOẶC Opaque Token tùy thuộc vào quyết định của Chủ quản về độ ưu tiên giữa tính tự chứa claims và sự tinh giản trong quản lý phiên.
- **Mức độ Tin cậy:** `MEDIUM` (Cần Chủ quản quyết định mô hình định danh ưu tiên).
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 3 - IAM).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-05: Thuật toán Băm Mật khẩu Tài khoản (Password Hashing Implementation)

- **Câu hỏi Quyết định:** Sử dụng thuật toán băm mật khẩu nào cho tài khoản người dùng tại cơ sở dữ liệu `apps/api`?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Argon2id (Khuyến nghị):** Thuật toán đạt giải nhất Password Hashing Competition (PHC), khuyến nghị hàng đầu của OWASP (OWASP Password Storage Cheat Sheet). Kháng tấn công GPU/ASIC nhờ cơ chế kết hợp bộ nhớ cứng (memory-hard) và thời gian (time-hard). Thư viện triển khai Node.js: `@node-rs/argon2` (native Rust binding).
  2. **Phương án B — bcrypt:** Cổ điển, phổ biến rộng rãi, nhưng khả năng kháng tấn công phần cứng GPU chuyên dụng kém hơn Argon2id, giới hạn độ dài mật khẩu đầu vào 72 bytes.
  3. **Phương án C — PBKDF2:** Tiêu chuẩn NIST cũ, tốn chu kỳ CPU nhưng kháng GPU kém hơn Argon2id.
- **Tách biệt Tham số Cơ sở Khuyến nghị và Đo đạc Thực tế:**
  - *Tham số cơ sở đề xuất theo khuyến nghị OWASP:* Memory cost: 64MB ($m=65536$), Time cost: 3 iterations ($t=3$), Parallelism: 1 ($p=1$). Phân loại tham số: `CANDIDATE_BASELINE`.
  - *Yêu cầu đo đạc (Benchmark):* Thời gian thực thi thực tế phụ thuộc trực tiếp vào cấu hình phần cứng CPU/RAM của máy chủ triển khai. Do đó, việc xác nhận thời gian băm mật khẩu đạt ngưỡng chấp nhận được (ví dụ mục tiêu $\le 150\text{ms}$ để tránh nghẽn Event Loop) phải được thực hiện thông qua bài kiểm thử đo đạc thực nghiệm (`NEEDS_BENCHMARK`) trên môi trường phần cứng đích, không coi đây là một cam kết bất biến mặc định.
- **Sự phù hợp Kho mã nguồn:** Node.js 22 hỗ trợ thư viện native `@node-rs/argon2` với binding tối ưu.
- **Sự phù hợp Kiến trúc:** Nằm trọn vẹn trong module IAM của `apps/api`.
- **Tác động An ninh:** Đáp ứng các tiêu chuẩn bảo vệ an toàn danh tính hiện đại trước nguy cơ rò rỉ cơ sở dữ liệu.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Argon2id)** kèm yêu cầu thực hiện benchmark tham số trên phần cứng máy chủ trước khi đưa vào sản xuất.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 3 - IAM).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-06: Nền tảng & Công cụ Web Quản trị (Admin Web Tooling)

- **Câu hỏi Quyết định:** Khởi tạo workspace `apps/admin-web` theo kiến trúc và bộ công cụ nào theo ADR 0005?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Vite + React 19 SPA (Khuyến nghị):** Single Page Application thuần túy, tốc độ khởi động và build nhanh, chia sẻ trực tiếp các gói nội bộ monorepo (`@novyx/contracts`, `@novyx/ui`), không có độ phức tạp của server-side rendering (SSR), triển khai đơn giản dưới dạng tệp tĩnh (Static Assets qua Nginx/S3/CDN).
  2. **Phương án B — Next.js 15 (App Router):** Hỗ trợ SSR và Server Actions, tuy nhiên tạo ra độ phức tạp vận hành không cần thiết cho một cổng quản trị nội bộ B2B/Enterprise được bảo vệ sau đăng nhập, khó chia sẻ cấu hình build hơn với monorepo React Native.
- **Sự phù hợp Kho mã nguồn:** Monorepo đã cấu hình sẵn React 19 và TypeScript. Vite tích hợp tự nhiên vào cấu trúc workspace npm hiện tại.
- **Sự phù hợp Kiến trúc:** Phục vụ riêng Platform Administrator theo ADR 0005; chỉ đọc và quản trị chính sách, không can thiệp tác vụ hiện trường.
- **Tác động An ninh:** Đóng gói tĩnh (Static SPA) hạn chế bề mặt tấn công SSR (Server-Side Request Forgery).
- **Tác động Độ tin cậy:** Độc lập hoàn toàn với runtime di động, lỗi web không ảnh hưởng đến ứng dụng mobile.
- **Độ phức tạp Vận hành:** Thấp (chỉ cần host HTML/JS/CSS tĩnh).
- **Chi phí Chuyển đổi:** Thấp.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Vite + React 19 SPA)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_ADMIN_WEB` (Cần quyết định trước Wave 6).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-07: Hạ tầng Lưu trữ Bằng chứng Tệp Nhị phân (Binary Object Storage)

- **Câu hỏi Quyết định:** Lựa chọn giải pháp lưu trữ các tệp ảnh bằng chứng hiện trường có dung lượng lớn (Binary Proof Photos) như thế nào để tách rời khỏi cơ sở dữ liệu quan hệ theo ADR 0013?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Giao diện Cổng S3-Compatible (MinIO cục bộ + AWS S3 / Cloudflare R2 sản xuất) (Khuyến nghị):** Định nghĩa Port lưu trữ `IObjectStoragePort`. Môi trường phát triển cục bộ và CI sử dụng container MinIO (giao diện tương thích chuẩn S3 API phổ biến). Môi trường sản xuất cắm trực tiếp AWS S3 hoặc Cloudflare R2.
  2. **Phương án B — Lưu trữ Tệp Cục bộ trên Ổ đĩa Máy chủ (Local Filesystem):** Lưu ảnh vào thư mục máy chủ và phục vụ qua HTTP static router. Nhược điểm: khó scale nhiều instance máy chủ sau này, rủi ro mất dữ liệu nếu ổ đĩa server bị hỏng.
  3. **Phương án C — Lưu trực tiếp nhị phân vào Database (BYTEA / BLOB):** Khiến database phình to nhanh chóng, làm chậm việc backup, restore và suy giảm hiệu năng bộ nhớ đệm DB.
- **Sự phù hợp Kho mã nguồn:** SDK S3 client của AWS (`@aws-sdk/client-s3`) hoặc `minio-js` phổ biến và ổn định trong Node.js.
- **Sự phù hợp Kiến trúc:** Phù hợp nguyên lý Clean Architecture: Domain chỉ lưu URL/URI và hash của ảnh; Infrastructure Adapter lo việc lưu trữ tệp vật lý.
- **Tác động An ninh:** Hỗ trợ cơ chế Pre-signed URLs hoặc private bucket với API gateway xác thực quyền truy cập ảnh.
- **Tác động Độ tin cậy:** Đảm bảo cơ sở dữ liệu tác nghiệp không bị phình to bởi dữ liệu nhị phân.
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
  1. **Phương án A — Docker Compose trên Linux VM Đơn lẻ (Khuyến nghị cho MVP):** Đóng gói toàn bộ hệ thống gồm các dịch vụ cốt lõi (`api`, `postgres`, `object-storage`, `admin-web`) trong một cấu hình `docker-compose.yml`. Triển khai trên 1 máy chủ ảo đám mây (Cloud VM RAM 4GB–8GB).
  2. **Phương án B — Nền tảng PaaS (Render / Fly.io / Railway):** Đẩy mã nguồn trực tiếp lên PaaS. Tiện lợi nhưng chi phí tăng dần và khả năng kiểm soát mạng nội bộ, phân quyền DB bị phụ thuộc vào nhà cung cấp.
  3. **Phương án C — Kubernetes (K8s):** Quá phức tạp, chi phí vận hành và nhân lực quản trị vượt xa nhu cầu của một ứng dụng Modular Monolith ở giai đoạn MVP.
- **Sự phù hợp Kho mã nguồn:** Monorepo sẵn sàng cho multi-stage Dockerfile cho `apps/api` và `apps/admin-web`.
- **Sự phù hợp Kiến trúc:** Phù hợp với quyết định Modular Monolith triển khai đơn khối duy nhất (ADR 0013).
- **Tác động An ninh:** Mạng Docker nội bộ (bridge network) cô lập cơ sở dữ liệu và object storage khỏi internet công cộng; chỉ phơi bày cổng API và Web qua Reverse Proxy SSL.
- **Độ phức tạp Vận hành:** Thấp cho giai đoạn MVP, dễ dàng sao lưu bằng snapshot ổ đĩa.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Docker Compose trên Linux VM cho MVP)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `CAN_DEFER_TO_DEPLOYMENT` (Không ảnh hưởng đến mã nguồn domain, có thể chốt tại Wave 8).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-09: Chiến lược Cấu hình Thời gian Lưu vết Idempotency

- **Câu hỏi Quyết định:** Thiết lập tham số và chiến lược dọn dẹp (cleanup) thời gian sống (TTL) của bản ghi idempotency tại máy chủ như thế nào để tuân thủ bất biến tại ADR 0009?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Cấu hình Linh hoạt qua Biến Môi trường (Khuyến nghị):** Khai báo biến `IDEMPOTENCY_RETENTION_HOURS` (giá trị cơ sở ứng viên: 72 giờ). Bảng `idempotency_records` có cột `expires_at = created_at + interval`. Một worker định kỳ (hoặc cron job) chạy lệnh xóa bản ghi quá hạn: `DELETE FROM idempotency_records WHERE expires_at < NOW()`.
  2. **Phương án B — Khóa Cứng 72 Giờ Bất biến trong Code:** Gán cứng `const TTL = 72 * 3600`. Nhược điểm: không thể điều chỉnh tăng lên khi triển khai tại các địa bàn có chu kỳ ngoại tuyến dài hơn dự kiến.
- **Sự phù hợp Kho mã nguồn:** Thư viện `packages/config` sẵn sàng xác thực biến môi trường này.
- **Sự phù hợp Kiến trúc:** Tuân thủ triệt để bất biến ADR 0009: *Thời gian lưu vết idempotency tại máy chủ bắt buộc $\ge$ Chân trời thử lại ngoại tuyến tối đa của thiết bị di động*.
- **Tác động An ninh:** Đảm bảo không cho phép gửi trùng lặp tác vụ khi thiết bị thử lại sau thời gian mất kết nối.
- **Độ phức tạp Vận hành:** Thấp.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Biến môi trường `IDEMPOTENCY_RETENTION_HOURS`, giá trị cơ sở ứng viên 72h, dọn dẹp định kỳ)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `CAN_DEFER_TO_FIELD_MEASUREMENT` (Cần cấu hình trước Wave 5, giá trị tối ưu đo đạc thực tế).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-10: Chiến lược Dọn dẹp Ảnh Bằng chứng Rác trên Mobile (Garbage Collection)

- **Câu hỏi Quyết định:** Khi nào và theo tiêu chí nào thì ứng dụng di động `apps/mobile` được phép xóa các tệp ảnh bằng chứng gốc đã lưu trong Sandbox Filesystem để tránh tràn bộ nhớ máy theo ADR 0008?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Lưu Bền Vững theo Thời Gian và Ngưỡng Dung Lượng (Khuyến nghị):** Ảnh gốc chỉ được đánh dấu có thể xóa khi tác vụ đã nhận phản hồi chính thức từ Server là `TaskStatus = COMPLETED`. Giữ ảnh thêm một khoảng thời gian cơ sở ứng viên (14 ngày) làm bộ đệm đối soát thực địa, sau đó tác vụ nền kiểm tra và dọn dẹp các tệp ảnh đủ điều kiện khi dung lượng trống của máy dưới ngưỡng cơ sở ứng viên (300 MB).
  2. **Phương án B — Xóa Ngay Lập Tức Khi Nhận ACK Thành Công:** Tiết kiệm bộ nhớ tức thì nhưng nhân viên không thể xem lại ảnh chất lượng cao trên máy khi kiểm tra lịch sử ngoại tuyến.
  3. **Phương án C — Không Bao Giờ Xóa:** Dẫn đến nguy cơ làm tràn bộ nhớ (Disk Full / OOM) trên các thiết bị Android phổ thông sau thời gian dài hoạt động.
- **Sự phù hợp Kho mã nguồn:** Sử dụng API `expo-file-system` để kiểm tra dung lượng và xóa tệp.
- **Sự phù hợp Kiến trúc:** Phù hợp với ADR 0008 (bảo tồn bằng chứng tối đa, không để mất dữ liệu trước khi nghiệm thu).
- **Tác động Độ tin cậy:** Bảo vệ thiết bị khỏi tình trạng hết dung lượng ổ đĩa gây lỗi ứng dụng.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Giữ ảnh sau COMPLETED ACK với giá trị cơ sở ứng viên 14 ngày và ngưỡng dọn dẹp cơ sở ứng viên 300 MB, tối ưu dựa trên đo đạc thực địa)**.
- **Mức độ Tin cậy:** `MEDIUM` (Cần đo đạc dung lượng ảnh thực tế ngoài hiện trường).
- **Tính Khẩn cấp:** `CAN_DEFER_TO_FIELD_MEASUREMENT` (Áp dụng trong Wave 5).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

### IDB-11: Hạ tầng Quản lý Phiên & Trạng thái Thu hồi Máy chủ (Session State Infrastructure)

- **Câu hỏi Quyết định:** Lưu trữ và kiểm tra trạng thái phiên làm việc (Session), token làm mới và cờ thu hồi tức thời (`authVersion`) ở máy chủ `apps/api` bằng cơ chế nào?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Bảng `sessions` trong CSDL Quan hệ Tác nghiệp (Khuyến nghị cho MVP):** Lưu trữ phiên trong bảng CSDL quan hệ có đánh chỉ mục trên `user_id` và token hash.
     - *Lý do kiến trúc cốt lõi:* Đảm bảo tính nhất quán giao dịch (transactional consistency) khi thực hiện các lệnh quản trị tài khoản (như `SuspendAccount`, `DisableAccount`, đổi vai trò) — toàn bộ phiên liên quan có thể bị vô hiệu hóa ngay trong cùng một database transaction. Đồng thời, phương án này giữ độ phức tạp vận hành ở mức tối thiểu cho giai đoạn MVP (không phải vận hành thêm một cụm in-memory cache độc lập).
     - *Độ trễ và Đo đạc:* Hiệu năng truy vấn qua chỉ mục B-tree phụ thuộc vào tải hệ thống và phần cứng; không đưa ra cam kết cố định dạng tuyệt đối (như "luôn $< 1\text{ms}$") mà phân loại là chỉ số cần đo đạc tải (`NEEDS_BENCHMARK`).
  2. **Phương án B — Redis In-Memory Key-Value Store:** Tốc độ truy vấn bộ nhớ cao, nhưng bổ sung thêm một dịch vụ hạ tầng độc lập (đòi hỏi cấu hình cụm, snapshot dữ liệu, giám sát failover), làm tăng độ phức tạp vận hành khi chưa có bằng chứng quá tải CSDL quan hệ.
- **Sự phù hợp Kho mã nguồn:** Tích hợp trực tiếp vào schema CSDL của `apps/api`.
- **Sự phù hợp Kiến trúc:** Tuân thủ ADR 0013: Modular Monolith tinh giản tối đa hạ tầng phụ trợ trong giai đoạn MVP.
- **Tác động An ninh:** Đảm bảo thu hồi phiên nguyên tử trong cùng giao dịch khi thay đổi trạng thái tài khoản.
- **Độ phức tạp Vận hành:** Tối giản cho MVP (sử dụng chung hạ tầng RDBMS).
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Bảng `sessions` trong CSDL quan hệ cho MVP; thiết kế cổng trừu tượng để có thể tích hợp Redis khi đo đạc tải thực tế chứng minh sự cần thiết)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Cần quyết định trước Wave 3 - IAM).
- **Trạng thái:** `OPEN`.
- **Quyết định của Chủ quản (Owner Decision):** `[ ] APPROVE  [ ] REJECT  [ ] REQUEST_REVISION` *(Chờ phê duyệt)*

---

## 4. Gói Trình Duyệt Quyết Định của Chủ Quản (Owner Decision Packet)

Nhằm giảm tải nhận thức và tối ưu hóa quy trình phê duyệt, các quyết định được phân tách theo đúng tiến trình đợt triển khai, tách biệt rõ giữa các quyết định kỹ thuật bắt buộc và các tham số vận hành có thể hoãn/đo đạc:

### 4.1. Quyết Định Bắt Buộc Cần Chốt Trước Wave 2 (DECIDE BEFORE WAVE 2)

| Mã IDB | Hạng Mục Quyết Định | Phương Án Khuyến Nghị | Mức Độ Tin Cậy | Rủi Ro Kỹ Thuật Nếu Trì Hoãn | Quyết Định Của Chủ Quản |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **IDB-01** | CSDL Quan hệ Máy chủ | **PostgreSQL 16+** | `HIGH` | Phải viết lại cú pháp migration DDL nếu đổi engine | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-02** | Web Framework Máy chủ | **Fastify 5.x** | `HIGH` | Chậm trễ tiến độ toàn bộ đợt Wave 2 (Skeleton & Router) | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-03** | ORM / Truy cập DB | **Drizzle ORM** | `HIGH` | Phải chuyển đổi toàn bộ repository models và schema | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |

### 4.2. Quyết Định Bắt Buộc Cần Chốt Trước Wave 3 (DECIDE BEFORE WAVE 3)

| Mã IDB | Hạng Mục Quyết Định | Phương Án Khuyến Nghị | Mức Độ Tin Cậy | Rủi Ro Kỹ Thuật Nếu Trì Hoãn | Quyết Định Của Chủ Quản |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **IDB-04** | Cấu trúc Token Xác thực | **Signed JWT HOẶC Opaque Token** | `MEDIUM` | Thiết kế auth bị treo, không thể test tích hợp Tier 2 Gate | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-05** | Băm Mật khẩu | **Argon2id (Cần Benchmark)** | `HIGH` | Không thể lưu trữ và xác thực an toàn tài khoản | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |
| **IDB-11** | Quản lý Phiên Máy chủ | **Bảng `sessions` DB (Cần Benchmark)** | `HIGH` | Nguy cơ đưa Redis vào quá sớm làm tăng độ phức tạp | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |

### 4.3. Quyết Định Bắt Buộc Cần Chốt Trước Wave 4 (DECIDE BEFORE WAVE 4)

| Mã IDB | Hạng Mục Quyết Định | Phương Án Khuyến Nghị | Mức Độ Tin Cậy | Rủi Ro Kỹ Thuật Nếu Trì Hoãn | Quyết Định Của Chủ Quản |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **IDB-07** | Lưu trữ File Bằng chứng | **S3-Compatible Port (MinIO/S3)** | `HIGH` | Luồng upload bằng chứng ảnh bị nghẽn ở Wave 4 | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |

### 4.4. Quyết Định Bắt Buộc Cần Chốt Trước Wave 6 (DECIDE BEFORE WAVE 6)

| Mã IDB | Hạng Mục Quyết Định | Phương Án Khuyến Nghị | Mức Độ Tin Cậy | Rủi Ro Kỹ Thuật Nếu Trì Hoãn | Quyết Định Của Chủ Quản |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **IDB-06** | Web Quản trị Admin | **Vite + React 19 SPA** | `HIGH` | Chặn khởi tạo workspace `apps/admin-web` ở Wave 6 | `[ ] APPROVE  [ ] REJECT  [ ] REVISE` |

### 4.5. Quyết Định An Toàn Để Hoãn (SAFE TO DEFER — Triển Khai / Đo Đạc)

| Mã IDB | Hạng Mục Quyết Định | Phương Án Khuyến Nghị | Mức Độ Tin Cậy | Giai Đoạn Đóng Băng Phù Hợp | Trạng Thái |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **IDB-08** | Đóng gói & Triển khai Hạ tầng | **Docker Compose trên Linux VM** | `HIGH` | Wave 8 (Đóng gói sản xuất) | `OPEN` |
| **IDB-09** | Cấu hình TTL Idempotency | **Biến môi trường (Mặc định 72h)** | `HIGH` | Căn chỉnh theo đo đạc thực tế tại Wave 5 | `OPEN` |
| **IDB-10** | Dọn dẹp Ảnh Bằng chứng Mobile | **Xóa sau COMPLETED (14d/300MB)** | `MEDIUM` | Căn chỉnh theo đo đạc thực địa tại Wave 5 | `OPEN` |

---

## 5. Bảng Phân Loại Tham Số Chưa Đóng Băng (Unfrozen Parameter Classification)

Các tham số định lượng dưới đây là các giá trị ứng viên cơ sở, tuyệt đối **KHÔNG được coi là bất biến chấp thuận mặc định** và không được đưa vào tiêu chí nghiệm thu nếu chưa được phê duyệt hoặc đo đạc chính thức:

| Tên Tham Số | Giá Trị Cơ Sở Ứng Viên (`Candidate Baseline`) | Phân Loại Tham Số (`Parameter Classification`) | Căn Cứ & Điều Kiện Phê Duyệt / Xác Lập |
| :--- | :---: | :---: | :--- |
| **Access Credential TTL** | 15 phút | `CANDIDATE_BASELINE` / `OWNER_DECISION` / `DEPLOYMENT_CONFIGURATION` | Phụ thuộc vào đánh giá rủi ro an ninh và quyết định của Chủ quản tại IDB-04; cấu hình qua biến môi trường. |
| **Refresh Token TTL** | 30 ngày | `CANDIDATE_BASELINE` / `OWNER_DECISION` / `DEPLOYMENT_CONFIGURATION` | Phụ thuộc vào chính sách phiên đăng nhập của Chủ quản tại IDB-04; cấu hình qua biến môi trường. |
| **Idempotency Retention** | 72 giờ | `CANDIDATE_BASELINE` / `NEEDS_FIELD_MEASUREMENT` / `DEPLOYMENT_CONFIGURATION` | Phụ thuộc vào chu kỳ ngoại tuyến tối đa đo đạc từ thực địa (ADR 0009); cấu hình qua `IDEMPOTENCY_RETENTION_HOURS`. |
| **Mobile Photo Retention** | 14 ngày | `CANDIDATE_BASELINE` / `NEEDS_FIELD_MEASUREMENT` | Phụ thuộc vào tần suất đối soát thực địa và thói quen xem lại của nhân viên; đo đạc trong Wave 5. |
| **Free-space GC Threshold** | 300 MB | `CANDIDATE_BASELINE` / `NEEDS_FIELD_MEASUREMENT` | Ngưỡng dung lượng trống để kích hoạt dọn dẹp ảnh cũ; cần kiểm thử trên các dòng máy Android thực địa giá rẻ. |
| **Outbox Warning Threshold**| 100 tác vụ | `CANDIDATE_BASELINE` / `NEEDS_FIELD_MEASUREMENT` | Cảnh báo khi tích tụ quá nhiều lệnh ngoại tuyến; cần đo đạc dựa trên kích thước SQLite và dung lượng RAM thiết bị. |
| **Session Lookup Latency** | $< 1\text{ms}$ (Giả định cũ) | `NEEDS_BENCHMARK` | Không được coi là bảo đảm mặc định; cần kiểm thử tải (benchmark) trên môi trường phần cứng máy chủ thực tế. |

---

## 6. Dẫn Chứng Kỹ Thuật Ban Đầu (External Technical Evidence)

Dưới đây là bảng đối soát dẫn chứng kỹ thuật từ các tài liệu tham chiếu chính thức (Primary Documentation) xác thực các nhận định kỹ thuật trong sổ bộ quyết định:

| Mã IDB | Nguồn Dẫn Chứng Chính Thức (`Primary Source`) | Thực Tế Kỹ Thuật Được Sử Dụng (`Fact Used`) | Ngày Kiểm Tra |
| :---: | :--- | :--- | :---: |
| **IDB-01** | [PostgreSQL Documentation (v16)](https://www.postgresql.org/docs/16/index.html) | Hỗ trợ kiểu dữ liệu JSONB với chỉ mục GIN, partial indexes, row-level locking cho OCC, và lệnh chuẩn SQL `REVOKE UPDATE, DELETE ON <table> FROM <role>` cho bảng kiểm toán. | 21/09/2026 |
| **IDB-02** | [Fastify Documentation (v5.x)](https://fastify.dev/docs/v5.0.x/) | Kiến trúc plugin bất đồng bộ phân lập ngữ cảnh (`fastify-plugin`), hỗ trợ bộ thẩm định schema trực tiếp qua `fastify-type-provider-zod`. | 21/09/2026 |
| **IDB-03** | [Drizzle ORM Documentation (v0.30+)](https://orm.drizzle.team/docs/overview) | Khai báo schema thuần TypeScript, kiểm tra kiểu tĩnh lúc biên dịch, tự động tham số hóa câu truy vấn (Parameterized queries), hỗ trợ API giao dịch rõ ràng. | 21/09/2026 |
| **IDB-04** | [RFC 7519 (JSON Web Token)](https://datatracker.ietf.org/doc/html/rfc7519) & [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) | Token chứa claims tự ký; việc thu hồi tức thời đối với tài khoản bị khóa bắt buộc phải duy trì kiểm tra trạng thái máy chủ (Server-side Freshness Check) trên mỗi request có bảo vệ theo ADR 0006. | 21/09/2026 |
| **IDB-05** | [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) & [RFC 9106](https://datatracker.ietf.org/doc/html/rfc9106) | Argon2id là thuật toán khuyến nghị hàng đầu; tham số tối thiểu đề xuất: memory 64MB, iterations 3, parallelism 1; khuyến nghị đo đạc (benchmark) trên phần cứng thực tế. | 21/09/2026 |
| **IDB-06** | [Vite Official Guide](https://vitejs.dev/guide/) & [React 19 Documentation](https://react.dev/) | Hỗ trợ đóng gói Static SPA tối ưu, thời gian build nhanh, không có bề mặt tấn công SSR, dễ dàng chia sẻ packages trong monorepo. | 21/09/2026 |
| **IDB-07** | [AWS S3 REST API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html) | Chuẩn giao diện REST API phổ biến cho object storage; hỗ trợ cơ chế Pre-signed URL và tương thích cao giữa MinIO (dev) và AWS S3/Cloudflare R2 (prod). | 21/09/2026 |
| **IDB-08** | [Docker Compose Specification](https://docs.docker.com/compose/compose-file/) | Định nghĩa triển khai đa dịch vụ cô lập mạng qua bridge network nội bộ, phù hợp cho triển khai đơn khối trên VM đám mây. | 21/09/2026 |
| **IDB-09** | [IETF Draft: The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) | Chuẩn hóa header `Idempotency-Key` (UUIDv4); xác lập cơ chế lưu vết và hoàn trả response có cùng key, yêu cầu vòng đời lưu vết phù hợp với chu kỳ retry của client. | 21/09/2026 |
| **IDB-10** | [Expo FileSystem API Documentation](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/) | Cung cấp API kiểm tra dung lượng bộ nhớ khả dụng (`getFreeDiskStorageAsync`) và thao tác xóa tệp an toàn trong Sandbox Filesystem của ứng dụng. | 21/09/2026 |
| **IDB-11** | [PostgreSQL Documentation (v16: Indexes & Transactions)](https://www.postgresql.org/docs/16/indexes-types.html) | Chỉ mục B-tree hỗ trợ tra cứu nhanh khóa chính/khóa duy nhất; cho phép thu hồi toàn bộ phiên của người dùng trong cùng một giao dịch ACID khi thay đổi trạng thái tài khoản. | 21/09/2026 |
