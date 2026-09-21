# Báo Cáo Sẵn Sàng Thực Thi & Đóng Băng Giai Đoạn 12B (Phase 12B Execution Readiness & Final Freeze)

**Dự án:** NOVYX GreenOps
**Giai đoạn:** Phase 12B — Final Freeze & Execution Readiness
**Ngày lập:** 21/09/2026
**Commit Baseline:** `c0390e08feaca7e7622ebf257ff703c8288ea697`
**Nhánh:** `base-setup`
**Tài liệu Nguồn Thẩm Quyền:**
- [`docs/PRODUCT.md`](PRODUCT.md), [`docs/DOMAIN.md`](DOMAIN.md), [`docs/ACCESS-CONTROL.md`](ACCESS-CONTROL.md)
- [`docs/WORKFLOWS.md`](WORKFLOWS.md), [`docs/REQUIREMENTS-TRACEABILITY.md`](REQUIREMENTS-TRACEABILITY.md), [`docs/NFR.md`](NFR.md)
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/adr/`](adr/)
- [`docs/PHASE12-CURRENT-SOURCE-EVIDENCE.md`](PHASE12-CURRENT-SOURCE-EVIDENCE.md)
- [`docs/PHASE12-IMPLEMENTATION-DECISION-REGISTER.md`](PHASE12-IMPLEMENTATION-DECISION-REGISTER.md)
- [`docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md`](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md)
- [`docs/PHASE12-IMPLEMENTATION-MASTER-PLAN.md`](PHASE12-IMPLEMENTATION-MASTER-PLAN.md)
- [`docs/PHASE12-IMPLEMENTATION-TRACEABILITY.md`](PHASE12-IMPLEMENTATION-TRACEABILITY.md)

---

## 1. Mục Đích (Purpose)

Báo cáo này xác lập mốc đóng băng chính thức cuối cùng của **Phase 12B (Final Planning Freeze)** và công bố trạng thái **Sẵn Sàng Thực Thi (Execution Readiness)** của Dự án NOVYX GreenOps.

Sau khi hoàn tất 3 đợt phê duyệt của Chủ quản (Batches 1–3):
1. **8 quyết định cấp triển khai cốt lõi** đã được Chủ quản phê duyệt chính thức (`OWNER_APPROVED`). Toàn bộ các quyết định chặn việc khởi động kỹ thuật cho các Đợt triển khai Waves 0–6 đã được giải tỏa triệt để.
2. **3 quyết định cấp triển khai còn lại** (`IDB-08`, `IDB-09`, `IDB-10`) được chính thức hoãn có chủ đích và có ranh giới bảo vệ nghiêm ngặt (`DEFERRED_WITH_BOUNDARY`). Ba quyết định này không cản trở kiến trúc mã nguồn hay việc lập trình Waves 0–6.
3. Ràng buộc bàn giao chi phí bằng không / dùng thử miễn phí (`COST-01`) được ghi nhận như một nguyên tắc điều hành nhưng tuyệt đối bảo toàn tính trung lập nhà cung cấp và bảo toàn toàn vẹn kiến trúc.
4. Xác lập quyền thực thi có kiểm soát: Việc đóng băng Phase 12B **KHÔNG** cho phép thực thi đồng loạt mọi wave. Việc thực thi được phân chia nghiêm ngặt theo cổng (wave-gated), và **DUY NHẤT Wave 0 (Nền tảng Kiểm thử, Chất lượng & Quản trị Thực thi)** được phép kích hoạt trong Phase 13 tiếp theo.
5. **TUYỆT ĐỐI KHÔNG CÓ THỰC THI MÃ NGUỒN** trong giai đoạn này.

---

## 2. Đường Cơ Sở Git Đóng Băng (Frozen Git Baseline)

- **Nhánh thực hiện:** `base-setup`
- **Commit Baseline Đầu Vào Phase 12B Final Freeze:** `c0390e08feaca7e7622ebf257ff703c8288ea697`
- **Trạng thái Working Tree:** Sạch (`clean`), không có thay đổi chưa commit trong mã nguồn hoặc tệp chưa theo dõi.
- **Dòng Lịch Sử Commit Chuẩn Tắc Của Tiến Trình Phase 12:**
  - `9df1b29` — `docs(adr): freeze Phase 11 architecture authority baselines` (Đóng băng Phase 11 Architecture Baselines)
  - `8735332` — `docs(implementation): record Phase 12A implementation baseline and decision register` (Đóng băng Phase 12A)
  - `0fcc5e1` — `docs(implementation): record Phase 12B Owner decision batch 1` (Phê duyệt Batch 1: IDB-01, IDB-02, IDB-03)
  - `7cb1b76` — `docs(implementation): record Phase 12B Owner decision batch 2` (Phê duyệt Batch 2: IDB-04, IDB-05, IDB-11)
  - `c0390e0` — `docs(implementation): record Phase 12B Owner decision batch 3` (Phê duyệt Batch 3: IDB-07, IDB-06, COST-01)

---

## 3. Đường Cơ Sở Nghiệp Vụ Đóng Băng (Frozen Business Baseline)

Toàn bộ các tài liệu đặc tả nghiệp vụ từ Phase 1 đến Phase 7 được giữ nguyên vẹn 100%, không bị sửa đổi hay tha hóa:
- **Tài liệu thẩm quyền nghiệp vụ:** [`docs/PRODUCT.md`](PRODUCT.md), [`docs/DOMAIN.md`](DOMAIN.md), [`docs/ACCESS-CONTROL.md`](ACCESS-CONTROL.md), [`docs/WORKFLOWS.md`](WORKFLOWS.md), [`docs/REQUIREMENTS-TRACEABILITY.md`](REQUIREMENTS-TRACEABILITY.md), [`docs/NFR.md`](NFR.md), và toàn bộ thư mục [`docs/business-reconciliation/`](business-reconciliation/).
- **48 Lệnh Nghiệp Vụ Chuẩn Tắc & 49 Truy Vấn:** Được phân bổ trong 14 Thực thể Miền Nghiệp vụ, ánh xạ chuẩn xác sang các In-Process Module Interfaces của kiến trúc Modular Monolith.
- **7 Trạng Thái Vòng Đời Tác Vụ Chuẩn Tắc (`TaskStatus`):** `DRAFT`, `ASSIGNED`, `IN_PROGRESS`, `SUBMITTED`, `REWORK_REQUIRED`, `COMPLETED`, `BLOCKED`. Cấm mọi trạng thái ngoại lai.
- **4 Kết Luận Duyệt Tác Vụ Chuẩn Tắc (`ReviewDecision`):** `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`. Cấm rút gọn thành nhị phân Approve/Reject.
- **3 Hồ Sơ Bằng Chứng Ngữ Nghĩa (`ProofProfile`):** `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`.
- **Nguyên Tắc Phân Quyền & Tách Biệt Nhiệm Vụ (SoD):**
  - Quản trị viên (`Admin`) tuyệt đối không can thiệp, không bắt đầu, không nộp, không duyệt các tác vụ vận hành hiện trường (`PLAN-SOD-ADMIN`, `BR-ACT-01`, `P4-09`).
  - Người thẩm định không bao giờ được tự duyệt bằng chứng do chính mình chụp (`DR-HARD-02`).
  - Kiểm tra độ tươi phiên và thu hồi quyền tức thì ở Cổng An ninh Tier 2 (`PLAN-AUTH-FRESHNESS`).
  - Nhật ký kiểm toán bất biến, chỉ ghi thêm (append-only), phân tách quyền hạn ở tầng cơ sở dữ liệu (`PLAN-AUDIT-IMMUTABILITY`).

---

## 4. Đường Cơ Sở Kiến Trúc Đóng Băng (Frozen Architecture Baseline)

- **Kiến trúc Máy chủ Duy nhất:** Modular Monolith (ADR 0003, [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)), triển khai mã nguồn tại `apps/api`. Không giả định chia tách microservices.
- **5 Module Nội bộ Tách Biệt Nghiêm Ngặt:**
  1. `IAM & Access Control`
  2. `Work Management & Execution`
  3. `Tree & Asset Registry`
  4. `Policy & Governance`
  5. `Audit Logging`
- **Bộ 13 Quyết Định Kiến Trúc Đã Chấp Thuận (ADR 0001..0013):** Đã đóng băng thẩm quyền, không được mở lại hay sửa đổi trong quá trình thực thi:
  - `ADR 0001`: Chiến lược Monorepo pnpm & TypeScript.
  - `ADR 0002`: Nền tảng Di động Expo React Native.
  - `ADR 0003`: Mô hình Máy chủ Backend Modular Monolith.
  - `ADR 0004`: Hệ thống Thiết kế Giao diện Di động & Quy chuẩn Trải nghiệm Ngoài trời.
  - `ADR 0005`: Tách biệt Giao diện Quản trị Nền tảng (Dedicated Web Portal) & Cấm Admin can thiệp tác vụ hiện trường.
  - `ADR 0006`: Mô hình Quản lý Danh tính & Phiên Máy chủ Tự chủ (Authoritative Auth).
  - `ADR 0007`: Kiến trúc Ủy thác & Kiểm soát Quyền hạn Hai Lớp (Tier 1 RBAC + Tier 2 Contextual Gate).
  - `ADR 0008`: Kiến trúc Ngoại tuyến Cục bộ Mobile Draft & Hàng Đợi Bền vững (Durable Outbox).
  - `ADR 0009`: Cơ chế Giao dịch Phân tán & Giao thức Nộp Bằng chứng Hai Giai đoạn.
  - `ADR 0010`: Chiến lược API Bề mặt & Ánh xạ Lệnh Nghiệp vụ Sang REST/RPC.
  - `ADR 0011`: Thiết kế Kho Lưu trữ Kiểm toán Bất biến & Phân tách Đặc quyền DB.
  - `ADR 0012`: Quản lý Trạng thái & Máy Trạng thái Tác vụ Chuẩn tắc.
  - `ADR 0013`: Chiến lược Di chuyển & Chuyển đổi Mã nguồn Hiện hữu (Strangler Fig Pattern).

---

## 5. Trạng Thái Giai Đoạn 12A (Phase-12A Status)

- **Trạng thái:** `COMPLETE / FROZEN`.
- **Hồ sơ hiện trạng mã nguồn:** [`docs/PHASE12-CURRENT-SOURCE-EVIDENCE.md`](PHASE12-CURRENT-SOURCE-EVIDENCE.md) đã ghi nhận đầy đủ 15 khoảng cách kỹ thuật hiện hữu (`IMP-GAP-001` đến `IMP-GAP-015`).
- **Kế hoạch tổng thể:** [`docs/PHASE12-IMPLEMENTATION-MASTER-PLAN.md`](PHASE12-IMPLEMENTATION-MASTER-PLAN.md) đã cấu trúc chi tiết 9 Đợt triển khai (Wave 0 đến Wave 8).
- **Ma trận truy vết:** [`docs/PHASE12-IMPLEMENTATION-TRACEABILITY.md`](PHASE12-IMPLEMENTATION-TRACEABILITY.md) đã hoàn tất ánh xạ 100% yêu cầu nghiệp vụ, khoảng cách kỹ thuật và kịch bản NFR sang các wave thực thi.

---

## 6. Quyết Định Của Chủ Quản — Đợt 1 (Owner Decision Batch 1)

Ghi nhận chính thức tại [`docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md`](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md):
- **IDB-01 — CSDL Quan hệ Máy chủ:** `PostgreSQL` (Baseline phát triển: 18.x; Sản xuất: Bản phát hành chính thức ổn định được nhà cung cấp hỗ trợ). Trạng thái: `OWNER_APPROVED`.
- **IDB-02 — Web Framework Máy chủ:** `Fastify 5.x` (Đóng vai trò hạ tầng runtime HTTP/routing; Zod và `@novyx/contracts` giữ vai trò thẩm quyền hợp đồng duy nhất). Trạng thái: `OWNER_APPROVED`.
- **IDB-03 — Công cụ Truy cập Dữ liệu / ORM:** `Drizzle ORM + drizzle-kit` (Type-safe SQL schema; kèm cơ chế Raw SQL escape hatch phục vụ phân tách đặc quyền DB và quản lý chỉ mục nâng cao). Trạng thái: `OWNER_APPROVED`.

---

## 7. Quyết Định Của Chủ Quản — Đợt 2 (Owner Decision Batch 2)

Ghi nhận chính thức tại [`docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md`](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md):
- **IDB-04 — Cấu trúc & Định dạng Token Xác thực:** `Opaque Bearer Access Credential + Rotating Opaque Refresh Credential` (Khắc phục triệt để nguy cơ trễ thu hồi token của Stateless JWT; máy chủ xác thực qua bảng phiên). Trạng thái: `OWNER_APPROVED`.
- **IDB-05 — Thuật toán Băm Mật khẩu:** `Argon2id` (Thuật toán an toàn bộ nhớ theo chuẩn OWASP/IETF; benchmark cấu hình trên phần cứng máy chủ đích, hỗ trợ cờ rehash). Trạng thái: `OWNER_APPROVED`.
- **IDB-11 — Hạ tầng Quản lý Phiên:** `PostgreSQL-backed Session Repository` cho MVP (Thiết kế qua Clean Architecture Port `SessionRepository`, cho phép chuyển đổi sang Redis trong tương lai nếu có bằng chứng nghẽn I/O mà không làm sửa đổi logic IAM). Trạng thái: `OWNER_APPROVED`.

---

## 8. Quyết Định Của Chủ Quản — Đợt 3 (Owner Decision Batch 3)

Ghi nhận chính thức tại [`docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md`](PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md):
- **IDB-07 — Lưu trữ File Bằng chứng:** `S3-Compatible Object Storage Port` (Giao diện trừu tượng hóa `ObjectStoragePort` tương thích AWS S3 API; hỗ trợ phát triển cục bộ bằng MinIO và triển khai demo/production bằng Cloudflare R2 hoặc các dịch vụ S3 tương thích). Trạng thái: `OWNER_APPROVED`.
- **IDB-06 — Web Quản trị Admin:** `React 19 SPA + Vite` (Xây dựng workspace mới `apps/admin-web`, phục vụ riêng biệt cho Quản trị viên hệ thống Platform Admin, truy cập API máy chủ qua HTTPS, cấm logic tác nghiệp hiện trường). Trạng thái: `OWNER_APPROVED`.
- **Ràng buộc COST-01:** Bổ sung chính sách phân phối với ngân sách $0 / dùng thử miễn phí, ưu tiên tối đa việc tiết kiệm chi phí mà vẫn giữ vững nguyên tắc thay thế nhà cung cấp (`keep providers replaceable`).

---

## 9. Ma Trận Quyết Định Cuối Cùng (Final Decision Matrix)

Toàn bộ 11 quyết định cấp triển khai của Phase 12B đạt trạng thái đóng băng chính thức như sau:

| Mã IDB | Hạng Mục Quyết Định | Phương Án Xác Lập / Trạng Thái | Mức Độ Tin Cậy | Trạng Thái Cuối Cùng | Đợt Phê Duyệt / Biên Bản |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **IDB-01** | CSDL Quan hệ Máy chủ | **PostgreSQL** (Baseline: 18.x, Prod: Supported Stable) | `HIGH` | `OWNER_APPROVED` | Batch 1 |
| **IDB-02** | Web Framework Máy chủ | **Fastify 5.x** (Runtime Infrastructure, Zod Contract Authority) | `HIGH` | `OWNER_APPROVED` | Batch 1 |
| **IDB-03** | Công cụ Truy cập Dữ liệu / ORM | **Drizzle ORM + drizzle-kit** (Kèm Raw SQL escape hatch) | `HIGH` | `OWNER_APPROVED` | Batch 1 |
| **IDB-04** | Cấu trúc Token Xác thực | **Opaque Bearer Access Credential + Rotating Opaque Refresh** | `HIGH` | `OWNER_APPROVED` | Batch 2 |
| **IDB-05** | Thuật toán Băm Mật khẩu | **Argon2id** (Benchmark target hardware, rehash support) | `HIGH` | `OWNER_APPROVED` | Batch 2 |
| **IDB-06** | Web Quản trị Admin | **React 19 SPA + Vite** (apps/admin-web, Platform Admin scope) | `HIGH` | `OWNER_APPROVED` | Batch 3 |
| **IDB-07** | Lưu trữ File Bằng chứng | **S3-Compatible Object Storage Port** (Provider-neutral abstraction) | `HIGH` | `OWNER_APPROVED` | Batch 3 |
| **IDB-08** | Đóng gói & Triển khai Hạ tầng | **Ranh giới hoãn kiểm soát** (Ứng viên: Linux VM / Docker Compose / PaaS) | `HIGH` | `DEFERRED_WITH_BOUNDARY` | Final Freeze |
| **IDB-09** | Cấu hình TTL Idempotency | **Ranh giới hoãn kiểm soát** (Cơ sở ứng viên: 72h; cấu hình qua env) | `HIGH` | `DEFERRED_WITH_BOUNDARY` | Final Freeze |
| **IDB-10** | Dọn dẹp Ảnh Bằng chứng Mobile | **Ranh giới hoãn kiểm soát** (Cơ sở ứng viên: 14d/300MB; Safety floor) | `MEDIUM` | `DEFERRED_WITH_BOUNDARY` | Final Freeze |
| **IDB-11** | Quản lý Phiên Máy chủ | **PostgreSQL-backed Session Repository cho MVP** | `HIGH` | `OWNER_APPROVED` | Batch 2 |

### Thống Kê Tổng Hợp Quyết Định:
- **`OWNER_APPROVED`:** **8** (IDB-01, IDB-02, IDB-03, IDB-04, IDB-05, IDB-06, IDB-07, IDB-11)
- **`DEFERRED_WITH_BOUNDARY`:** **3** (IDB-08, IDB-09, IDB-10)
- **`OPEN`:** **0** (Không còn bất kỳ quyết định mở không kiểm soát nào)
- **`REJECTED`:** **0**

---

## 10. Ranh Giới Các Quyết Định Hoãn (Deferred Decision Boundaries)

Ba quyết định `IDB-08`, `IDB-09`, `IDB-10` được hoãn một cách có chủ đích và không gây cản trở các Đợt triển khai Waves 0–6 nhờ các ranh giới kiểm soát đóng băng sau:

### 10.1. IDB-08: Đóng Gói & Triển Khai Hạ Tầng (Deployment / Hosting)
- **Lý do hoãn:** Quyết định nền tảng hạ tầng cụ thể không cản trở thiết kế kiến trúc mã nguồn, hợp đồng API hay việc cài đặt mã nguồn các Wave 0–6.
- **Cổng phê duyệt muộn nhất:** Phải được giải quyết dứt điểm trước khi đóng gói sản xuất / phát hành Wave 8 (Production Release).
- **Ranh giới bất biến trong thời gian hoãn:**
  - Áp dụng nguyên tắc `COST-01`: Ưu tiên gói miễn phí / dùng thử / chi phí $0 khi đáp ứng yêu cầu kỹ thuật.
  - **Duy trì tính trung lập nhà cung cấp (Vendor-Neutral):** Không khóa chặt vào Render, Railway, AWS, Docker Compose hay Linux VM. Mọi cấu hình phải dễ dàng thay thế (`keep providers replaceable`).
  - Hạ tầng bắt buộc hỗ trợ đầy đủ tô-pô 4 thành phần đã chấp thuận: `apps/api` (Node.js), `PostgreSQL`, `apps/admin-web` (Static Web), và Lưu trữ đối tượng tương thích S3.
  - Bắt buộc mã hóa toàn trình qua HTTPS/TLS.
  - Toàn bộ thông tin cấu hình môi trường và bí mật (secrets) phải được tách biệt bên ngoài mã nguồn (`externalized config`).
  - Backend máy chủ duy nhất giữ thẩm quyền nghiệp vụ tối cao; cấm tạo nguồn chân lý kép.
  - Bắt buộc có quy trình sao lưu/xuất dữ liệu trước khi sử dụng hạ tầng dùng thử có thời hạn; việc hết hạn dùng thử tuyệt đối không được gây mất mát dữ liệu nghiệp vụ, nhật ký kiểm toán hay thông tin người dùng.

### 10.2. IDB-09: Thời Gian Lưu Vết Chống Trùng Lặp (Idempotency Retention)
- **Lý do hoãn:** Giá trị số học chính xác về thời gian lưu vết (TTL) cần được căn cứ trên số liệu đo đạc thực tế về hành vi thử lại ngoại tuyến (offline retry) của công nhân hiện trường.
- **Cổng phê duyệt muộn nhất:** Phải được giải quyết trước khi nghiệm thu sản xuất cơ chế ngoại tuyến / idempotency.
- **Bất biến đóng băng trong thời gian hoãn:**
  $$\text{Server Idempotency Retention} \ge \text{Maximum Legitimate Offline Retry Horizon Supported by Product}$$
- **Ranh giới lập trình mã nguồn:**
  - Cơ chế lưu trữ idempotency trên máy chủ phải được thiết kế: **cấu hình được qua biến môi trường (configurable)**, **quan sát được qua log/metric (observable)**, và **kiểm thử tự động được (testable)**.
  - Giá trị **72 giờ** chỉ đóng vai trò là **Cơ Sở Ứng Viên (`CANDIDATE_BASELINE`)**, tuyệt đối không được mã hóa cứng (hard-code) như một hằng số bất biến của nghiệp vụ.
  - Các bài kiểm thử mã nguồn phải xác nhận: các yêu cầu gửi cùng một `Idempotency-Key` trong cửa sổ lưu vết không bị nhân bản đột biến; quy trình dọn dẹp bản ghi cũ không vi phạm khung thời gian thử lại tối đa được cấu hình.

### 10.3. IDB-10: Dọn Dẹp File Bằng Chứng Cục Bộ Trên Thiết Bị Di Động (Mobile Evidence GC)
- **Lý do hoãn:** Ngưỡng dung lượng và thời gian dọn dẹp tối ưu phụ thuộc vào dung lượng bộ nhớ thực tế của các dòng điện thoại Android hiện trường và kích thước ảnh chụp thực tế.
- **Cổng phê duyệt muộn nhất:** Phải được giải quyết trước đợt rollout thực địa sản xuất / nghiệm thu cuối Wave 5.
- **Sàn An Toàn Tuyệt Đối (Non-Negotiable Safety Floor):**
  Một tệp bằng chứng cục bộ trên thiết bị di động **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP XÓA** khi:
  1. Đang được tham chiếu bởi một phần tử Outbox đang chờ gửi (`pending Outbox item`).
  2. Vẫn đang cần thiết cho các chu trình gửi lại (`offline retry`).
  3. Quá trình tải lên hoặc nghiệm thu nghiệp vụ chưa nhận được xác nhận bền vững từ máy chủ (`durable server acknowledgement`).
  4. Quá trình đối soát xung đột hoặc xử lý lỗi đồng bộ vẫn đang đòi hỏi tệp bằng chứng cục bộ để đối chiếu.
  5. Hành động xóa có thể dẫn đến vi phạm kịch bản chất lượng `QAS-OFFLINE-01` hoặc `QAS-OFFLINE-02`.
- **Ranh giới chính sách:** Các giá trị **14 ngày**, **300 MB**, hay **100 tác vụ Outbox** chỉ đóng vai trò **Cơ Sở Ứng Viên Cần Đo Đạc Thực Địa (`CANDIDATE_BASELINE / NEEDS_FIELD_MEASUREMENT`)**, không phải bất biến nghiệp vụ. Trạng thái `COMPLETED` của tác vụ là điều kiện cần nhưng không phải là chính sách số học cố định. Nguyên tắc tối thượng là: **KHÔNG ĐƯỢC MẤT BẰNG CHỨNG CẦN CHO VIỆC NỘP, THỬ LẠI VÀ ĐỐI SOÁT BỀN VỮNG**.

---

## 11. Ràng Buộc Chi Phí Bằng Không (COST-01 Constraint)

1. **Ưu Tiên Chi Phí Bằng Không / Gói Dùng Thử:**
   Dự án cam kết ưu tiên tối đa các giải pháp miễn phí hoặc dùng thử (free tier / free trial ~1 tháng / free credits) trong các giai đoạn phát triển và chạy thử nghiệm ban đầu. Tuyệt đối không yêu cầu hạ tầng trả phí khi đã có phương án thay thế miễn phí khả thi về mặt kỹ thuật.
2. **Nguyên Tắc Trung Lập Nhà Cung Cấp:**
   Mọi nhà cung cấp (Render, Railway, Cloudflare R2, MinIO, Docker Compose trên VM) chỉ là ứng viên triển khai (`deployment candidates`), tuyệt đối không trở thành thẩm quyền kiến trúc. Mã nguồn ứng dụng chỉ phụ thuộc vào các Clean Architecture Ports (ví dụ: `ObjectStoragePort`, `SessionRepository`), không phụ thuộc trực tiếp vào vendor SDK nội bộ.
3. **Giới Hạn Của Gói Miễn Phí Không Được Tha Hóa Kiến Trúc:**
   - Cấm lưu trực tiếp file ảnh nhị phân vào cơ sở dữ liệu PostgreSQL chỉ để lách hạn ngạch object storage.
   - Cấm gỡ bỏ máy chủ có thẩm quyền tối cao chỉ vì backend miễn phí tự động rơi vào trạng thái "ngủ" (cold start).
   - Cấm tạo nguồn chân lý kép ngoài luồng chỉ vì một dịch vụ dùng thử hết hạn.
4. **Cảnh Báo Thông Tin Nhà Cung Cấp Có Tính Thời Điểm (Time-Sensitive Provider Information):**
   Các thông số hạn ngạch nhà cung cấp (như "10 GB", "miễn phí băng thông tải về", "$5 trial") là thông tin vận hành có tính thời điểm, có thể thay đổi bất cứ lúc nào theo chính sách của bên thứ ba. Chúng được gắn nhãn minh thị `[TIME-SENSITIVE PROVIDER INFORMATION — CHECK AGAIN BEFORE DEPLOYMENT]` và không trở thành bất biến kiến trúc đóng băng.
5. **An Toàn Khi Hết Hạn Dùng Thử:**
   Trước khi đưa dữ liệu vào bất kỳ dịch vụ dùng thử nào, bắt buộc phải có quy trình trích xuất, sao lưu và di chuyển dữ liệu độc lập để đảm bảo không xảy ra mất mát dữ liệu do hết hạn dùng thử.

---

## 12. Thứ Tự Phụ Thuộc Thực Thi (Implementation Dependency Order)

Tiến trình thực thi được cấu trúc theo đồ thị có hướng nghiêm ngặt (Strict Directed Acyclic Graph — DAG). Không có đợt triển khai nào được phép thực hiện song song nếu vi phạm các phụ thuộc tiên quyết:

```
Wave 0: Nền Tảng Kiểm Thử, Chất Lượng & Quản Trị Thực Thi
   │
   ▼
