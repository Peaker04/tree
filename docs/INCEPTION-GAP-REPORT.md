# NOVYX GreenOps — Inception Gap Report & Open Decision Register

Tài liệu này là báo cáo chính thức tổng hợp toàn bộ **CÁC KHOẢNG TRỐNG KIẾN TRÚC & NGHIỆP VỤ (Gaps)** được phát hiện qua đợt Inception đối soát mã nguồn ở baseline commit `2f9a26b`, cùng với **SỔ ĐĂNG KÝ QUYẾT ĐỊNH MỞ (Open Decision Register)** và **TÁI ĐÁNH GIÁ LỘ TRÌNH KIỂM TOÁN CŨ**.

---

## 1. Báo cáo khoảng trống phân loại theo lĩnh vực (Classified Gap Report)

Mỗi khoảng trống được phân hạng nghiêm ngặt theo mức độ nghiêm trọng:

- `BLOCKER`: Nguy cơ cao gây mất dữ liệu hiện trường, hỏng quy trình lõi hoặc sập ứng dụng.
- `HIGH`: Khiếm khuyết kiến trúc lớn gây khó khăn cho việc mở rộng hoặc bảo trì.
- `MEDIUM`: Điểm vênh về hợp đồng dữ liệu, hiệu năng danh sách hoặc quy ước giao diện.
- `LOW`: Vấn đề làm sạch mã nguồn hoặc tối ưu nhỏ.

---

### GAP-DATA-01: Bộ đệm ngoại tuyến (Offline Snapshot) lưu trên RAM gây mất dữ liệu khi kill app

- **ID:** `GAP-DATA-01`
- **Lĩnh vực:** `OFFLINE / RESILIENCE` & `DATA`
- **Trạng thái:** `GAP`
- **Mức độ nghiêm trọng:** `BLOCKER`
- **Hiện trạng thực tế `[VERIFIED]`:**
  Tại `apps/mobile/src/services/greenOpsService.ts` (dòng 425):
  `let snapshot: AppData = createInitialData();`
  Toàn bộ dữ liệu tác vụ, bằng chứng chụp ảnh và thông báo khi rớt mạng đều lưu trong biến JavaScript trong bộ nhớ RAM.
- **Kỳ vọng:** Khi rớt mạng, tiến trình làm việc và ảnh bằng chứng phải được lưu vào bộ lưu trữ bền vững (Durable Storage: MMKV / SQLite) để nếu Android tắt ngầm ứng dụng (OS Kill khi RAM đầy), dữ liệu vẫn sống sót $100\%$.
- **Bằng chứng:** Tắt tiến trình ứng dụng khi đang ở chế độ rớt mạng $\to$ Mở lại thấy dữ liệu quay về mock ban đầu.
- **Tác động:** Nhân viên mất toàn bộ công sức định vị và chụp ảnh ngoài hiện trường; vi phạm cam kết `QAS-OFFLINE-01` và `QAS-OFFLINE-02`.
- **Hướng đề xuất:** Thay thế biến in-memory bằng `DurableStorageAdapter` (sử dụng `@react-native-async-storage/async-storage` hoặc `react-native-mmkv`).
- **Quyết định cần xin ý kiến:** Xem `DEC-01`.
- **Phụ thuộc:** `greenOpsService` refactor.
- **Chặn MVP?**: **CÓ (BLOCKER CHO MVP FIELD-READY)**

---

### GAP-ARCH-01: Rò rỉ logic biến đổi trạng thái nghiệp vụ vào thành phần giao diện JSX

- **ID:** `GAP-ARCH-01`
- **Lĩnh vực:** `APPLICATION ARCHITECTURE` & `DOMAIN`
- **Trạng thái:** `GAP`
- **Mức độ nghiêm trọng:** `HIGH`
- **Hiện trạng thực tế `[VERIFIED]`:**
  Tại `apps/mobile/src/screens/manager/ManagerReview.tsx` (dòng 132-136 và 163-167):
  Thành phần giao diện tự tay khởi tạo object `fallbackTask` với trạng thái `TaskStatus.COMPLETED` hoặc `TaskStatus.REWORK_REQUIRED` và ngày cập nhật `new Date().toISOString()`, rồi truyền vào `props.reviewTaskDecision(..., fallbackTask)`.
