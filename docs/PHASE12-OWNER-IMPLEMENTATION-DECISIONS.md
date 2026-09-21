# Phase 12 Owner Implementation Decisions

Baseline: `9df1b290dd2853afcb9fdcaacb299d02c28c1f8a`
Ngày lập: 21/09/2026
Thẩm quyền: Quyết định Ràng buộc của Chủ quản Hệ thống (Authoritative Owner Decisions)

---

## 1. Bảng Quyết Định Đợt 1 — Nền Tảng Kỹ Thuật Wave 2 (Decision Batch 1 — Wave 2 Foundation)

Chủ quản đã xem xét và đưa ra quyết định ràng buộc cấp triển khai cho 3 quyết định kỹ thuật cốt lõi chặn đợt Wave 2 (`apps/api` runtime & persistence):

| ID | Quyết Định Chủ Quản (Owner Decision) | Phương Án Chấp Thuận (Accepted Direction) | Trạng Thái (Status) |
| :---: | :---: | :--- | :---: |
| **IDB-01** | **APPROVE** | **PostgreSQL**; Điểm khởi đầu triển khai (Initial implementation baseline): **PostgreSQL 18.x**; Môi trường sản xuất (Production) bắt buộc sử dụng một bản phát hành chính thức được hỗ trợ ổn định (supported stable major) kết hợp bản vá phụ hiện hành (current supported minor). Việc nâng cấp major trong tương lai không cấu thành thay đổi kiến trúc. | `OWNER_APPROVED` |
| **IDB-02** | **APPROVE** | **Fastify 5.x**; Vận hành trên Node.js runtime được kho mã nguồn hỗ trợ. Fastify chỉ đóng vai trò hạ tầng vận hành HTTP/Runtime, không phải thẩm quyền hợp đồng nghiệp vụ. `@novyx/contracts` và Zod schemas duy trì vị thế ranh giới hợp đồng mạng duy nhất. | `OWNER_APPROVED` |
| **IDB-03** | **APPROVE** | **Drizzle ORM + drizzle-kit**; Drizzle đảm nhiệm biểu diễn lưu trữ và truy cập dữ liệu định kiểu; `drizzle-kit` quản lý công cụ migration. Cho phép cơ chế thoát SQL thuần (raw SQL escape hatch) cho các yêu cầu hạ tầng CSDL chuyên biệt (phân tách quyền CSDL, chỉ mục, ràng buộc toàn vẹn). | `OWNER_APPROVED` |

---

## 2. Chi Tiết Phạm Vi Chấp Thuận Từng Quyết Định (Accepted Decision Scopes)

### 2.1. IDB-01 — Hệ Quản Trị Cơ Sở Dữ Liệu Quan Hệ: PostgreSQL (`OWNER_APPROVED`)

- **Lựa chọn Động cơ CSDL:** PostgreSQL là hệ quản trị CSDL quan hệ chính thức cho `apps/api` (thỏa mãn Relational Database Family theo ADR 0013).
- **Mốc Phiên bản Triển khai (Baseline):**
  - Điểm khởi đầu triển khai ban đầu (Initial implementation baseline): **PostgreSQL 18.x**.
  - Yêu cầu vận hành môi trường sản xuất: Phải sử dụng một phiên bản PostgreSQL major được hỗ trợ ổn định kết hợp phiên bản minor hiện hành còn được bảo trì bảo mật.
  - "PostgreSQL 18.x" là mốc triển khai kỹ thuật ban đầu, **tuyệt đối không bị khóa thành bất biến kiến trúc vĩnh cửu** (not a permanent architecture invariant). Các nâng cấp major định kỳ trong tương lai không đòi hỏi phải ban hành ADR mới chỉ vì thay đổi số hiệu phiên bản.
- **Sử dụng Cơ chế Chuyên biệt của PostgreSQL:** Cho phép kế hoạch triển khai sử dụng cú pháp và cơ chế chuyên biệt của PostgreSQL (như `GRANT`, `REVOKE`, database roles, table privileges, partial indexes, GIN index trên JSONB, row locking `FOR UPDATE` phục vụ OCC) khi có cơ sở kỹ thuật rõ ràng.
- **Phân định Ranh giới Khóa Hạ tầng:** Không khóa cứng nhà cung cấp dịch vụ đám mây (Cloud Vendor), dịch vụ CSDL quản lý (Managed DB Provider), image container cụ thể, hay cấu trúc liên mạng hạ tầng.
- **Tính Di động (Portability):** Khả năng chuyển đổi qua lại giữa các engine RDBMS khác nhau không phải là yêu cầu của giai đoạn MVP.

### 2.2. IDB-02 — Web Framework Máy Chủ: Fastify 5.x (`OWNER_APPROVED`)

- **HTTP Runtime Framework:** `apps/api` sử dụng Fastify 5.x trên môi trường Node.js `>= 22.13.0`.
- **Phạm vi Trách nhiệm:** Fastify đảm nhận: định tuyến (routing), vòng đời request/response, middleware tầng vận chuyển (transport middleware), xử lý và ánh xạ lỗi HTTP chuẩn hóa (error mapping), và các adapters mạng.
- **Thẩm quyền Hợp đồng:**
  - `@novyx/contracts` và các Zod schemas là thẩm quyền hợp đồng duy nhất và tối cao tại ranh giới mạng.
  - Không sử dụng Fastify JSON Schema thuần để thay thế hoặc làm nguồn chân lý hợp đồng thay cho Zod `@novyx/contracts`.
  - Tích hợp Zod qua Type Provider (`fastify-type-provider-zod`) ở tầng transport adapter.
- **Bảo toàn Kiến trúc Sạch (Clean Architecture Invariant):**
  - Logic nghiệp vụ miền (Domain Core) và tầng ứng dụng (Application Use Cases) tuyệt đối độc lập với Fastify.
  - Cấm tầng Domain và Application nhận trực tiếp hay phụ thuộc vào các đối tượng `FastifyRequest`, `FastifyReply`.

### 2.3. IDB-03 — Công Cụ Truy Cập Dữ Liệu & ORM: Drizzle ORM + drizzle-kit (`OWNER_APPROVED`)

- **Phạm vi Trách nhiệm:**
  - Drizzle ORM quản lý việc biểu diễn dữ liệu quan hệ (relational persistence representation) và truy vấn định kiểu an toàn (typed data access).
  - `drizzle-kit` đóng vai trò công cụ tạo và quản lý migration lược đồ khi phù hợp.
