# NOVYX GreenOps — Canonical Workflows, State Machines & Handoffs

Tài liệu này là chuẩn mực thẩm quyền cao nhất định nghĩa **QUY TRÌNH VẬN HÀNH THỰC ĐỊA (Operational Field Workflows)**, **QUY TRÌNH QUẢN TRỊ NỀN TẢNG (Platform Governance Workflows)**, **MÁY TRẠNG THÁI VÒNG ĐỜI (Lifecycle State Machines)**, **CÁC ĐIỀU KIỆN TIÊN QUYẾT (Guards)** và **MA TRẬN BÀN GIAO XUYÊN NGỮ CẢNH (Canonical Handoff Matrix)**.

---

## 1. Phân tách rạch ròi các chiều trạng thái (Separate State Dimensions)

Hệ thống phân biệt rành mạch 5 chiều trạng thái độc lập nhằm loại bỏ triệt để nhầm lẫn giữa vòng đời nghiệp vụ, tiến trình bằng chứng, xử lý ngoại lệ và kết nối kỹ thuật:

```text
+-----------------------------------------------------------------------------------+
|                        FIVE SEPARATE STATE DIMENSIONS                             |
+-----------------------------------------------------------------------------------+
| 1. TaskStatus        | Vòng đời nghiệp vụ chuẩn tắc máy chủ (7 trạng thái tất định)|
| 2. ProofProgress     | Tiến độ thu thập bằng chứng theo ProofProfile nhiệm vụ    |
| 3. VerificationState | Kết quả xác thực hiện trường (Bình thường vs Ngoại lệ)    |
| 4. SyncStatus        | Trạng thái đồng bộ máy khách (SYNCED / PENDING / FAILED)   |
| 5. NavigationState   | Điều hướng giao diện người dùng (Màn hình hiện thời)       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Máy Trạng Thái Vòng Đời Nhiệm Vụ Chuẩn Tắc (Task Lifecycle State Machine)

Vòng đời của thực thể `Task` trong phiên bản MVP bao gồm chính xác **7 trạng thái tất định**:

```text
                     [Manager Tạo việc & Giao việc (WF-01)]
                                    │
                                    ▼
             ┌───────────────────────────────────────────┐
             │                  PENDING                  │ <─────────────────────┐
             └───────────────────────────────────────────┘                       │
               │                     │                 │                         │
    [Manager   │          [Staff bấm │        [Manager │                         │
     Hủy việc] │          StartTask] │       Reassign] │                         │
     (WF-09)   │          (WF-02)    │       (Case A)  │                         │
               │                     ▼                 │                         │
               │      ┌─────────────────────────────┐  │                         │
               │      │         IN_PROGRESS         │  │                         │
               │      └─────────────────────────────┘  │                         │
               │        │                         │    │                         │
               │        │ [Staff bấm              │    │                         │
               │        │  ReportFieldIssue]      │    │                         │
               │        │  (WF-08)                │    │                         │
               │        ▼                         │    │                         │
               │   ┌─────────┐                    │    │                         │
               │   │ BLOCKED │                    │    │                         │
               │   └─────────┘                    │    │                         │
               │     │  │  │                      │    │                         │
               │     │  │  └── [Manager Reassign] ─┼────┘                         │
               │     │  │       Case B (WF-08)     │                             │
               │     │  │                          │                             │
               │     │  └───── [Manager Resume] ───┘                             │
               │     │          (WF-08)           │                              │
               │     │                            │ [Staff nộp đủ 100%           │
               │     │                            │  bằng chứng theo Profile]    │
               │     │                            │  (WF-05 / WF-18)             │
               │     │                            ▼                              │
               │     │                     ┌────────────────┐                    │
               │     │                     │ WAITING_REVIEW │                    │
               │     │                     └────────────────┘                    │
               │     │                          │   │   │                        │
               │     │       [Manager Yêu cầu   │   │   │ [Manager Phê duyệt     │
               │     │        làm lại có mục    │   │   │  hoặc Duyệt ngoại lệ]  │
               │     │        tiêu] (WF-07)     │   │   │  (WF-06)               │
               │     │                          ▼   │   ▼                        │
               │     │      ┌─────────────────┐     │  ┌───────────────┐         │
               │     │      │ REWORK_REQUIRED │     │  │   COMPLETED   │ [TERMINAL│
               │     │      └─────────────────┘     │  └───────────────┘  SUCCESS]│
               │     │        │       │             │       │ (Sinh CareHistory) │
               │     │        │       │ [Staff nộp  │       │                    │
               │     │        │       │  lại khâu   │       │                    │
               │     │        │       │  sửa]       │       │                    │
               │     │        │       └─────────────┼───────┘                    │
               │     │        │                     │                            │
               ▼     ▼        ▼                     ▼                            │
        ┌───────────────────┐                                                    │
        │     CANCELLED     │ <──────────────────────────────────────────────────┘
        └───────────────────┘ [TERMINAL VOID - Hủy việc từ mọi trạng thái chưa đóng]