- **Kỳ vọng:** Giao diện chỉ gửi Command nghiệp vụ (`ApproveTaskCommand`, `RequestReworkCommand`). Tầng Application/Domain chịu trách nhiệm tính toán trạng thái mới và bảo vệ Invariants.
- **Bằng chứng:** Mã nguồn `ManagerReview.tsx` chứa trực tiếp các đoạn code `fallbackTask`.
- **Tác động:** Logic nghiệp vụ bị phân tán; khó viết Unit Test độc lập không dính JSX; dễ sai lệch trạng thái nếu màn hình khác gọi service.
- **Hướng đề xuất:** Chuyển toàn bộ logic tạo `fallbackTask` vào Use Case (`ReviewTaskUseCase`) hoặc Domain Entity method.
- **Quyết định cần xin ý kiến:** Xem `DEC-02`.
- **Phụ thuộc:** Không.
- **Chặn MVP?**: **CÓ (Phải chuẩn hóa trước khi refactor màn hình Manager)**

---

### GAP-WORKFLOW-01: Ghép lẫn điều hướng màn hình và bước thu thập bằng chứng vào `StaffStep`

- **ID:** `GAP-WORKFLOW-01`
- **Lĩnh vực:** `WORKFLOW` & `DOMAIN`
- **Trạng thái:** `GAP`
- **Mức độ nghiêm trọng:** `HIGH`
- **Hiện trạng thực tế `[VERIFIED]`:**
  Tại `apps/mobile/src/domain/mobileWorkflow.ts` (dòng 3-17):
  `type StaffStep = 'HOME' | 'MY_TREES' | 'WORK' | 'MAP' | 'DETAIL' | 'GPS' | 'QR' | 'BEFORE' | 'CHECKLIST' | 'AFTER' | 'REVIEW' | 'SUCCESS' | 'NOTIFICATIONS' | 'ACCOUNT';`
  Một enum duy nhất quản lý cả tab điều hướng cấp cao lẫn 5 bước quy trình thu thập bằng chứng.
- **Kỳ vọng:** Tách biệt rõ ràng giữa **Tuyến điều hướng (StaffNavigationRoute)** và **Trạng thái quy trình bằng chứng (ProofAcquisitionState)**.
- **Bằng chứng:** Mọi thay đổi về cấu trúc màn hình đều buộc phải sửa đổi `StaffStep`.
- **Tác động:** `StaffProofFlow.tsx` phình to thành file độc khối 1.476 dòng vì phải gánh toàn bộ các bước lồng nhau; khó kiểm soát nút Back của Android.
- **Hướng đề xuất:** Tách thành `StaffRoute` (`HOME`, `MY_TREES`, `WORK`, `ACCOUNT`, `PROOF_FLOW`) và `ProofStepKey` (`GPS`, `QR`, `BEFORE`, `CHECKLIST`, `AFTER`, `REVIEW`).
- **Quyết định cần xin ý kiến:** Xem `DEC-03`.
- **Phụ thuộc:** `StaffArea.tsx`, `StaffProofFlow.tsx`.
- **Chặn MVP?**: **CÓ (Cốt lõi để dỡ bỏ file độc khối StaffProofFlow)**

---

### GAP-CONTRACT-01: Hợp đồng thiếu `idempotencyKey` và khóa lạc quan `version`

- **ID:** `GAP-CONTRACT-01`
- **Lĩnh vực:** `INTEGRATION` & `DATA`
- **Trạng thái:** `GAP`
- **Mức độ nghiêm trọng:** `MEDIUM`
- **Hiện trạng thực tế `[VERIFIED]`:**
  Tại `packages/contracts/src/index.ts`:
  `SubmitTaskEvidenceRequest` chỉ chứa `taskId`, `gpsCheck`, `qrCheck`, `evidence`, `checklist`, `notes`. Không có `idempotencyKey`. `TaskDto` không có trường `version: number`.