- **Thẩm quyền Nghiệp vụ:**
  - Schema bảng Drizzle (Drizzle Table Schemas) chỉ là biểu diễn lưu trữ hạ tầng, **không thay thế** `@novyx/contracts`, không thay thế Domain Aggregate Models, và không thay thế Business Commands.
  - Tầng Domain và Application tuyệt đối không phụ thuộc vào Drizzle (`Domain -> Drizzle` bị CẤM).
  - Chỉ các Repository Adapters tại tầng Infrastructure mới được phép import Drizzle.
- **Cơ chế Thoát SQL Thuần (Raw SQL Escape Hatch):**
  - Được phép sử dụng script SQL thuần hoặc migration SQL đặc thù của PostgreSQL khi cần thiết để thực hiện các yêu cầu hạ tầng CSDL mà ORM API không hỗ trợ đầy đủ:
    - Phân tách quyền CSDL kiểm toán (`REVOKE UPDATE, DELETE, TRUNCATE ON audit_events FROM runtime_user`).
    - Tạo partial indexes, GIN index trên JSONB.
    - Cấu hình ràng buộc toàn vẹn dữ liệu (table constraints) hoặc cơ chế khóa hàng.
- **Chính sách Di trú An toàn Dữ liệu:**
  - Mọi migration (sinh bởi Drizzle hoặc viết tay) đều bắt buộc phải tuân thủ chính sách di trú an toàn dữ liệu: phải có Chiến lược Khôi phục / Phục hồi (Rollback / Recovery Strategy) được tài liệu hóa rõ ràng dựa trên bản chất thay đổi (không ép buộc `down.sql` hình thức nếu gây phá hủy dữ liệu).

---

---

## 3. Bảng Quyết Định Đợt 2 — Nền Tảng IAM & An Ninh Wave 3 (Decision Batch 2 — IAM & Security Foundation)

Chủ quản đã xem xét và đưa ra quyết định ràng buộc cấp triển khai cho 3 quyết định kỹ thuật cốt lõi chặn đợt Wave 3 (`apps/api` IAM, Auth Gate & Session Freshness):

| ID | Quyết Định Chủ Quản (Owner Decision) | Phương Án Chấp Thuận (Accepted Direction) | Trạng Thái (Status) |
| :---: | :---: | :--- | :---: |
| **IDB-04** | **APPROVE** | **Opaque Bearer Access Credential + Rotating Opaque Refresh Credential**; Cả Access Credential và Refresh Credential đều là chuỗi ngẫu nhiên mờ đục (Opaque tokens) sinh bởi CSPRNG. Máy chủ tuyệt đối không lưu trữ bản rõ (plaintext) của access token; chỉ lưu bản băm an toàn phục vụ tra cứu. Mọi request có bảo vệ bắt buộc kiểm tra tính tươi tài khoản (`AccountStatus == ACTIVE`, `authVersion`). Xoay vòng refresh token khi sử dụng và phát hiện tái sử dụng (reuse detection) để vô hiệu hóa phiên/token family bị ảnh hưởng. Yêu cầu TLS cho toàn bộ luồng truyền tải. | `OWNER_APPROVED` |
| **IDB-05** | **APPROVE** | **Argon2id**; Thuật toán băm mật khẩu chính thức là Argon2id với thư viện được bảo trì trên Node.js runtime, sử dụng muối ngẫu nhiên duy nhất cho từng mật khẩu. Tham số chi phí sản xuất (production work factors) bắt buộc phải được đo đạc (benchmark) trên phần cứng máy chủ đích, không bị đóng băng vĩnh viễn thành hằng số kiến trúc. Hỗ trợ cơ chế băm lại khi đăng nhập thành công (`rehash-on-successful-login`). | `OWNER_APPROVED` |
| **IDB-11** | **APPROVE** | **PostgreSQL-backed Session Repository cho MVP**; Trạng thái phiên và cờ thu hồi được lưu trữ bền vững trong CSDL PostgreSQL qua cổng trừu tượng `SessionRepository Port` theo Clean Architecture. Không đòi hỏi Redis cho MVP; việc chuyển đổi hoặc bổ sung cache chỉ được xem xét khi có bằng chứng đo đạc thực nghiệm. Hỗ trợ thu hồi phiên nguyên tử trong giao dịch (transactional revocation). | `OWNER_APPROVED` |

---

## 4. Chi Tiết Phạm Vi Chấp Thuận Đợt 2 (Accepted Scopes — Batch 2)

### 4.1. IDB-04 — Cấu Trúc & Định Dạng Thông Tin Xác Thực: Opaque Tokens (`OWNER_APPROVED`)

- **Định dạng Thông tin Xác thực (Accepted Credential Representation):**
  - Access Credential là **Opaque Bearer Access Credential**.
  - Refresh Credential là **Rotating Opaque Refresh Credential**.
  - Toàn bộ thông tin xác thực được sinh bằng bộ sinh số ngẫu nhiên an toàn mật mã học (Cryptographically Secure Pseudo-Random Number Generator - CSPRNG) với độ dài entropy bảo mật cao.
- **Ranh giới Lưu trữ Phía Máy Chủ (Server-Side Storage Boundary):**
  - Máy chủ **TUYỆT ĐỐI KHÔNG lưu trữ bản rõ (plaintext)** của bearer access credential.
  - Phía máy chủ chỉ lưu trữ bản băm an toàn hoặc định danh dẫn xuất an toàn (`hash(token)` / secure token lookup hash) phục vụ cho việc tra cứu phiên và xác thực thu hồi.
  - Hàm băm dùng cho chuỗi token ngẫu nhiên là chi tiết triển khai tầng Infrastructure của Wave 3, bảo đảm **không đồng nhất token ngẫu nhiên với mật khẩu người dùng** (tuyệt đối không áp đặt chi phí tính toán của Argon2id lên việc băm chuỗi token ngẫu nhiên).
