# NOVYX GreenOps — Business Optimization Gap Register (Phase 0)

> **Tài liệu thuộc Phase 0 — Baseline Freeze & Change Control (Tiêu chuẩn P0-10)**  
> Ghi nhận toàn bộ khoảng trống nghiệp vụ, các quyết định mở cần chốt và ranh giới quản trị đối với vai trò **Admin**, làm cơ sở thực thi xuyên suốt từ Phase 1 đến Phase 10 của Master Plan.

---

## 1. Sổ Đăng Ký Khoảng Trống Nghiệp Vụ (Business Gap Register)

| Mã Gap | Lĩnh vực ảnh hưởng | Hiện trạng Baseline | Rủi ro / Mâu thuẫn nghiệp vụ | Mục tiêu Chuẩn hóa (Target Phase) |
|---|---|---|---|---|
| **GAP-ADM-01** | Mô hình Tác nhân (Actor Model) | Docs ghi nhận Admin là `[OUT_OF_MVP]`, nhưng mã nguồn client mobile lại có nút quick-login `admin → Manager`. | Vi phạm nguyên tắc phân tách trách nhiệm; ép buộc một vai trò quản trị (Admin) phải hành xử như vai trò vận hành thực địa (Manager). | **Phase 1**: Chốt dứt điểm quy tắc `Admin ≠ Manager` và định nghĩa độc lập 4 actors (Staff, Manager, Admin, System). |
| **GAP-ADM-02** | Ranh giới Năng lực Quản trị (Admin Scope) | Chưa có danh mục năng lực (Capabilities) rõ ràng cho Admin; chỉ có mô tả chung chung "vận hành cấp cao". | Nguy cơ gán ghép tùy tiện các quyền hạn mà không gắn liền với giá trị nghiệp vụ thực tế hoặc kiểm toán được. | **Phase 2**: Phân loại nhị phân từng capability vào 1 trong 4 trạng thái: `MVP`, `NEXT`, `RESERVED`, `REJECTED`. |
| **GAP-ADM-03** | Ranh giới Ngữ cảnh (Bounded Contexts) | Chưa tách biệt giữa Core Field Verification Context và Generic Administration/Identity Context. | Nguy cơ ô nhiễm Bounded Context cốt lõi của việc chăm sóc cây bằng các thực thể tài khoản và cấu hình hệ thống. | **Phase 3**: Xác lập Bounded Context riêng biệt `Identity & Access Management` và `Administration & Audit`. |
| **GAP-ADM-04** | Ma trận Phân quyền & Điều kiện Kích hoạt | Ma trận hiện tại (`07-action-eligibility`) chỉ bao phủ Staff và Manager; quyền hạn Admin chưa có công thức 4 yếu tố. | Thiếu ma trận phân quyền quản trị; nguy cơ Admin trở thành "Superuser" có thể tùy tiện can thiệp hoặc ghi đè trạng thái task. | **Phase 4**: Xây dựng 2 ma trận độc lập: Operational Action Matrix (Staff/Manager) và Governance Action Matrix (Admin). |
| **GAP-ADM-05** | Luồng Quy trình & Bơi làn (Swimlanes) | Chưa có quy trình chuẩn cho User Provisioning, Role Change, Account Suspension, Master Data Governance, Break-glass. | Thiếu quy trình vận hành quản trị có lưu vết kiểm toán (Audit Trail); nguy cơ chèn sai Admin lane vào quy trình hiện trường. | **Phase 5**: Định nghĩa rõ quy trình quản trị chuyên biệt, tuyệt đối không chèn Admin lane vào Operational Task Swimlane. |
| **GAP-ADM-06** | Đồng bộ Hệ thống Tài liệu Canonical | Các tài liệu `PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md` chưa đồng bộ về Admin. | Không nhất quán về khái niệm và thuật ngữ (Ubiquitous Language); thiếu liên kết truy vết yêu cầu (RTM). | **Phase 6 & 7**: Hiệu chỉnh đồng bộ theo thứ tự nghiêm ngặt và mở rộng bảng RTM với Acceptance Oracles dạng nhị phân. |
| **GAP-ADM-07** | Hệ thống Sơ đồ Trực quan (Diagrams) | 16 sơ đồ hiện hữu được thiết kế khi Admin ở trạng thái `RESERVED`; thiếu các góc nhìn trực quan về Governance. | Biểu đồ không phản ánh đúng kiến trúc bảo mật và phân quyền quản trị sau khi chuẩn hóa. | **Phase 8**: Cập nhật các biểu đồ active liên quan và cân nhắc bổ sung sơ đồ quản trị chuyên biệt (13, 14, 15). |

---

## 2. Sổ Đăng Ký Quyết Định Mở Bắt Buộc Chốt (Open Decision Register)

Các câu hỏi kiến trúc nghiệp vụ bắt buộc phải được giải quyết dứt điểm tại Phase 1 và Phase 2:

### 2.1. Nhóm Quyết định Tác nhân (Phase 1 Decisions)

