# Sổ Bộ Quyết Định Cấp Triển Khai (Phase 12 Implementation Decision Register)

**Dự án:** NOVYX GreenOps
**Giai đoạn:** Phase 12B — Owner Implementation Decision Review
**Trạng thái Toàn bộ Sổ bộ:** 8 OWNER_APPROVED / 3 OPEN / 0 REJECTED (Batch 1 Approved: IDB-01, IDB-02, IDB-03; Batch 2 Approved: IDB-04, IDB-05, IDB-11; Batch 3 Approved: IDB-06, IDB-07; Còn lại: IDB-08, IDB-09, IDB-10 đang mở)
**Tài liệu Nguồn:** [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/PHASE11-OWNER-ADR-DECISIONS.md`](PHASE11-OWNER-ADR-DECISIONS.md), [`docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md`](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md)
**Ngày cập nhật:** 21/09/2026

---

## 1. Nguyên Tắc Quản Trị Quyết Định Cấp Triển Khai (Governance Rules)

1. **Không Tự Ý Khóa Quyết Định Tác Động Lớn:**
   Antigravity đề xuất phương án kỹ thuật tối ưu kèm mức độ tin cậy và phân tích đa chiều (sự phù hợp repo, kiến trúc, an ninh, độ tin cậy, độ phức tạp vận hành, chi phí chuyển đổi). Tuy nhiên, **toàn bộ các quyết định chưa được phê duyệt bắt buộc phải giữ trạng thái `OPEN`** cho đến khi Chủ quản (Owner) xem xét và phê duyệt chính thức theo từng đợt tại Phase 12B.
2. **Phân Định Tính Khẩn Cấp (Decision Urgency):**
   Mỗi quyết định được phân loại rõ ràng theo mức độ chặn các đợt triển khai (Waves):
   - `BLOCKS_BACKEND`: Chặn trực tiếp việc khởi tạo mã nguồn máy chủ `apps/api` (Wave 2, Wave 3, Wave 4).
   - `BLOCKS_MOBILE`: Chặn trực tiếp các thành phần tích hợp sâu trên client di động `apps/mobile` (Wave 5).
   - `BLOCKS_ADMIN_WEB`: Chặn việc khởi tạo dự án web quản trị `apps/admin-web` (Wave 6).
   - `CAN_DEFER_TO_DEPLOYMENT`: Có thể hoãn lại đến thời điểm đóng gói và phát hành hạ tầng production (Wave 8).
   - `CAN_DEFER_TO_FIELD_MEASUREMENT`: Có thể hoãn lại để căn chỉnh dựa trên số liệu đo đạc thực tế.
3. **Thao tác Chủ quản Cho phép:** `APPROVE` (Phê duyệt), `REJECT` (Bác bỏ), `REQUEST_REVISION` (Yêu cầu chỉnh sửa). Tại Đợt 1, Đợt 2 và Đợt 3, Chủ quản đã chính thức `APPROVE` IDB-01, IDB-02, IDB-03, IDB-04, IDB-05, IDB-06, IDB-07, IDB-11.
4. **Kỷ Luật Bằng Chứng Kỹ Thuật (Evidence Discipline):**
   Loại bỏ toàn bộ các tuyên bố tiếp thị tuyệt đối ("tốt nhất", "hoàn hảo 100%", "loại bỏ hoàn toàn SQLi", "luôn < 1ms"). Mọi đánh giá phải dựa trên bằng chứng kỹ thuật khách quan từ tài liệu gốc (Primary Sources).

---

## 2. Bảng Tổng Hợp Mức Độ Khẩn Cấp (Decision Urgency Matrix)

| Mã IDB | Tên Quyết Định Cấp Triển Khai | Đợt Triển Khai Chặn (Blocked Wave) | Phân Loại Tính Khẩn Cấp | Trạng Thái Hiện Tại |
| :---: | :--- | :---: | :---: | :---: |
| **IDB-01** | Hệ quản trị Cơ sở Dữ liệu Quan hệ (RDBMS Engine) | Wave 2 (Backend Foundation) | `BLOCKS_BACKEND` | `OWNER_APPROVED` |
| **IDB-02** | Web Framework Máy chủ API (Backend HTTP Framework) | Wave 2 (Backend Foundation) | `BLOCKS_BACKEND` | `OWNER_APPROVED` |
| **IDB-03** | Công cụ Truy cập DB / ORM / Query Builder | Wave 2 (Backend Foundation) | `BLOCKS_BACKEND` | `OWNER_APPROVED` |
| **IDB-04** | Cấu trúc Thông tin Xác thực (Access Credential Architecture) | Wave 3 (IAM & Authorization) | `BLOCKS_BACKEND` | `OWNER_APPROVED` |
| **IDB-05** | Thuật toán Băm Mật khẩu Tài khoản (Password Hashing) | Wave 3 (IAM & Authorization) | `BLOCKS_BACKEND` | `OWNER_APPROVED` |
| **IDB-06** | Nền tảng & Công cụ Web Quản trị (Admin Web Tooling) | Wave 6 (Dedicated Admin Web) | `BLOCKS_ADMIN_WEB` | `OWNER_APPROVED` |
| **IDB-07** | Hạ tầng Lưu trữ Bằng chứng Tệp Nhị phân (Object Storage)| Wave 4 (Operational Domain) | `BLOCKS_BACKEND` | `OWNER_APPROVED` |
| **IDB-08** | Chiến lược Đóng gói & Triển khai Hạ tầng (Hosting) | Wave 8 (Hardening & Prod) | `CAN_DEFER_TO_DEPLOYMENT` | `OPEN` |
| **IDB-09** | Chiến lược Cấu hình Thời gian Lưu vết Idempotency | Wave 2 / Wave 5 (OCC & Outbox) | `CAN_DEFER_TO_FIELD_MEASUREMENT` | `OPEN` |
| **IDB-10** | Chiến lược Dọn dẹp Ảnh Bằng chứng Rác trên Mobile (GC) | Wave 5 (Mobile Local Storage) | `CAN_DEFER_TO_FIELD_MEASUREMENT` | `OPEN` |
| **IDB-11** | Hạ tầng Quản lý Phiên & Trạng thái Thu hồi Máy chủ | Wave 3 (IAM & Freshness) | `BLOCKS_BACKEND` | `OWNER_APPROVED` |

---

## 3. Chi Tiết Từng Quyết Định Cấp Triển Khai (IDB-01 .. IDB-11)

---

### IDB-01: Hệ quản trị Cơ sở Dữ liệu Quan hệ Máy chủ (RDBMS Engine)

- **Câu hỏi Quyết định:** Lựa chọn hệ quản trị cơ sở dữ liệu quan hệ cụ thể nào làm engine lưu trữ tác nghiệp và nhật ký kiểm toán cho `apps/api` trong phạm vi Relational Database Family đã được chấp thuận tại ADR 0013?
- **Các Phương án Ứng viên:**
  1. **Phương án A — PostgreSQL (Khuyến nghị):** Hệ RDBMS mã nguồn mở phổ biến, hỗ trợ kiểu dữ liệu JSONB mạnh mẽ cho metadata bằng chứng linh hoạt, hỗ trợ partial indexes, row-level locking phục vụ kiểm soát đồng thời (OCC), và phân tách đặc quyền chuẩn SQL (`GRANT/REVOKE`) chi tiết ở cấp bảng/cột cho bảng Audit.
  2. **Phương án B — MySQL 8.0+:** Phổ biến, hiệu năng ghi tốt, nhưng hỗ trợ biểu thức indexing và tính năng JSON hạn chế hơn PostgreSQL trong các kịch bản kiểm toán và lưu trữ cấu trúc động.
  3. **Phương án C — SQLite Nhúng (better-sqlite3) trên máy chủ:** Rất đơn giản, không cần dịch vụ ngoài, nhưng hạn chế về xử lý đa kết nối đồng thời và cơ chế phân tách quyền người dùng DB, không phù hợp làm máy chủ tác nghiệp trung tâm.
- **Sự phù hợp Kho mã nguồn:** Nhánh `base-setup` dùng Node.js 22; các thư viện kết nối PostgreSQL như `pg` hoặc `postgres.js` tích hợp chuẩn xác với TypeScript.
- **Sự phù hợp Kiến trúc:** Khớp với ADR 0011 (Privilege Separation) và ADR 0013 (Relational Modular Monolith).
- **Tác động An ninh:** PostgreSQL cho phép cấu hình phân quyền người dùng DB chi tiết (`REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM novyx_api_user`).
- **Tác động Độ tin cậy:** Hỗ trợ đầy đủ giao dịch ACID theo chuẩn SQL, bảo vệ dữ liệu khỏi trạng thái bất nhất khi xảy ra sự cố máy chủ.
- **Độ phức tạp Vận hành:** Trung bình (cần 1 container Docker hoặc dịch vụ Managed DB).
- **Chi phí Chuyển đổi:** Thấp do chưa có dữ liệu sản xuất (dự án chưa triển khai database backend).
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (PostgreSQL)**.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Đã được giải tỏa cho Wave 2).
- **Trạng thái:** `OWNER_APPROVED`.
- **Quyết định của Chủ quản (Owner Decision):** `[x] APPROVE — PostgreSQL  [ ] REJECT  [ ] REQUEST_REVISION`
- **Phạm vi Chấp thuận Cụ thể (Accepted Scope):**
  - PostgreSQL là hệ quản trị CSDL quan hệ chính thức của hệ thống.
  - Mốc triển khai ban đầu (Initial implementation baseline): **PostgreSQL 18.x**. Môi trường sản xuất (Production) bắt buộc sử dụng một bản phát hành major ổn định được hỗ trợ (supported stable major) kết hợp bản vá minor hiện hành. "PostgreSQL 18.x" là mốc kỹ thuật ban đầu, **không phải bất biến kiến trúc vĩnh cửu**; các đợt nâng cấp major trong tương lai không cấu thành thay đổi kiến trúc.
  - Cho phép sử dụng các cơ chế và cú pháp SQL chuyên biệt của PostgreSQL (như `GRANT`, `REVOKE`, database roles, table privileges, partial indexes, row-locking `FOR UPDATE` cho OCC) trong tài liệu triển khai và mã nguồn hạ tầng khi có cơ sở kỹ thuật rõ ràng.
  - Không khóa cứng nhà cung cấp đám mây (Cloud Vendor), dịch vụ CSDL được quản lý (Managed DB Provider), image container cụ thể hay cấu trúc topology máy chủ.
  - Tính di động giữa các hệ quản trị CSDL (Database portability) không phải là yêu cầu của giai đoạn MVP.

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
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Đã được giải tỏa cho Wave 2).
- **Trạng thái:** `OWNER_APPROVED`.
- **Quyết định của Chủ quản (Owner Decision):** `[x] APPROVE — Fastify 5.x  [ ] REJECT  [ ] REQUEST_REVISION`
- **Phạm vi Chấp thuận Cụ thể (Accepted Scope):**
  - HTTP runtime framework cho `apps/api` là Fastify 5.x, chạy trên Node.js runtime được kho mã nguồn hỗ trợ.
  - Fastify đóng vai trò hạ tầng vận hành HTTP/Runtime (routing, request lifecycle, transport middleware, HTTP error mapping, transport adapters), **tuyệt đối không phải thẩm quyền hợp đồng nghiệp vụ**.
  - Gói `@novyx/contracts` và các Zod schemas duy trì vị thế ranh giới hợp đồng mạng duy nhất và tối cao tại runtime. Không sử dụng Fastify JSON Schema để thay thế hoặc làm nguồn chân lý hợp đồng nghiệp vụ.
  - Đảm bảo tính độc lập của Clean Architecture: Logic nghiệp vụ miền (Domain Core) và tầng ứng dụng (Application Use Cases) tuyệt đối không phụ thuộc trực tiếp vào Fastify hay các đối tượng `FastifyRequest`, `FastifyReply`.

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
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Đã được giải tỏa cho Wave 2).
- **Trạng thái:** `OWNER_APPROVED`.
- **Quyết định của Chủ quản (Owner Decision):** `[x] APPROVE — Drizzle ORM + drizzle-kit  [ ] REJECT  [ ] REQUEST_REVISION`
- **Phạm vi Chấp thuận Cụ thể (Accepted Scope):**
  - Drizzle ORM đảm nhận biểu diễn lưu trữ quan hệ và truy xuất dữ liệu định kiểu (typed data access); `drizzle-kit` đảm nhận công cụ migration khi phù hợp.
  - Schema bảng Drizzle chỉ là mô hình lưu trữ hạ tầng, **tuyệt đối không thay thế** `@novyx/contracts`, không thay thế Domain Aggregate Models, và không thay thế Business Commands.
  - Tầng Domain và Application tuyệt đối không phụ thuộc vào Drizzle (`Domain -> Drizzle` bị cấm). Chỉ các Repository Adapters tại tầng Infrastructure mới được import Drizzle.
  - Cho phép cơ chế thoát SQL thuần (raw SQL escape hatch) cho các yêu cầu hạ tầng CSDL chuyên biệt: phân tách đặc quyền PostgreSQL (`REVOKE UPDATE, DELETE, TRUNCATE ON audit_events`), partial indexes, GIN index JSONB, hoặc các tính năng không thể biểu diễn tối ưu qua ORM API.
  - Mọi migration đều phải có Chiến lược Khôi phục / Phục hồi (Rollback / Recovery Strategy) được tài liệu hóa rõ ràng, không ép buộc `down.sql` hình thức nếu gây phá hủy dữ liệu.

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
- **Khuyến nghị Kỹ thuật Ban đầu (Lịch sử):** Từng xem xét Signed JWT ngắn hạn kết hợp Refresh Token xoay vòng HOẶC Opaque Bearer Token thuần túy.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Đã được giải tỏa cho Wave 3).
- **Trạng thái:** `OWNER_APPROVED`.
- **Quyết định của Chủ quản (Owner Decision):** `[x] APPROVE — Opaque Bearer Access Credential + Rotating Opaque Refresh Credential  [ ] REJECT  [ ] REQUEST_REVISION`
- **Phạm vi Chấp thuận Cụ thể (Accepted Scope):**
  - Access Credential là **Opaque Bearer Access Credential**; Refresh Credential là **Rotating Opaque Refresh Credential**.
  - Cả hai loại credential đều được sinh bằng bộ sinh số ngẫu nhiên an toàn mật mã học (CSPRNG) với đủ độ dài entropy bảo mật cao.
  - Phía máy chủ **TUYỆT ĐỐI KHÔNG lưu trữ bản rõ (plaintext)** của bearer access credential; chỉ lưu trữ bản băm an toàn hoặc định danh dẫn xuất an toàn (`hash(token)` / secure token lookup hash) phục vụ tra cứu phiên và xác minh thu hồi.
  - Hàm băm dùng cho chuỗi token ngẫu nhiên là chi tiết triển khai tầng Infrastructure của Wave 3 (không tự ý áp đặt Argon2id lên việc băm chuỗi token ngẫu nhiên).
  - Access credential có thời gian sống ngắn; refresh credential có thời gian sống dài hơn. Các mốc thời gian (như 15 phút, 30 ngày) chỉ là mốc cơ sở ứng viên (`CANDIDATE_BASELINE`) hoặc cấu hình triển khai (`DEPLOYMENT_CONFIGURATION`), **không bị đóng băng vĩnh viễn thành hằng số kiến trúc bất biến**.
  - Mọi request có bảo vệ (Read, Mutate, Decide, Administer) bắt buộc thực hiện kiểm tra tính tươi tài khoản trên máy chủ theo ADR 0006: `AccountStatus != ACTIVE` $\rightarrow$ TỪ CHỐI; `authVersion`/`sessionVersion` lỗi thời $\rightarrow$ TỪ CHỐI; thay đổi vai trò (role change) lập tức vô hiệu hóa các phiên mang quyền hạn cũ.
  - Xoay vòng Refresh Credential: mỗi lần refresh thành công, refresh credential cũ bị hủy hiệu lực ngay lập tức và cấp mới credential thay thế.
  - Phát hiện tái sử dụng Refresh Credential (Reuse / Replay Detection): máy chủ lưu trữ metadata phát hiện việc gửi lại credential đã xoay vòng; khi phát hiện tái sử dụng, lập tức vô hiệu hóa phiên làm việc hoặc token family bị ảnh hưởng theo chính sách IAM (phân định rõ bán kính ảnh hưởng).
  - Bắt buộc giao thức mã hóa TLS cho toàn bộ các kênh truyền thông tin xác thực.
  - Kế hoạch triển khai chính thức loại bỏ hoàn toàn các phương án JWT, JWS, JWE, JWKS, RS256, ES256, HS256 khỏi định hướng chấp thuận.

---

### IDB-05: Thuật toán Băm Mật khẩu Tài khoản (Password Hashing Implementation)

- **Câu hỏi Quyết định:** Sử dụng thuật toán băm mật khẩu nào cho tài khoản người dùng tại cơ sở dữ liệu `apps/api`?
- **Các Phương án Ứng viên:**
  1. **Phương án A — Argon2id (Khuyến nghị):** Thuật toán đạt giải nhất Password Hashing Competition (PHC), khuyến nghị hàng đầu của OWASP (OWASP Password Storage Cheat Sheet). Kháng tấn công GPU/ASIC nhờ cơ chế kết hợp bộ nhớ cứng (memory-hard) và thời gian (time-hard). Thư viện triển khai Node.js: `@node-rs/argon2` (native Rust binding).
  2. **Phương án B — bcrypt:** Cổ điển, phổ biến rộng rãi, nhưng khả năng kháng tấn công phần cứng GPU chuyên dụng kém hơn Argon2id, giới hạn độ dài mật khẩu đầu vào 72 bytes.
  3. **Phương án C — PBKDF2:** Tiêu chuẩn NIST cũ, tốn chu kỳ CPU nhưng kháng GPU kém hơn Argon2id.
- **Tách biệt Tham số Cơ sở Khuyến nghị và Đo đạc Thực tế:**
  - *Tham số khuyến nghị từ tài liệu gốc (Primary Sources):*
    - **OWASP Password Storage Cheat Sheet (Mức tối thiểu thực tế):** $m = 19\text{ MiB}$ ($19456\text{ KiB}$), $t = 2$, $p = 1$.
    - **RFC 9106 (Tùy chọn khuyến nghị thứ hai cho môi trường hạn chế bộ nhớ):** $m = 64\text{ MiB}$ ($65536\text{ KiB}$), $t = 3$, $p = 4$.
    - *Phân loại tham số cơ sở:* `CANDIDATE_BASELINE` (Không gộp lẫn hoặc tự ý hợp nhất tham số giữa hai nguồn).
  - *Yêu cầu đo đạc (Benchmark):* Thời gian thực thi thực tế phụ thuộc trực tiếp vào cấu hình phần cứng CPU/RAM của máy chủ triển khai. Do đó, việc lựa chọn work factors cụ thể cho môi trường sản xuất phải được xác định thông qua bài kiểm thử đo đạc thực nghiệm (`NEEDS_BENCHMARK`) trên môi trường phần cứng đích, không tự ý đóng băng mục tiêu thời gian (như $\le 150\text{ms}$) khi chưa có chính sách NFR/an ninh chính thức phê duyệt.
- **Sự phù hợp Kho mã nguồn:** Node.js 22 hỗ trợ thư viện native `@node-rs/argon2` với binding tối ưu.
- **Sự phù hợp Kiến trúc:** Nằm trọn vẹn trong module IAM của `apps/api`.
- **Tác động An ninh:** Đáp ứng các tiêu chuẩn bảo vệ an toàn danh tính hiện đại trước nguy cơ rò rỉ cơ sở dữ liệu.
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (Argon2id)** kèm yêu cầu thực hiện benchmark tham số trên phần cứng máy chủ trước khi đưa vào sản xuất.
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Đã được giải tỏa cho Wave 3).
- **Trạng thái:** `OWNER_APPROVED`.
- **Quyết định của Chủ quản (Owner Decision):** `[x] APPROVE — Argon2id  [ ] REJECT  [ ] REQUEST_REVISION`
- **Phạm vi Chấp thuận Cụ thể (Accepted Scope):**
  - Thuật toán băm mật khẩu chính thức của hệ thống là **Argon2id**.
  - Sử dụng thư viện triển khai được duy trì bảo trì và tối ưu cho môi trường Node.js runtime. Việc lựa chọn thư viện cụ thể (như `@node-rs/argon2` hoặc tương đương) là chi tiết triển khai thuộc phạm vi Wave 3, không bị khóa cứng thành bất biến bắt buộc của Chủ quản.
  - Mỗi mật khẩu bắt buộc phải sử dụng một muối ngẫu nhiên duy nhất (unique salt) với độ dài bảo mật tiêu chuẩn.
  - Tham số chi phí sản xuất (production work factors) bắt buộc phải được đo đạc (benchmark) trên môi trường phần cứng máy chủ đích (`NEEDS_BENCHMARK`). Các tham số này là chính sách cấu hình an ninh (`SECURITY_CONFIGURATION`), **không bị đóng băng vĩnh viễn thành hằng số kiến trúc bất biến**.
  - Bảo lưu phân biệt chuẩn xác giữa hai tài liệu tham chiếu gốc:
    - *OWASP Password Storage Cheat Sheet (Mức tối thiểu thực tế):* $m = 19\text{ MiB}$, $t = 2$, $p = 1$.
    - *RFC 9106 (Khuyến nghị thứ hai cho môi trường giới hạn bộ nhớ):* $m = 64\text{ MiB}$, $t = 3$, $p = 4$.
    - Tuyệt đối không tự ý gộp lẫn tham số thành $m = 64\text{ MiB}, t = 3, p = 1$.
  - Hỗ trợ chính sách tự động băm lại khi đăng nhập thành công (`rehash-on-successful-login`) khi chính sách tham số băm được nâng cấp trong tương lai (chỉ thực hiện khi có mật khẩu bản rõ hợp lệ trong phiên đăng nhập).

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
- **Tính Khẩn cấp:** `BLOCKS_ADMIN_WEB` (Đã được giải tỏa cho Wave 6).
- **Trạng thái:** `OWNER_APPROVED`.
- **Quyết định của Chủ quản (Owner Decision):** `[x] APPROVE — React 19 SPA + Vite  [ ] REJECT  [ ] REQUEST_REVISION`
- **Phạm vi Chấp thuận Cụ thể (Accepted Scope):**
  - Workspace chuyên biệt cho web quản trị là `apps/admin-web`, xây dựng theo kiến trúc Single Page Application (SPA) với React 19, TypeScript và Vite.
  - Mốc triển khai ban đầu (Initial implementation baseline) tuân thủ bản phát hành React 19.x tương thích kho mã nguồn hiện tại và bản phát hành Vite major được hỗ trợ tương thích với Node runtime của repository. **Không đóng băng vĩnh viễn** bản vá minor/patch cụ thể của React hay Vite; các đợt nâng cấp dependency thông thường không cấu thành thay đổi kiến trúc.
  - Admin Web tiêu thụ trực tiếp gói `@novyx/contracts` và gói `@novyx/ui` (ở những thành phần thực sự tương thích môi trường web).
  - Phục vụ riêng tư cách Quản trị viên Nền tảng (Platform Administrator) với các thẩm quyền quản trị: `CAP-ADM-01` (User Provisioning), `CAP-ADM-02` (Role Assignment), `CAP-ADM-03` (Account Lifecycle), `CAP-ADM-04` (Account Recovery / Unlock), `CAP-ADM-05` (Audit Log Inspection), `CAP-ADM-06` (Tree Master Data Governance), `CAP-ADM-07` (TaskType Catalog Governance), `CAP-ADM-08` (ProofProfile Policy Governance), `CAP-ADM-09` (Checklist Template Governance), và quyền chỉ đọc `OP-22` (ViewCareHistory).
  - **Tuyệt đối KHÔNG trao thẩm quyền tác nghiệp thông thường** cho Admin Web: cấm bổ sung các quyền đột biến công việc hiện trường (`CreateTask`, `AssignTask`, `StartTask`, `SubmitEvidence`, `ApproveTask`, `RequestRework`) như quyền quản trị thông thường.
  - **SPA không phải là ranh giới an ninh (SPA is NOT a security boundary):** Khả năng hiển thị giao diện trên React/Vite (ẩn/hiện nút, route guards, điều kiện vai trò trong component) chỉ mang tính tư vấn/chỉ dẫn trải nghiệm (`ADVISORY`). Toàn bộ quyền truy cập và thực thi bắt buộc phải được thẩm định và thực thi uy quyền tại Máy chủ (Server Request Gate & Domain Authoritative Eligibility).
  - **Ranh giới lưu trữ thông tin xác thực trình duyệt (Browser Credential Boundary):** Việc lựa chọn Vite + React không tự động quyết định cơ chế lưu trữ credential trong trình duyệt. Tuyệt đối không tự ý chọn ngầm `localStorage`, `sessionStorage` hay `IndexedDB` cho refresh token làm kiến trúc an ninh cuối cùng; cơ chế xác thực Admin Web phải tuân thủ nghiêm ngặt ADR 0006, IDB-04, IDB-11 và được giải quyết trong giai đoạn thiết kế an ninh/triển khai.
  - **Ưu tiên bàn giao demo chi phí $0:** Render Static Site là phương án ưu tiên bàn giao cho môi trường demo hiện tại (do Admin Web là static SPA thuần túy). Tuy nhiên, Render **KHÔNG phải là kiến trúc bị khóa cứng bởi Chủ quản**; bất kỳ nền tảng lưu trữ tĩnh tương đương nào hỗ trợ định tuyến SPA, HTTPS và kết nối an toàn tới `apps/api` đều có thể được sử dụng thay thế.

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
- **Khuyến nghị của Kỹ sư:** **Chọn Phương án A (S3-Compatible Object Storage Port)** kèm ưu tiên bàn giao demo chi phí $0 (Free-First Delivery Preference).
- **Mức độ Tin cậy:** `HIGH`.
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Đã được giải tỏa cho Wave 4).
- **Trạng thái:** `OWNER_APPROVED`.
- **Quyết định của Chủ quản (Owner Decision):** `[x] APPROVE — S3-Compatible Object Storage Port (Free-First Delivery Preference)  [ ] REJECT  [ ] REQUEST_REVISION`
- **Phạm vi Chấp thuận Cụ thể (Accepted Scope):**
  - Bằng chứng nhị phân (Binary Proof Photos) được lưu trữ bên ngoài cơ sở dữ liệu quan hệ PostgreSQL thông qua cổng trừu tượng `IObjectStoragePort`.
  - Adapter hạ tầng (Infrastructure Adapter) sử dụng các thao tác tương thích chuẩn S3 API (S3-compatible operations).
  - Tầng Domain và Application Use Cases duy trì tính trung lập hoàn toàn với nhà cung cấp (provider-neutral); tuyệt đối không phụ thuộc vào SDK hay kiểu dữ liệu riêng biệt của Cloudflare R2, AWS S3, MinIO hay bất kỳ nhà cung cấp cụ thể nào.
  - Thùng chứa (Buckets/Containers) ở trạng thái riêng tư theo mặc định (`private by default`). Máy chủ kiểm soát việc sinh khóa đối tượng (`objectKey`), ủy quyền truy cập đối tượng thông qua URL có chữ ký tạm thời (`presigned URLs`) có thời hạn sống ngắn.
  - Client tuyệt đối không nhận URL công khai vĩnh viễn làm định danh bằng chứng. Định danh bằng chứng bền vững trong CSDL PostgreSQL lưu trữ tối thiểu về mặt khái niệm: `storageRef` / `objectKey`, `contentHash` / `checksum`, `contentType`, `size`, nguồn gốc/sở hữu bằng chứng (`evidence ownership/provenance`), dấu thời gian tạo (`createdAt`), và metadata bằng chứng theo nghiệp vụ; **tuyệt đối không lưu URL có chữ ký tạm thời làm định danh bằng chứng bền vững**. Lược đồ bảng SQL cụ thể không bị đóng băng tại quyết định này.
  - **An toàn nghiệm thu tải lên (Upload Acceptance Safety):** Phân định ranh giới tuyệt đối giữa *Tải tệp thành công lên Object Storage (Object Upload Success)* và *Nghiệm thu bằng chứng nghiệp vụ (Business Evidence Acceptance)*. Việc tệp nhị phân tải lên thành công vào bucket **tuyệt đối KHÔNG tự động**: chuyển đổi `TaskStatus`, đánh dấu bằng chứng hợp lệ, hoàn thành `SubmitEvidence`, hay cho phép chuyển trạng thái sang thẩm định. Máy chủ/tầng Ứng dụng bắt buộc phải kiểm tra quyền sở hữu tài nguyên, trạng thái tác vụ, yêu cầu minh chứng (`ProofProfile`), checksum/tính toàn vẹn và các tiền điều kiện nghiệp vụ trước khi ghi nhận bằng chứng.
  - **Ưu tiên bàn giao miễn phí (Free-First Delivery Preference):**
    - Ứng viên ưu tiên số một cho môi trường demo chi phí $0: **Cloudflare R2 Free Tier**.
    - Các ứng viên dự phòng: Railway Bucket trong thời gian dùng thử (Trial), MinIO/dịch vụ S3-compatible cục bộ cho môi trường phát triển, hoặc nhà cung cấp tương thích S3 khác.
    - **Bất biến kiến trúc duy nhất được phê duyệt là: S3-COMPATIBLE OBJECT STORAGE PORT**. Cloudflare R2, AWS S3, Railway, MinIO **tuyệt đối KHÔNG phải là bất biến kiến trúc bị khóa vĩnh viễn**. MinIO thuần túy là hạ tầng môi trường phát triển/CI, không phải thẩm quyền kiến trúc production và không bắt buộc chạy MinIO trên production.
    - Tuyệt đối không lan truyền tên bucket R2, account ID, domain model riêng của Cloudflare hay R2 SDK types vào Domain, Application, hay `@novyx/contracts`.

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
- **Tính Khẩn cấp:** `BLOCKS_BACKEND` (Đã được giải tỏa cho Wave 3).
- **Trạng thái:** `OWNER_APPROVED`.
- **Quyết định của Chủ quản (Owner Decision):** `[x] APPROVE — PostgreSQL-backed Session Repository cho MVP  [ ] REJECT  [ ] REQUEST_REVISION`
- **Phạm vi Chấp thuận Cụ thể (Accepted Scope):**
  - Trạng thái phiên và cờ thu hồi tức thời được lưu trữ bền vững trong CSDL PostgreSQL cho giai đoạn MVP, tận dụng cơ chế giao dịch ACID và chỉ mục B-tree.
  - Redis **KHÔNG phải là yêu cầu bắt buộc** cho MVP; việc đưa cache in-memory vào hệ thống chỉ được xem xét khi có số liệu đo đạc tải thực tế chứng minh sự cần thiết.
  - Tuân thủ nghiêm ngặt Clean Architecture: Tầng Domain và Application Use Cases chỉ giao tiếp với cổng trừu tượng `SessionRepository Port`. Tầng Infrastructure triển khai adapter tương ứng (`PostgreSQLSessionRepository`) qua Drizzle ORM. Tuyệt đối cấm tầng Domain/Application phụ thuộc trực tiếp vào Drizzle hay PostgreSQL (`Domain -> Drizzle` và `Domain -> PostgreSQL` bị CẤM).
  - Dữ liệu phiên ở mức khái niệm (Conceptual Session State) có thể bao gồm: `sessionId`, `tokenFamilyId`, `userId`, dữ liệu tra cứu access token băm, refresh token băm, `authVersion`/`sessionVersion` tại thời điểm cấp, `expiresAt`, `revokedAt`, metadata xoay vòng/thay thế, `createdAt`, và `lastUsedAt` khi có lý do kỹ thuật. Lược đồ bảng, tên cột, kiểu dữ liệu SQL cụ thể không bị đóng băng tại quyết định này, mà thuộc phạm vi thiết kế chi tiết của Wave 3.
  - Thu hồi nguyên tử trong giao dịch (transactional revocation): Các thao tác thay đổi trạng thái tài khoản (`SuspendAccount`, `DisableAccount`, `AssignRole`) cập nhật trạng thái định danh và vô hiệu hóa các phiên/token liên quan trong cùng một database transaction.
  - Bảo toàn tính bất biến nghiệp vụ: Việc thay đổi trạng thái tài khoản hoặc vai trò trong IAM **tuyệt đối KHÔNG trực tiếp làm đột biến `TaskStatus`** của các tác vụ hiện trường.
  - Tuyệt đối không phát sinh lệnh nghiệp vụ tự tạo mang tên `RevokeSession`; việc vô hiệu hóa phiên làm việc thuần túy là hệ quả kỹ thuật của việc đăng xuất hoặc quản trị tài khoản.

---

## 4. Gói Trình Duyệt Quyết Định của Chủ Quản (Owner Decision Packet)

Nhằm giảm tải nhận thức và tối ưu hóa quy trình phê duyệt, các quyết định được phân tách theo đúng tiến trình đợt triển khai, tách biệt rõ giữa các quyết định kỹ thuật đã phê duyệt, các quyết định cần duyệt ở đợt tiếp theo, và các tham số vận hành có thể hoãn/đo đạc:

### 4.1. ĐÃ PHÊ DUYỆT — ĐỢT 1: NỀN TẢNG WAVE 2 (DECIDED — BATCH 1)

| Mã IDB | Hạng Mục Quyết Định | Phương Án Chấp Thuận | Mức Độ Tin Cậy | Trạng Thái | Biên Bản Phê Duyệt |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **IDB-01** | CSDL Quan hệ Máy chủ | **PostgreSQL** (Baseline: 18.x; Prod: Supported Stable Major + Minor) | `HIGH` | `OWNER_APPROVED` | [Batch 1 Ledger](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md#21-idb-01--hệ-quản-trị-cơ-sở-dữ-liệu-quan-hệ-postgresql-owner_approved) |
| **IDB-02** | Web Framework Máy chủ | **Fastify 5.x** (Runtime Infrastructure, Zod/@novyx/contracts là Contract Authority) | `HIGH` | `OWNER_APPROVED` | [Batch 1 Ledger](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md#22-idb-02--web-framework-máy-chủ-fastify-5x-owner_approved) |
| **IDB-03** | ORM / Truy cập DB | **Drizzle ORM + drizzle-kit** (Kèm Raw SQL escape hatch cho DB privileges/indexes) | `HIGH` | `OWNER_APPROVED` | [Batch 1 Ledger](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md#23-idb-03--công-cụ-truy-cập-dữ-liệu--orm-drizzle-orm--drizzle-kit-owner_approved) |

### 4.2. ĐÃ PHÊ DUYỆT — ĐỢT 2: AN NINH & IAM WAVE 3 (DECIDED — BATCH 2)

| Mã IDB | Hạng Mục Quyết Định | Phương Án Chấp Thuận | Mức Độ Tin Cậy | Trạng Thái | Biên Bản Phê Duyệt |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **IDB-04** | Cấu trúc Thông tin Xác thực | **Opaque Bearer Access Credential + Rotating Opaque Refresh Credential** | `HIGH` | `OWNER_APPROVED` | [Batch 2 Ledger](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md#41-idb-04--cấu-trúc--định-dạng-thông-tin-xác-thực-opaque-tokens-owner_approved) |
| **IDB-05** | Băm Mật khẩu | **Argon2id** (Benchmark trên phần cứng đích, hỗ trợ rehash) | `HIGH` | `OWNER_APPROVED` | [Batch 2 Ledger](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md#42-idb-05--thuật-toán-băm-mật-khẩu-argon2id-owner_approved) |
| **IDB-11** | Quản lý Phiên Máy chủ | **PostgreSQL-backed Session Repository cho MVP** (Clean Architecture port) | `HIGH` | `OWNER_APPROVED` | [Batch 2 Ledger](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md#43-idb-11--hạ-tầng-quản-lý-phiên-postgresql-session-repository-cho-mvp-owner_approved) |

### 4.3. ĐÃ PHÊ DUYỆT — ĐỢT 3: TÁC NGHIỆP & WEB QUẢN TRỊ (DECIDED — BATCH 3)

| Mã IDB | Hạng Mục Quyết Định | Phương Án Chấp Thuận | Mức Độ Tin Cậy | Trạng Thái | Biên Bản Phê Duyệt |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **IDB-07** | Lưu trữ File Bằng chứng | **S3-Compatible Object Storage Port** (Free-First Delivery: Cloudflare R2 / MinIO dev; Provider-neutral) | `HIGH` | `OWNER_APPROVED` | [Batch 3 Ledger](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md#5-decision-batch-3--object-storage--admin-web) |
| **IDB-06** | Web Quản trị Admin | **React 19 SPA + Vite** (apps/admin-web, Platform Admin scope, Server authority) | `HIGH` | `OWNER_APPROVED` | [Batch 3 Ledger](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md#5-decision-batch-3--object-storage--admin-web) |

### 4.4. AN TOÀN ĐỂ HOÃN — TRIỂN KHAI / ĐO ĐẠC THỰC ĐỊA (SAFE TO DEFER)

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
| **Argon2id Work Factors** | OWASP min ($19\text{ MiB}/t=2/p=1$); RFC 9106 ($64\text{ MiB}/t=3/p=4$) | `CANDIDATE_BASELINE` / `NEEDS_BENCHMARK` | Tham số băm mật khẩu được đề xuất theo hai cơ sở tài liệu gốc; tham số sản xuất chính thức bắt buộc đo đạc (benchmark) trên phần cứng máy chủ đích, không tự ý đóng băng mục tiêu thời gian cố định. |

---

## 6. Dẫn Chứng Kỹ Thuật Ban Đầu (External Technical Evidence)

Dưới đây là bảng đối soát dẫn chứng kỹ thuật từ các tài liệu tham chiếu chính thức (Primary Documentation) xác thực các nhận định kỹ thuật trong sổ bộ quyết định:

| Mã IDB | Nguồn Dẫn Chứng Chính Thức (`Primary Source`) | Thực Tế Kỹ Thuật Được Sử Dụng (`Fact Used`) | Ngày Kiểm Tra |
| :---: | :--- | :--- | :---: |
| **IDB-01** | [PostgreSQL Documentation (v16)](https://www.postgresql.org/docs/16/index.html) | Hỗ trợ kiểu dữ liệu JSONB với chỉ mục GIN, partial indexes, row-level locking cho OCC, và lệnh chuẩn SQL `REVOKE UPDATE, DELETE ON <table> FROM <role>` cho bảng kiểm toán. | 21/09/2026 |
| **IDB-02** | [Fastify Documentation (v5.x)](https://fastify.dev/docs/v5.0.x/) | Kiến trúc plugin bất đồng bộ phân lập ngữ cảnh (`fastify-plugin`), hỗ trợ bộ thẩm định schema trực tiếp qua `fastify-type-provider-zod`. | 21/09/2026 |
| **IDB-03** | [Drizzle ORM Documentation (v0.30+)](https://orm.drizzle.team/docs/overview) | Khai báo schema thuần TypeScript, kiểm tra kiểu tĩnh lúc biên dịch, tự động tham số hóa câu truy vấn (Parameterized queries), hỗ trợ API giao dịch rõ ràng. | 21/09/2026 |
| **IDB-04** | [RFC 7519 (JSON Web Token)](https://datatracker.ietf.org/doc/html/rfc7519) & [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) | Token chứa claims tự ký; việc thu hồi tức thời đối với tài khoản bị khóa bắt buộc phải duy trì kiểm tra trạng thái máy chủ (Server-side Freshness Check) trên mỗi request có bảo vệ theo ADR 0006. | 21/09/2026 |
| **IDB-05** | [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) & [RFC 9106](https://datatracker.ietf.org/doc/html/rfc9106) | Argon2id là thuật toán khuyến nghị hàng đầu. Khuyến nghị tài liệu gốc phân biệt rõ: OWASP đề xuất mức tối thiểu thực tế ($m=19\text{ MiB}, t=2, p=1$); RFC 9106 khuyến nghị cấu hình hạn chế bộ nhớ thứ hai ($m=64\text{ MiB}, t=3, p=4$). Cấu hình tham số sản xuất thuộc diện `NEEDS_BENCHMARK` trên phần cứng đích. | 21/09/2026 |
| **IDB-06** | [Vite Official Guide](https://vitejs.dev/guide/) & [React 19 Documentation](https://react.dev/) | Hỗ trợ đóng gói Static SPA tối ưu, thời gian build nhanh, không có bề mặt tấn công SSR, dễ dàng chia sẻ packages trong monorepo. | 21/09/2026 |
| **IDB-07** | [AWS S3 REST API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html) | Chuẩn giao diện REST API phổ biến cho object storage; hỗ trợ cơ chế Pre-signed URL và tương thích cao giữa MinIO (dev) và AWS S3/Cloudflare R2 (prod). | 21/09/2026 |
| **IDB-08** | [Docker Compose Specification](https://docs.docker.com/compose/compose-file/) | Định nghĩa triển khai đa dịch vụ cô lập mạng qua bridge network nội bộ, phù hợp cho triển khai đơn khối trên VM đám mây. | 21/09/2026 |
| **IDB-09** | [IETF Draft: The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) | Chuẩn hóa header `Idempotency-Key` (UUIDv4); xác lập cơ chế lưu vết và hoàn trả response có cùng key, yêu cầu vòng đời lưu vết phù hợp với chu kỳ retry của client. | 21/09/2026 |
| **IDB-10** | [Expo FileSystem API Documentation](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/) | Cung cấp API kiểm tra dung lượng bộ nhớ khả dụng (`getFreeDiskStorageAsync`) và thao tác xóa tệp an toàn trong Sandbox Filesystem của ứng dụng. | 21/09/2026 |
| **IDB-11** | [PostgreSQL Documentation (v16: Indexes & Transactions)](https://www.postgresql.org/docs/16/indexes-types.html) | Chỉ mục B-tree hỗ trợ tra cứu nhanh khóa chính/khóa duy nhất; cho phép thu hồi toàn bộ phiên của người dùng trong cùng một giao dịch ACID khi thay đổi trạng thái tài khoản. | 21/09/2026 |