- **Thời Gian Hiệu Lực Không Bị Đóng Băng Cố Định (Unfrozen TTL Baseline):**
  - Access Credential có thời gian sống ngắn (short-lived); Refresh Credential có thời gian sống dài hơn.
  - Các mốc thời gian (như Access TTL 15 phút, Refresh TTL 30 ngày) chỉ đóng vai trò mốc cơ sở ứng viên (`CANDIDATE_BASELINE`) hoặc cấu hình triển khai (`DEPLOYMENT_CONFIGURATION`), **tuyệt đối không bị đóng băng thành hằng số kiến trúc bất biến** tại quyết định này; thời hạn chính thức sẽ được căn chỉnh thông qua thẩm định an ninh và kiểm thử runtime.
- **Thẩm Quyền Tối Cao Của Máy Chủ & Kiểm Tra Tính Tươi (Server Authority & Freshness):**
  - Quyết định sử dụng Opaque token hoàn toàn nhất quán với ADR 0006: Mọi request có bảo vệ (Read, Mutate, Decide, Administer) đều bắt buộc phải xác lập phiên hợp lệ và kiểm tra tính tươi tài khoản trước khi xử lý nghiệp vụ:
    - `AccountStatus != ACTIVE` $\rightarrow$ **TỪ CHỐI (DENY)** tức thì.
    - `authVersion` hoặc `sessionVersion` bị lệch/cũ $\rightarrow$ **TỪ CHỐI (DENY)** tức thì.
    - Thay đổi vai trò (role change) có hiệu lực lập tức vô hiệu hóa các phiên mang thẩm quyền cũ.
- **Xoay Vòng Refresh Token & Phát Hiện Tái Sử Dụng (Rotation & Reuse Detection):**
  - Mỗi lần làm mới phiên thành công (successful refresh), credential làm mới cũ sẽ bị vô hiệu hóa ngay lập tức và một cặp credential thay thế mới được cấp phát.
  - Máy chủ duy trì đủ metadata để phát hiện hành vi tái sử dụng (replay / reuse) của refresh credential đã xoay vòng.
  - Khi phát hiện hành vi tái sử dụng, hệ thống lập tức vô hiệu hóa phiên làm việc hoặc họ token (token family) bị ảnh hưởng theo chính sách IAM (phân định rõ bán kính ảnh hưởng - blast radius, không tự ý tuyên bố thu hồi toàn bộ phiên toàn cầu nếu không có yêu cầu an ninh riêng).
- **An Ninh Kênh Truyền:** Yêu cầu bắt buộc giao thức mã hóa TLS trên toàn bộ các kênh truyền thông tin xác thực.
- **Loại Bỏ Hoàn Toàn Ngôn Ngữ Khóa Công Nghệ Kế Hoạch:** Kế hoạch triển khai chính thức loại bỏ hoàn toàn các phương án JWT, JWS, JWE, JWKS, RS256, ES256, HS256 khỏi định hướng chấp thuận.

### 4.2. IDB-05 — Thuật Toán Băm Mật Khẩu: Argon2id (`OWNER_APPROVED`)

- **Thuật toán Băm Mật khẩu:** Argon2id là thuật toán băm mật khẩu chính thức của hệ thống.
- **Thư viện Triển khai:** Sử dụng một thư viện triển khai được duy trì bảo trì và tối ưu cho môi trường Node.js runtime. Việc chọn thư viện cụ thể (như `@node-rs/argon2` hoặc tương đương) là chi tiết triển khai thuộc phạm vi Wave 3, không bị khóa cứng thành bất biến của Chủ quản.
- **Muối Ngẫu Nhiên (Unique Salt):** Mỗi mật khẩu bắt buộc phải sử dụng một muối ngẫu nhiên duy nhất với độ dài bảo mật tiêu chuẩn.
- **Tham Số Chi Phí Bắt Buộc Đo Đạc Thực Nghiệm (Benchmarked Production Work Factors):**
  - Tham số chi phí cho môi trường sản xuất bắt buộc phải được đo đạc (benchmark) trên môi trường phần cứng máy chủ đích (`NEEDS_BENCHMARK`).
  - Các tham số sản xuất cụ thể là chính sách cấu hình an ninh (`SECURITY_CONFIGURATION`), **không bị đóng băng vĩnh viễn thành hằng số kiến trúc bất biến**.
  - Bảo lưu phân biệt chuẩn xác giữa hai tài liệu tham chiếu gốc:
    - *OWASP Password Storage Cheat Sheet (Mức tối thiểu thực tế):* $m = 19\text{ MiB}$, $t = 2$, $p = 1$.
    - *RFC 9106 (Khuyến nghị thứ hai cho môi trường giới hạn bộ nhớ):* $m = 64\text{ MiB}$, $t = 3$, $p = 4$.
    - Tuyệt đối không tự ý gộp lẫn tham số thành $m = 64\text{ MiB}, t = 3, p = 1$.
- **Chính Sách Tự Động Băm Lại (Rehash-on-Successful-Login):**
  - Hỗ trợ cơ chế kiểm tra tham số băm của mật khẩu đã lưu khi người dùng đăng nhập thành công.
  - Nếu tham số lưu trữ yếu hơn chính sách cấu hình hiện hành, hệ thống thực hiện băm lại mật khẩu với chính sách mới và cập nhật bản băm an toàn vào CSDL ngay trong luồng đăng nhập (chỉ thực hiện khi có mật khẩu bản rõ hợp lệ trong phiên đăng nhập).

### 4.3. IDB-11 — Hạ Tầng Quản Lý Phiên: PostgreSQL Session Repository Cho MVP (`OWNER_APPROVED`)

- **Lưu Trữ Phiên Bền Vững Trong CSDL Quan Hệ:** Trạng thái phiên và cờ thu hồi tức thời được lưu trữ trực tiếp trong CSDL PostgreSQL cho giai đoạn MVP, tận dụng cơ chế giao dịch ACID và chỉ mục B-tree.
- **Không Đòi Hỏi Redis Trong MVP:** Redis không phải là yêu cầu bắt buộc của MVP; việc đưa cache in-memory vào hệ thống chỉ được xem xét khi có số liệu đo đạc tải thực tế chứng minh sự cần thiết.
- **Tuân Thủ Ranh Giới Clean Architecture:**
  - Logic nghiệp vụ IAM và tầng ứng dụng (Application Use Cases) chỉ giao tiếp với cổng trừu tượng `SessionRepository Port`.
  - Tầng hạ tầng (Infrastructure) triển khai `PostgreSQLSessionRepository` adapter thông qua Drizzle ORM.
  - Tuyệt đối cấm tầng Domain/Application phụ thuộc trực tiếp vào Drizzle hay PostgreSQL (`Domain -> Drizzle` và `Domain -> PostgreSQL` bị CẤM).
