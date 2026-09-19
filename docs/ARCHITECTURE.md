# NOVYX GreenOps — System Architecture & Technical Decomposition

Tài liệu này là chuẩn mực duy nhất định nghĩa **KIẾN TRÚC KỸ THUẬT (System Architecture)**. Tài liệu phân định rạch ròi giữa **Hiện trạng thực tế (AS-IS tại commit `2f9a26b`)** và **Kiến trúc mục tiêu (TO-BE Target Baseline)**, đồng thời đánh giá chi tiết dịch vụ `greenOpsService` và hợp đồng dữ liệu `packages/contracts`.

---

## 1. Hiện trạng kiến trúc thực tế (AS-IS Architecture)

Hệ thống hiện tại là một ứng dụng Expo SDK 57 React Native dạng nguyên khối phía client (Fat Client Monolith) với cơ chế hoạt động Hybrid (vừa gọi REST API vừa có fallback in-memory):

```text
+-----------------------------------------------------------------------------------+
|                        AS-IS ARCHITECTURE (COMMIT 2f9a26b)                        |
+-----------------------------------------------------------------------------------+
| [PRESENTATION & ORCHESTRATION]                                                    |
| MobileApp.tsx (2,054 dòng)                                                        |
|   - Quản lý toàn bộ State (tasks, trees, notifications, activeTask, reviewTask)   |
|   - Điều phối điều hướng (Login, Forgot, StaffArea, ManagerArea)                  |
|   - Chứa mã JSX inline cho màn Login và Quên mật khẩu                             |
|   - Prop Drilling hơn 30 props xuống StaffArea và ManagerArea                     |
|                                                                                   |
| StaffArea.tsx & ManagerArea.tsx                                                   |
|   - Nhận props từ MobileApp, tiếp tục khoan props xuống các màn hình con          |
|                                                                                   |
| Màn hình độc khối (Monolithic Screens):                                           |
|   - StaffProofFlow.tsx (1,476 dòng): Gộp cả GPS, Camera QR, Chụp ảnh, Checklist   |
|   - ManagerReview.tsx (483 dòng): Tự tính toán fallbackTask trong JSX            |
|   - LoginScreen.tsx (300 dòng): Dead code (bị bỏ quên, không được dùng)          |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| [DOMAIN & BUSINESS HELPERS]                                                       |
| mobileWorkflow.ts (295 dòng)                                                      |
|   - Gộp chung màn hình giao diện (HOME, WORK, MAP) và bước bằng chứng (GPS, QR)   |
|   - Cung cấp hàm thuần tính toán gaps và chuyển bước                              |
|   - Chưa có lớp thực thể (Entity class) bảo vệ tính toàn vẹn trạng thái           |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| [SERVICE FACADE / HYBRID CATCH-ALL]                                               |
| greenOpsService.ts (856 dòng)                                                     |
|   - Quá tải trách nhiệm: REST Client, In-Memory DB, Session Manager, Mock Data    |
|   - Snapshot lưu trong biến RAM (let snapshot: AppData) -> Mất sạch khi kill app  |
|   - Cơ chế Fallback nhận "fallbackTask" được tính toán sẵn từ UI component        |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| [SHARED CONTRACTS & PACKAGES]                                                     |
| @novyx/contracts                                                                  |
|   - DTOs được export trực tiếp và alias thành Domain Type trong apps/mobile/types |
|   - Thiếu Idempotency-Key và Concurrency Token trong hợp đồng                     |
+-----------------------------------------------------------------------------------+
```

### 1.1. Các khiếm khuyết kiến trúc cốt tử của hiện trạng (Architectural Flaws)

1. **Rò rỉ nghiệp vụ vào giao diện (Domain Leakage into UI):**
   Tại `ManagerReview.tsx` (dòng 132-136 và 163-167), mã JSX tự tay tạo ra object `fallbackTask` với trạng thái `COMPLETED` hoặc `REWORK_REQUIRED` rồi truyền vào `greenOpsService.reviewTask(request, fallbackTask)`. Giao diện đang làm nhiệm vụ của Domain Model!
2. **Quá tải thành phần gốc (`MobileApp.tsx` & `greenOpsService.ts`):**
   Hai file này chiếm tới hơn 2.900 dòng code, nắm giữ mọi trạng thái và phân tán trách nhiệm điều phối.
