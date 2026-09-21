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

## 5. Tổng Hợp Trạng Thái Toàn Bộ Quyết Định Triển Khai (Phase 12B Status Summary)

| Trạng Thái | Số Lượng | Danh Sách Mã Quyết Định | Ghi Chú |
| :--- | :---: | :--- | :--- |
| **`OWNER_APPROVED`** | **6** | **IDB-01, IDB-02, IDB-03, IDB-04, IDB-05, IDB-11** | Đã được Chủ quản phê duyệt chính thức tại Đợt 1 (Wave 2) và Đợt 2 (Wave 3 IAM/Security). |
| **`OPEN`** | **5** | **IDB-06, IDB-07, IDB-08, IDB-09, IDB-10** | Tiếp tục giữ trạng thái mở, chờ xem xét theo từng đợt tương ứng. |
| **`REJECTED`** | **0** | *(Không có)* | |

---

## 6. Tuyên Bố Giới Hạn Thẩm Quyền Triển Khai (Execution Boundary Statement)

> [!IMPORTANT]
> **Tuyên bố Ranh giới Tuyệt đối:**
> **Không có bất kỳ mã nguồn ứng dụng nào (`apps/**`), gói dùng chung (`packages/**`), kịch bản (`scripts/**`), hoặc phụ thuộc runtime (`package.json`) nào được phép khởi tạo, cài đặt hay thay đổi trong phạm vi của đợt phê duyệt Đợt 1 và Đợt 2 này.**
> Quyết định này chỉ ghi nhận các lựa chọn công nghệ cấp kiến trúc triển khai để cập nhật kế hoạch tổng thể và ma trận truy vết.
> Toàn bộ các đợt thực thi mã nguồn (Wave 0, Wave 1, Wave 2, Wave 3) **CHƯA ĐƯỢC PHÉP THỰC THI** cho đến khi có chỉ thị chính thức.

---

## 7. Kế Hoạch Trình Duyệt Đợt Tiếp Theo (Next Review Batch)

- **Đợt 3 (Batch 3 — Quyết định Chặn Wave 4 & Wave 6):**
  - **IDB-07:** Hạ tầng Lưu trữ Bằng chứng Tệp Nhị phân (`S3-Compatible Port: MinIO / AWS S3 / Cloudflare R2` — Chặn Wave 4).
  - **IDB-06:** Nền tảng & Bộ Công cụ Web Quản trị Admin (`Vite + React 19 SPA` — Chặn Wave 6).
- **An Toàn Để Hoãn (Safe to Defer — Triển khai / Đo đạc thực địa):**
  - **IDB-08:** Chiến lược Đóng gói & Triển khai Hạ tầng (Docker Compose trên Linux VM — Hoãn Wave 8).
  - **IDB-09:** Cấu hình TTL Idempotency (Biến môi trường, đo đạc tại Wave 5).
  - **IDB-10:** Dọn dẹp Ảnh Bằng chứng Mobile GC (Đo đạc thực địa tại Wave 5).