- **Mô Hình Dữ Liệu Khái Niệm (Conceptual Session State):**
  - Dữ liệu phiên ở mức khái niệm có thể bao gồm: `sessionId`, `tokenFamilyId`, `userId`, dữ liệu tra cứu access token băm, refresh token băm, `authVersion`/`sessionVersion` tại thời điểm cấp, `expiresAt`, `revokedAt`, metadata xoay vòng/thay thế, `createdAt`, và `lastUsedAt` khi có lý do kỹ thuật.
  - Tên cột, kiểu dữ liệu SQL, chỉ mục và ràng buộc khóa ngoại cụ thể không bị đóng băng tại quyết định này, mà thuộc phạm vi thiết kế chi tiết của Wave 3.
- **Thu Hồi Nguyên Tử Trong Giao Dịch (Transactional Revocation):**
  - Các thao tác thay đổi trạng thái tài khoản (`SuspendAccount`, `DisableAccount`, `AssignRole`) cập nhật trạng thái định danh và vô hiệu hóa các phiên/token liên quan trong cùng một database transaction.
  - **Bảo toàn tính bất biến nghiệp vụ:** Việc thay đổi trạng thái tài khoản hoặc vai trò trong IAM **tuyệt đối KHÔNG trực tiếp làm đột biến `TaskStatus`** của các tác vụ hiện trường.
  - **Không phát sinh lệnh nghiệp vụ tự tạo:** Tuyệt đối không tạo ra lệnh nghiệp vụ con người mang tên `RevokeSession`; việc vô hiệu hóa phiên làm việc thuần túy là hệ quả kỹ thuật của việc đăng xuất hoặc quản trị tài khoản.

---

---

## 5. Bảng Quyết Định Đợt 3 — Lưu Trữ Bằng Chứng & Web Quản Trị Admin (Decision Batch 3 — Object Storage & Admin Web)

Chủ quản đã xem xét và đưa ra quyết định ràng buộc cấp triển khai cho 2 quyết định kỹ thuật cốt lõi chặn đợt Wave 4 (Lưu trữ ảnh bằng chứng tác nghiệp) và Wave 6 (Cổng web quản trị Admin):

| ID | Quyết Định Chủ Quản (Owner Decision) | Phương Án Chấp Thuận (Accepted Direction) | Trạng Thái (Status) |
| :---: | :---: | :--- | :---: |
| **IDB-07** | **APPROVE** | **S3-Compatible Object Storage Port** với phương thức phân phối ưu tiên miễn phí (Free-first / Zero-cost demo delivery). Ảnh bằng chứng nhị phân được lưu trữ bên ngoài PostgreSQL thông qua cổng trừu tượng `IObjectStoragePort`. Bucket mặc định private; máy chủ phân quyền truy cập và cấp presigned URLs tạm thời. Cơ sở dữ liệu chỉ lưu trữ định danh bền vững (object key / storage reference), mã băm nội dung (checksum) và metadata. Ứng viên phân phối demo ưu tiên hiện tại là Cloudflare R2 Free Tier (kèm phương án dự phòng Railway Bucket hoặc MinIO cục bộ), nhưng không khóa cứng nhà cung cấp vào kiến trúc. | `OWNER_APPROVED` |
| **IDB-06** | **APPROVE** | **React 19 SPA + Vite** cho workspace `apps/admin-web`; Kiến trúc Single Page Application thuần túy tiêu thụ `@novyx/contracts` và `@novyx/ui` (phần tương thích web). Dành riêng cho Platform Administrator thực thi các năng lực quản trị (CAP-ADM-01..09) và tra cứu lịch sử (OP-22), tuyệt đối không can thiệp tác vụ vận hành hiện trường. Giao diện SPA mang tính định hướng (advisory), máy chủ là thẩm quyền an ninh tối cao. Ứng viên phân phối demo ưu tiên là Render Static Site nhưng không khóa cứng hạ tầng. | `OWNER_APPROVED` |

---

## 6. Ràng Buộc Phân Phối Chi Phí Bằng Không / Ưu Tiên Gói Miễn Phí (Owner Constraint COST-01 — Zero-Cost / Free-Tier-First Delivery)

Chủ quản xác lập ràng buộc điều hành ràng buộc về chi phí trong giai đoạn MVP / Demo:

- **Nguyên tắc cốt lõi (COST-01):** Ngân sách hạ tầng hiện tại là **$0 hoặc xấp xỉ $0**. Do đó, lộ trình triển khai phải ưu tiên tối đa các gói miễn phí (Free Tier) hoặc các chương trình dùng thử miễn phí (Free Trial ~1 tháng) có sẵn của các nhà cung cấp dịch vụ đám mây uy tín; tránh bắt buộc sử dụng hạ tầng trả phí khi đã có phương án thay thế miễn phí khả thi về mặt kỹ thuật.
- **Tính độc lập với Kiến trúc (Architecture Neutrality):** Ràng buộc chi phí chỉ định hướng việc lựa chọn nhà cung cấp dịch vụ hạ tầng trong giai đoạn thử nghiệm/demo, **tuyệt đối KHÔNG làm thay đổi thẩm quyền kiến trúc hoặc ngữ nghĩa nghiệp vụ chuẩn tắc**:
  - Không vì giới hạn dung lượng của gói object storage miễn phí mà đưa ảnh nhị phân quay trở lại lưu trữ trong PostgreSQL.
  - Không vì backend miễn phí có thời gian khởi động nguội (cold start / sleep) mà cắt bỏ các bước xác thực tính tươi tài khoản hoặc hạ tầng backend có thẩm quyền.
  - Không vì tài khoản dùng thử hết hạn mà tạo ra nguồn chân lý nghiệp vụ kép (dual business truth).