```

### Bảng chuyển trạng thái chuẩn tắc (Canonical Transition Matrix)

| Trạng thái Hiện tại | Lệnh / Thao tác | Tác nhân Hợp lệ | Điều kiện Tiên quyết (Guards) | Trạng thái Mới | Hậu điều kiện & Handoff |
|---|---|:---:|---|:---:|---|
| *(Khởi tạo)* | `CreateTask` | Operations Manager | Cây tồn tại; `TaskType` đang `ACTIVE`; hạn chót tương lai. Gán Profile tất định. | `PENDING` | Xuất hiện trên danh sách của Staff; phát thông báo (`HO-01`). |
| `PENDING` | `StartTask` | Field Staff | `assignedStaffId == actor.userId`. DUY NHẤT lệnh này chuyển trạng thái. | `IN_PROGRESS` | Khởi tạo phiên làm việc thực địa; snapshot biểu mẫu (`HO-02`). |
| `PENDING` | `ReassignTask` *(Case A)* | Operations Manager | Chọn nhân sự mới `ACTIVE` khác nhân sự hiện tại. | `PENDING` | Cập nhật `assignedStaffId`; chuyển sang danh sách nhân viên mới. |
| `PENDING` | `CancelTask` | Operations Manager | Bắt buộc nhập lý do văn bản (`cancelReason`). | `CANCELLED` | Đóng task vĩnh viễn; không sinh CareHistory (`HO-09`). |
| `IN_PROGRESS` | `ReportFieldIssue` | Field Staff | Trở ngại thực địa cản trở thi công; bắt buộc ảnh chụp sự cố + lý do. | `BLOCKED` | Chuyển task sang hàng đợi sự cố của Quản lý (`HO-03`). |
| `IN_PROGRESS` | `SubmitEvidence` | Field Staff | Đủ 100% bằng chứng theo Profile; máy chủ chấp thuận gói tin. | `WAITING_REVIEW` | Đẩy task vào hàng đợi thẩm định của Quản lý (`HO-05`). |
| `IN_PROGRESS` | `CancelTask` | Operations Manager | Bắt buộc nhập lý do văn bản. | `CANCELLED` | Bảo toàn dữ liệu nháp; đóng task vĩnh viễn; không sinh CareHistory. |
| `BLOCKED` | `ResumeBlockedTask` | Operations Manager | Trở ngại thực địa đã được tháo gỡ; cho cùng nhân viên cũ tiếp tục. | `IN_PROGRESS` | Staff nhận thông báo tiếp tục công việc (`HO-04`). |
| `BLOCKED` | `ReassignTask` *(Case B)* | Operations Manager | Nhân viên cũ không thể tiếp tục; chọn nhân sự mới `ACTIVE`. | `PENDING` | Chuyển về `PENDING`; **bảo toàn quyền tác giả bằng chứng cũ**. |
| `BLOCKED` | `CancelTask` | Operations Manager | Sự cố bất khả kháng không thể thi công; bắt buộc có lý do. | `CANCELLED` | Đóng task vĩnh viễn; bảo toàn vết sự cố phục vụ kiểm toán. |
| `WAITING_REVIEW` | `ReviewApprove` | Operations Manager | 100% bằng chứng đạt chuẩn; `actor.userId != assignedStaffId`. | `COMPLETED` | **Terminal Success**; sinh bản ghi Lịch sử chăm sóc `CareHistory` (`HO-08`). |
| `WAITING_REVIEW` | `ReviewApproveWithException` | Operations Manager | Việc làm thật, có ngoại lệ không thể tái tạo; Quản lý chịu trách nhiệm kèm lý do. | `COMPLETED` | **Terminal Success**; sinh `CareHistory` mang cờ `HAS_EXCEPTION`. |
| `WAITING_REVIEW` | `ReviewRequestRework` | Operations Manager | Sai sót kỹ thuật; chỉ rõ khâu sai (`targetedArea`) + nhập lý do cụ thể. | `REWORK_REQUIRED` | Đẩy task lên đầu danh sách Staff; bảo lưu bằng chứng cũ (`HO-06`). |
| `WAITING_REVIEW` | `CancelTask` | Operations Manager | Phát hiện gian lận hoặc kế hoạch bị hủy bỏ; bắt buộc nhập lý do. | `CANCELLED` | Đóng task vĩnh viễn; bảo toàn lịch sử phục vụ kiểm toán. |
| `REWORK_REQUIRED` | `ResubmitRework` | Field Staff | `assignedStaffId == actor.userId`; đã bổ sung đúng khâu bị từ chối. | `WAITING_REVIEW` | Ghép bằng chứng cũ và khâu mới sửa thành `Attempt 2` gửi lại Quản lý (`HO-07`). |
| `REWORK_REQUIRED` | `CancelTask` | Operations Manager | Khi nhân sự không thể khắc phục sửa chữa; bắt buộc có lý do. | `CANCELLED` | Đóng task vĩnh viễn; bảo toàn toàn bộ lịch sử nộp và thẩm định. |
| `COMPLETED` | *(Mọi thao tác sửa)* | Không ai | **BỊ CẤM TUYỆT ĐỐI (`DR-HARD-05`)** — Trạng thái đóng vĩnh viễn. | `COMPLETED` | Toàn bộ dữ liệu bất biến. |
| `CANCELLED` | *(Mọi thao tác sửa)* | Không ai | **BỊ CẤM TUYỆT ĐỐI (`DR-HARD-05`)** — Trạng thái đóng vĩnh viễn. | `CANCELLED` | Toàn bộ dữ liệu bất biến. |

---

## 3. Các Quy Trình Vận Hành Thực Địa (Operational Field Workflows WF-01..09)

> **Ranh giới cốt tử:** Trong toàn bộ 9 quy trình vận hành thực địa dưới đây, Platform Administrator **hoàn toàn không có bất kỳ làn bơi (Swimlane) hay thẩm quyền can thiệp nào**.

### WF-01: Task Creation & Assignment (Khởi tạo & Giao việc)
- **Tác nhân:** Operations Manager $\to$ System $\to$ Field Staff.
- **Quy trình:**
  1. Quản lý chọn Cây mục tiêu, loại việc (`TaskType`), hạn chót và chỉ định nhân viên thực hiện (`assignedStaffId`).
  2. Hệ thống tự động ánh xạ tất định `TaskType -> ProofProfile` (`CHANGE_PROOF`, `SERVICE_PROOF`, hoặc `INSPECTION_PROOF`) và snapshot mã định danh cây bất biến `treeIdSnapshot`, phiên bản chính sách `policyVersionId`.
  3. Quản lý bấm tạo việc $\to$ Task được khởi tạo ở trạng thái `PENDING` và xuất hiện trong danh sách của nhân viên (`HO-01`).
- **Quy tắc:** Quản lý không được tùy tiện hạ cấp `ProofProfile` của từng task riêng lẻ (`DR-MVP-02`).

### WF-02: Task Execution Initiation (Bắt đầu thi công)
- **Tác nhân:** Field Staff $\to$ System.
- **Quy trình:**
  1. Nhân viên mở màn hình chi tiết công việc trong danh mục `PENDING`.
  2. Nhân viên chủ động bấm nút **"Bắt đầu làm việc"** (`StartTask`).
  3. Hệ thống chụp bản mẫu checklist kỹ thuật vào `ChecklistSnapshot` và chuyển trạng thái task: `PENDING` $\to$ `IN_PROGRESS` (`HO-02`).
- **Quy tắc:** DUY NHẤT hành động bấm nút `StartTask` mới chuyển trạng thái (`DR-MVP-04`). Mở xem chi tiết, quét QR hay đo GPS không làm đổi trạng thái task.

### WF-03: Site Verification (Xác thực hiện trường)
- **Tác nhân:** Field Staff $\to$ System.
- **Hai tín hiệu độc lập:**
  - **Định danh cây (Tree Identity):** Quét mã tem QR gắn trên thân cây. Nếu tem hỏng/mờ/mất, nhân viên kích hoạt `IDENTITY_EXCEPTION` kèm ảnh chụp tem hỏng tại gốc và mã dập nổi đối chiếu. Cây mục tiêu là bất biến, tuyệt đối cấm đổi sang cây khác (`DR-HARD-01`).
  - **Vị trí thực địa (Location):** GPS đo khoảng cách tới gốc cây đạt tiêu chuẩn mục tiêu $\le 10$m. Nếu GPS trôi do tán lá/nhà cao tầng sau khi thử lại, nhân viên kích hoạt `LOCATION_EXCEPTION` kèm ảnh và văn bản giải trình.
- **Quy tắc:** Thứ tự quét QR và đo GPS là hoàn toàn linh hoạt; việc xác thực chỉ cập nhật thuộc tính `siteVerification`, **tuyệt đối không làm thay đổi `TaskStatus`**.

### WF-04: Proof Acquisition (Thu thập bằng chứng theo Hồ sơ)
- **Tác nhân:** Field Staff $\to$ System.
- **Thu thập thích ứng theo 3 hồ sơ:**
  - **`CHANGE_PROOF`:** Chụp ảnh Trước (`beforePhoto`) $\to$ Tích 100% tiêu chuẩn trong `ChecklistSnapshot` $\to$ Chụp ảnh Sau (`afterPhoto`) góc tương tự.
  - **`SERVICE_PROOF`:** Thực hiện dịch vụ, tích 100% tiêu chuẩn trong `ChecklistSnapshot` $\to$ Chụp ảnh Hoàn thành (`completionPhoto`). Không bắt chụp ảnh Trước.
  - **`INSPECTION_PROOF`:** Điền bảng khám bệnh lâm sinh có cấu trúc (`StructuredFindings`) $\to$ Chụp ảnh hiện trạng bệnh tật/khuyết tật (`conditionPhotos[]`). Không dùng checklist thao tác chung chung.
- **Quy tắc:** Cấm ngụy tạo ảnh chụp màn hình hay lấy ảnh cũ (`DR-HARD-04`). Nếu lỡ cắt tỉa trước khi chụp ảnh Trước, bắt buộc báo cáo `EVIDENCE_INTEGRITY_EXCEPTION` để Quản lý hậu kiểm.

### WF-05: Evidence Submission (Nộp hồ sơ nghiệm thu)
- **Tác nhân:** Field Staff $\to$ System $\to$ Operations Manager.
- **Quy trình:**
  1. Nhân viên rà soát toàn bộ bằng chứng và bấm **"Gửi duyệt kết quả"** (`SubmitEvidence`).
  2. Hệ thống kiểm tra tính đầy đủ tất định: 100% ảnh theo Profile, 100% checklist hoặc findings, và dữ liệu Site Verification.
  3. Nếu thiết bị trực tuyến và máy chủ chấp thuận gói tin: Chuyển `TaskStatus = WAITING_REVIEW` (`HO-05`). Nếu ngoại tuyến: Chuyển sang quy trình kỹ thuật `WF-18`.

### WF-06: Review & Quality Approval (Thẩm định & Phê duyệt chất lượng)
- **Tác nhân:** Operations Manager $\to$ System $\to$ Tree Asset Registry.
- **Quy trình:**
  1. Quản lý mở hàng đợi thẩm định, đối soát toàn bộ bằng chứng ảnh, checklist, kết quả khám bệnh, tọa độ GPS và ảnh tem QR.
  2. Quản lý ban hành **chính xác 1 trong 4 quyết định dứt điểm**:
     - **`APPROVE` $\to$ `COMPLETED`:** Nghiệm thu đạt chuẩn 100%. Nhiệm vụ đóng vĩnh viễn và sinh bản ghi Lịch sử chăm sóc chính thức (`CareHistory`) (`HO-08`).
     - **`APPROVE_WITH_EXCEPTION` $\to$ `COMPLETED`:** Công việc làm thật, có ngoại lệ không thể tái tạo; Quản lý bảo lãnh trách nhiệm kèm lý do bắt buộc. Sinh bản ghi `CareHistory` mang cờ `HAS_EXCEPTION`.
     - **`REQUEST_REWORK` $\to$ `REWORK_REQUIRED`:** Sai sót kỹ thuật; chỉ rõ khâu hỏng và nhập lý do. Chuyển sang `WF-07`.
     - **`CANCEL` $\to$ `CANCELLED`:** Phát hiện gian lận hoặc kế hoạch bị hủy bỏ. Chuyển sang `WF-09`.
- **Quy tắc:** Người thi công không bao giờ được tự duyệt việc của mình (`DR-HARD-02`). 100% task phải do Quản lý con người duyệt, cấm duyệt tự động `Auto-approval` (`DR-POL-01`).

### WF-07: Targeted Rework Loop (Vòng lặp sửa chữa có trọng tâm)
- **Tác nhân:** Operations Manager $\leftrightarrow$ Field Staff $\to$ System.
- **Quy trình:**
  1. Quản lý chỉ định chính xác khâu có sai sót (`targetedArea`: ví dụ `AFTER_PHOTO` hoặc khâu bón phân trong `CHECKLIST`) và nhập hướng dẫn khắc phục.
  2. Hệ thống bảo lưu toàn bộ bằng chứng hợp lệ cũ của phiên trước (`Attempt 1`), chuyển task sang `REWORK_REQUIRED` (`HO-06`).
  3. Giao diện của nhân viên **chỉ mở quyền chụp/sửa đúng khâu bị từ chối**.
  4. Nhân viên khắc phục ngoài thực địa và bấm **"Nộp lại hồ sơ"** (`ResubmitRework`).
  5. Hệ thống ghép bằng chứng cũ và khâu mới thành phiên nộp `Attempt 2`, chuyển task về `WAITING_REVIEW` (`HO-07`).
- **Quy tắc:** Không bắt nhân viên làm lại từ đầu. Cấm gọi `ReportFieldIssue` hay `Reassign` trực tiếp khi task đang ở `REWORK_REQUIRED`.

### WF-08: Blocked Resolution (Xử lý sự cố ách tắc hiện trường)
- **Tác nhân:** Field Staff $\to$ Operations Manager $\to$ System.
- **Lối vào duy nhất:** Nhân viên gặp chướng ngại vật thực địa bấm `ReportFieldIssue` $\to$ Chuyển sang `BLOCKED` (`HO-03`).
- **Ba lối thoát chuẩn tắc duy nhất của Quản lý:**
  1. **`RESUME` $\to$ `IN_PROGRESS`:** Trở ngại đã giải tỏa (đã dỡ rào chắn, đã xử lý tổ ong); cho cùng nhân viên cũ tiếp tục làm việc.
  2. **`REASSIGN` $\to$ `PENDING`:** Nhân viên cũ bị ốm/tai nạn; Quản lý chọn nhân sự mới `ACTIVE` (`ReassignTask Case B`). **Toàn bộ bằng chứng do nhân viên cũ thu thập được giữ nguyên quyền tác giả ban đầu**.
  3. **`CANCEL` $\to$ `CANCELLED`:** Sự cố bất khả kháng (cây đã bị gãy đổ hoàn toàn); Quản lý hủy nhiệm vụ có lý do.
- **Quy tắc:** Cấm Staff tự ý Resume hoặc tự hủy việc.

### WF-09: Task Cancellation (Hủy bỏ nhiệm vụ vận hành)
- **Tác nhân:** Operations Manager $\to$ System $\to$ Audit Store.
- **Quy trình:**
  1. Quản lý chọn hủy nhiệm vụ từ **bất kỳ trạng thái nào chưa đóng** (`PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`).
  2. Quản lý bắt buộc nhập lý do văn bản (`cancelReason`).
  3. Hệ thống chuyển trạng thái `TaskStatus = CANCELLED`, ghi nhận người hủy, thời điểm hủy và phát sự kiện kiểm toán (`HO-09`).
- **Quy tắc:** Task đã ở trạng thái đóng (`COMPLETED`/`CANCELLED`) cấm bị hủy (`DR-HARD-05`). Nhiệm vụ bị hủy **TUYỆT ĐỐI KHÔNG BAO GIỜ sinh Lịch sử chăm sóc `CareHistory`** (`DR-HARD-07`).

---

## 4. Các Quy Trình Quản Trị Nền Tảng (Platform Governance Workflows WF-10..17)

### WF-10: User Provisioning (Khởi tạo tài khoản người dùng mới)
- **Mã quy trình:** `WF-10`
- **Tác nhân:** Platform Administrator (`admin`) $\to$ System $\to$ Người dùng.
- **Quy trình:**
  1. Admin nhập thông tin định danh (Email, Số điện thoại) và chọn vai trò ban đầu (`staff`, `manager`, hoặc `admin`).
  2. Hệ thống kiểm tra tính duy nhất của định danh; khởi tạo bản ghi `User` và `Account` ở trạng thái `INVITED` hoặc `ACTIVE`; lưu vết phân quyền ban đầu vào `RoleAssignment`.
  3. Hệ thống cung cấp cơ chế kích hoạt tài khoản / thiết lập thông tin xác thực an toàn (Secure Credential Setup Mechanism) tới kênh liên lạc của người dùng.
  4. Hệ thống ghi sự kiện kiểm toán (`AUDIT_REQUIRED`).
- **Bất biến:** Admin tuyệt đối không nhìn thấy mật khẩu dạng rõ. Cấm tự do đăng ký tài khoản ngoài màn hình đăng nhập.

### WF-11: Role Change & Operational Responsibility Reconciliation (Điều chỉnh vai trò & Đối soát trách nhiệm)
- **Mã quy trình:** `WF-11`
- **Tác nhân:** Platform Administrator (`admin`) $\to$ System $\to$ Operations Manager.
- **Quy trình:**
  1. Admin chọn tài khoản cần điều chỉnh, chọn vai trò mới và nhập lý do văn bản (`AssignRole`).
  2. **Bước Kiểm tra Tác động Trách nhiệm (Role Change Impact Check):**
     - *Hệ thống* rà soát deterministically các trách nhiệm tác nghiệp đang nắm giữ:
       - **Staff $\to$ Manager:** Rà soát các task do người này phụ trách. Task `PENDING` phải được phân công lại (`Reassign Case A`); Task `IN_PROGRESS` / `REWORK_REQUIRED` phải được giải tỏa qua lệnh hợp lệ (Quản lý thực hiện `CancelTask` có lý do và tạo task thay thế cho người khác); Task `WAITING_REVIEW` giữ nguyên quyền tác giả lịch sử. **Sau khi thăng chức lên Manager, người này TUYỆT ĐỐI CẤM phê duyệt các task do chính mình thi công trước đây** (`DR-HARD-02`), bắt buộc một Quản lý khác thẩm định.
       - **Manager $\to$ Staff / Admin:** Rà soát trách nhiệm quản trị (`AUTHORIZED_OPERATIONAL_RESPONSIBILITIES`), hàng đợi duyệt và các sự cố `BLOCKED`. Bắt buộc bàn giao trách nhiệm quản lý sang một Quản lý khác trước khi đổi quyền.
  3. Nếu còn tồn đọng trách nhiệm xung đột: Hệ thống ghi nhận điều kiện quy trình `ROLE_CHANGE_PENDING_OPERATIONAL_HANDOFF` *(đây là trạng thái điều kiện quy trình, không phải enum AccountStatus mới)*. Admin quan sát được xung đột nhưng **Admin TUYỆT ĐỐI CẤM tự ý can thiệp vào các Task của Work Management**; thông tin được chuyển sang Quản lý vận hành xử lý (`HO-12`).
  4. Khi toàn bộ trách nhiệm đã được giải tỏa hoàn tất: Admin xác nhận kích hoạt vai trò mới. Thẩm quyền phiên làm việc hiện thời của tài khoản không được tiếp tục duy trì với các đặc quyền cũ; hệ thống ghi sự kiện kiểm toán (`AUDIT_REQUIRED`).

### WF-12: Account Suspension & Workload Disposition (Khóa tài khoản & Xử lý khối lượng công việc)
- **Mã quy trình:** `WF-12`
- **Tác nhân:** Platform Administrator (`admin`) $\to$ System $\to$ Operations Manager.
- **Quy trình:**
  1. Admin thực hiện lệnh quản trị: `SuspendAccount` (Khóa tạm thời), `ActivateAccount` / `UnlockAccount` (Mở lại), hoặc `DisableAccount` (Vô hiệu hóa vĩnh viễn do nghỉ việc).
  2. Hệ thống ngắt thẩm quyền truy cập của tài khoản, ghi sự kiện kiểm toán (`AUDIT_REQUIRED`).
  3. Hệ thống phát thông tin sự kiện `USER_NOT_OPERATIONALLY_AVAILABLE` sang bảng điều hành của Quản lý vận hành (`HO-10`).
  4. **BẤT BIẾN CỐT TỬ:** IAM và System **TUYỆT ĐỐI KHÔNG tự ý đột biến `TaskStatus`** (không tự hủy sang `CANCELLED`, không tự chuyển sang `BLOCKED`, không sinh trạng thái mới `ACCOUNT_SUSPENDED`).
  5. **Ma trận Xử lý Khối lượng Công việc của Nhân viên Bị Khóa (Suspended Staff Task Disposition Matrix):**
     - Quản lý vận hành tiếp nhận thông tin và xử lý từng nhiệm vụ theo thẩm quyền hợp lệ:
       - **`PENDING`:** Task giữ nguyên `PENDING`. Quản lý thực hiện `ReassignTask (Case A)` sang nhân viên mới `ACTIVE`.
       - **`IN_PROGRESS`:** Task giữ nguyên `IN_PROGRESS`. Cấm Reassign trực tiếp. IAM/System cấm tự chuyển sang `BLOCKED`. Quản lý thực hiện `CancelTask` với lý do nhân sự bị đình chỉ. Nếu công việc vẫn cần thiết, Quản lý tạo Task thay thế mới qua quy trình chuẩn `WF-01`.
       - **`BLOCKED`:** Task giữ nguyên `BLOCKED`. Quản lý có thể: (1) `Resume` chỉ khi chính nhân viên đó được kích hoạt khả dụng trở lại; (2) `ReassignTask (Case B)` $\to$ `PENDING` cho nhân viên mới; (3) `CancelTask` $\to$ `CANCELLED`.
       - **`WAITING_REVIEW`:** Task giữ nguyên `WAITING_REVIEW`. Khóa tài khoản không làm mất giá trị bằng chứng đã nộp. Quản lý thực hiện thẩm định: `Approve`, `ApproveWithException`, hoặc `CancelTask`. Nếu chọn `RequestRework` mà nhân viên bị khóa không thể sửa, Quản lý xử lý qua hủy việc/tạo task thay thế thay vì điều chuyển trái phép từ `REWORK_REQUIRED`.
       - **`REWORK_REQUIRED`:** Task giữ nguyên `REWORK_REQUIRED`. Cấm Reassign trực tiếp. Nhân viên bị khóa không thể resubmit. Quản lý thực hiện `CancelTask` và tạo task thay thế mới qua `WF-01`, bảo tồn toàn bộ lịch sử nộp cũ.
       - **`COMPLETED` / `CANCELLED`:** Toàn bộ dữ liệu bất biến, không đột biến.

### WF-13: Tree Master Data Governance (Quản trị dữ liệu gốc cây xanh)
- **Mã quy trình:** `WF-13`
- **Tác nhân:** Platform Administrator (`admin`) $\to$ System.
- **Quy trình:**
  1. Admin thực hiện các lệnh quản trị:
     - `CreateTree`: Nhập mã định danh `treeId` (duy nhất), mã tem `qrCode` ban đầu (duy nhất), thông số thực vật học và tọa độ GPS chuẩn (kiểm tra tính hợp lệ về định dạng và phạm vi trắc địa, **tọa độ không phải là khóa duy nhất**).
     - `UpdateTreeMasterData`: Cập nhật thông số thực vật học, chiều cao, tán lá kèm lý do bắt buộc.
     - `ReplaceTreeQrCode`: Cấp chuỗi `qrCode` mới duy nhất khi tem ngoài hiện trường bị hỏng; giữ nguyên bất biến `treeId`.
     - `UpdateCanonicalCoordinates`: Cập nhật tọa độ chuẩn khi có số liệu trắc địa đo đạc lại chính xác; kiểm tra tính hợp lệ về định dạng/dải đo, không kiểm tra tính duy nhất; bắt buộc có lý do văn bản; giữ nguyên `treeId`.
     - `RetireTree`: Cây bị chết/đốn hạ $\to$ chuyển sang `RETIRED`; chặn tạo task mới về sau; không xóa vật lý.
  2. Hệ thống ghi cập nhật bền vững vào Sổ bộ Cây xanh và phát sự kiện kiểm toán tài sản (`AUDIT_REQUIRED`). Toàn bộ các nhiệm vụ lịch sử giữ nguyên vẹn bản chụp tọa độ và mã QR đã đo trong quá khứ.

### WF-14: TaskType Catalog Governance (Quản trị danh mục loại việc)
- **Mã quy trình:** `WF-14`
- **Tác nhân:** Platform Administrator (`admin`) $\to$ System.
- **Phân định tài nguyên:** `TaskTypeCatalog` là tài nguyên **chỉ ghi lưu vết kiểm toán (AUDIT-ONLY resource)**.
- **Quy trình:** Admin tạo mới (`CreateTaskType`), tạm ngưng (`DeactivateTaskType`) hoặc kích hoạt lại (`ActivateTaskType`). Cấm xóa cứng loại việc đã có nhiệm vụ tham chiếu.
- **Quy tắc:** Loại việc chỉ có thể được Quản lý chọn khi đã được gắn kèm ánh xạ chính sách bằng chứng hợp lệ tại `WF-15`.

### WF-15: Proof Policy Mapping Governance (Quản trị chính sách bằng chứng)
- **Mã quy trình:** `WF-15`
- **Tác nhân:** Platform Administrator (`admin`) $\to$ System.
- **Phân định tài nguyên:** `ProofPolicyMapping` là tài nguyên **chính sách có quản lý phiên bản độc lập (VERSIONED policy resource)**.
- **Quy trình:** Admin thiết lập ánh xạ bắt buộc từ mỗi `TaskType` sang đúng một trong 3 hồ sơ (`CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`), đánh số phiên bản mới (`policyVersionId`) và ban hành (`PublishProofPolicyVersion`).
- **Quy tắc không áp dụng hồi tố (No Retroactive Application):** Phiên bản chính sách mới chỉ áp dụng cho các task tạo mới trong tương lai. Toàn bộ các task đang chạy hoặc đã đóng giữ nguyên bản hợp đồng cũ.

### WF-16: Checklist Template Versioning (Quản trị phiên bản mẫu checklist)
- **Mã quy trình:** `WF-16`
- **Tác nhân:** Platform Administrator (`admin`) $\to$ System.
- **Quy trình:** Admin soạn thảo danh sách câu hỏi tiêu chí kỹ thuật, đánh số phiên bản mới (`templateVersionId`) và bấm ban hành (`PublishChecklistTemplateVersion`).
- **Quy tắc bản chụp độc lập (Decoupled Snapshotting):** Khi nhân viên bấm `StartTask` (`WF-02`), hệ thống snapshot nguyên vẹn biểu mẫu vào task; việc ban hành mẫu mới không bao giờ làm thay đổi checklist của các task đang thi công.

### WF-17: Audit Log Inspection (Thanh tra & tra cứu sổ nhật ký kiểm toán)
- **Mã quy trình:** `WF-17`
- **Tác nhân:** Platform Administrator (`admin`) $\to$ System.
- **Quy trình:** Admin mở phân hệ nhật ký kiểm toán, thiết lập bộ lọc (thời gian, tác nhân, hành vi, tài nguyên) và xem danh sách bản ghi toàn vẹn từ kho lưu trữ Append-Only.
- **Quy tắc:** Kho kiểm toán là bất biến vĩnh viễn (`ADM-SOD-03`); không tồn tại bất kỳ API nào cho phép sửa/xóa log. Quyền xem kiểm toán độc lập hoàn toàn với quyền can thiệp dữ liệu.

---

## 5. Quy Trình Kỹ Thuật Ngoại Tuyến (Technical Supporting Flow WF-18)

### WF-18: Offline Submission & Background Outbox Sync (Nộp offline & Đồng bộ ngầm)
- **Bản chất:** Là quy trình kỹ thuật vận chuyển gói tin máy khách, **tuyệt đối không phải là một trạng thái trong vòng đời Task**.
- **Quy trình:**
  1. Nhân viên bấm "Nộp hồ sơ" khi không có kết nối mạng Internet.
  2. Thiết bị di động: Ghi nhận `LocalSubmissionStatus = PENDING_SYNC`; lưu bền vững toàn bộ dữ liệu gói tin và ảnh vào Bộ nhớ an toàn cục bộ (Durable Outbox Store).
  3. Hệ thống máy chủ chuẩn tắc: Trạng thái nhiệm vụ **VẪN LÀ `TaskStatus = IN_PROGRESS`**; tuyệt đối không có trạng thái `"OFFLINE_SUBMITTED"`.
  4. Khi thiết bị khôi phục kết nối mạng: Dịch vụ nền tự động đẩy gói tin lên máy chủ.
     - **Trường hợp A (Máy chủ chấp thuận nghiệp vụ - Server/Business Acceptance):** Máy chủ tiếp nhận trọn vẹn dữ liệu, kiểm tra hợp lệ $\to$ chuyển `TaskStatus = WAITING_REVIEW`. Thiết bị cập nhật `LocalSubmissionStatus = SYNCED`. Task chính thức xuất hiện trên hàng đợi của Quản lý.
     - **Trường hợp B (Đồng bộ thất bại - Rớt mạng/Lỗi kết nối):** Máy chủ giữ nguyên `TaskStatus = IN_PROGRESS`. Thiết bị cập nhật `LocalSubmissionStatus = SYNC_FAILED` và cung cấp nút "Thử gửi lại" thủ công.

---

## 6. Định Vị Các Quy Trình Kiểm Soát Giai Đoạn Tương Lai (Controlled Future Flows NEXT)

1. **`WF-NEXT-01` (Dynamic Findings Template Governance):** Bộ tạo biểu mẫu khám bệnh động kéo-thả. Trong MVP áp dụng Fixed Schema.
2. **`WF-NEXT-02` (Break-Glass Emergency Execution):** Can thiệp vượt quyền khẩn cấp có giới hạn thời gian (Time-boxed), lưu vết kiểm toán cấp độ cao (`CRITICAL_AUDIT`) và bắt buộc hậu kiểm. Bị khóa hoàn toàn tại MVP.
3. **`WF-NEXT-03` (Security Governance Notifications):** Cảnh báo an ninh tự động tới Ban Giám sát khi có biến động quyền quản trị cấp cao. Khóa tại MVP.

---

## 7. Ma Trận Bàn Giao Xuyên Ngữ Cảnh Chuẩn Tắc (Canonical Cross-Context Handoff Matrix)

| Mã Bàn Giao | Ngữ Cảnh Giao | Tác Nhân Giao | Ngữ Cảnh Nhận | Tác Nhân Nhận | Sự Kiện Kích Hoạt | Thực Thể / Dữ Liệu Bàn Giao | Trạng Thái Trước | Trạng Thái Sau |
|:---:|---|---|---|---|---|---|:---:|:---:|
| **HO-01** | `Work Management` | Operations Manager | `Work Management` | Field Staff | Quản lý bấm `CreateTask` | Thực thể `Task` kèm `treeId`, loại việc, deadline | *(Khởi tạo)* | `PENDING` |
| **HO-02** | `Work Management` | Field Staff | `Work Management` | Hiện trường / Tự làm | Nhân viên bấm `StartTask` ngoài thực địa | Bắt đầu phiên thi công, snapshot checklist | `PENDING` | `IN_PROGRESS` |
| **HO-03** | `Work Management` | Field Staff | `Work Management` | Operations Manager | Nhân viên gặp trở ngại bấm `ReportFieldIssue` | Thực thể `FieldIssue` kèm ảnh hiện trường & lý do | `IN_PROGRESS` | `BLOCKED` |
| **HO-04** | `Work Management` | Operations Manager | `Work Management` | Field Staff (cũ/mới) | Quản lý giải quyết sự cố (`Resume` / `Reassign`) | Lệnh mở lại hoặc điều chuyển kèm bảo toàn bằng chứng | `BLOCKED` | `IN_PROGRESS` hoặc `PENDING` |
| **HO-05** | `Work Management` | Field Staff | `Work Management` | Operations Manager | Nhân viên hoàn tất thu thập bấm `SubmitEvidence` | Gói hồ sơ nghiệm thu (`SiteVerification` + Bằng chứng) | `IN_PROGRESS` | `WAITING_REVIEW` |
| **HO-06** | `Work Management` | Operations Manager | `Work Management` | Field Staff | Quản lý phát hiện sai sót bấm `RequestRework` | Thực thể `ReworkRequest` kèm chỉ định khâu hỏng | `WAITING_REVIEW` | `REWORK_REQUIRED` |
| **HO-07** | `Work Management` | Field Staff | `Work Management` | Operations Manager | Nhân viên sửa xong bấm `ResubmitRework` | Gói hồ sơ bổ sung phiên mới (`Attempt 2`) | `REWORK_REQUIRED` | `WAITING_REVIEW` |
| **HO-08** | `Work Management` | Operations Manager | `Tree Asset Registry` | Cây xanh mục tiêu | Quản lý bấm `Approve` hoặc `ApproveWithException` | Bản ghi kỹ thuật chính thức chiếu sang `CareHistory` | `WAITING_REVIEW` | `COMPLETED` |
| **HO-09** | `Work Management` | Operations Manager | `Audit & Compliance` | Sổ nhật ký kiểm toán | Quản lý bấm `CancelTask` | Thực thể `Cancellation` kèm lý do hủy văn bản | Phi kết thúc | `CANCELLED` |
| **HO-10** | `Identity & Access` | Platform Administrator | `Work Management` | Operations Manager | Admin khóa tài khoản nhân sự (`SuspendAccount`) | Thông tin sự kiện `USER_NOT_OPERATIONALLY_AVAILABLE` | `ACTIVE` | `SUSPENDED` |
| **HO-11** | Mọi Ngữ cảnh | Mọi Tác nhân | `Audit & Compliance` | Sổ nhật ký kiểm toán | Thực thi bất kỳ lệnh quản trị hoặc quyết định duyệt | Dữ liệu `AuditEvent` bất biến (`Append-Only`) | *N/A* | *N/A* |
| **HO-12** | `Identity & Access` | Platform Administrator | `Work Management` | Operations Manager | Yêu cầu đổi vai trò xung đột trách nhiệm vận hành | Tín hiệu `ROLE_CHANGE_PENDING_OPERATIONAL_HANDOFF` | Khởi tạo đổi quyền | Chờ giải tỏa xong mới đổi |
