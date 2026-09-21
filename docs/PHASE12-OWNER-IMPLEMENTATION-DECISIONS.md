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

## 3. Tổng Hợp Trạng Thái Toàn Bộ Quyết Định Triển Khai (Phase 12B Status Summary)

| Trạng Thái | Số Lượng | Danh Sách Mã Quyết Định | Ghi Chú |
| :--- | :---: | :--- | :--- |
| **`OWNER_APPROVED`** | **3** | **IDB-01, IDB-02, IDB-03** | Đã được Chủ quản phê duyệt chính thức tại Đợt 1 (Wave 2 Foundation). |
| **`OPEN`** | **8** | **IDB-04, IDB-05, IDB-06, IDB-07, IDB-08, IDB-09, IDB-10, IDB-11** | Tiếp tục giữ trạng thái mở, chờ xem xét theo từng đợt tương ứng. |
| **`REJECTED`** | **0** | *(Không có)* | |

---

## 4. Tuyên Bố Giới Hạn Thẩm Quyền Triển Khai (Execution Boundary Statement)

> [!IMPORTANT]
> **Tuyên bố Ranh giới Tuyệt đối:**
> **Không có bất kỳ mã nguồn ứng dụng nào (`apps/**`), gói dùng chung (`packages/**`), kịch bản (`scripts/**`), hoặc phụ thuộc runtime (`package.json`) nào được phép khởi tạo, cài đặt hay thay đổi trong phạm vi của đợt phê duyệt này.**
> Đợt phê duyệt này chỉ ghi nhận quyết định cấp kiến trúc triển khai để cập nhật kế hoạch tổng thể và ma trận truy vết.
> Các đợt Wave 0, Wave 1, Wave 2 **CHƯA ĐƯỢC PHÉP THỰC THI** cho đến khi có chỉ thị thực thi chính thức.

---

## 5. Kế Hoạch Trình Duyệt Đợt Tiếp Theo (Next Review Batch)

- **Đợt 2 (Batch 2 — Quyết định Chặn Wave 3 IAM & An Ninh):**
  - **IDB-04:** Định dạng & Cấu trúc Thông tin Xác thực (`Signed JWT` vs `Opaque Bearer Token`).
  - **IDB-05:** Thuật toán Băm Mật khẩu Tài khoản (`Argon2id` kèm đo đạc thực nghiệm trên phần cứng đích).
  - **IDB-11:** Hạ tầng Quản lý Phiên & Trạng thái Thu hồi Máy chủ (`Bảng sessions CSDL` vs `Redis cache`).