- **Quy trình An toàn Khi Hết Hạn Dùng Thử (Trial Expiration Safety):** Kế hoạch triển khai hạ tầng phải dự phòng các quy trình an toàn: quy trình sao lưu/xuất dữ liệu (export/backup), quy trình xoay vòng thông tin xác thực (credential rotation), quy trình chuyển đổi nhà cung cấp (provider migration), và phân tách cấu hình qua biến môi trường. Việc hết hạn gói dùng thử không được phép làm mất mát dữ liệu nghiệp vụ, nhật ký kiểm toán, liên kết bằng chứng hoặc tài khoản người dùng.
- **Gợi Ý Cấu Hình Phân Phối Demo Phi Ràng Buộc (Non-Binding Zero-Cost Demo Guidance):**
  - `apps/api`: Web Service gói miễn phí / dùng thử (ví dụ: Render Free / Web Service Trial).
  - PostgreSQL: CSDL PostgreSQL miễn phí / dùng thử (ví dụ: Render PostgreSQL Free / Trial).
  - `apps/admin-web`: Dịch vụ lưu trữ web tĩnh miễn phí (ví dụ: Render Static Site Free Tier).
  - Lưu trữ Bằng chứng: Object Storage gói miễn phí (ví dụ: Cloudflare R2 Free Tier; [THÔNG TIN NHÀ CUNG CẤP CÓ TÍNH THỜI ĐIỂM — KIỂM TRA LẠI TRƯỚC KHI TRIỂN KHAI / TIME-SENSITIVE PROVIDER INFORMATION — CHECK AGAIN BEFORE DEPLOYMENT, Checked: 21/09/2026]).
  - Hạ tầng dự phòng tạm thời: Gói dùng thử Railway khi có credit trải nghiệm.
  - *Lưu ý quan trọng:* Gợi ý trên là định hướng phân phối thực tế phi ràng buộc, **tuyệt đối KHÔNG giải quyết hay khóa cứng quyết định hạ tầng tổng thể IDB-08**.

---

## 7. Chi Tiết Phạm Vi Chấp Thuận Đợt 3 (Accepted Scopes — Batch 3)

### 7.1. IDB-07 — Hạ Tầng Lưu Trữ Bằng Chứng Tệp Nhị Phân: S3-Compatible Port (`OWNER_APPROVED`)

- **Kiến trúc Lưu trữ Phân tách:** Tệp ảnh bằng chứng nhị phân (Binary Proof Photos) được lưu trữ hoàn toàn bên ngoài cơ sở dữ liệu quan hệ PostgreSQL thông qua cổng giao tiếp trừu tượng `IObjectStoragePort` tại tầng Infrastructure.
- **Thao tác Chuẩn S3 (S3-Compatible Operations):** Adapter hạ tầng sử dụng các thao tác tương thích chuẩn S3 API (PutObject, GetObject, DeleteObject, HeadObject, CreatePresignedUrl). Tầng Domain và Application hoàn toàn trung lập với nhà cung cấp (provider-neutral).
- **Quy Tắc Truy Cập Đối Tượng (Object Access Rules):**
  1. Toàn bộ bucket / container lưu trữ đều được cấu hình ở chế độ **riêng tư mặc định (private by default)**.
  2. Máy chủ backend kiểm soát hoàn toàn việc sinh khóa đối tượng (object-key generation) theo cấu trúc định danh chuẩn hóa.
  3. Client không nhận được URL công khai vĩnh viễn (public URLs) làm định danh bằng chứng chuẩn tắc.
  4. Presigned URLs chỉ là hiện vật vận chuyển / truy cập tạm thời (temporary transport/access artifacts) có thời hạn sống hữu hạn do máy chủ ký cấp phát sau khi đã thẩm định quyền truy cập.
  5. Cơ sở dữ liệu quan hệ chỉ lưu trữ biểu diễn bằng chứng bền vững ở mức khái niệm gồm:
     - `storageRef` / `objectKey` (khóa lưu trữ định danh bền vững)
     - `contentHash` / `checksum` (mã băm toàn vẹn nội dung)
     - `contentType` (kiểu MIME, ví dụ `image/jpeg`)
     - `size` (kích thước tệp tính bằng bytes)
     - `evidence ownership` / `provenance` (người chụp, tọa độ GPS, thời điểm ghi nhận)
     - Các metadata bằng chứng khác theo ngữ nghĩa nghiệp vụ đóng băng.
  6. Lược đồ bảng SQL cụ thể cho bảng bằng chứng không bị đóng băng tại quyết định này, mà thuộc phạm vi thiết kế chi tiết của Wave 4.
- **Phân Biệt An Toàn Tiếp Nhận Tải Lên (Upload Acceptance Safety Invariant):**
  - Kế hoạch triển khai phân biệt rạch ròi giữa **Tải Lên Tệp Thành Công (Object Upload Success)** và **Tiếp Nhận Bằng Chứng Nghiệp Vụ (Business Evidence Acceptance)**.
  - Việc tải thành công một tệp nhị phân lên object storage **tuyệt đối KHÔNG tự động**:
    - Làm chuyển đổi trạng thái tác vụ (`TaskStatus`).
    - Đánh dấu bằng chứng là hợp lệ (`VALID`).
    - Hoàn tất lệnh nộp bằng chứng (`SubmitEvidence`).
    - Cho phép bước thẩm định duyệt (`ReviewTask`).
  - Tầng Máy chủ / Application Use Cases bắt buộc phải thực hiện thẩm định toàn diện: quyền sở hữu tài nguyên, trạng thái tác vụ hiện hành, quy tắc hồ sơ bằng chứng (ProofProfile), mã băm toàn vẹn (checksum) và các tiền điều kiện nghiệp vụ trước khi ghi nhận đột biến nghiệp vụ.
- **Ranh Giới Mã Nguồn & Nhà Cung Cấp (Provider Boundary):**
  - Tuyệt đối không đưa tên bucket R2 cụ thể, Account IDs, mô hình domain đặc thù Cloudflare, hay SDK types của nhà cung cấp vào Domain, Application, hoặc `@novyx/contracts`.
  - Mã nguồn hoặc SDK chuyên biệt của nhà cung cấp (ví dụ `@aws-sdk/client-s3`) chỉ được phép tồn tại duy nhất tại thư mục Adapter thuộc tầng Infrastructure của `apps/api`.
  - Cloudflare R2, AWS S3, Railway Bucket, MinIO **không phải là bất biến kiến trúc vĩnh cửu**; bất biến duy nhất được phê duyệt là **Cổng lưu trữ tương thích chuẩn S3 (S3-Compatible Object Storage Port)**.
  - MinIO chỉ là công cụ hỗ trợ môi trường phát triển cục bộ và CI, không bắt buộc vận hành trong môi trường sản xuất.