3. **Mất dữ liệu ngoại tuyến khi ứng dụng bị tắt ngầm (Data Loss Risk):**
   Biến `snapshot` trong `greenOpsService.ts` nằm trên bộ nhớ RAM. Nếu nhân viên tắt app hoặc Android kill app khi đang rớt mạng, toàn bộ dữ liệu task và bằng chứng mới thu thập biến mất hoàn toàn.
4. **Nhầm lẫn giữa điều hướng và quy trình nghiệp vụ:**
   Enum `StaffStep` trong `mobileWorkflow.ts` chứa cả `HOME`, `MY_TREES`, `WORK` lẫn `GPS`, `QR`, `BEFORE`.

---

## 2. Kiến trúc mục tiêu đề xuất (Proposed Target Architecture — Subject to ADR Approval)

> **Phân loại kiến trúc:** `[PROPOSED]` — Kiến trúc phân tầng Clean Architecture / Ports and Adapters dưới đây là phương án kỹ thuật đề xuất, đang chờ phê duyệt thông qua Architecture Decision Record (ADR) chính thức trước khi triển khai mã nguồn.

Hệ thống mục tiêu đề xuất áp dụng nguyên lý **Clean Architecture / Ports and Adapters** nhằm đảm bảo mã nguồn độc lập với framework, dễ kiểm thử tự động (TDD) và bảo vệ dữ liệu hiện trường:

```text
+-----------------------------------------------------------------------------------+
|               TO-BE CLEAN ARCHITECTURE (PROPOSED TARGET ARCHITECTURE)             |
+-----------------------------------------------------------------------------------+
| [1. PRESENTATION LAYER (Giao diện người dùng)]                                     |
| Screens (StaffHome, StaffWork, StaffProofFlow, ManagerDashboard, ManagerReview)   |
| Presentational Components (TaskSurfaces, TreeSurfaces, AppPrimitives)             |
| UI ViewModels & Hooks (useTaskQueue, useProofWorkflow, useManagerReview)          |
| -> Chỉ render dữ liệu từ Application Layer; TUYỆT ĐỐI KHÔNG chứa logic nghiệp vụ. |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| [2. APPLICATION LAYER / USE CASES (Ca sử dụng ứng dụng - PROPOSED)]               |
| - StartTaskUseCase: Bắt đầu thực hiện nhiệm vụ (PENDING -> IN_PROGRESS)           |
| - VerifySiteUseCase: Thu thập QR/GPS & Xử lý ngoại lệ có kiểm soát                |
| - AcquireProofUseCase: Thu thập bằng chứng theo 3 ProofProfiles (CHANGE/SERVICE/INSP)|
| - ReportFieldIssueUseCase: Báo cáo sự cố hiện trường (IN_PROGRESS -> BLOCKED)     |
| - ResolveBlockedUseCase: Xử lý sự cố hiện trường (Resume / Reassign / Cancel)     |
| - SubmitTaskEvidenceUseCase: Đóng gói và gửi duyệt (Hợp đồng ProofProfile)        |
| - ReviewTaskUseCase: Thẩm định 4 kết luận (Approve, Rework, ApproveException, Cancel)|
| - CancelTaskUseCase: Hủy việc có lý do từ mọi trạng thái chưa đóng                |
| - ReassignTaskUseCase: Phân công lại ở PENDING & BLOCKED                          |
| - LookupTreeByQrUseCase: Tra cứu cây và lịch sử chăm sóc                          |
| - RestoreSessionUseCase: Khôi phục phiên làm việc                                 |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| [3. DOMAIN LAYER (Thực thể & Quy tắc nghiệp vụ cốt lõi - PROPOSED)]               |
| Aggregates & Entities: Task (7 states), Tree, SiteVerification, ReviewAudit       |
| Value Objects: QrCheck, GpsCheck, TaskEvidence (versioned), FieldIssue, Coordinates|
| Domain Invariants: DR-HARD-01..07, DR-MVP-01..06, DR-POL-01..05                   |
| Domain Events: TaskStartedEvent, TaskBlockedEvent, TaskSubmittedEvent...          |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| [4. PORTS (Giao diện ranh giới cổng - PROPOSED)]                                  |
| ITaskRepository | ITreeRepository | IAuthRepository | IDeviceHardwarePort        |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| [5. INFRASTRUCTURE ADAPTERS (Bộ điều hợp kỹ thuật & Ngoại vi - PROPOSED)]         |
| - RestApiAdapter: HTTP Client REST v1, multipart upload, xử lý mạng chập chờn     |
| - DurableStorageAdapter: SQLite / MMKV lưu trữ ngoại tuyến chống mất dữ liệu      |
| - ExpoHardwareAdapter: Quản lý quyền và luồng Camera / GPS của Expo SDK 57        |
+-----------------------------------------------------------------------------------+
```