- **Kỳ vọng:** Khi nhân viên bấm nộp bằng chứng trong điều kiện mạng lag, request có thể bị gửi 2 lần; cần có `idempotencyKey` để backend không ghi nhận trùng lặp. Cần có `version` để phát hiện nếu Manager đổi việc trong lúc Staff đang làm.
- **Bằng chứng:** Đọc định nghĩa request trong contracts package.
- **Tác động:** Dữ liệu có thể bị trùng lặp hoặc ghi đè mất mát khi tích hợp backend thực tế.
- **Hướng đề xuất:** Bổ sung trường tùy chọn `idempotencyKey?: string` vào `SubmitTaskEvidenceRequest` và `version?: number` vào `TaskDto`.
- **Quyết định cần xin ý kiến:** Xem `DEC-04`.
- **Phụ thuộc:** `@novyx/contracts`.
- **Chặn MVP?**: Không chặn giao diện mock, nhưng chặn Backend Integration.

---

### GAP-PERF-01: Sử dụng `ScrollView` + `map()` cho danh sách công việc và danh mục cây

- **ID:** `GAP-PERF-01`
- **Lĩnh vực:** `NFR` & `APPLICATION ARCHITECTURE`
- **Trạng thái:** `GAP`
- **Mức độ nghiêm trọng:** `HIGH`
- **Hiện trạng thực tế `[VERIFIED]`:**
  Tại `StaffWork.tsx`, `StaffTrees.tsx`, `ManagerTrees.tsx`, `ManagerReview.tsx`:
  Các màn hình đều dùng `<ScrollView>` bọc ngoài và render toàn bộ phần tử mảng bằng `.map((task) => <TaskCard ... />)`.
- **Kỳ vọng:** Bắt buộc sử dụng `FlatList` với cơ chế ảo hóa khung nhìn (Virtualization) và `keyExtractor` ổn định theo chuẩn `QAS-PERF-01`.
- **Bằng chứng:** Đã ghi nhận trong `docs/MOBILE_DESIGN_AUDIT.md`.
- **Tác động:** Khi số lượng cây hoặc task vượt quá 100, ứng dụng sẽ bị tràn bộ nhớ (OOM) và giật khung hình nghiêm trọng trên Android.
- **Hướng đề xuất:** Chuyển đổi sang `FlatList` trong Wave tái cấu trúc màn hình.
- **Quyết định cần xin ý kiến:** Đã thống nhất trong lộ trình; cần ưu tiên thực hiện.
- **Chặn MVP?**: **CÓ (Chặn kiểm thử hiệu năng ngoài thực địa)**

---

### GAP-AUTH-01: File `LoginScreen.tsx` độc lập là mã chết (Dead Code)

- **ID:** `GAP-AUTH-01`
- **Lĩnh vực:** `DOCUMENTATION GOVERNANCE` & `APPLICATION ARCHITECTURE`
- **Trạng thái:** `GAP`
- **Mức độ nghiêm trọng:** `LOW`
- **Hiện trạng thực tế `[VERIFIED]`:**
  File `apps/mobile/src/screens/LoginScreen.tsx` (300 dòng) không được import hoặc sử dụng ở bất kỳ đâu. Toàn bộ logic đăng nhập thực tế đang nằm inline trong `apps/mobile/src/screens/MobileApp.tsx` (dòng 150-350).
- **Kỳ vọng:** Tách màn hình đăng nhập thành component độc lập sạch sẽ và xóa bỏ file dead code.
- **Bằng chứng:** Tìm kiếm chuỗi import `LoginScreen` trong toàn bộ repository cho kết quả rỗng.
- **Tác động:** Gây hiểu nhầm cho lập trình viên mới; lãng phí dung lượng bundle.
- **Hướng đề xuất:** Tách logic đăng nhập từ `MobileApp.tsx` sang `LoginScreen.tsx` chuẩn và đấu nối lại router.
- **Chặn MVP?**: Không, dọn dẹp trong Wave 0.