### 7.2. IDB-06 — Nền Tảng & Bộ Công Cụ Web Quản Trị Admin: React 19 SPA + Vite (`OWNER_APPROVED`)

- **Không Gian Làm Việc Chấp Thuận:** Khởi tạo workspace `apps/admin-web` theo kiến trúc Single Page Application (SPA) bằng **React 19**, **TypeScript**, và công cụ build **Vite**.
- **Tiêu Thụ Gói Dùng Chung Nội Bộ:**
  - Tiêu thụ `@novyx/contracts` làm thẩm quyền hợp đồng định kiểu duy nhất.
  - Tiêu thụ `@novyx/ui` cho các thành phần token màu sắc và typography thực sự tương thích với web (không ép buộc các thành phần đặc thù React Native).
- **Chính Sách Phiên Bản Linh Hoạt (Version Policy):**
  - Mốc triển khai ban đầu tuân thủ phiên bản React 19.x và Vite major tương thích với môi trường Node runtime hiện tại của repo.
  - Không đóng băng vĩnh viễn phiên bản minor/patch cụ thể; các đợt cập nhật bảo trì thông thường không đòi hỏi quyết định kiến trúc mới nếu không làm thay đổi bản chất kiến trúc SPA.
- **Phạm Vi Thẩm Quyền Quản Trị Chuẩn Tắc (Admin Authority):**
  - `apps/admin-web` là bề mặt giao diện chuyên biệt dành riêng cho Platform Administrator, chỉ phục vụ 9 năng lực quản trị chuẩn tắc:
    - `CAP-ADM-01`: Cấp phát người dùng (`ProvisionUser`)
    - `CAP-ADM-02`: Phân quyền vai trò (`AssignRole`)
    - `CAP-ADM-03`: Vòng đời tài khoản (`SuspendAccount`, `ActivateAccount`, `DisableAccount`)
    - `CAP-ADM-04`: Mở khóa & Đặt lại tài khoản (`UnlockAccount`, `ResetCredentialSetup`)
    - `CAP-ADM-05`: Tra cứu nhật ký kiểm toán bất biến (`ViewAuditLog`)
    - `CAP-ADM-06`: Quản trị danh mục cây chuẩn (`CreateTree`, `UpdateTree`, `DecommissionTree`)
    - `CAP-ADM-07`: Quản trị danh mục loại tác vụ (`CreateTaskType`, `UpdateTaskType`)
    - `CAP-ADM-08`: Quản trị chính sách hồ sơ bằng chứng (`ConfigureProofProfile`)
    - `CAP-ADM-09`: Quản trị biểu mẫu checklist (`CreateChecklistTemplate`, `UpdateChecklistTemplate`)
    - Năng lực đọc kiểm toán: `OP-22` Tra cứu lịch sử chăm sóc cây toàn hệ thống (`ViewCareHistory` chỉ đọc).
  - **Cấm Tuyệt Đối Can Thiệp Tác Vụ Hiện Trường:** `apps/admin-web` tuyệt đối KHÔNG có quyền hạn hay giao diện thực thi các tác vụ vận hành thông thường (`CreateTask`, `AssignTask`, `StartTask`, `SubmitEvidence`, `ApproveTask`, `RequestRework`).
- **Giao Diện SPA Không Phải Là Ranh Giới An Ninh (SPA is NOT a Security Boundary):**
  - Việc ẩn nút bấm, bảo vệ route bằng React router guard, hay kiểm tra điều kiện vai trò ở client chỉ mang tính chất định hướng giao diện (advisory).
  - An ninh bắt buộc tuân thủ nguyên tắc phòng vệ 3 tầng: Client advisory $\rightarrow$ Server request gate (Tier 2 Gate) $\rightarrow$ Application/Domain authoritative eligibility. Mọi hành động nhạy cảm đều phải được máy chủ thẩm định quyền hạn tối cao.
- **Ranh Giới Thông Tin Xác Thực Trình Duyệt (Browser Credential Boundary):**
  - Việc chấp thuận Vite + React 19 không đồng nghĩa với việc tự ý quyết định nơi lưu trữ credential trên trình duyệt.
  - Tuyệt đối không tự ý ngầm chọn `localStorage`, `sessionStorage`, hay `IndexedDB` cho refresh token mà phải tuân thủ nghiêm ngặt ADR 0006, IDB-04 (Opaque Credentials) và IDB-11, được chốt cụ thể trong thiết kế an ninh của Wave 6.
- **Phân Phối Ưu Tiên Miễn Phí (Free-First Static Delivery):**
  - Do `apps/admin-web` là Static SPA (chỉ gồm HTML/JS/CSS tĩnh sau khi build), ứng viên phân phối demo tối ưu chi phí là dịch vụ Static Site miễn phí (như Render Static Site, Cloudflare Pages, hoặc tương đương). Tuy nhiên, tên nhà cung cấp không phải là bất biến kiến trúc.

---

## 8. Tổng Hợp Trạng Thái Toàn Bộ Quyết Định Triển Khai (Phase 12B Status Summary)

| Trạng Thái | Số Lượng | Danh Sách Mã Quyết Định | Ghi Chú |
| :--- | :---: | :--- | :--- |
| **`OWNER_APPROVED`** | **8** | **IDB-01, IDB-02, IDB-03, IDB-04, IDB-05, IDB-06, IDB-07, IDB-11** | Đã được Chủ quản phê duyệt chính thức qua 3 đợt. Toàn bộ các quyết định chặn đợt 1 đến 6 đã được giải tỏa dứt điểm. |
| **`DEFERRED_WITH_BOUNDARY`** | **3** | **IDB-08, IDB-09, IDB-10** | Chủ quản chủ động hoãn có ranh giới bảo vệ chặt chẽ; không chặn kiến trúc mã nguồn hay việc khởi động Waves 0–6. |
| **`OPEN`** | **0** | *(Không còn quyết định nào chưa định đoạt)* | Toàn bộ 11 quyết định đã được phân loại dứt điểm. |
| **`REJECTED`** | **0** | *(Không có)* | |

---

## 9. Tuyên Bố Giới Hạn Thẩm Quyền Triển Khai (Execution Boundary Statement)