---

## 3. Phân rã dịch vụ `greenOpsService` (Decomposition Plan)

`greenOpsService.ts` hiện là một "Anti-Corruption Layer" chuyển tiếp (Transitional Facade). Kế hoạch phân rã theo từng giai đoạn:

| Trách nhiệm hiện tại trong `greenOpsService`        | Phân loại       | Thành phần thay thế mục tiêu (Target Component) | Tầng kiến trúc (Layer)         |
| --------------------------------------------------- | --------------- | ----------------------------------------------- | ------------------------------ |
| Gọi HTTP REST `/v1/` và xử lý envelope              | Kỹ thuật / Mạng | `HttpTransportClient` / `RestApiAdapter`        | Infrastructure                 |
| Quản lý token, login, logout, restoreSession        | Ứng dụng        | `AuthRepository` & `useSession`                 | Application / Infra            |
| Lưu trữ và cập nhật danh sách Task, Tree cục bộ     | Dữ liệu / Kho   | `LocalTaskRepository`, `LocalTreeRepository`    | Infrastructure (Durable Cache) |
| Đóng gói multipart và upload ảnh bằng chứng         | Kỹ thuật        | `EvidenceUploadService`                         | Infrastructure                 |
| Tính toán `buildCareHistory` từ các task hoàn thành | Miền            | `CareHistoryProjector`                          | Domain / Application           |
| Tạo và cập nhật trạng thái thông báo                | Ứng dụng        | `NotificationRepository`                        | Infrastructure                 |

---

## 4. Kiểm toán hợp đồng `@novyx/contracts` (Contracts Audit)

### 4.1. Cấu trúc chuẩn đã được xác lập `[VERIFIED]`

- Chuẩn hóa Envelope phản hồi thành công: `ApiSuccess<TData> { data: TData }`.
- Chuẩn hóa Envelope phản hồi lỗi: `ApiFailure { error: ApiError { code, message, requestId, details } }`.
- Chuẩn hóa danh sách phân trang: `ApiList<TData> { data: TData[], meta: { nextCursor, hasMore } }`.
- Chuẩn hóa mã lỗi nghiệp vụ: `VALIDATION_FAILED`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`.

### 4.2. Các khoảng trống và rò rỉ hợp đồng cần bổ sung `[GAP]`

1. **Thiếu Idempotency Key cho thao tác nộp bằng chứng:**
   Trong `SubmitTaskEvidenceRequest`, chưa có trường `idempotencyKey` hoặc header HTTP tương ứng. Khi mạng chập chờn, nhân viên bấm gửi nhiều lần có thể gây trùng lặp request trên backend.
2. **Thiếu Optimistic Concurrency Control:**
   `TaskDto` chưa có trường `version: number`. Nếu Quản lý đổi người giao việc trong lúc Nhân viên đang nộp bằng chứng, hệ thống chưa có cơ chế phát hiện xung đột dữ liệu (Data Conflict).
3. **Bất đồng bộ giữa Pagination Contract và Triển khai UI:**
   Hợp đồng có `ListTasksQuery` hỗ trợ `cursor` và `limit`, nhưng toàn bộ màn hình mobile hiện tải 100% dữ liệu về bộ nhớ và lọc bằng mảng JavaScript cục bộ.

---

## 5. Kiến trúc dữ liệu và Bằng chứng hiện trường (Data & Evidence Architecture)

Bằng chứng hiện trường (Evidence) là tài sản thông tin có giá trị kiểm toán vận hành cao nhất trong NOVYX (LEGAL STATUS: NOT ESTABLISHED / OUTSIDE CURRENT MVP CLAIMS):

```text
[Camera máy / Cảm biến GPS]
       |
       | 1. Chụp ảnh
       v