---

## 2. Sổ đăng ký quyết định kiến trúc mở (Open Decision Register)

Dưới đây là các bài toán kiến trúc còn nhiều phương án kỹ thuật, cần Product Owner / Tech Lead xem xét và phê duyệt trước khi bước vào giai đoạn triển khai:

---

### DEC-01: Lựa chọn công nghệ lưu trữ ngoại tuyến bền vững (Durable Offline Store)

- **Vấn đề:** Hiện tại `snapshot` lưu trên RAM (in-memory). Cần cơ chế lưu trữ để bảo vệ dữ liệu khi tắt app ngoài hiện trường.
- **PHƯƠNG ÁN A: Giữ nguyên In-Memory JS Variable (Hiện trạng)**
  - _Ưu điểm:_ Không tốn công sửa đổi; chạy mượt trên máy giả lập.
  - _Chi phí & Rủi ro:_ Mất sạch dữ liệu khi app bị OS kill; không thể dùng ngoài thực địa.
  - _Tác động MVP:_ Thất bại hoàn toàn khi thử nghiệm thực địa.
- **PHƯƠNG ÁN B: Tích hợp `@react-native-async-storage/async-storage` (Đề xuất khuyến nghị)**
  - _Ưu điểm:_ Thư viện chuẩn được Expo SDK 57 hỗ trợ chính thức; API đơn giản; lưu chuỗi JSON an toàn; đủ nhanh cho khối lượng vài nghìn bản ghi cây/task.
  - _Chi phí & Rủi ro:_ Cần tuần tự hóa JSON (JSON.stringify/parse) khi đọc/ghi snapshot.
  - _Tác động MVP:_ Đảm bảo $100\%$ tính bền vững dữ liệu mà không cần cài thêm thư viện native phức tạp.
  - _Độ phức tạp di chuyển:_ Rất thấp (chỉ thay đổi tầng lưu trữ trong `greenOpsService`).
- **PHƯƠNG ÁN C: Cài đặt SQLite cục bộ (`expo-sqlite`)**
  - _Ưu điểm:_ Hỗ trợ truy vấn SQL quan hệ, đánh chỉ mục và phân trang cực mạnh.
  - _Chi phí & Rủi ro:_ Quá mức cần thiết (Over-engineering) cho giai đoạn MVP; tốn nhiều thời gian thiết kế schema cục bộ và cơ chế đồng bộ 2 chiều (Bi-directional Sync).
- **HƯỚNG ĐỀ XUẤT:** `[PROPOSED]` **Chọn PHƯƠNG ÁN B**.

---

### DEC-02: Chiến lược phân rã `greenOpsService` và `MobileApp.tsx`

- **Vấn đề:** Hai file này quá lớn (gần 3.000 dòng code), gây nghẽn bảo trì và vi phạm đơn trách nhiệm (Single Responsibility Principle).
- **PHƯƠNG ÁN A: Phân rã ngay lập tức thành toàn bộ các Repository và Use Case riêng biệt**
  - _Ưu điểm:_ Đạt chuẩn Clean Architecture tối đa ngay lập tức.
  - _Chi phí & Rủi ro:_ Khối lượng file thay đổi quá lớn cùng lúc; nguy cơ gãy các luồng đang chạy nếu không có bộ test suite bao phủ toàn diện.
- **PHƯƠNG ÁN B: Phân rã 2 bước theo mô hình Anti-Corruption Layer (Khuyến nghị)**
  - _Bước 1:_ Giữ `greenOpsService` làm Facade bên ngoài cho UI gọi, nhưng bên trong tách nhỏ thành các module thuần túy: `TaskRepository`, `TreeRepository`, `AuthStore`, `EvidenceUploader`.
  - _Bước 2:_ Dỡ bỏ `MobileApp.tsx` bằng cách tách Router riêng và đưa State về các Hook chuyên biệt (`useTaskQueue`, `useStaffProof`).
  - _Ưu điểm:_ Rollback an toàn; kiểm thử được từng phần; không làm gián đoạn tiến độ chung.