> [!IMPORTANT]
> **Tuyên bố Ranh giới Đóng băng & Ủy quyền Thực thi:**
> 1. **Phase 12B chính thức ĐÓNG BĂNG HOÀN TOÀN (FULLY FROZEN).** Không còn bất kỳ quyết định mở (`OPEN`) nào chưa được phân loại.
> 2. **Ủy Quyền Từng Bước (Wave-Gated Execution):** Việc đóng băng Phase 12B và xác nhận "Sẵn sàng Thực thi" (Execution Ready) **TUYỆT ĐỐI KHÔNG ĐỒNG NGHĨA VỚI VIỆC CHO PHÉP TRIỂN KHAI ĐỒNG THỜI TOÀN BỘ CÁC WAVES**.
> 3. **Chỉ Duy Nhất Wave 0 Đủ Điều Kiện Kích Hoạt Tiếp Theo:** Sau khi Phase 12B đóng băng, chỉ duy nhất **Phase 13 / Implementation Wave 0 (Thiết lập Nền tảng Kiểm thử & Quản trị Thực thi)** trở nên đủ điều kiện để kích hoạt theo lời nhắc chuyên biệt tiếp theo.
> 4. **Wave 1 Bắt Buộc Chờ Wave 0:** Wave 1 (`@novyx/contracts`) chỉ được phép bắt đầu sau khi Wave 0 vượt qua cổng kiểm soát đầu ra (Exit Gate) một cách độc lập và có chứng cứ thực nghiệm.
> 5. **Cấm Tuyệt Đối Triển Khai Mã Nguồn Trong Phase 12B:** Không có bất kỳ mã nguồn ứng dụng nào (`apps/**`), gói dùng chung (`packages/**`), kịch bản (`scripts/**`), hoặc phụ thuộc runtime (`package.json`) nào được phép khởi tạo, cài đặt hay thay đổi trong phạm vi đóng băng Phase 12B này.

---

## 10. Ý Đồ Chủ Quản Về Việc Hoãn Quyết Định (Owner Intent on Deferrals)

Chủ quản xác nhận việc hoãn 3 quyết định (`IDB-08`, `IDB-09`, `IDB-10`) là **chủ động và có tính toán kỹ thuật (intentional deferral)**:
- Cả 3 quyết định này hoàn toàn **KHÔNG CHẶN** kiến trúc mã nguồn của hệ thống và **KHÔNG CHẶN** việc khởi động các đợt triển khai từ Wave 0 đến Wave 6.
- Việc phân loại chuyển từ `OPEN` sang `DEFERRED_WITH_BOUNDARY` xác lập rõ ràng rằng: không còn khoảng trống nhận thức nào cản trở việc triển khai mã nguồn; các quyết định này được bảo vệ bằng ranh giới kỹ thuật nghiêm ngặt và chỉ cần giải tỏa dứt điểm trước mốc nghiệm thu sản xuất tương ứng.

---

## 11. Các Quyết Định Hoãn Chính Thức Có Ranh Giới — Sẵn Sàng Thực Thi (Final Deferral Decisions — Execution Readiness)

| ID | Quyết Định Chủ Quản | Hạng Mục Quyết Định | Ranh Giới Kỹ Thuật Đóng Băng & Điều Kiện Giải Tỏa Cuối Cùng | Trạng Thái (Status) |
| :---: | :---: | :--- | :--- | :---: |
| **IDB-08** | **DEFER** | Chiến lược Đóng gói & Triển khai Hạ tầng (Deployment / Hosting) | Bắt buộc giải tỏa trước khi đóng gói sản xuất / Wave 8 Production Release; tuân thủ COST-01, nhà cung cấp có thể thay thế, topology 4 thành phần chuẩn tắc, HTTPS/TLS, biến môi trường ngoài, backend có thẩm quyền duy nhất, quy trình backup/di chuyển an toàn. | `DEFERRED_WITH_BOUNDARY` |
| **IDB-09** | **DEFER** | Giá trị Định lượng Thời gian Lưu vết Idempotency (Retention Window) | Bắt buộc giải tỏa trước khi nghiệm thu sản xuất hành vi thử lại ngoại tuyến; bất biến đóng băng: `Server Idempotency Retention >= Maximum Legitimate Offline Retry Horizon`; cơ chế cấu hình linh hoạt qua biến môi trường; mốc 72h chỉ là `CANDIDATE_BASELINE`. | `DEFERRED_WITH_BOUNDARY` |
| **IDB-10** | **DEFER** | Chính sách Định lượng Dọn dẹp Ảnh Bằng chứng Mobile GC | Bắt buộc giải tỏa trước khi nghiệm thu thực địa sản xuất / Wave 5 Final Acceptance; sàn an toàn tối thượng: tuyệt đối cấm xóa ảnh khi còn outbox pending, cần cho retry, chưa nhận ACK nghiệp vụ bền vững, hoặc có nguy cơ vi phạm QAS-OFFLINE-01/02; các mốc 14 ngày/300MB/100 items chỉ là `CANDIDATE_BASELINE` / `NEEDS_FIELD_MEASUREMENT`. | `DEFERRED_WITH_BOUNDARY` |

### 11.1. Ranh Giới Chấp Thuận Cho IDB-08 (Deployment / Hosting)