- **P1-D01: Admin có trở thành active product role hay không?**
  - *Option A*: Admin là active role quản trị hệ sinh thái (tài khoản, phân quyền, cấu hình danh mục) có mặt trong kế hoạch hiện hành.
  - *Option B*: Admin tiếp tục là `[OUT_OF_MVP] / [RESERVED]` và bị loại bỏ hoàn toàn khỏi mã nguồn client hiện tại.
  - *Định hướng*: Cần chuẩn hóa mô hình 3-role để Admin có ranh giới rõ ràng, không bị lẫn lộn vào Manager.

- **P1-D02: Admin là human actor độc lập hay subtype của Manager?**
  - *Nguyên tắc bất biến*: `Admin ≠ Manager`. Admin là human actor độc lập chuyên trách quản trị nền tảng, không sở hữu các quyền vận hành tác vụ của Manager (như duyệt bằng chứng, giao việc chăm sóc cây).

- **P1-D03: Admin có được tham gia task operations thông thường không?**
  - *Nguyên tắc*: Mặc định KHÔNG. Admin không nhận task, không đi hiện trường, không tự tạo task tác vụ thường nhật và tuyệt đối không tự phê duyệt công việc.

- **P1-D04: System actor giữ phạm vi nào?**
  - *Định vị*: System là technical actor thực thi các tác vụ nền tảng (cache sync, token refresh, outbox, sensor check), không dùng như một người dùng đóng vai trò quản trị viên.

- **P1-D05: Có Service/System Administrator khác Admin hay không?**
  - *Làm rõ*: Phân định rõ Business Administrator (quản lý user, role, danh mục nghiệp vụ) và Infrastructure/DevOps Administrator (hạ tầng máy chủ, database - nằm ngoài phạm vi nghiệp vụ ứng dụng).

---

### 2.2. Nhóm Quyết định Năng lực Quản trị (Phase 2 Capabilities)

| Capability Ứng viên | Mục đích Nghiệp vụ | Ràng buộc Bảo mật & Kiểm toán | Trạng thái Dự kiến (`MVP` / `NEXT` / `RESERVED` / `REJECTED`) |
|---|---|---|:---:|
| **User Provisioning** | Tạo tài khoản, kích hoạt, vô hiệu hóa người dùng | Bắt buộc ghi nhận actor tạo, thời gian, trạng thái tài khoản | *Chốt tại Phase 2* |
| **Role Assignment** | Gán vai trò Staff, Manager, Admin | Bắt buộc lưu lịch sử phân quyền; không ghi đè vết lịch sử | *Chốt tại Phase 2* |
| **Account Recovery** | Mở khóa tài khoản, cấp lại quyền truy cập | Phải có lý do và xác thực định danh | *Chốt tại Phase 2* |
| **Audit Log Inspection** | Đọc, lọc, tra cứu nhật ký kiểm toán hệ thống | Read-only; cấm sửa đổi hoặc xóa bản ghi log | *Chốt tại Phase 2* |
| **Tree Master Data** | Quản lý danh mục cây đô thị, mã định danh cây | Tách biệt với việc chăm sóc cây; thay đổi có lưu vết | *Chốt tại Phase 2* |
| **TaskType Catalog** | Quản trị danh mục loại công việc chăm sóc cây | Gắn liền với định nghĩa ProofProfile chuẩn | *Chốt tại Phase 2* |
| **ProofProfile Policy** | Quản trị quy tắc bằng chứng bắt buộc theo loại việc | Không cho phép hạ cấp ProofProfile tùy tiện | *Chốt tại Phase 2* |
| **Checklist Templates** | Quản trị mẫu danh mục kiểm tra hiện trường | Quản lý đa phiên bản (versioning) | *Chốt tại Phase 2* |
| **Break-Glass Access** | Cơ chế mở khóa khẩn cấp khi ách tắc hệ thống | Bắt buộc có lý do + actor + timestamp + alert kiểm toán | *Chốt tại Phase 2* |

---

## 3. Quy Tắc Phân Tách Trách Nhiệm (Separation of Duties - SoD)

Nhằm chống lại tình trạng "Superuser độc quyền", hệ thống thiết lập các rào cản bất biến:

1. **Cấm tự phê duyệt (Self-Review Prohibition)**: Bất kỳ actor nào (kể cả Admin nếu sau này có quyền tác vụ) đều không được phê duyệt công việc do chính mình thực hiện.
2. **Cấm ghi đè ngầm (No Silent Bypass)**: Mọi quyền can thiệp ngoại lệ (Break-glass) phải tạo ra Audit Event bất biến kèm lý do bắt buộc.
3. **Bảo toàn tính chính danh lịch sử (Historical Authorship Preservation)**: Việc thay đổi role hoặc vô hiệu hóa tài khoản không được làm thay đổi hoặc xóa bỏ danh tính tác giả trong các báo cáo lịch sử chăm sóc cây (`CareHistory`).
4. **Không trộn lẫn Vận hành và Quản trị (Separation of Operations and Governance)**: Manager tập trung 100% vào điều phối hiện trường; Admin tập trung vào cấu hình nền tảng và kiểm toán tuân thủ.