[File cục bộ trong Cache máy: file://.../cache/evidence-123.jpg]
       |
       | 2. Lưu vào CSDL cục bộ (SQLite/Durable Store) kèm Metadata:
       |    - taskId, treeId, proofProfile (CHANGE/SERVICE/INSPECTION)
       |    - stage/role (before/after/completion/finding), attemptNumber
       |    - capturedAt (ISO UTC), capturedByUserId (StaffId)
       |    - siteVerification (lat, lng, accuracy, distance, timestamp, exceptions)
       v
[Hàng đợi đồng bộ (Sync Queue / Outbox)]
       |
       +---> [Khi có mạng]: Upload Multipart (File nhị phân + JSON metadata)
       |        |
       |        v
       |     [Backend Object Storage (Provider: TBD / NEEDS_DECISION) & Database]
       |        |
       |        v
       |     [Trả về Remote URL chính thức: https://... (Storage Provider TBD)]
       |
       +---> [Khi mất mạng]: Giữ nguyên URI cục bộ; giao diện tiếp tục hoạt động.
```

### 5.1. Bất biến lưu trữ bằng chứng

- Không bao giờ lưu file ảnh dạng Base64 trong database hoặc state.
- URI cục bộ phải được đảm bảo không bị hệ điều hành xóa dọn (Garbage Collected) trước khi nộp thành công lên server.
- Mỗi ảnh bằng chứng bắt buộc phải đi kèm metadata định vị tại đúng thời điểm chụp để phục vụ hậu kiểm.

---

## 6. Sổ đăng ký quyết định kiến trúc kỹ thuật tiếp theo (Technical Decisions Register)

Các quyết định kiến trúc sau đây được nhận diện từ quá trình đồng bộ nghiệp vụ nhưng **CHƯA ĐƯỢC TRIỂN KHAI MÃ NGUỒN** và sẽ được giải quyết trong giai đoạn "Technical Architecture Baseline Reconciliation":

| Mã quyết định       | Vấn đề kiến trúc kỹ thuật                                                                    | Phân loại trạng thái | Hướng tiếp cận sơ khởi                                                                                       |
| :------------------ | :------------------------------------------------------------------------------------------- | :------------------- | :----------------------------------------------------------------------------------------------------------- |
| **ADR-PROPOSED-01** | Tách biệt trạng thái Vòng đời Task (`TaskStatus`) và Tiến trình bằng chứng (`ProofProgress`) | `[PROPOSED]`         | Tách state owner trong ViewModel/Hook thay vì gộp chung vào `TaskDto`.                                       |
| **ADR-PROPOSED-02** | Lựa chọn giải pháp lưu trữ bền vững ngoại tuyến: SQLite (expo-sqlite) vs MMKV                | `[NEEDS_DECISION]`   | SQLite hỗ trợ quan hệ bảng cho evidence history; MMKV tối ưu cho key-value cache nhẹ.                        |
| **ADR-PROPOSED-03** | Mô hình lưu trữ và định danh phiên bản bằng chứng (`TaskEvidenceAttempt`)                    | `[NEEDS_DECISION]`   | Lưu vết `attemptNumber: 1, 2...` kèm tham chiếu ID bằng chứng cũ thay vì clone toàn bộ.                      |
| **ADR-PROPOSED-04** | Cơ chế Outbox Queue & Retry Policy cho đồng bộ ngoại tuyến                                   | `[PROPOSED]`         | Hàng đợi tuần tự (FIFO) với exponential backoff, phân biệt lỗi 4xx và 5xx/mạng.                              |
| **ADR-PROPOSED-05** | Hợp đồng API cho Báo cáo sự cố (`FieldIssue`) và 3 lối thoát của `BLOCKED`                   | `[PROPOSED]`         | Bổ sung endpoints `POST /tasks/:id/field-issue` và `POST /tasks/:id/resolve-blocked` vào `@novyx/contracts`. |
| **ADR-PROPOSED-06** | Hợp đồng API cho Phê duyệt có ngoại lệ (`approve_with_exception`)                            | `[PROPOSED]`         | Cập nhật payload `ReviewDecisionRequest` và bổ sung cờ ngoại lệ vào `CareHistoryDto`.                        |