- **Lý Do Hoãn:** Không ảnh hưởng đến kiến trúc Clean Architecture, Domain model, hay mã nguồn ứng dụng trong các Waves 0–6.
- **Thời Điểm Bắt Buộc Giải Tỏa:** Trước khi đóng gói hạ tầng sản xuất và phát hành chính thức tại Wave 8.
- **Ranh Giới Bắt Buộc Khi Đang Hoãn:**
  1. **Ràng buộc COST-01:** Ưu tiên hạ tầng chi phí $0, gói miễn phí (Free Tier) hoặc chương trình dùng thử (~1 tháng / Free Credits) khi còn khả thi về mặt kỹ thuật.
  2. **Khả Năng Thay Thế Nhà Cung Cấp (Provider Neutrality):** Giữ cho các nhà cung cấp luôn có thể thay thế lẫn nhau (`keep providers replaceable`). Tuyệt đối không để nhà cung cấp miễn phí tạm thời trở thành thẩm quyền kiến trúc vĩnh cửu.
  3. **Tô-pô Hệ Thống Chuẩn Tắc:** Hạ tầng lưu trữ bắt buộc phải hỗ trợ đầy đủ 4 thành phần đã được phê duyệt: `apps/api` (Node.js runtime Fastify), `PostgreSQL` (CSDL quan hệ), `apps/admin-web` (Static Web SPA), và `S3-compatible Object Storage` (Lưu trữ nhị phân bằng chứng qua Port).
  4. **An Ninh Vận Chuyển & Cấu Hình:** Bắt buộc hỗ trợ HTTPS/TLS trên mọi endpoint công khai; toàn bộ thông tin xác thực, secrets, và chuỗi kết nối phải được cấu hình qua biến môi trường bên ngoài, không ghi cứng trong mã nguồn.
  5. **Bảo Toàn Thẩm Quyền Máy Chủ:** Máy chủ backend luôn là nguồn thẩm quyền tối cao và duy nhất cho mọi đột biến nghiệp vụ; không tạo ra nguồn chân lý kép (dual business truth).
  6. **An Toàn Dữ Liệu Khi Hết Hạn Dùng Thử:** Bắt buộc có quy trình sao lưu/xuất dữ liệu, xoay vòng credentials, và phương án di chuyển nhà cung cấp trước khi phụ thuộc vào dịch vụ miễn phí/dùng thử có thời hạn. Việc hết hạn dùng thử tuyệt đối không được gây mất mát dữ liệu nghiệp vụ, kiểm toán hay bằng chứng.
  7. **Không Khóa Cứng Nhà Cung Cấp:** Render, Railway, Docker Compose, Linux VM, Cloudflare, AWS **tuyệt đối KHÔNG phải là kiến trúc được Chủ quản phê duyệt** trong pha này; chúng thuần túy là các ứng viên triển khai (deployment candidates).

### 11.2. Ranh Giới Chấp Thuận Cho IDB-09 (Idempotency Retention Numeric Value)

- **Lý Do Hoãn:** Giá trị số học chính xác về thời gian lưu vết (TTL) phụ thuộc vào chu kỳ thử lại ngoại tuyến thực tế và điều kiện kết nối mạng ngoài hiện trường.
- **Thời Điểm Bắt Buộc Giải Tỏa:** Trước khi nghiệm thu sản xuất hành vi ngoại tuyến / idempotency tại Wave 5 & Wave 8.
- **Bất Biến Đóng Băng Trong Thời Gian Hoãn:**
  $$\text{SERVER IDEMPOTENCY RETENTION} \ge \text{MAXIMUM LEGITIMATE OFFLINE RETRY HORIZON SUPPORTED BY THE PRODUCT}$$
- **Ranh Giới Triển Khai Mã Nguồn:**
  1. Tầng triển khai được phép xây dựng cơ chế lưu vết idempotency có thể cấu hình linh hoạt (`configurable`), có thể giám sát (`observable`), và có thể kiểm thử tự động (`testable`) mà không cần đóng băng giá trị số học sản xuất cuối cùng.
  2. Mốc **72 giờ** chỉ mang tính chất **Giá trị Cơ sở Ứng viên (`CANDIDATE_BASELINE`)**, tuyệt đối KHÔNG được mã hóa cứng thành hằng số nghiệp vụ trong domain.
  3. Kiểm thử tự động phải xác nhận:
     - Các request mang cùng `Idempotency-Key` trong khoảng thời gian lưu vết không làm nhân bản đột biến tác vụ.
     - Tác vụ định kỳ dọn dẹp bản ghi idempotency hết hạn không vi phạm chân trời thử lại đã được cấu hình.
     - Giá trị thời gian lưu vết có thể thay đổi linh hoạt qua biến môi trường cấu hình triển khai (`IDEMPOTENCY_RETENTION_HOURS`) mà không làm thay đổi hợp đồng DTO hay logic nghiệp vụ.

### 11.3. Ranh Giới Chấp Thuận Cho IDB-10 (Mobile Evidence File Garbage Collection)

- **Lý Do Hoãn:** Ngưỡng dung lượng bộ nhớ trống và khoảng thời gian lưu đệm tệp ảnh gốc trên thiết bị Android cần được đo đạc thực tế dựa trên kích thước ảnh nén và cấu hình phần cứng phổ thông ngoài thực địa.
- **Thời Điểm Bắt Buộc Giải Tỏa:** Trước khi phát hành thực địa phiên bản sản xuất / nghiệm thu cuối cùng của Wave 5.
- **Sàn An Toàn Bắt Buộc Không Thể Thương Lượng (Non-Negotiable Safety Floor):**
  Một tệp ảnh bằng chứng cục bộ trên máy di động **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP XÓA** khi:
  1. Tệp đang được tham chiếu bởi một phần tử hàng đợi Outbox đang chờ gửi (`pending Outbox item`).
  2. Tệp đang cần thiết cho các chu kỳ thử lại ngoại tuyến (`required for retry`).
  3. Việc nộp bằng chứng chưa được máy chủ xác nhận bền vững ở cấp nghiệp vụ (`upload/business acceptance has not been durably acknowledged`).
  4. Quá trình đồng bộ gặp lỗi hoặc xung đột phiên bản (`409 Conflict`) vẫn đòi hỏi bảo toàn tệp ảnh gốc trên máy để nhân viên đối soát.
  5. Thao tác xóa có nguy cơ vi phạm các chỉ số độ tin cậy ngoại tuyến `QAS-OFFLINE-01` hoặc `QAS-OFFLINE-02`.
- **Phân Loại Tham Số & Trạng Thái COMPLETED:**
  - Các mốc **14 ngày**, **300 MB**, **100 outbox items** chỉ mang tính chất **Giá trị Cơ sở Ứng viên (`CANDIDATE_BASELINE` / `NEEDS_FIELD_MEASUREMENT`)**, tuyệt đối KHÔNG bị khóa cứng thành bất biến sản phẩm.
  - Việc chính sách triển khai chọn giữ ảnh cho đến khi tác vụ đạt `TaskStatus = COMPLETED` là giải pháp thuận tiện vận hành, nhưng không được biến thành bất biến nghiệp vụ đóng băng.
  - Bất biến an toàn cốt tử duy nhất là: **TUYỆT ĐỐI KHÔNG LÀM MẤT BẰNG CHỨNG CẦN THIẾT CHO VIỆC NỘP BỀN VỮNG, THỬ LẠI NGOẠI TUYẾN VÀ HÒA GIẢI XUNG ĐỘT (NO LOSS OF EVIDENCE REQUIRED FOR DURABLE SUBMISSION / RETRY / RECONCILIATION).**