Wave 1: Hợp Đồng Chuẩn Tắc (@novyx/contracts)
   │
   ▼
Wave 2: Nền Tảng Backend & Lưu Trữ Quan Hệ (apps/api Foundation & Drizzle Migrations)
   │
   ▼
Wave 3: IAM, Cổng Xác Thực Tier 2 & Nhật Ký Kiểm Toán Bất Biến (apps/api IAM & Audit)
   │
   ▼
Wave 4: Các Module Nghiệp Vụ Tác Nghiệp & APIs (apps/api Work, Tree, Policy, S3 Port)
   │
   ▼
Wave 5: Tích Hợp Di Động, Ngoại Tuyến & Durable Outbox (apps/mobile)
   │
   ▼
Wave 6: Cổng Quản Trị Hệ Thống Web (apps/admin-web)
   │
   ▼
Wave 7: Thu Hồi & Dọn Dẹp Mã Nguồn Cũ (Legacy Retirement)
   │
   ▼
Wave 8: Làm Cứng NFR & Đóng Gói Sản Xuất (Hardening & Release)
```

---

## 13. Ranh Giới Ủy Quyền Wave 0 (Wave 0 Authorization Boundary)

Sau khi Phase 12B đóng băng thành công, **DUY NHẤT** giai đoạn tiếp theo được phép kích hoạt là:
$$\mathbf{PHASE\ 13\ /\ IMPLEMENTATION\ WAVE\ 0}$$

### Mục Tiêu Cốt Tử Của Wave 0:
Thiết lập **Nền Tảng Kiểm Thử, Chất Lượng & Quản Trị Thực Thi (Test / Quality / Execution Governance Foundation)** để làm lưới an toàn đo lường trước khi bất kỳ hợp đồng nghiệp vụ hay dòng code backend nào được thay đổi.

### Các Hạng Mục Dự Kiến Trong Wave 0:
- Thiết lập công cụ chạy kiểm thử tự động toàn dự án (`vitest`).
- Cấu hình lệnh kiểm thử gốc tại root (`npm test`).
- Thiết lập kiểm tra ranh giới nhập khẩu kiến trúc (`architecture/import boundary tests`) nhằm ngăn chặn việc vi phạm phụ thuộc giữa các package/module.
- Thiết lập đường cơ sở hồi quy (`regression baseline`) cho mã nguồn hiện hữu.
- Xây dựng các bài kiểm thử ngữ nghĩa đóng băng dựa trên các fixtures chuẩn tắc (7 task states, 4 review decisions, 3 proof profiles).
- Chuẩn hóa các quy ước thu thập bằng chứng chất lượng thực nghiệm (`quality evidence conventions`).

**Lưu ý cốt tử:** Toàn bộ việc triển khai cụ thể của Wave 0 sẽ được hướng dẫn và kích hoạt độc lập trong yêu cầu Phase 13 riêng biệt. **TUYỆT ĐỐI KHÔNG TRIỂN KHAI WAVE 0 TRONG GIAI ĐOẠN 12B NÀY.**

---

## 14. Các Wave Chưa Được Phép Thực Thi (Waves Not Yet Authorized)

- **Các đợt triển khai từ Wave 1 đến Wave 8:** Tuyệt đối **CHƯA ĐƯỢC PHÉP KHỞI ĐỘNG**.
- **Quy tắc cổng độc lập:** Wave 1 chỉ được xem xét kích hoạt khi và chỉ khi Wave 0 đã hoàn tất 100%, vượt qua toàn bộ các cổng kiểm soát nghiệm thu đầu ra của Wave 0, và được kiểm chứng độc lập.
- Tương tự, mỗi wave tiếp theo đều đòi hỏi một chu trình phê duyệt và nghiệm thu cổng độc lập trước khi chuyển giao.

---

## 15. Rủi Ro Đường Cơ Sở Mã Nguồn Hiện Hữu (Source Baseline Risks)

Báo cáo sẵn sàng thực thi tái khẳng định việc nhận diện đầy đủ các khiếm khuyết cốt tử trong mã nguồn hiện trạng (`AS-IS`) đã được xác minh trong Phase 12A:
1. **Ép vai trò Quản trị viên sai lệch trên mobile (`IMP-GAP-001`):** Mã nguồn hiện tại ép `admin` thành `manager` (`role === 'admin' ? 'manager' : role`), vi phạm nghiêm trọng nguyên tắc SoD `PLAN-SOD-ADMIN`.
2. **Điều hướng nhị phân hai nhánh (`IMP-GAP-002`):** Mobile chia nhánh thô sơ `isStaff ? 'StaffApp' : 'ManagerApp'`, hoàn toàn thiếu cổng quản trị độc lập và phạm vi vai trò chuẩn tắc.
3. **Hợp đồng trạng thái tác vụ thiếu sót (`IMP-GAP-003`):** Mock data chỉ có 5 trạng thái thô sơ, thiếu các trạng thái chuẩn tắc `REWORK_REQUIRED` và `BLOCKED`.
4. **Thiếu vắng hợp đồng `ReviewDecision` và `ProofProfile` (`IMP-GAP-004`):** Thẩm định chỉ có Approve/Reject đơn giản; không có cơ chế lưu vết ảnh hợp lệ khi rework; không có cấu trúc cho 3 hồ sơ bằng chứng ngữ nghĩa.
5. **Chưa có máy chủ `apps/api` có thẩm quyền (`IMP-GAP-006`):** Toàn bộ dữ liệu đang lưu trong bộ nhớ RAM tạm thời của script mock `greenops-dev-api.cjs` hoặc state client, mất sạch khi tắt app.
6. **Thiếu cơ chế hàng đợi Outbox bền vững trên di động (`IMP-GAP-007`, `IMP-GAP-008`):** Chưa có SQLite lưu trữ ngoại tuyến cục bộ, nguy cơ mất trắng dữ liệu khi mất mạng hoặc bị hệ điều hành tắt ngầm (`QAS-OFFLINE-01`, `QAS-OFFLINE-02`).
7. **Chưa có kiểm soát đồng thời lạc quan (OCC) & Idempotency (`IMP-GAP-009`, `IMP-GAP-014`):** Chưa hỗ trợ các trường `version`, `expectedVersion`, và header `Idempotency-Key` để bảo vệ đột biến.
8. **Chưa có kho lưu trữ kiểm toán bất biến phân tách quyền (`IMP-GAP-011`):** Chưa có bảng kiểm toán quan hệ với quyền phân tách ở tầng DB (chỉ `INSERT`/`SELECT`, cấm `UPDATE`/`DELETE`).
9. **Rò rỉ logic nghiệp vụ sang phía client (`IMP-GAP-015`):** Các tính toán xác thực đang bị phân tán trên giao diện thay vì tập trung tại máy chủ.

*Ghi chú định hướng:* Những khoảng cách trên là **lý do căn bản để tiến hành thực thi kế hoạch theo từng đợt**, tuyệt đối **không phải lý do để mở lại hay tranh cãi về mặt kiến trúc**.

---

## 16. Chiến Lược Kiểm Chứng (Verification Strategy)

Quá trình thực thi các Wave sẽ được bảo vệ bởi chiến lược kiểm chứng đa tầng:
1. **Kiểm tra kiểu tĩnh & Linting:**
   - `npm run typecheck` trên toàn bộ các workspace.
   - `npm run lint` và `npm run format:check` đảm bảo không có vi phạm định dạng.
   - Tuyệt đối cấm hạ thấp độ nghiêm ngặt của TypeScript (`strict: true`) hoặc tắt cảnh báo linter để làm biến mất lỗi.
2. **Kiểm thử hợp đồng (Contract Tests):**
   - Sử dụng Zod schema trong `@novyx/contracts` để xác thực toàn bộ payload vào/ra, header idempotency, và phân trang.
3. **Kiểm thử máy trạng thái & quy tắc miền (Domain Unit Tests):**
   - Kiểm tra toàn bộ ma trận chuyển đổi 7 trạng thái tác vụ, 4 kết luận duyệt, và điều kiện tiên quyết của 48 lệnh nghiệp vụ.
4. **Kiểm thử ranh giới kiến trúc (Architecture Boundary Tests):**
   - Tự động phát hiện và chặn các vi phạm import trái phép giữa các module và workspace.
5. **Kiểm thử tích hợp & Ngoại tuyến (Integration & Offline Tests):**
   - Kiểm thử hành vi Outbox của ứng dụng di động dưới điều kiện mất mạng hoàn toàn và khôi phục khi có sóng trở lại.
6. **Bằng chứng thực nghiệm (Empirical Evidence):**
   - Không chấp nhận tuyên bố hoàn thành mà không có log chạy kiểm thử thực tế và mã thoát (exit code) 0.

---

## 17. Các Khẳng Định Phủ Định (Negative Assertions — All Must Be FALSE)

Toàn bộ 15 khẳng định phủ định dưới đây đã được kiểm tra và đánh giá chính thức là **FALSE**:

- **P12BF-N01:** Quyết định IDB-08 đã được Chủ quản phê duyệt chính thức (`OWNER_APPROVED`).
  $\rightarrow$ **FALSE** (IDB-08 đang giữ trạng thái `DEFERRED_WITH_BOUNDARY`).
- **P12BF-N02:** Quyết định IDB-09 đã được Chủ quản phê duyệt chính thức (`OWNER_APPROVED`).
  $\rightarrow$ **FALSE** (IDB-09 đang giữ trạng thái `DEFERRED_WITH_BOUNDARY`).
- **P12BF-N03:** Quyết định IDB-10 đã được Chủ quản phê duyệt chính thức (`OWNER_APPROVED`).
  $\rightarrow$ **FALSE** (IDB-10 đang giữ trạng thái `DEFERRED_WITH_BOUNDARY`).
- **P12BF-N04:** Quyết định IDB-08 vẫn đang ở trạng thái mở không kiểm soát (`OPEN`).
  $\rightarrow$ **FALSE** (Đã chuyển sang `DEFERRED_WITH_BOUNDARY` với ranh giới và cổng kiểm soát rõ ràng).
- **P12BF-N05:** Giá trị 72 giờ là hằng số bất biến đóng băng của nghiệp vụ đối với thời gian lưu vết idempotency.
  $\rightarrow$ **FALSE** (72h chỉ là Cơ Sở Ứng Viên `CANDIDATE_BASELINE`, bắt buộc cấu hình qua biến môi trường).
- **P12BF-N06:** Giá trị 14 ngày hoặc 300 MB là chính sách dọn dẹp file di động đóng băng vĩnh viễn.
  $\rightarrow$ **FALSE** (Chỉ là `CANDIDATE_BASELINE`, cần đo đạc thực tế tại Wave 5).
- **P12BF-N07:** Render là thẩm quyền kiến trúc bắt buộc của hệ thống.
  $\rightarrow$ **FALSE** (Render chỉ là ứng viên triển khai theo hướng dẫn phi ràng buộc; hệ thống trung lập nhà cung cấp).
- **P12BF-N08:** Cloudflare R2 là thẩm quyền kiến trúc bắt buộc của hệ thống.
  $\rightarrow$ **FALSE** (Hệ thống chỉ phụ thuộc vào chuẩn `ObjectStoragePort` tương thích S3).
- **P12BF-N09:** Railway là thẩm quyền kiến trúc bắt buộc của hệ thống.
  $\rightarrow$ **FALSE** (Railway chỉ là ứng viên triển khai).
- **P12BF-N10:** Các con số hạn ngạch miễn phí của nhà cung cấp là bất biến vĩnh viễn của kiến trúc.
  $\rightarrow$ **FALSE** (Được dán nhãn là thông tin nhà cung cấp có tính thời điểm).
- **P12BF-N11:** Việc đóng băng Phase 12B đồng nghĩa với việc toàn bộ các Wave 0 đến 8 đều được phép bắt đầu đồng loạt.
  $\rightarrow$ **FALSE** (Quá trình thực thi được phân chia nghiêm ngặt theo cổng, từng wave một).
- **P12BF-N12:** Wave 1 có thể bắt đầu trước khi Wave 0 hoàn tất và được nghiệm thu độc lập.
  $\rightarrow$ **FALSE** (Wave 1 phụ thuộc nghiêm ngặt vào việc vượt qua cổng nghiệm thu của Wave 0).
- **P12BF-N13:** Các quyết định hoãn được phép vi phạm các ranh giới đã được đóng băng trong ADR và NFR.
  $\rightarrow$ **FALSE** (Các ranh giới bảo vệ được áp đặt tuyệt đối trong suốt thời gian hoãn).
- **P12BF-N14:** Bằng chứng cục bộ trên di động có thể bị xóa trong khi vẫn đang chờ trong Outbox hoặc cần để gửi lại.
  $\rightarrow$ **FALSE** (Sàn an toàn nghiêm cấm tuyệt đối việc xóa bằng chứng chưa được máy chủ xác nhận).
- **P12BF-N15:** Có bất kỳ sửa đổi mã nguồn ứng dụng nào đã diễn ra trong Phase 12B.
  $\rightarrow$ **FALSE** (0 tệp mã nguồn trong `apps/`, `packages/`, `scripts/`, `external/` bị thay đổi; 0 gói mới được cài đặt).

---

## 18. Đánh Giá Cổng Sẵn Sàng Cuối Cùng (Final Readiness Gates — P12BF-G01..12)

Toàn bộ 12 Cổng Kiểm soát Sẵn sàng Thực thi Phase 12B đều đạt trạng thái **PASS**:

| Mã Cổng | Tiêu Chí Kiểm Soát Sẵn Sàng Thực Thi | Kết Quả Đánh Giá | Trạng Thái |
| :---: | :--- | :--- | :---: |
| **P12BF-G01** | Có đúng 8 quyết định cấp triển khai được Chủ quản phê duyệt chính thức (`OWNER_APPROVED`). | IDB-01, IDB-02, IDB-03, IDB-04, IDB-05, IDB-06, IDB-07, IDB-11 đều có biên bản phê duyệt chính thức. | **PASS** |
| **P12BF-G02** | Có đúng 3 quyết định cấp triển khai được hoãn chính thức có ranh giới kiểm soát (`DEFERRED_WITH_BOUNDARY`). | IDB-08, IDB-09, IDB-10 được xác lập ranh giới bảo vệ chi tiết và tiêu chí nghiệm thu rõ ràng. | **PASS** |
| **P12BF-G03** | Không còn bất kỳ quyết định mở (`OPEN`) nào chưa được xử lý trong sổ đăng ký. | Số lượng quyết định trạng thái `OPEN` = 0. | **PASS** |
| **P12BF-G04** | Không có quyết định nào bị bác bỏ (`REJECTED`). | Số lượng quyết định trạng thái `REJECTED` = 0. | **PASS** |
| **P12BF-G05** | Toàn bộ các quyết định chặn việc khởi động kỹ thuật các Waves 1–6 đã được giải tỏa triệt để. | CSDL, framework, ORM, Auth tokens, Hash, Session, Web framework, Object storage đều đã chốt. | **PASS** |
| **P12BF-G06** | Các quyết định hoãn có cổng phê duyệt muộn nhất được xác định rõ ràng. | IDB-08 (trước Wave 8 release), IDB-09 (trước offline acceptance), IDB-10 (trước Wave 5 final). | **PASS** |
| **P12BF-G07** | Ràng buộc COST-01 bảo toàn tuyệt đối tính trung lập nhà cung cấp. | Không có vendor độc quyền nào trở thành thẩm quyền kiến trúc; Clean Architecture Port được duy trì. | **PASS** |
| **P12BF-G08** | Không có hạn ngạch nhà cung cấp có tính thời điểm nào trở thành bất biến kiến trúc. | Toàn bộ hạn ngạch được dán nhãn `[TIME-SENSITIVE PROVIDER INFORMATION]` hoặc loại bỏ khỏi sổ đăng ký. | **PASS** |
| **P12BF-G09** | Tuyệt đối không có thay đổi mã nguồn trong giai đoạn này. | `git diff` trên `apps/**`, `packages/**`, `scripts/**`, `external/**` trả về đúng 0 dòng thay đổi. | **PASS** |
| **P12BF-G10** | Không có thay đổi nào xâm phạm vào các tài liệu nghiệp vụ hoặc kiến trúc đã đóng băng. | `PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `ARCHITECTURE.md`, `adr/**` giữ nguyên. | **PASS** |
| **P12BF-G11** | Tiến trình thực thi được phân chia nghiêm ngặt theo cổng (wave-gated). | DAG thứ tự phụ thuộc từ Wave 0 đến Wave 8 được xác lập và khóa chặt; cấm thực thi đồng loạt. | **PASS** |
| **P12BF-G12** | Duy nhất Wave 0 được phép kích hoạt trong giai đoạn tiếp theo. | Wave 0 là bước kế tiếp duy nhất; Wave 1 và các wave sau tiếp tục bị khóa cho đến khi có nghiệm thu riêng. | **PASS** |

---

## 19. Trạng Thái Cuối Cùng (Final Status)

```text
PHASE 12B COMPLETE — EXECUTION READY & FROZEN
— 8 OWNER_APPROVED
— 3 DEFERRED_WITH_BOUNDARY
— 0 OPEN
— 0 REJECTED
— COST-01 FREE-FIRST CONSTRAINT PRESERVED
— PROVIDER NEUTRALITY PRESERVED
— IMPLEMENTATION MASTER PLAN FROZEN
— BUSINESS / ARCHITECTURE BASELINES UNCHANGED
— NO SOURCE IMPLEMENTATION
— IMPLEMENTATION REMAINS WAVE-GATED
— ONLY WAVE 0 IS ELIGIBLE NEXT
— READY FOR PHASE 13 / IMPLEMENTATION WAVE 0
```