- **HƯỚNG ĐỀ XUẤT:** `[PROPOSED]` **Chọn PHƯƠNG ÁN B**.

---

### DEC-03: Tách biệt cấu trúc điều hướng và Quy trình Proof trong `mobileWorkflow.ts`

- **Vấn đề:** Enum `StaffStep` gộp chung 14 trạng thái màn hình và bước proof.
- **PHƯƠNG ÁN A: Giữ nguyên `StaffStep` 14 giá trị**
  - _Ưu điểm:_ Không cần sửa đổi code hiện tại.
  - _Nhược điểm:_ Không thể xử lý độc lập nút Android Back; giao diện tiếp tục bị trói chặt vào mã nguồn dài dòng.
- **PHƯƠNG ÁN B: Tách thành 2 kiểu dữ liệu độc lập (Khuyến nghị)**
  - `type StaffTab = 'HOME' | 'MY_TREES' | 'WORK' | 'ACCOUNT';` (Điều hướng cấp cao)
  - `type ProofStepKey = 'GPS' | 'QR' | 'BEFORE' | 'CHECKLIST' | 'AFTER' | 'REVIEW';` (Tiến trình proof)
  - _Ưu điểm:_ Rõ ràng về mặt miền; cho phép `StaffProofFlow` trở thành một luồng độc lập có thể mở từ bất kỳ đâu (từ Work hoặc từ Tree details).
- **HƯỚNG ĐỀ XUẤT:** `[PROPOSED]` **Chọn PHƯƠNG ÁN B**.

---

## 3. Tái đánh giá lộ trình kiểm toán giao diện cũ (Audit Re-evaluation)

Các phát hiện trong tài liệu kiểm toán cũ `docs/MOBILE_DESIGN_AUDIT.md` (các Wave 0–5) được phân loại lại dựa trên nền tảng kiến trúc mới:

| Phát hiện kiểm toán cũ                               | Trạng thái phân loại mới          | Diễn giải & Hướng xử lý kiến trúc                                                               |
| ---------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Lạm dụng GradientCard màu mè trên nhiều màn hình** | `STILL_VALID`                     | Giữ nguyên kế hoạch thay thế bằng `Card` phẳng theo chuẩn Seed/Linear trong Wave 1.             |
| **Sử dụng fontWeight 800/900 không có trong token**  | `STILL_VALID`                     | Chuẩn hóa về token `typography` (400, 500, 600) trong Wave 0.                                   |
| **Dùng ScrollView.map() thay vì FlatList**           | `NEEDS_ARCHITECTURE_CHANGE_FIRST` | Không sửa vội trong UI nếu chưa chuẩn hóa xong tầng dữ liệu và phân trang của `TaskRepository`. |
| **File `LoginScreen.tsx` là mã chết**                | `STILL_VALID`                     | Xóa bỏ an toàn trong Wave 0 để làm sạch mã nguồn.                                               |
| **MobileApp.tsx quá tải dung lượng và styles**       | `NEEDS_ARCHITECTURE_CHANGE_FIRST` | Phải tách Router và State Hook trước khi chỉnh sửa giao diện và CSS của file này.               |
| **Các token màu cũ thừa thãi (`forest`, `sage`...)** | `STILL_VALID`                     | Dọn dẹp trong Wave 0 sau khi toàn bộ màn hình đã trỏ về `DESIGN.md`.                            |
| **StaffProofFlow.tsx độc khối 1.476 dòng**           | `NEEDS_ARCHITECTURE_CHANGE_FIRST` | Bắt buộc phải bóc tách `ProofWorkflow` theo `DEC-03` trước khi tiến hành chia nhỏ component UI. |
