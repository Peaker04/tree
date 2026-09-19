# NOVYX GreenOps — Actor Model Reconciliation (Phase 1)

> **Tài liệu chuẩn mực thuộc Phase 1 — Actor Model Reconciliation**  
> Tuân thủ quy chuẩn quản trị chất lượng nghiêm ngặt tại [`docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md`](../NOVYX_Business_Baseline_Reconciliation_Master_Plan.md).  
>
> **Ranh giới thực thi (Hard Scope Rule)**:  
> - Phase 1 là **DECISION PHASE**. Mọi quyết định tại tài liệu này xác lập ranh giới tác nhân chuẩn mực để áp dụng cho các phase kế tiếp.  
> - Tuyệt đối **KHÔNG** chỉnh sửa tài liệu canonical (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`), không sửa sơ đồ trực quan (`docs/diagrams/`), không sửa mã nguồn (`apps/`, `packages/`).  
>
> **Định danh Baseline khởi đầu**:  
> - Branch: `base-setup`  
> - Starting Commit HEAD: [`36b036909cbe2efbd635cfb0c1daacebd3cb971a`](https://github.com/Peaker04/tree/commit/36b036909cbe2efbd635cfb0c1daacebd3cb971a)  
> - Starting Tree Hash: `cfc2ed95b54d4729250777df569b3c32ff7a3567`  
> - Trạng thái: **PHASE 1 PASS** (100% quyết định P1-D01..D05 đã chốt dứt điểm, 100% tiêu chí P1-01..P1-12 có bằng chứng nhị phân kiểm chứng được).

---

## 1. Năm Quyết Định Kiến Trúc Nghiệp Vụ Cốt Lõi (Core Decisions P1-D01..D05)

### 1.1. Quyết định P1-D01: Admin có trở thành Active Product Role không?

- **Câu hỏi**: Vai trò Quản trị viên hệ thống (Admin) có trở thành một vai trò hoạt động chính thức (Active Product Role) trong mô hình sản phẩm NOVYX GreenOps hay tiếp tục ở trạng thái `[OUT_OF_MVP] / [RESERVED]`?
- **Phân tích so sánh hai phương án**:
  - **Phương án A: ACTIVE PRODUCT ROLE (Phạm vi Quản trị & Định danh / Governance & IAM)**:
    - *Mục đích sản phẩm*: NOVYX là nền tảng quản trị vận hành cây xanh đô thị số hóa với yêu cầu khắt khe về chuỗi bằng chứng. Việc quản trị tài khoản nhân sự (onboarding/offboarding Staff, Manager), phân định vai trò, bảo vệ danh mục cây xanh đô thị (Master Data), và giám sát nhật ký kiểm toán (Audit Logs) là năng lực quản trị không thể thiếu.
    - *Bằng chứng hợp đồng hiện hành*: `packages/contracts/src/index.ts` (dòng 41) đã định nghĩa tường minh `export type UserRole = 'staff' | 'manager' | 'admin'`. Nghĩa là tầng dữ liệu và hợp đồng hệ thống đã chuẩn bị sẵn cho `admin`.
    - *Nhu cầu thực tế & Khoảng trống quản trị*: Tài liệu [`ACCESS-CONTROL.md`](../ACCESS-CONTROL.md) hiện để Admin là `RESERVED`, dẫn đến khoảng trống: không có tác nhân nào sở hữu thẩm quyền hợp pháp để tạo tài khoản, gán quyền, hoặc khóa tài khoản khi nhân viên nghỉ việc.
    - *Khắc phục defect hiện hữu*: Mã nguồn ứng dụng di động (`apps/mobile/src`) đang có lỗi nguy hiểm: ép tài khoản admin nhận quyền Manager (`admin → Manager`). Việc công nhận Admin là Active Role độc lập ở tầng Governance là tiền đề bắt buộc để loại bỏ defect này.
    - *Ảnh hưởng phạm vi MVP*: Kích hoạt Admin ở tầng nghiệp vụ Quản trị (Governance Scope), hoàn toàn không đưa Admin vào ứng dụng hiện trường của Staff/Manager.
  - **Phương án B: REMAIN RESERVED / OUT OF MVP**:
    - Giữ nguyên trạng thái `RESERVED` như tài liệu cũ.
    - *Hệ quả tiêu cực*: Tiếp tục để ngỏ chủ sở hữu của việc cấp phát tài khoản; tiếp tục dung dưỡng lỗi runtime ép `admin → Manager`; vi phạm nguyên tắc kiểm soát chất lượng không có vùng xám.
- **QUYẾT ĐỊNH (DECISION)**: **ACTIVE PRODUCT ROLE** (Trạng thái: **DECIDED**).
- **LÝ DO (RATIONALE)**: Khép kín chu trình quản trị định danh (IAM), phân định rõ ràng ai quản lý con người và hệ thống, triệt tiêu tận gốc lỗi ép Admin thành Manager, thiết lập nền tảng bảo mật vững chắc cho chuỗi bằng chứng.
- **HỆ QUẢ (CONSEQUENCES)**:
  1. Admin trở thành human actor chính thức thứ 3 của hệ thống.
  2. Phạm vi của Admin được giới hạn tuyệt đối ở tầng **Quản trị nền tảng (Governance & Administration)**.
  3. Mã nguồn client di động hiện tại sẽ phải loại bỏ các nút đăng nhập ép quyền Admin thành Manager khi chuyển sang giai đoạn Technical Implementation.
  4. Hình thái client của Admin (Web Console hay giải pháp kỹ thuật khác) sẽ được quyết định độc lập tại Phase 11 thông qua Architecture Decision Record (ADR), không làm phức tạp hóa ứng dụng di động hiện trường.
- **PHƯƠNG ÁN BỊ TỪ CHỐI (REJECTED ALTERNATIVE)**: Phương án B (`REMAIN RESERVED`) bị từ chối vì tạo ra khoảng trống thẩm quyền (Unowned Capabilities) và dung dưỡng lỗ hổng bảo mật trong mã nguồn.

---

### 1.2. Quyết định P1-D02: Admin độc lập hay là Subtype của Manager?

- **Câu hỏi**: Admin là một tác nhân con người độc lập (Independent Human Actor) hay là một tập con / mở rộng quyền lực (Subtype / Super-Manager) của Manager?
- **Nguyên tắc nghiệp vụ bất biến**:
  $$\mathbf{Admin \neq Manager}$$
- **Chứng minh bằng ma trận đối chiếu trách nhiệm (Responsibility Comparison)**:

| Tiêu chí đối chiếu | Nhân viên hiện trường (Staff) | Quản lý vận hành (Manager) | Quản trị hệ thống (Admin) |
|---|---|---|---|
| **Mục đích chính (Primary Purpose)** | Thu thập bằng chứng ngoài hiện trường, thực thi tác vụ chăm sóc cây theo hồ sơ `ProofProfile`. | Điều phối nhân lực, giám sát tiến độ toàn tuyến, giải tỏa ách tắc `BLOCKED`, thẩm định chất lượng bằng chứng. | Quản trị vòng đời tài khoản (IAM), phân quyền vai trò, quản trị danh mục chính (Master Data), giám sát kiểm toán tuân thủ. |
| **Tài nguyên làm chủ (Owned Resources)** | Nhiệm vụ được giao (`assignedStaffId === user.id`), dữ liệu cảm biến thực địa (GPS, QR, Ảnh, Checklist). | Danh sách nhiệm vụ tuyến vận hành, hàng đợi thẩm định `WAITING_REVIEW`, hàng đợi sự cố `BLOCKED`. | Danh mục người dùng & phân quyền, danh mục cây đô thị (Tree Registry), nhật ký kiểm toán (Audit Logs). |
| **Thẩm quyền vận hành (Operational Authority)** | Bắt đầu việc (`StartTask`), quét QR, đo GPS, báo sự cố (`ReportFieldIssue`), nộp hồ sơ (`SubmitTaskEvidence`). | Tạo việc, phân công, đổi người (`Reassign`), hủy việc (`CancelTask`), duyệt (`Approve`), yêu cầu làm lại (`RequestRework`). | **HOÀN TOÀN KHÔNG CÓ THẨM QUYỀN VẬN HÀNH THƯỜNG NHẬT**. |
| **Thẩm quyền quản trị (Governance Authority)** | Không có. | Không có quyền gán vai trò (`AssignRole`), không có quyền sửa đổi danh mục cây hay xem nhật ký kiểm toán bảo mật. | Cấp/khóa tài khoản, gán vai trò (`Staff`/`Manager`/`Admin`), mở khóa khẩn cấp (`Break-glass`), tra cứu Audit Trail. |
| **Ranh giới cấm tuyệt đối (Prohibited Boundaries)** | Cấm tự duyệt việc của mình (DR-HARD-02), cấm tạo việc, cấm đổi người, cấm quản trị tài khoản. | Cấm gán vai trò tài khoản, cấm hạ cấp `ProofProfile` per-task (DR-MVP-02), cấm can thiệp nhật ký kiểm toán. | Cấm thu thập bằng chứng hiện trường, cấm duyệt nhiệm vụ thường nhật, cấm tự duyệt công việc, cấm xóa lịch sử kiểm toán. |

- **QUYẾT ĐỊNH (DECISION)**: **INDEPENDENT ACTOR** (Trạng thái: **DECIDED**).
- **LÝ DO (RATIONALE)**: Thẩm quyền của Admin và Manager thuộc hai trục nghiệp vụ hoàn toàn trực giao (Orthogonal): Manager phụ trách **Vận hành thực địa (Operational Operations)**; Admin phụ trách **Quản trị hệ thống & Kiểm toán (Governance & Security)**. Việc biến Admin thành subtype hoặc supertype của Manager sẽ phá vỡ toàn bộ cấu trúc kiểm soát nội bộ và phân tách quyền lực.

---

### 1.3. Quyết định P1-D03: Admin có tham gia Task Operations thông thường không?

- **Câu hỏi**: Admin có được cấp quyền thực hiện các hành động trong chu trình nhiệm vụ vận hành hiện trường thông thường (Normal Task Operations) hay không?
- **Nguyên tắc đánh giá**: Default là **DENY**. Mọi hành động không có lý do nghiệp vụ trực tiếp bắt buộc phải bị từ chối. Không cấp quyền suy diễn "Admin làm được tất cả".
- **Bảng thẩm định chi tiết từng hành động (Action-by-Action Evaluation)**:

| Hành động vận hành | Thẩm quyền của Admin | Cơ sở lý luận & Ràng buộc nghiệp vụ |
|---|:---:|---|
| `CreateTask` | **DENY** | Thuộc thẩm quyền độc quyền của Manager dựa trên kế hoạch điều phối thực địa. Admin không quản lý lịch trình chăm sóc cây hàng ngày. |
| `AssignTask` | **DENY** | Thuộc thẩm quyền của Manager dựa trên khối lượng công việc và năng lực nhân sự thực tế. |
| `Reassign` | **DENY** | Thuộc thẩm quyền của Manager khi xử lý ách tắc hoặc điều chuyển nguồn lực hiện trường. |
| `StartTask` | **DENY** | Thuộc thẩm quyền độc quyền của Staff nhận việc ngoài hiện trường. |
| `VerifySite` (QR/GPS) | **DENY** | Đòi hỏi sự hiện diện vật lý tại tọa độ cây của Staff. Admin không phải nhân sự thực địa. |
| `CollectEvidence` (Ảnh/Checklist) | **DENY** | Đòi hỏi quan sát thực tế và chụp ảnh hiện trường của Staff. |
| `ReportFieldIssue` | **DENY** | Phát sinh từ trở ngại khách quan ngoài hiện trường của Staff. |
| `SubmitEvidence` | **DENY** | Cam kết trách nhiệm hồ sơ của chính Staff thực hiện nhiệm vụ. |
| `Review` | **DENY** | Quy trình chuyên môn nghiệp vụ cây xanh do Manager phụ trách thẩm định. |
| `Approve` | **DENY** | Quyết định nghiệm thu chất lượng do Manager chịu trách nhiệm vận hành. |
| `ApproveWithException` | **DENY** | Đòi hỏi đánh giá rủi ro hiện trường của Manager; Admin không có thẩm quyền bỏ qua bằng chứng thực địa. |
| `RequestRework` | **DENY** | Chỉ đạo kỹ thuật khắc phục sai sót do Manager ban hành cho Staff. |
| `Cancel` (Operational) | **DENY** | Hủy nhiệm vụ vận hành thường nhật do Manager quyết định kèm lý do vận hành bắt buộc (DR-POL-04). |

- **QUYẾT ĐỊNH (DECISION)**: **DENY TRÊN TOÀN BỘ NORMAL TASK OPERATIONS** (Trạng thái: **DECIDED**).
- **LÝ DO (RATIONALE)**: Ngăn chặn triệt để nguy cơ Admin can thiệp trái thẩm quyền vào chuỗi bằng chứng khách quan. Nếu hệ thống xảy ra sự cố kỹ thuật nghiêm trọng hoặc ách tắc diện rộng đòi hỏi can thiệp, hành động đó phải đi qua luồng ngoại lệ có kiểm toán nghiêm ngặt (**Break-Glass Action**) chứ không bao giờ là quyền tác vụ thông thường.

---

### 1.4. Quyết định P1-D04: Định nghĩa Tác nhân Hệ thống (System Actor)

- **Câu hỏi**: Tác nhân Hệ thống (System Actor) được định vị như thế nào trong mô hình tác nhân?
- **Bản chất**: **TECHNICAL ACTOR** (Tác nhân kỹ thuật tự động hóa nền tảng, hoàn toàn **KHÔNG PHẢI CON NGƯỜI**).
- **Trách nhiệm của System**:
  1. *Đồng bộ ngoại tuyến*: Tự động xử lý hàng đợi Outbox khi thiết bị kết nối lại mạng Internet.
  2. *Duy trì phiên làm việc*: Tự động làm mới accessToken qua refreshToken trước khi hết hạn.
  3. *Điều phối cảm biến & Quyền*: Kiểm tra tính khả dụng của cảm biến GPS và quyền Camera theo ngữ cảnh.
  4. *Thực thi chính sách tất định (Deterministic Policy Enforcement)*: Tự động tính toán khoảng cách GPS ($\le 10$m), so khớp mã QR, kiểm tra tính đầy đủ của hồ sơ bằng chứng theo hợp đồng `ProofProfile`.
  5. *Phát thông báo tự động*: Gửi thông báo đẩy (push notification) cho Staff khi có task mới/yêu cầu làm lại, hoặc cho Manager khi có task nộp duyệt.
- **Phạm vi Dữ liệu Đọc/Ghi**:
  - *Readable*: Trạng thái cảm biến thiết bị, bộ đệm ngoại tuyến (SQLite/Outbox), trạng thái kết nối mạng, token phiên.
  - *Writable*: Bộ đệm dữ liệu cục bộ, hàng đợi đồng bộ, bản ghi nhật ký kiểm toán hệ thống (System Audit Events).
- **Các quyết định bị CẤM TUYỆT ĐỐI đối với System**:
  1. **CẤM** đưa ra phán quyết thẩm định chất lượng thay con người (Không tự ý Approve, Reject hoặc RequestRework hồ sơ bằng chứng).
  2. **CẤM** tự động gán hoặc nâng quyền tài khoản người dùng thành Admin.
  3. **CẤM** giả mạo (impersonate) danh tính của Staff, Manager hoặc Admin trong các bản ghi nghiệp vụ.
  4. **CẤM** âm thầm bỏ qua (silent bypass) các quy tắc phân quyền hoặc điều kiện tiên quyết (Preconditions).
- **QUYẾT ĐỊNH (DECISION)**: **TECHNICAL AUTOMATION ACTOR ONLY** (Trạng thái: **DECIDED**).

---

### 1.5. Quyết định P1-D05: Có cần tách Business Admin vs Infrastructure / DevOps Administrator không?

- **Câu hỏi**: Có cần tạo thêm một vai trò tác nhân sản phẩm thứ 5 đại diện cho Quản trị viên hạ tầng / DevOps hay không?
- **Phân tích ranh giới nghiệp vụ**:
  - **Business Administrator (Admin)**: Là tác nhân thuộc mô hình sản phẩm (In-Product Actor Model). Quản lý người dùng, phân quyền các role `Staff`/`Manager`/`Admin`, quản lý danh mục cây xanh đô thị, tra cứu nhật ký kiểm toán tuân thủ.
  - **Infrastructure / DevOps Administrator**: Quản trị cụm máy chủ, cơ sở dữ liệu vật lý (PostgreSQL / Redis), mạng, Kubernetes, CI/CD pipeline, bảo mật đường truyền. Tác nhân này nằm hoàn toàn ngoài phạm vi mô hình nghiệp vụ ứng dụng (Outside Product Business Model), không tương tác với các entity nghiệp vụ thông qua phần mềm ứng dụng.
- **QUYẾT ĐỊNH (DECISION)**: **KHÔNG TẠO ACTOR THỨ 5 TRONG PRODUCT MODEL** (Trạng thái: **DECIDED**).
- **LÝ DO (RATIONALE)**: Mô hình tác nhân sản phẩm chỉ quản lý các chủ thể tương tác với nghiệp vụ GreenOps. Việc đưa Infrastructure/DevOps vào ứng dụng là sai lệch ranh giới kiến trúc (Architecture Boundary Violation). Mọi quyền hạn quản trị trong ứng dụng tập trung duy nhất vào vai trò **Admin**.

---

## 2. Sổ Đăng Ký Tác Nhân Chuẩn Tắc (Authoritative Actor Registry)

Bảng phân loại chuẩn xác 4 tác nhân duy nhất của NOVYX GreenOps:

| Tác nhân (Actor) | Bản chất (Type) | Trạng thái Sản phẩm | Mục đích vận hành chính (Primary Purpose) | Phạm vi dữ liệu đọc (Readable Scope) | Phạm vi dữ liệu ghi (Writable Scope) | Quyết định làm chủ (Owned Decisions) | Ranh giới cấm tuyệt đối (Forbidden Actions) | Tham gia Task thường nhật? | Yêu cầu Lưu vết Kiểm toán (Audit Requirement) | Nguồn kiểm chứng thực tế (Evidence Source) |
|---|---|---|---|---|---|---|---|:---:|---|---|
| **Nhân viên hiện trường (Staff)** | Human Actor | **CURRENT MVP** | Trực tiếp chăm sóc cây và thu thập chuỗi bằng chứng xác thực ngoài hiện trường. | Chỉ các cây được giao, chỉ các nhiệm vụ cá nhân (`assignedStaffId === user.id`), thông báo cá nhân, lịch sử chăm sóc cây liên quan. | Bấm `StartTask`, quét QR, đo GPS, báo ngoại lệ, chụp ảnh bằng chứng, tích checklist, báo sự cố `ReportFieldIssue`, nộp hồ sơ `SubmitTaskEvidence`. | Xác nhận bắt đầu làm việc; ghi nhận trung thực hiện trạng hiện trường; nộp báo cáo hoàn thành. | CẤM tự duyệt việc của mình (DR-HARD-02); CẤM tạo task; CẤM đổi người; CẤM quản trị tài khoản; CẤM ngụy tạo bằng chứng. | **CÓ (Chính)** | Toàn bộ thao tác đo đạc GPS, quét QR, ảnh chụp và thời gian nộp đều gắn chặt với `userId` và timestamp bất biến. | `contracts:index.ts:86`<br>`ACCESS-CONTROL.md:13` |
| **Quản lý vận hành (Manager)** | Human Actor | **CURRENT MVP** | Điều phối nguồn lực, giám sát tiến độ toàn tuyến, xử lý ách tắc và thẩm định chất lượng bằng chứng. | Toàn bộ danh mục cây, toàn bộ danh sách nhiệm vụ toàn tuyến, danh sách nhân viên hiện trường, hàng đợi `WAITING_REVIEW`, hàng đợi sự cố `BLOCKED`. | Tạo nhiệm vụ mới, phân công nhân viên, đổi người (`Reassign`), hủy việc (`CancelTask`), giải tỏa `BLOCKED`, thẩm định duyệt (`Approve`), duyệt ngoại lệ (`ApproveWithException`), yêu cầu làm lại (`RequestRework`). | Quyết định giao việc cho ai; quyết định giải tỏa sự cố hiện trường; phán quyết chất lượng hồ sơ bằng chứng (Đạt, Ngoại lệ, Làm lại). | CẤM gán vai trò tài khoản; CẤM hạ cấp ProofProfile tùy tiện per-task (DR-MVP-02); CẤM duyệt thiếu bằng chứng mà không có lý do; CẤM sửa task đã đóng; CẤM can thiệp audit log. | **CÓ (Chính)** | Quyết định duyệt, duyệt ngoại lệ kèm lý do, yêu cầu làm lại có mục tiêu, hủy task kèm lý do bắt buộc đều lưu vết vĩnh viễn. | `contracts:index.ts:64`<br>`ACCESS-CONTROL.md:14` |
| **Quản trị hệ thống (Admin)** | Human Actor | **ACTIVE PRODUCT ROLE** *(Governance & IAM Scope)* | Quản trị vòng đời tài khoản, phân quyền vai trò, quản trị danh mục chính và giám sát kiểm toán tuân thủ. | Danh bạ người dùng toàn hệ thống, ma trận phân quyền vai trò, danh mục cây đô thị (Tree Registry), nhật ký kiểm toán hệ thống (Audit Logs). | Khởi tạo tài khoản, kích hoạt/khóa tài khoản, gán vai trò (`AssignRole`), cập nhật thông tin Master Data danh mục cây, kích hoạt cơ chế khẩn cấp `Break-glass` có lưu vết. | Quyết định cấp quyền truy cập hệ thống; quyết định gán vai trò cho người dùng; quyết định cập nhật danh mục cây chính; phê duyệt quyền mở khóa đặc biệt khẩn cấp. | CẤM thực hiện thu thập bằng chứng hiện trường; CẤM duyệt nhiệm vụ vận hành thường nhật; CẤM tự duyệt công việc của mình; CẤM xóa hoặc sửa đổi nhật ký kiểm toán; CẤM ghi đè tác giả lịch sử. | **KHÔNG** *(Tuyệt đối không tham gia luồng task thường nhật)* | Mọi hành vi tạo user, đổi role, khóa tài khoản, sửa master-data, kích hoạt break-glass đều bắt buộc sinh Audit Event bất biến. | `contracts:index.ts:41`<br>`ACCESS-CONTROL.md:15` |
| **Hệ thống tự động (System)** | Technical Actor | **TECHNICAL AUTOMATION** | Tự động hóa nền tảng, điều phối đồng bộ ngoại tuyến, kiểm soát token phiên và thực thi chính sách tất định. | Trạng thái cảm biến thiết bị, bộ đệm ngoại tuyến (SQLite/Outbox), trạng thái kết nối mạng, token phiên. | Bộ đệm dữ liệu cục bộ, hàng đợi Outbox, cập nhật trạng thái đồng bộ, ghi nhật ký kiểm toán kỹ thuật. | Xác định khoảng cách GPS hợp lệ ($\le 10$m); xác định mã QR trùng khớp; xác định tính đầy đủ của bằng chứng trước khi cho phép nộp. | CẤM đưa ra phán quyết thẩm định chất lượng thay con người; CẤM tự cấp quyền Admin; CẤM giả mạo danh tính con người; CẤM bỏ qua điều kiện bảo mật. | **CÓ (Hỗ trợ tự động)** | Lưu vết thời gian đồng bộ, kết quả kiểm tra tự động mã QR/GPS và các lỗi kết nối ngoại tuyến. | `ACCESS-CONTROL.md:16`<br>`MobileApp.tsx` |

---

## 3. Ma Trận Quyền Hạn & Trách Nhiệm Chi Tiết (Role Responsibility Matrix)

Quy ước giá trị nghiêm ngặt:
- **`OWNER`**: Chủ sở hữu toàn quyền ra quyết định và chịu trách nhiệm tối hậu.
- **`EXECUTE`**: Trực tiếp thao tác thực thi hành động.
- **`READ`**: Có quyền xem dữ liệu phục vụ nhiệm vụ.
- **`SUPPORT`**: Hỗ trợ kỹ thuật hoặc tự động hóa quy trình.
- **`FORBIDDEN`**: Nghiêm cấm tuyệt đối theo chính sách an ninh & phân tách trách nhiệm.
- **`N/A`**: Không áp dụng đối với vai trò này.

| Nhóm Năng lực / Trách nhiệm | Staff | Manager | Admin | System |
|---|:---:|:---:|:---:|:---:|
| **1. Xác thực & Quản lý Phiên (Authentication & Session)** | EXECUTE | EXECUTE | EXECUTE | SUPPORT |
| **2. Thực thi Nhiệm vụ Cá nhân (Own Task Execution - StartTask)** | **OWNER / EXECUTE** | FORBIDDEN | FORBIDDEN | SUPPORT |
| **3. Xác thực Hiện trường (Site Verification - QR & GPS $\le 10$m)** | **EXECUTE** | FORBIDDEN | FORBIDDEN | **SUPPORT (Validate)** |
| **4. Thu thập Bằng chứng (Evidence Acquisition - Ảnh, Checklist)** | **EXECUTE** | FORBIDDEN | FORBIDDEN | SUPPORT |
| **5. Báo cáo Sự cố Hiện trường (Field Issue Reporting - BLOCKED)** | **EXECUTE** | READ | READ | SUPPORT |
| **6. Khởi tạo Nhiệm vụ Vận hành (Task Creation)** | FORBIDDEN | **OWNER / EXECUTE** | FORBIDDEN | N/A |
| **7. Phân công & Đổi người (Assignment & Reassignment)** | FORBIDDEN | **OWNER / EXECUTE** | FORBIDDEN | SUPPORT |
| **8. Xử lý Ách tắc Hiện trường (Blocked Resolution)** | READ | **OWNER / EXECUTE** | FORBIDDEN | SUPPORT |
| **9. Thẩm định Nghiệm thu Bằng chứng (Review & Decision)** | FORBIDDEN | **OWNER / EXECUTE** | FORBIDDEN | FORBIDDEN |
| **10. Hủy Nhiệm vụ Vận hành (Operational Task Cancellation)** | FORBIDDEN | **OWNER / EXECUTE** | FORBIDDEN | N/A |
| **11. Khởi tạo & Kích hoạt Người dùng (User Management)** | FORBIDDEN | FORBIDDEN | **OWNER / EXECUTE** | SUPPORT |
| **12. Phân quyền & Gán Vai trò (Role Assignment - Staff/Manager/Admin)** | FORBIDDEN | FORBIDDEN | **OWNER / EXECUTE** | FORBIDDEN |
| **13. Vòng đời Tài khoản (Account Suspension / Unlock / Reset)** | FORBIDDEN | FORBIDDEN | **OWNER / EXECUTE** | SUPPORT |
| **14. Quản trị Danh mục Cây Đô thị (Tree Master-Data Governance)** | READ | READ | **OWNER / EXECUTE** | SUPPORT |
| **15. Quản trị Chính sách & Mẫu kiểm tra (Policy & Template Governance)** | READ | READ | **OWNER / EXECUTE** | N/A |
| **16. Tra cứu & Xuất Nhật ký Kiểm toán (Audit Log Inspection)** | FORBIDDEN | READ (Limited) | **OWNER / READ (Full)** | SUPPORT (Write log) |
| **17. Mở khóa Ngoại lệ Khẩn cấp (Break-Glass Authorization)** | FORBIDDEN | FORBIDDEN | **EXECUTE (With Reason)** | SUPPORT (Enforce log) |
| **18. Đồng bộ Ngoại tuyến & Đẩy Outbox (Sync & Outbox Coordination)** | N/A | N/A | N/A | **OWNER / EXECUTE** |
| **19. Phát Thông báo Vận hành (Operational Notifications Dispatch)** | READ | READ | READ | **OWNER / EXECUTE** |

---

## 4. Định Nghĩa Phạm Vi Dữ Liệu Đọc (Readable Scope)

Tuân thủ tiêu chuẩn P1-03, phạm vi đọc của từng actor được xác định cụ thể, nghiêm cấm khái niệm mơ hồ "đọc tất cả":

1. **Nhân viên hiện trường (Staff)**:
   - Danh sách các nhiệm vụ được phân công trực tiếp cho chính mình (`assignedStaffId === currentUser.id`).
   - Hồ sơ thuộc tính của các cây mục tiêu gắn liền với các nhiệm vụ được giao.
   - Lịch sử chăm sóc (`CareHistory`) đã hoàn thành của cây mục tiêu liên quan.
   - Hộp thư thông báo vận hành gửi đích danh cho tài khoản cá nhân.
   - Trạng thái kết nối và tiến độ đồng bộ của hàng đợi Outbox trên thiết bị cá nhân.

2. **Quản lý vận hành (Manager)**:
   - Toàn bộ danh sách nhiệm vụ vận hành thuộc phạm vi quản lý tuyến/khu vực phụ trách.
   - Khối lượng công việc (workload) và trạng thái phân công của toàn bộ nhân viên hiện trường (`StaffDto`).
   - Hàng đợi hồ sơ nộp duyệt (`WAITING_REVIEW`) và hàng đợi sự cố hiện trường (`BLOCKED`).
   - Toàn bộ danh mục cây đô thị trong khu vực quản lý.
   - Lịch sử các quyết định phê duyệt và yêu cầu làm lại trước đây.

3. **Quản trị hệ thống (Admin)**:
   - Danh bạ tài khoản người dùng toàn hệ thống (Staff, Manager, Admin) và trạng thái hoạt động (Active, Suspended).
   - Bảng phân quyền vai trò hiện tại và lịch sử thay đổi vai trò của từng tài khoản.
   - Toàn bộ sổ nhật ký kiểm toán hệ thống (Audit Trail) bao gồm actor, timestamp, action, resource, reason.
   - Toàn bộ danh mục cây đô thị (Tree Master-Data Registry) phục vụ cấu hình và chuẩn hóa dữ liệu.
   - Bảng ánh xạ danh mục loại công việc (`TaskType`) và hồ sơ bằng chứng chuẩn tắc (`ProofProfile`).

4. **Hệ thống tự động (System)**:
   - Trạng thái cảm biến thiết bị (GPS accuracy, Camera readiness).
   - Bộ đệm dữ liệu ngoại tuyến (SQLite database) và bảng hàng đợi Outbox.
   - Trạng thái phiên xác thực (accessToken, refreshToken, thời hạn expiresAt).
   - Metadata kiểm tra tính đầy đủ của bằng chứng (proof completion completeness check).

---

## 5. Định Nghĩa Phạm Vi Dữ Liệu Ghi (Writable Scope)

Tuân thủ tiêu chuẩn P1-04, phân tách rạch ròi 3 nhóm quyền ghi: Business Mutation, Governance Mutation, và Technical Mutation:

```text
               ┌─────────────────────────────────────────────────────────┐
               │                  WRITABLE SCOPE MAPPING                 │
               └─────────────────────────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
│   BUSINESS MUTATION   │       │  GOVERNANCE MUTATION  │       │  TECHNICAL MUTATION   │
│ (Staff & Manager)     │       │ (Admin Only)          │       │ (System Only)         │
├───────────────────────┤       ├───────────────────────┤       ├───────────────────────┤
│ • Task lifecycle state│       │ • User provisioning  │       │ • SQLite local cache  │
│ • Site verification   │       │ • Role assignment     │       │ • Outbox queue sync   │
│ • Proof acquisition   │       │ • Account status      │       │ • Token refresh       │
│ • Review decisions    │       │ • Tree master-data    │       │ • System audit event  │
│ • Issue reporting     │       │ • Break-glass trigger │       │ • Notification push   │
└───────────────────────┘       └───────────────────────┘       └───────────────────────┘
```

1. **Nhóm Thay đổi Nghiệp vụ Vận hành (Business Mutation)**:
   - *Chủ sở hữu*: **Staff & Manager**.
   - *Staff được ghi*: Chuyển trạng thái `StartTask`, ghi tọa độ đo GPS, ghi kết quả quét QR, upload ảnh bằng chứng, cập nhật trạng thái checklist, gửi báo cáo sự cố `ReportFieldIssue`, nộp hồ sơ `SubmitTaskEvidence`.
   - *Manager được ghi*: Tạo bản ghi Task mới, gán `assignedStaffId`, chuyển trạng thái `Reassign`, chuyển trạng thái `CancelTask` (kèm lý do), giải tỏa `BLOCKED`, ghi nhận quyết định `Approve` / `ApproveWithException` / `RequestRework`.
   - *Admin & System*: **HOÀN TOÀN BỊ CẤM GHI VÀO CÁC TRƯỜNG DỮ LIỆU NÀY**.

2. **Nhóm Thay đổi Quản trị & Định danh (Governance Mutation)**:
   - *Chủ sở hữu độc quyền*: **Admin**.
   - *Admin được ghi*: Thêm mới người dùng, cập nhật trạng thái kích hoạt/khóa tài khoản, thay đổi vai trò người dùng (`AssignRole`), tạo/sửa đổi bản ghi danh mục cây chính (Tree Registry), kích hoạt mở khóa khẩn cấp (`Break-glass`) bắt buộc kèm lý do.
   - *Staff, Manager, System*: **HOÀN TOÀN BỊ CẤM GHI VÀO CÁC TRƯỜNG DỮ LIỆU NÀY**.

3. **Nhóm Thay đổi Kỹ thuật Nền tảng (Technical Mutation)**:
   - *Chủ sở hữu*: **System**.
   - *System được ghi*: Bản ghi hàng đợi Outbox, cập nhật cờ đồng bộ `syncedAt`, ghi đè accessToken mới vào bộ lưu trữ bảo mật (SecureStore), ghi nhận nhật ký lỗi kết nối mạng kỹ thuật.

---

## 6. Ranh Giới Cấm Tuyệt Đối (Explicit Forbidden Boundaries)

Tuân thủ tiêu chuẩn P1-05, thiết lập các rào cản bất khả xâm phạm đối với từng tác nhân:

### 6.1. Ranh giới cấm đối với Nhân viên hiện trường (Staff)
- **CẤM 1 (DR-HARD-02)**: Tuyệt đối CẤM tự phê duyệt nhiệm vụ do chính mình thực hiện.
- **CẤM 2**: Tuyệt đối CẤM tự tạo nhiệm vụ mới hoặc tự ý chuyển giao nhiệm vụ cho nhân viên khác.
- **CẤM 3 (DR-HARD-01)**: Tuyệt đối CẤM chuyển đổi nhiệm vụ sang cây khác (Cây mục tiêu là bất biến).
- **CẤM 4 (DR-HARD-04)**: Tuyệt đối CẤM ngụy tạo bằng chứng giả mạo không có giá trị tái tạo.
- **CẤM 5**: Tuyệt đối CẤM can thiệp vào cấu hình người dùng, danh mục cây hoặc phân quyền hệ thống.

### 6.2. Ranh giới cấm đối với Quản lý vận hành (Manager)
- **CẤM 1**: Tuyệt đối CẤM khởi tạo, kích hoạt hoặc gán vai trò (`AssignRole`) cho tài khoản người dùng.
- **CẤM 2 (DR-MVP-02)**: Tuyệt đối CẤM tùy tiện hạ cấp `ProofProfile` của một nhiệm vụ đơn lẻ.
- **CẤM 3 (DR-HARD-06)**: Tuyệt đối CẤM phân công lại trực tiếp khi nhiệm vụ đang ở trạng thái `IN_PROGRESS` hoặc `WAITING_REVIEW`.
- **CẤM 4 (DR-HARD-05)**: Tuyệt đối CẤM chỉnh sửa dữ liệu của nhiệm vụ đã ở trạng thái đóng (`COMPLETED` hoặc `CANCELLED`).
- **CẤM 5**: Tuyệt đối CẤM chỉnh sửa, can thiệp hoặc xóa bỏ nhật ký kiểm toán hệ thống.

### 6.3. Ranh giới cấm đối với Quản trị hệ thống (Admin)
- **CẤM 1**: Tuyệt đối CẤM thực hiện các hành động thu thập bằng chứng hiện trường thay cho Staff.
- **CẤM 2**: Tuyệt đối CẤM thẩm định hoặc phê duyệt các nhiệm vụ vận hành thường nhật thay cho Manager.
- **CẤM 3**: Tuyệt đối CẤM tự phê duyệt công việc do chính mình khởi tạo hoặc can thiệp (chống độc quyền phán quyết).
- **CẤM 4**: Tuyệt đối CẤM âm thầm sửa đổi dữ liệu vận hành mà không qua cơ chế Break-glass có lưu vết kiểm toán.
- **CẤM 5**: Tuyệt đối CẤM xóa bỏ hoặc chỉnh sửa lịch sử danh tính tác giả trong các báo cáo lịch sử chăm sóc cây (`CareHistory`).

### 6.4. Ranh giới cấm đối với Hệ thống tự động (System)
- **CẤM 1**: Tuyệt đối CẤM đưa ra các phán quyết nghiệm thu chất lượng thay thế sự suy xét của con người.
- **CẤM 2**: Tuyệt đối CẤM tự động nâng quyền người dùng hoặc cấp phát quyền Admin.
- **CẤM 3**: Tuyệt đối CẤM giả mạo danh tính của bất kỳ con người nào trong các bản ghi nghiệp vụ.

---

## 7. Kiểm Toán Khiếm Khuyết Hiện Hành: Non-Staff ≠ Manager (Tiêu chuẩn P1-06)

Kiểm toán trực tiếp trên mã nguồn baseline (`36b0369`) xác định các vị trí vi phạm quy tắc `Non-Staff ≠ Manager` và cơ chế ép `admin → Manager`:

| STT | File nguồn | Vị trí ký hiệu / Dòng | Hành vi vi phạm thực tế trong mã nguồn | Phân tích tác động an ninh & nghiệp vụ | Phân loại quản trị |
|---|---|---|---|---|:---:|
| 1 | `apps/mobile/src/services/greenOpsService.ts` | Dòng 349:<br>`mapSessionRole` | `const mapSessionRole = (session: AuthSession): Role => (session.user.role === 'staff' ? 'Staff' : 'Manager');` | **Quy tắc nhị phân sai lệch**: Bất kỳ người dùng nào không phải `'staff'` (bao gồm cả tài khoản có `role === 'admin'`) đều bị mặc định ép nhận vai trò `'Manager'`. | **IMPLEMENTATION GAP FOR LATER PHASE** |
| 2 | `apps/mobile/src/screens/MobileApp.tsx` | Dòng 398:<br>`onLogin` fallback | `normalized.includes('manager') \|\| normalized.includes('admin') ? 'Manager' : 'Staff'` | **Gán ghép vai trò tùy tiện**: Nếu tên đăng nhập chứa `'admin'`, hệ thống ép cấp quyền `'Manager'`. | **IMPLEMENTATION GAP FOR LATER PHASE** |
| 3 | `apps/mobile/src/screens/MobileApp.tsx` | Dòng 475:<br>Quick Login button | `<Text style={styles.quickDesc}>Admin (Manager)</Text>` | Nhãn giao diện người dùng công khai thừa nhận sai lầm Admin là một dạng của Manager. | **IMPLEMENTATION GAP FOR LATER PHASE** |
| 4 | `apps/mobile/src/screens/LoginScreen.tsx` | Dòng 41 & 117 | `setPassword('admin123');`<br>`Admin (Manager)` | Màn hình đăng nhập cung cấp lối tắt đăng nhập Admin nhưng trả về giao diện của Manager. | **IMPLEMENTATION GAP FOR LATER PHASE** |
| 5 | `packages/contracts/src/index.ts` | Dòng 64:<br>`export type Role` | `export type Role = 'Staff' \| 'Manager';` | Type `Role` dùng cho UI chỉ có 2 giá trị, trong khi `UserRole` ở dòng 41 có 3 giá trị (`'staff' \| 'manager' \| 'admin'`), buộc tầng UI phải ép kiểu sai lệch. | **IMPLEMENTATION GAP FOR LATER PHASE** |

> **Cam kết tuân thủ ranh giới (Phase 1 Boundary Rule)**:  
> Việc phát hiện 5 khiếm khuyết trên **KHÔNG** làm thất bại Phase 1. Trạng thái mã nguồn được giữ nguyên trạng thái Read-Only. Các khiếm khuyết này được đăng ký chính thức là **Khoảng trống triển khai cần khắc phục tại các pha kỹ thuật sau** (sau khi Business Baseline Freeze được phê duyệt).

---

## 8. Bằng Chứng Phân Tách Quyền Lực Tuyệt Đối (P1-07, P1-08, P1-09, P1-10)

### 8.1. Kiểm chứng P1-07: Staff Privileges ∩ Manager/Admin Privileged Mutations = $\emptyset$
- Tập quyền thay đổi dữ liệu của Staff: $\{\text{StartTask}, \text{VerifySite}, \text{CollectEvidence}, \text{ReportFieldIssue}, \text{SubmitEvidence}\}$.
- Tập quyền thay đổi đặc quyền của Manager & Admin: $\{\text{CreateTask}, \text{AssignTask}, \text{Reassign}, \text{CancelTask}, \text{Approve}, \text{ApproveWithException}, \text{RequestRework}, \text{UserProvisioning}, \text{AssignRole}, \text{AccountSuspension}, \text{MasterDataMutation}, \text{BreakGlass}\}$.
- **Giao tập (Intersection)**: Hoàn toàn rỗng ($\emptyset$). Không tồn tại bất kỳ quyền quản trị hoặc thẩm định nào bị rò rỉ sang Staff.

### 8.2. Kiểm chứng P1-08: Manager Privileges ∩ Admin-Only Governance Mutations = $\emptyset$
- Tập quyền của Manager: Điều phối và thẩm định tác vụ hiện trường.
- Tập quyền đặc quyền độc quyền của Admin: $\{\text{UserProvisioning}, \text{AssignRole}, \text{AccountSuspension}, \text{BreakGlass}, \text{MasterDataRetire}\}$.
- **Giao tập (Intersection)**: Hoàn toàn rỗng ($\emptyset$). Manager không mặc nhiên có bất kỳ quyền quản trị tài khoản, phân quyền hoặc can thiệp hệ thống nào.

### 8.3. Kiểm chứng P1-09: Negative Check chống "Admin Super-Manager"
- Toàn bộ văn bản tài liệu Phase 1 đã được kiểm tra:
  - KHÔNG chứa quy tắc nào coi "Admin kế thừa Manager" (Admin inherits Manager).
  - KHÔNG chứa quy tắc nào coi "Admin là Super-Manager".
  - KHÔNG chứa quy tắc nào cho phép Admin tự động duyệt task hoặc tham gia vào normal task operations.
- Admin bị **DENY 100%** trên toàn bộ các hành động vận hành thường nhật (Mục 1.3).

### 8.4. Kiểm chứng P1-10: System Humanization Check
- System được định vị 100% là **Technical Automation Actor**.
- KHÔNG có tài khoản đăng nhập con người mang tên System.
- KHÔNG có quyền can thiệp vào các phán quyết suy xét của con người (Human Discretionary Review).

---

## 9. Năm Nguyên Tắc Phân Tách Trách Nhiệm Bất Biến (SoD Principles - P1-11)

Dự án thiết lập 5 nguyên tắc Phân tách Trách nhiệm (Separation of Duties) chuẩn tắc:

- **SoD-01 (Cấm tự phê duyệt - No Self-Review)**: Người thực thi nhiệm vụ (Executor) tuyệt đối không được phê duyệt nhiệm vụ của chính mình dưới bất kỳ hình thức nào.
- **SoD-02 (Tách biệt Vận hành và Quản trị - Separation of Operations and Governance)**: Thẩm quyền điều phối vận hành hiện trường của Manager hoàn toàn độc lập và không thể thay thế cho thẩm quyền quản trị nền tảng của Admin.
- **SoD-03 (Bảo toàn Chính danh Tác giả Lịch sử - Historical Attribution Preservation)**: Mọi thao tác thay đổi vai trò (`AssignRole`) hoặc khóa tài khoản (`SuspendAccount`) của Admin tuyệt đối không được làm thay đổi hoặc xóa bỏ danh tính người thực hiện trong các bản ghi lịch sử (`CareHistory`, `AuditTrail`).
- **SoD-04 (Mở khóa Khẩn cấp có Kiểm toán - Controlled Break-Glass)**: Cơ chế can thiệp khẩn cấp (Break-glass) là luồng ngoại lệ có lưu vết kiểm toán bắt buộc (gồm Actor, Timestamp, Lý do cụ thể, Cảnh báo an ninh), tuyệt đối không phải là quyền truy cập mặc định thường nhật của Admin.
- **SoD-05 (Tự động hóa không thay thế Phán quyết Con người - Automation Cannot Replace Human Judgement)**: Tác nhân tự động hóa (System) chỉ được phép kiểm tra các điều kiện tiên quyết tất định (GPS, QR, Checklist đầy đủ); tuyệt đối không được tự động phê duyệt nghiệm thu chất lượng thay cho Manager.

---

## 10. Trạng Thái Khóa Quyết Định Mở (Decision Status - P1-12)

Đối chiếu toàn bộ 5 quyết định kiến trúc bắt buộc của Phase 1:

| Quyết định | Nội dung câu hỏi kiến trúc | Trạng thái Chốt | Kết luận dứt điểm |
|---|---|:---:|---|
| **P1-D01** | Admin có trở thành active product role không? | **DECIDED** | **ACTIVE PRODUCT ROLE** (ở phạm vi Quản trị & Định danh; không vào mobile field app). |
| **P1-D02** | Admin là human actor độc lập hay subtype của Manager? | **DECIDED** | **INDEPENDENT ACTOR** (Tuân thủ triệt để nguyên tắc bất biến $\text{Admin} \neq \text{Manager}$). |
| **P1-D03** | Admin có tham gia normal Task Operations không? | **DECIDED** | **DENY TRÊN TOÀN BỘ NORMAL TASK OPERATIONS** (Không làm super-manager). |
| **P1-D04** | Định vị và phạm vi của System actor là gì? | **DECIDED** | **TECHNICAL AUTOMATION ACTOR ONLY** (Không nhân cách hóa, không duyệt thay người). |
| **P1-D05** | Có cần tách Business Admin và Infrastructure Admin không? | **DECIDED** | **CHỈ DUY TRÌ ADMIN TRONG PRODUCT MODEL** (DevOps nằm ngoài mô hình sản phẩm). |

> **Chỉ số kiểm soát chất lượng P1-12**:  
> - Số lượng quyết định ở trạng thái `TBD`: **0**  
> - Số lượng quyết định ở trạng thái `MAYBE`: **0**  
> - Số lượng quyết định ở trạng thái `TO DISCUSS LATER`: **0**  
> - Kết luận: **100% quyết định P1-D01..P1-D05 đã chốt dứt điểm (DECIDED)**.

---

## 11. Thử Nghiệm Phủ Định Chủ Động (Negative Tests Execution)

Trước khi nghiệm thu PASS, tiến hành thử nghiệm chủ động trên 6 mô hình sai lệch:

| Kịch bản thử nghiệm phủ định (Negative Test Case) | Mô tả giả định kiểm tra | Kết quả mong đợi | Đánh giá thực tế trong Phase 1 Model | Kết luận |
|---|---|:---:|---|:---:|
| **CASE A: Admin kế thừa toàn bộ quyền của Manager** | Giả định Admin có thể tạo task, giao việc, duyệt việc ngoài hiện trường. | **FAIL** (Bị cấm) | Bị từ chối triệt để tại Mục 1.3 và Mục 6.3. Admin bị DENY trên toàn bộ normal task operations. | **PASS (Đã chặn đứng)** |
| **CASE B: Admin bị chuyển đổi thành Manager khi đăng nhập** | Giả định tài khoản admin khi login được cấp giao diện và quyền Manager. | **FAIL** (Bị cấm) | Bị xác định là defect nguy hiểm tại Mục 7 (P1-06) và đăng ký là Implementation Gap cần loại bỏ. | **PASS (Đã chặn đứng)** |
| **CASE C: Manager có thể tự gán quyền Admin cho mình hoặc người khác** | Giả định Manager có quyền gọi API `AssignRole(Admin)`. | **FAIL** (Bị cấm) | Bị từ chối tại Mục 3 và Mục 6.2. Manager hoàn toàn không có quyền User/Role Management. | **PASS (Đã chặn đứng)** |
| **CASE D: Staff tự phê duyệt nhiệm vụ của chính mình** | Giả định Staff sau khi nộp hồ sơ có nút bấm tự Approve. | **FAIL** (Bị cấm) | Bị nghiêm cấm tuyệt đối theo DR-HARD-02, Mục 6.1 và SoD-01. | **PASS (Đã chặn đứng)** |
| **CASE E: System tự động Approve task dựa trên dữ liệu cảm biến** | Giả định System tự chuyển task sang `COMPLETED` khi GPS và QR hợp lệ. | **FAIL** (Bị cấm) | Bị nghiêm cấm tại Mục 1.4, Mục 6.4 và SoD-05. Phán quyết nghiệm thu bắt buộc phải qua Manager con người. | **PASS (Đã chặn đứng)** |
| **CASE F: Thay đổi vai trò làm xóa bỏ danh tính tác giả lịch sử** | Giả định khi Staff nghỉ việc hoặc đổi role thì `CareHistory` cũ bị đổi tác giả. | **FAIL** (Bị cấm) | Bị nghiêm cấm tại Mục 6.3 và SoD-03. Lịch sử tác giả được bảo toàn bất biến. | **PASS (Đã chặn đứng)** |

---

## 12. Bảng Bằng Chứng Nghiệm Thu Toàn Diện Phase 1 (Phase 1 Evidence Table)

| Gate ID | Tiêu chí nghiệm thu (Requirement) | Phương pháp xác minh (Verification Method) | Bằng chứng cụ thể (Evidence) | Tính chặn cổng (Blocking) | Kết quả nghiệm thu (Result) |
|---|---|---|---|:---:|:---:|
| **P1-01** | Actor Registry chứa chính xác mọi actor được hỗ trợ | Deterministic Registry Audit | Bảng tại Mục 2: Đúng 4 actors (Staff, Manager, Admin, System). Không có actor thứ 5. | **YES** | **PASS** |
| **P1-02** | Mỗi actor có purpose rõ ràng | Semantic Purpose Validation | Cột *Mục đích vận hành chính* tại Mục 2: Từng actor có định vị mục đích riêng biệt, không chồng lấn. | **YES** | **PASS** |
| **P1-03** | Mỗi actor có readable scope xác định | Concretely Defined Scope Check | Mục 4: Phân định chi tiết phạm vi đọc cho Staff, Manager, Admin, System. Không dùng khái niệm "all data". | **YES** | **PASS** |
| **P1-04** | Mỗi actor có writable scope xác định | Resource Mutation Boundary Check | Mục 5: Phân tách rạch ròi 3 miền Business Mutation, Governance Mutation, Technical Mutation kèm chủ sở hữu. | **YES** | **PASS** |
| **P1-05** | Mỗi actor có forbidden actions tường minh | Prohibited Boundary Check | Mục 6: Danh mục 5 điều cấm cho Staff, 5 điều cấm cho Manager, 5 điều cấm cho Admin, 3 điều cấm cho System. | **YES** | **PASS** |
| **P1-06** | Không còn rule "mọi non-staff = Manager" | Source Code Audit | Mục 7: Định vị chính xác 5 vị trí lỗi trong code (`greenOpsService.ts:349`, `MobileApp.tsx:398,475`, `LoginScreen.tsx:41,117`, `contracts:64`) và phân loại Gap. | **YES** | **PASS** |
| **P1-07** | Staff không có Manager/Admin privileges | Privilege Disjoint Proof | Mục 8.1: Chứng minh toán học $\text{Staff Privileges} \cap \text{Privileged Mutations} = \emptyset$. | **YES** | **PASS** |
| **P1-08** | Manager không mặc nhiên có Admin privileges | Governance Boundary Proof | Mục 8.2: Chứng minh toán học $\text{Manager Privileges} \cap \text{Admin Governance} = \emptyset$. | **YES** | **PASS** |
| **P1-09** | Admin không mặc nhiên trở thành super-manager | Negative Super-Manager Test | Mục 1.3 & Mục 8.3: Admin bị DENY 100% trên normal task operations. Không có quyền thừa kế Manager. | **YES** | **PASS** |
| **P1-10** | System actor không được dùng như human role | Humanization Negative Check | Mục 1.4 & Mục 8.4: System được khóa là Technical Automation Actor duy nhất, không có giao diện hoặc quyền phán quyết. | **YES** | **PASS** |
| **P1-11** | Separation of Duties được định nghĩa chuẩn tắc | SoD Principles Formulation | Mục 9: Thiết lập chuẩn tắc 5 nguyên tắc SoD-01 đến SoD-05. | **YES** | **PASS** |
| **P1-12** | 100% quyết định mở được ghi nhận rõ, 0 TBD | Decision State Audit | Mục 10: 5/5 quyết định P1-D01..D05 đều đạt trạng thái `DECIDED`. 0 TBD, 0 MAYBE. | **YES** | **PASS** |

---

## 13. Kết Luận Cổng Phase 1 (Phase 1 Exit Gate)

```text
================================================================================
PHASE 1 PASS
— ACTOR MODEL RECONCILED
— ADMIN BOUNDARY DECIDED
— READY FOR PHASE 2 ADMIN BUSINESS SCOPE
================================================================================
```
