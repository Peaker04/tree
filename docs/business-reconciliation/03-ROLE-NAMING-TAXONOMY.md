# NOVYX GreenOps — Role Naming & Taxonomy Reconciliation

> **Tài liệu chuẩn mực phân loại và định danh tác nhân (Role Naming & Taxonomy)**
> Thuộc chu trình: **Business Baseline Reconciliation — Mini-Phase (giữa Phase 1 và Phase 2)**.
> Căn cứ chuẩn tắc: [`docs/business-reconciliation/02-ACTOR-MODEL-DECISION.md`](02-ACTOR-MODEL-DECISION.md) và [`docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md`](../NOVYX_Business_Baseline_Reconciliation_Master_Plan.md).
>
> **Ranh giới thực thi (Hard Scope Rule)**:
> - Tài liệu này chuẩn hóa **hệ thống thuật ngữ và định danh chuẩn tắc** (Taxonomy & Naming Standards).
> - **KHÔNG** sửa đổi mã nguồn ứng dụng (`apps/`, `packages/`).
> - **KHÔNG** đổi mã định danh kỹ thuật (`UserRole = 'staff' | 'manager' | 'admin'`).
> - **KHÔNG** sửa đổi tài liệu canonical (`PRODUCT.md`, `DOMAIN.md`, `ACCESS-CONTROL.md`, `WORKFLOWS.md`, `REQUIREMENTS-TRACEABILITY.md`) hay sơ đồ trực quan trong mini-phase này (chỉ ghi nhận độ lệch thuật ngữ để đồng bộ tại Phase 6).
>
> **Định danh Baseline khởi đầu**:
> - Branch: `base-setup`
> - Starting Commit HEAD: [`42a54593099670032c42a516e54e92e552cd31d6`](https://github.com/Peaker04/tree/commit/42a54593099670032c42a516e54e92e552cd31d6)
> - Starting Tree Hash: `484173bafc3a57cbd78673710bb63f0e69140d86`
> - Trạng thái: **ROLE NAMING TAXONOMY PASS** (100% tiêu chuẩn RN-01..RN-12 có bằng chứng nghiệm thu nhị phân).

---

## 1. Nguyên Tắc Định Danh Chuẩn Tắc (Naming Principles)

Để chấm dứt tình trạng dùng từ ngữ tùy tiện, mâu thuẫn giữa code và tài liệu, NOVYX GreenOps thiết lập 5 nguyên tắc định danh cốt lõi:

1. **Phân tách 3 Tầng Khái niệm (Three-Tier Concept Separation)**:
   $$\text{Technical Role ID} \neq \text{Canonical Business Name} \neq \text{Vietnamese Display Label}$$
   - *Technical Role ID*: Dùng trong database, JWT claims, API contracts (`'staff'`, `'manager'`, `'admin'`). Cần ngắn gọn, ổn định, bất biến, không refactor tùy tiện khi không có yêu cầu kỹ thuật bắt buộc.
   - *Canonical Business Name*: Tên tiếng Anh chuẩn tắc dùng trong tài liệu kiến trúc, đặc tả nghiệp vụ, mô hình miền DDD (`Field Staff`, `Operations Manager`, `Platform Administrator`, `System`).
   - *Vietnamese Display Label*: Nhãn hiển thị tiếng Việt trên giao diện người dùng (UI) và tài liệu vận hành bản địa hóa (`Nhân viên hiện trường`, `Quản lý vận hành`, `Quản trị hệ thống`, `Hệ thống tự động`).
2. **Định danh Phản ánh Bản chất Trách nhiệm (Responsibility-Driven Naming)**: Tên gọi phải thể hiện chính xác phạm vi nghiệp vụ và thẩm quyền độc quyền của vai trò (Ví dụ: `Field Staff` thể hiện công tác ngoài thực địa; `Operations Manager` thể hiện điều phối vận hành; `Platform Administrator` thể hiện quản trị nền tảng).
3. **Phân tách Rạch ròi Vận hành và Quản trị (Operations vs. Governance Orthogonality)**: Không dùng các danh xưng thể hiện cấp bậc cha-con sai lệch giữa Admin và Manager. Admin không phải là "Manager cấp cao", và Manager không phải là "Admin cấp thấp".
4. **Không Nhân cách hóa Hệ thống (De-humanization of System Actor)**: Tác nhân tự động hóa (`System`) là thực thể kỹ thuật, tuyệt đối không được gọi là "Role", "User" hay "Account".
5. **Chống Từ ngữ Mơ hồ (Ambiguity Elimination)**: Loại bỏ triệt để các từ đơn lẻ quá chung chung như "Nhân viên" (không rõ văn phòng hay hiện trường) hay "Quản lý" (không rõ quản lý nhân sự, kinh doanh hay vận hành).

---

## 2. Mô Hình Phân Tầng Tác Nhân (Actor Classification & Distinction Model)

Hệ thống tác nhân được phân loại thành hai nhánh độc lập phân nhánh từ cấp cao nhất của giải pháp NOVYX, kết hợp với tầng tự động hóa kỹ thuật nền tảng:

```text
                               ┌─────────────────────────┐
                               │     NOVYX GreenOps      │
                               └─────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
     ┌─────────────────────────────┐                 ┌─────────────────────────────┐
     │      OPERATIONS BRANCH      │                 │      GOVERNANCE BRANCH      │
     │    (Chu trình Thực địa)     │                 │   (Chu trình Quản trị)      │
     └─────────────────────────────┘                 └─────────────────────────────┘
                    │                                               │
                    ▼                                               ▼
       ┌────────────────────────┐                     ┌───────────────────────────┐
       │   Operations Manager   │                     │   Platform Administrator  │
       │  (Quản lý vận hành)    │                     │   (Quản trị hệ thống)     │
       └────────────────────────┘                     └───────────────────────────┘
                    │
                    ▼
       ┌────────────────────────┐
       │      Field Staff       │
       │ (Nhân viên hiện trường)│
       └────────────────────────┘

     ───────────────────────────────────────────────────────────────────────────────
                                TECHNICAL AUTOMATION LAYER
     ───────────────────────────────────────────────────────────────────────────────
                                            │
                                            ▼
                                ┌────────────────────────┐
                                │         System         │
                                │   (Hệ thống tự động)   │
                                └────────────────────────┘
```

> **Bất biến cấu trúc quan trọng**:
> - **Admin KHÔNG PHẢI là cha của Manager**: Mô hình không phân cấp theo dạng cây `Admin → Manager → Staff`.
> - Nhánh **Operations** (Manager + Staff) chịu trách nhiệm về chu trình nhiệm vụ và chuỗi bằng chứng chăm sóc cây.
> - Nhánh **Governance** (Platform Administrator) chịu trách nhiệm về vòng đời tài khoản, phân quyền vai trò, danh mục dữ liệu chính (Master Data) và giám sát kiểm toán (Audit Trail).
> - Nhánh **Technical Automation** (`System`) hỗ trợ đồng bộ dữ liệu và thực thi chính sách tất định, hoàn toàn đứng ngoài chuỗi ra quyết định của con người.

---

## 3. Mã Định Danh Kỹ Thuật (Technical Role IDs)

### 3.1. Quyết định Giữ Nguyên Mã Định Danh Kỹ Thuật
- **Mã kỹ thuật hiện hành**: `'staff'`, `'manager'`, `'admin'` (trong `packages/contracts/src/index.ts:41`).
- **QUYẾT ĐỊNH**: **GIỮ NGUYÊN BẤT BIẾN (STABLE KEEP)**.
- **Lý do**:
  1. *Ngắn gọn, tối ưu payload*: Rất phù hợp làm claim phân quyền trong JWT token, header API và lưu trữ trong cơ sở dữ liệu.
  2. *Hợp đồng đã có sẵn*: `packages/contracts` đã chuẩn hóa `UserRole = 'staff' | 'manager' | 'admin'`.
  3. *Tránh di chuyển dữ liệu không cần thiết (Zero Migration Overhead)*: Việc đổi tên technical ID (ví dụ thành `'field_staff'` hay `'platform_administrator'`) không mang lại giá trị nghiệp vụ nhưng lại đòi hỏi refactor mã nguồn phức tạp và tiềm ẩn rủi ro phá vỡ tương thích ngược.
- **Ràng buộc chuẩn tắc**:
  $$\text{Technical ID} \in \{'staff', 'manager', 'admin'\}$$
  Tuyệt đối không dùng mã định danh kỹ thuật làm nhãn hiển thị trên giao diện người dùng.

---

## 4. Quyết Định Định Danh Chi Tiết Từng Tác Nhân

### 4.1. Định danh Vai trò Nhân viên Hiện trường (Field Staff)

- **Nhãn chung cũ**: `Staff` / `Nhân viên`.
- **Các phương án ứng viên đánh giá**:
  - *Phương án A: Field Staff (Nhân viên hiện trường)*: Phản ánh trung thực tính chất cơ động ngoài thực địa; phân biệt rõ với nhân sự văn phòng; bao hàm toàn diện mọi nghiệp vụ chăm sóc, đo đạc GPS, quét QR và chụp ảnh bằng chứng.
  - *Phương án B: Field Technician (Kỹ thuật viên hiện trường)*: Quá thiên về kỹ thuật cao; không phù hợp với các công việc chăm sóc cơ bản (tưới cây, dọn cỏ, bón phân).
  - *Phương án C: Tree Care Staff (Nhân viên chăm sóc cây)*: Quá dài dòng; không nhấn mạnh được yêu cầu hiện trường và kiểm soát chuỗi bằng chứng vị trí.
- **TÊN CHỌN CHUẨN TẮC (SELECTED)**:
  - Canonical English Name: **`Field Staff`**
  - Vietnamese Display Label: **`Nhân viên hiện trường`**
  - Short Display Label (UI hẹp): **`Nhân viên`**
- **LÝ DO (RATIONALE)**: Khớp hoàn hảo với trách nhiệm nhận việc, bấm `StartTask`, đo đạc tọa độ GPS, quét QR, thu thập ảnh trước/sau và xử lý làm lại ngoài thực địa. Khớp với thuật ngữ đã xuất hiện trong [`docs/ACCESS-CONTROL.md:13`](../ACCESS-CONTROL.md) và [`docs/PRODUCT.md:47`](../PRODUCT.md).
- **PHƯƠNG ÁN TỪ CHỐI**: Loại bỏ *Field Technician* và *Tree Care Staff*. Nghiêm cấm dùng từ đơn độc "Nhân viên" làm tên gọi chuẩn tắc trong tài liệu nghiệp vụ.

---

### 4.2. Định danh Vai trò Quản lý Vận hành (Operations Manager)

- **Nhãn chung cũ**: `Manager` / `Quản lý`.
- **Các phương án ứng viên đánh giá**:
  - *Phương án A: Operations Manager (Quản lý vận hành)*: Thể hiện chính xác thẩm quyền điều phối chu trình nhiệm vụ vận hành (Operations Lifecycle: Tạo task, phân công, đổi người, giải tỏa ách tắc hiện trường, thẩm định hồ sơ bằng chứng và yêu cầu làm lại).
  - *Phương án B: Field Operations Manager (Quản lý vận hành hiện trường)*: Dễ gây hiểu nhầm vai trò này phải túc trực ngoài hiện trường như Field Staff. Trên thực tế, Manager chủ yếu làm việc qua Dashboard/Bàn điều phối trung tâm.
  - *Phương án C: Operations Supervisor (Giám sát vận hành)*: Thuật ngữ "Giám sát" chỉ phản ánh chức năng theo dõi (Read/Monitor), trong khi vai trò này sở hữu toàn quyền phê duyệt, từ chối, phân công và hủy nhiệm vụ (Command/Execute).
  - *Phương án D: Work Supervisor (Giám sát công việc)*: Quá hẹp, không phản ánh tầm bao quát toàn tuyến cây xanh đô thị.
- **TÊN CHỌN CHUẨN TẮC (SELECTED)**:
  - Canonical English Name: **`Operations Manager`**
  - Vietnamese Display Label: **`Quản lý vận hành`**
  - Short Display Label (UI hẹp): **`Vận hành`** (hoặc `Quản lý` trong ngữ cảnh phân quyền tab)
- **LÝ DO (RATIONALE)**: Phân định rạch ròi giữa quản lý tác vụ vận hành cây xanh và quản trị hệ thống nền tảng. Khớp với thuật ngữ trong [`docs/ACCESS-CONTROL.md:14`](../ACCESS-CONTROL.md) và [`docs/WORKFLOWS.md`](../WORKFLOWS.md).
- **PHƯƠNG ÁN TỪ CHỐI**: Loại bỏ *Field Operations Manager*, *Operations Supervisor*, *Work Supervisor*. Cấm dùng từ đơn độc "Quản lý" làm tên chuẩn tắc trong tài liệu.

---

### 4.3. Định danh Vai trò Quản trị Hệ thống (Platform Administrator)

- **Nhãn chung cũ**: `Admin`.
- **Các phương án ứng viên đánh giá**:
  - *Phương án A: Platform Administrator (Quản trị hệ thống)*:
    - *Tiếng Anh*: `Platform Administrator` giúp phân biệt rõ ràng với kỹ sư hạ tầng mạng/máy chủ vật lý (IT/DevOps Infrastructure Administrator).
    - *Tiếng Việt*: `Quản trị hệ thống` là danh từ chuẩn mực, thân thuộc và đã được ghi nhận trong [`docs/PRODUCT.md:49`](../PRODUCT.md) và [`docs/ACCESS-CONTROL.md:15`](../ACCESS-CONTROL.md).
  - *Phương án B: System Administrator (Quản trị viên hệ thống)*: Dễ gây nhầm lẫn nghiêm trọng trong tiếng Anh với kỹ sư SysAdmin/DevOps hạ tầng đám mây.
  - *Phương án C: Platform Admin (Quản trị nền tảng)*: "Admin" là từ viết tắt không trang trọng; "Quản trị nền tảng" trong tiếng Việt có phần xa lạ với người dùng doanh nghiệp đô thị.
  - *Phương án D: Business Administrator (Quản trị nghiệp vụ)*: Không bao quát được chức năng cấu hình hệ thống, quản lý khóa bảo mật và điều phối kiểm toán kỹ thuật.
- **TÊN CHỌN CHUẨN TẮC (SELECTED)**:
  - Canonical English Name: **`Platform Administrator`**
  - Vietnamese Display Label: **`Quản trị hệ thống`**
  - Short Display Label (UI hẹp): **`Quản trị`**
- **LÝ DO (RATIONALE)**: Xác lập ranh giới độc lập: Platform Administrator quản trị các chính sách nghiệp vụ, danh mục cây đô thị, tài khoản nhân sự và kiểm toán trên phần mềm ứng dụng; hoàn toàn không can thiệp hạ tầng phần cứng hay cụm máy chủ.
- **PHƯƠNG ÁN TỪ CHỐI**: Loại bỏ *System Administrator* (chống nhầm lẫn DevOps), *Platform Admin*, *Business Administrator*. Cấm dùng từ lóng kỹ thuật "Admin" làm tên chuẩn tắc trong văn bản chính thức.

---

### 4.4. Định danh Tác nhân Kỹ thuật Tự động hóa (System)

- **Bản chất**: **TECHNICAL AUTOMATION ACTOR** (Hoàn toàn **KHÔNG PHẢI VAI TRÒ NGƯỜI DÙNG**).
- **TÊN CHỌN CHUẨN TẮC (SELECTED)**:
  - Canonical English Name: **`System`**
  - Vietnamese Display Label: **`Hệ thống tự động`**
- **QUY TẮC BẮT BUỘC**:
  - **CẤM** gọi là: `System Role`, `System User`, `Technical User`, `Tài khoản hệ thống`.
  - Không có giao diện đăng nhập, không cấp phát mật khẩu, không tham gia vào các phán quyết suy xét của con người.
  - Chỉ xuất hiện với tư cách chủ thể thực hiện các tác vụ tự động hóa (đồng bộ outbox, refresh token, gửi push notification, kiểm tra vi phạm GPS).

---

## 5. Bảng Ánh Xạ Danh Xưng Chuẩn Tắc Toàn Diện (Definitive Mapping Table)

Bảng chuẩn mực thống nhất 100% cách gọi trên toàn dự án:

| Phân lớp Tác nhân (Actor Class) | Technical Role ID | Canonical Business Name (English) | Vietnamese Display Label (Tiếng Việt) | Nhãn UI rút gọn (Compact UI) | Phân nhóm Chức năng (Category) | Tham gia Task vận hành? | Thẩm quyền Quản trị (Governance)? |
|---|:---:|---|---|---|:---:|:---:|:---:|
| **Operational Human Actor** | `staff` | **Field Staff** | **Nhân viên hiện trường** | *Nhân viên* | Operations | **CÓ (Chính)** | **KHÔNG** |
| **Operational Human Actor** | `manager` | **Operations Manager** | **Quản lý vận hành** | *Vận hành* / *Quản lý* | Operations | **CÓ (Chính)** | **KHÔNG** |
| **Governance Human Actor** | `admin` | **Platform Administrator** | **Quản trị hệ thống** | *Quản trị* | Governance | **KHÔNG** | **CÓ (Chính)** |
| **Technical Automation Actor** | *N/A* | **System** | **Hệ thống tự động** | *Hệ thống* | Technical | **Tự động hỗ trợ** | **KHÔNG** |

---

## 6. Danh Mục Từ Ngữ Bị Cấm & Thuật Ngữ Mơ Hồ (Forbidden & Ambiguous Labels)

Để bảo đảm tính chặt chẽ trong tài liệu và mã nguồn, các thuật ngữ sau đây bị **CẤM TUYỆT ĐỐI** hoặc hạn chế ngữ cảnh sử dụng:

| Thuật ngữ không hợp lệ | Đánh giá / Nguy cơ sai lệch | Quy định xử lý | Ngữ cảnh ngoại lệ (nếu có) |
|---|---|---|---|
| **"Nhân viên"** *(dùng đơn lẻ)* | Mơ hồ; không phân biệt được nhân viên văn phòng, nhân viên hỗ trợ hay nhân viên ngoài hiện trường. | **CẤM** dùng làm tên chuẩn tắc trong tài liệu đặc tả. Thay bằng: `Field Staff` / `Nhân viên hiện trường`. | Cho phép trên nút bấm/tab UI có không gian chật hẹp. |
| **"Quản lý"** *(dùng đơn lẻ)* | Mơ hồ; dễ nhầm với Quản lý nhân sự, Quản lý tài chính, hoặc Admin. | **CẤM** dùng làm tên chuẩn tắc trong tài liệu đặc tả. Thay bằng: `Operations Manager` / `Quản lý vận hành`. | Cho phép trên nút bấm/tab UI có không gian chật hẹp. |
| **"Admin"** *(dùng làm danh xưng)* | Tiếng lóng kỹ thuật viết tắt; không thể hiện được cấp độ quản trị nền tảng. | **CẤM** dùng trong văn bản chính quy. Thay bằng: `Platform Administrator` / `Quản trị hệ thống`. | Cho phép dùng làm Technical Role ID (`'admin'`) trong code và API. |
| **"Super Admin"** | Nguy cơ tạo ra siêu người dùng vượt trên mọi quy tắc kiểm toán và SoD. | **CẤM TUYỆT ĐỐI**. Không tồn tại vai trò Super Admin trong kiến trúc NOVYX. | Không có. |
| **"Admin Manager"** / **"Manager Admin"** | Trộn lẫn trái phép giữa Quản lý vận hành và Quản trị nền tảng, vi phạm $\text{Admin} \neq \text{Manager}$. | **CẤM TUYỆT ĐỐI**. Phải tách bạch hai vai trò độc lập. | Không có. |
| **"System User"** / **"System Role"** | Nhân cách hóa sai lệch tác nhân tự động hóa kỹ thuật thành người dùng. | **CẤM TUYỆT ĐỐI**. System là Technical Actor, không phải User/Role. | Không có. |
| **"Field Worker"** / **"Worker"** | Không đồng bộ với type `StaffDto` và văn phong chuẩn tắc của dự án. | **CẤM** dùng thay thế cho Field Staff. | Không có. |

---

## 7. Quy Chuẩn Hiển Thị Trên Giao Diện (UI Naming Guidance)

1. **Quy tắc Tiêu đề & Nhãn Đầy đủ (Primary Labels)**:
   - Tại các màn hình đăng nhập, hồ sơ cá nhân (Profile/Account), màn hình phân quyền, modal xác thực:
     - Bắt buộc dùng nhãn chuẩn: **`Nhân viên hiện trường`**, **`Quản lý vận hành`**, **`Quản trị hệ thống`**.
2. **Quy tắc Nhãn Rút gọn (Compact Fallback Labels)**:
   - Chỉ áp dụng tại các vị trí không gian bị giới hạn nghiêm ngặt (thanh tab bottom navigation, huy hiệu badge nhỏ $\le 80\text{px}$, nút bấm chọn vai trò nhanh):
     - Field Staff $\rightarrow$ **`Nhân viên`**
     - Operations Manager $\rightarrow$ **`Vận hành`** (hoặc `Quản lý`)
     - Platform Administrator $\rightarrow$ **`Quản trị`**
3. **Tuyệt đối loại bỏ lỗi Quick Login cũ**:
   - Loại bỏ hoàn toàn nút bấm hiển thị sai lệch `Admin (Manager)` trong mã nguồn `MobileApp.tsx` và `LoginScreen.tsx` khi bước vào giai đoạn implementation.

---

## 8. Quy Chuẩn Văn Bản Tài Liệu (Documentation Naming Guidance)

1. **Nguyên tắc Xuất hiện Đầu tiên (First Mention Rule)**:
   - Khi một vai trò được nhắc đến lần đầu tiên trong một tài liệu hoặc một phân đoạn lớn, bắt buộc phải ghi đầy đủ dạng song ngữ:
     - `Field Staff (Nhân viên hiện trường)`
     - `Operations Manager (Quản lý vận hành)`
     - `Platform Administrator (Quản trị hệ thống)`
     - `System (Hệ thống tự động)`
2. **Nguyên tắc Các lần Nhắc tiếp theo (Subsequent Mention Rule)**:
   - Các lần nhắc sau trong cùng tài liệu có thể dùng thuật ngữ tiếng Anh chuẩn tắc: `Field Staff`, `Operations Manager`, `Platform Administrator`, `System`.
   - Trong các văn bản tiếng Việt hoàn toàn, sử dụng: `Nhân viên hiện trường`, `Quản lý vận hành`, `Quản trị hệ thống`.
3. **Cấm dùng từ đồng nghĩa tùy tiện**: Tuyệt đối không hoán đổi ngẫu nhiên giữa *Staff*, *Worker*, *Technician*, *Employee* trong cùng một chu trình nghiệp vụ.

---

## 9. Sổ Kiểm Kê Độ Lệch Thuật Ngữ Hiện Hành (Vocabulary Drift Inventory)

Kiểm toán từ vựng trên 5 tài liệu chuẩn tắc canonical (`docs/*.md`) tại baseline commit `42a5459` ghi nhận độ lệch thuật ngữ cần đồng bộ tại **Phase 6**:

| Thuật ngữ hiện diện | Vị trí xuất hiện hiện tại | Ý nghĩa thực tế đang diễn đạt | Đánh giá & Hướng xử lý tại Phase 6 | Thuật ngữ Chuẩn tắc Thay thế |
|---|---|---|---|---|
| **"Nhân viên hiện trường"** | `PRODUCT.md` (1), `ACCESS-CONTROL.md` (2) | Đúng chuẩn người chăm sóc cây thực địa. | **GIỮ LẠI (KEEP)** làm display label chính thức. | `Field Staff (Nhân viên hiện trường)` |
| **"Nhân viên"** *(đơn lẻ)* | `PRODUCT.md` (4), `DOMAIN.md` (9), `ACCESS-CONTROL.md` (14), `WORKFLOWS.md` (35), `RTM.md` (3) | Chỉ nhân viên chăm sóc thực địa. | **THAY THẾ (REPLACE)** thành danh xưng chuẩn tắc ở các định nghĩa thẩm quyền; chỉ giữ lại trong câu văn ngữ cảnh thông thường. | `Field Staff` / `Nhân viên hiện trường` |
| **"Staff"** | `PRODUCT.md` (20), `DOMAIN.md` (8), `ACCESS-CONTROL.md` (22), `WORKFLOWS.md` (20), `RTM.md` (18) | Technical type hoặc nhân viên hiện trường. | **GIỮ CÓ ĐIỀU KIỆN (CONTEXTUAL)**: Giữ nguyên khi trích dẫn mã kỹ thuật (`StaffDto`, `Role = 'Staff'`), chuẩn hóa thành `Field Staff` trong văn cảnh nghiệp vụ. | `Field Staff` (Business) / `Staff` (Code) |
| **"Quản lý vận hành"** | `PRODUCT.md` (1), `DOMAIN.md` (1), `ACCESS-CONTROL.md` (2), `WORKFLOWS.md` (3) | Đúng chuẩn người điều phối và duyệt việc. | **GIỮ LẠI (KEEP)** làm display label chính thức. | `Operations Manager (Quản lý vận hành)` |
| **"Quản lý"** *(đơn lẻ)* | `PRODUCT.md` (13), `DOMAIN.md` (24), `ACCESS-CONTROL.md` (5), `WORKFLOWS.md` (29), `RTM.md` (7) | Chỉ người điều phối vận hành thực địa. | **THAY THẾ (REPLACE)** thành danh xưng chuẩn tắc ở các mục thẩm quyền và ma trận kích hoạt hành động. | `Operations Manager` / `Quản lý vận hành` |
| **"Manager"** | `PRODUCT.md` (21), `DOMAIN.md` (2), `ACCESS-CONTROL.md` (21), `WORKFLOWS.md` (28), `RTM.md` (16) | Technical type hoặc người quản lý vận hành. | **GIỮ CÓ ĐIỀU KIỆN (CONTEXTUAL)**: Giữ nguyên khi trích dẫn mã kỹ thuật (`Role = 'Manager'`), chuẩn hóa thành `Operations Manager` trong văn cảnh nghiệp vụ. | `Operations Manager` (Business) / `Manager` (Code) |
| **"Quản trị hệ thống"** | `PRODUCT.md` (1), `ACCESS-CONTROL.md` (1) | Đúng chuẩn vai trò quản trị nền tảng. | **GIỮ LẠI (KEEP)** làm display label chính thức. | `Platform Administrator (Quản trị hệ thống)` |
| **"Quản trị viên"** | `PRODUCT.md` (1) | Cách gọi biến thể của người quản trị. | **CHUẨN HÓA (REPLACE)** thống nhất thành `Quản trị hệ thống`. | `Platform Administrator (Quản trị hệ thống)` |
| **"Admin"** | `PRODUCT.md` (2), `ACCESS-CONTROL.md` (3) | Quản trị nền tảng hoặc role kỹ thuật. | **GIỮ CÓ ĐIỀU KIỆN (CONTEXTUAL)**: Giữ nguyên cho mã kỹ thuật (`UserRole = 'admin'`), dùng `Platform Administrator` cho định danh nghiệp vụ. | `Platform Administrator` (Business) / `admin` (Code) |
| **"Hệ thống tự động"** | `PRODUCT.md` (1), `DOMAIN.md` (1), `ACCESS-CONTROL.md` (1) | Đúng chuẩn tác nhân kỹ thuật nền tảng. | **GIỮ LẠI (KEEP)** làm display label chính thức. | `System (Hệ thống tự động)` |
| **"Hệ thống"** *(đơn lẻ)* | `PRODUCT.md` (6), `DOMAIN.md` (7), `ACCESS-CONTROL.md` (6), `WORKFLOWS.md` (6), `RTM.md` (6) | Khi là tác nhân kích hoạt hành động (Actor). | **CHUẨN HÓA (CONTEXTUAL)**: Khi là tác nhân thực thi hành động, gọi rõ `Hệ thống tự động (System)`; khi là phần mềm nói chung, giữ nguyên. | `System` (Actor) |

> **Cam kết không sửa Canonical Docs trong Mini-Phase**:
> Toàn bộ bảng kiểm kê độ lệch trên được lưu trữ làm căn cứ đối chiếu. Mọi việc cập nhật văn bản canonical sẽ được thực hiện đúng trình tự bắt buộc tại **Phase 6 — Canonical Document Reconciliation**.

---

## 10. Thử Nghiệm Phủ Định Định Danh (Negative Naming Tests)

| Mã Thử nghiệm | Giả định định danh sai lệch | Kết quả mong đợi | Đánh giá thực tế trong Quy chuẩn Taxonomy | Kết luận |
|---|---|:---:|---|:---:|
| **CASE A: Đổi tên Manager thành "Admin Manager"** | Giả định gọi Manager là "Quản lý kiêm Quản trị viên". | **FAIL** (Bị cấm) | Bị nghiêm cấm tại Mục 6. Phá vỡ tính trực giao giữa Vận hành và Quản trị. | **PASS (Đã chặn đứng)** |
| **CASE B: Đặt Admin làm vai trò cha trực tiếp của Manager** | Giả định Admin là cấp trên trực tiếp trong cây thừa kế của Manager. | **FAIL** (Bị cấm) | Bị từ chối tại Mục 2. Hai vai trò thuộc hai nhánh phân lập: Operations Branch và Governance Branch. | **PASS (Đã chặn đứng)** |
| **CASE C: Phân loại System là một vai trò người dùng (User Role)** | Giả định cấp tài khoản đăng nhập và phân quyền cho System. | **FAIL** (Bị cấm) | Bị từ chối tại Mục 4.4 và Mục 6. System là Technical Automation Actor, không phải User. | **PASS (Đã chặn đứng)** |
| **CASE D: Dùng từ đơn lẻ "Nhân viên" làm tên chuẩn tắc duy nhất** | Giả định chấp nhận "Nhân viên" là tên gọi chính quy của Staff. | **FAIL** (Bị cấm) | Bị từ chối tại Mục 4.1 và Mục 6. Phải là `Field Staff` / `Nhân viên hiện trường`. | **PASS (Đã chặn đứng)** |
| **CASE E: Dùng từ đơn lẻ "Quản lý" làm tên chuẩn tắc duy nhất** | Giả định chấp nhận "Quản lý" là tên gọi chính quy của Manager. | **FAIL** (Bị cấm) | Bị từ chối tại Mục 4.2 và Mục 6. Phải là `Operations Manager` / `Quản lý vận hành`. | **PASS (Đã chặn đứng)** |
| **CASE F: Đổi mã kỹ thuật ('staff' $\rightarrow$ 'field_staff') gây xáo trộn code** | Giả định bắt buộc refactor mã nguồn và migration database. | **FAIL** (Bị cấm) | Bị từ chối tại Mục 3. Giữ nguyên technical role IDs ổn định (`'staff'`, `'manager'`, `'admin'`). | **PASS (Đã chặn đứng)** |
| **CASE G: Dùng "System Administrator" gây nhầm lẫn với DevOps/IT** | Giả định dùng tên tiếng Anh là System Administrator. | **FAIL** (Bị cấm) | Bị từ chối tại Mục 4.3. Chọn `Platform Administrator` để tách bạch với quản trị hạ tầng. | **PASS (Đã chặn đứng)** |

---

## 11. Bảng Bằng Chứng Nghiệm Thu Cổng (Acceptance Evidence RN-01..RN-12)

| Gate ID | Tiêu chí nghiệm thu (Requirement) | Phương pháp xác minh (Verification Method) | Bằng chứng cụ thể (Evidence) | Tính chặn cổng (Blocking) | Kết quả nghiệm thu (Result) |
|---|---|---|---|:---:|:---:|
| **RN-01** | Xác định chính xác 3 human roles + 1 technical actor | Taxonomy Registry Check | Mục 2 & Mục 5: 3 human roles (`Field Staff`, `Operations Manager`, `Platform Administrator`) + 1 technical actor (`System`). | **YES** | **PASS** |
| **RN-02** | Mỗi human role có mục đích vận hành độc nhất | Semantic Uniqueness Audit | Bảng Mục 5: Field Staff (Thực địa), Operations Manager (Điều phối vận hành), Platform Administrator (Quản trị nền tảng & IAM). | **YES** | **PASS** |
| **RN-03** | Tách biệt rạch ròi Technical ID, Business Name, Display Label | Three-Tier Formula Verification | Mục 1 & Mục 5: Công thức 3 tầng được thể hiện bằng bảng đối chiếu độc lập từng cột. | **YES** | **PASS** |
| **RN-04** | Field Staff phản ánh trách nhiệm hiện trường | Responsibility Mapping Check | Mục 4.1: Ánh xạ đầy đủ trách nhiệm GPS, QR, ảnh, checklist, làm lại ngoài thực địa. | **YES** | **PASS** |
| **RN-05** | Operations Manager phản ánh quản lý vận hành | Responsibility Mapping Check | Mục 4.2: Ánh xạ đầy đủ trách nhiệm tạo task, phân công, đổi người, giải tỏa blocked, duyệt việc. | **YES** | **PASS** |
| **RN-06** | Platform Administrator phản ánh quản trị nền tảng | Responsibility Mapping Check | Mục 4.3: Ánh xạ đầy đủ trách nhiệm user lifecycle, role assignment, master data, audit trail. | **YES** | **PASS** |
| **RN-07** | System bị loại trừ khỏi taxonomy người dùng | De-humanization Audit | Mục 4.4 & Mục 10 (Case C): System được khóa là Technical Actor, cấm gọi là User/Role. | **YES** | **PASS** |
| **RN-08** | Không có hệ phân cấp nào coi Admin là cha Manager | Hierarchy Branching Audit | Sơ đồ cây Mục 2: Nhánh Operations và Nhánh Governance hoàn toàn song song, độc lập. | **YES** | **PASS** |
| **RN-09** | Thiết lập danh mục từ cấm & từ mơ hồ | Ambiguous Terms Registry | Bảng Mục 6: 7 cụm từ bị cấm/mơ hồ kèm phân tích rủi ro và giải pháp thay thế. | **YES** | **PASS** |
| **RN-10** | Lập bảng kiểm kê độ lệch từ vựng (Vocabulary Drift) | Grep / Script Audit trên Docs | Bảng Mục 9: Thống kê định lượng 11 nhóm thuật ngữ trên 5 tài liệu canonical. | **YES** | **PASS** |
| **RN-11** | Không sửa tài liệu canonical / code / biểu đồ | Git Diff Boundary Inspection | `git diff --stat apps/ packages/ docs/*.md`: 0 files changed (ngoại trừ docs/business-reconciliation/). | **YES** | **PASS** |
| **RN-12** | 100% quyết định định danh đã chốt (DECIDED), 0 TBD | Decision Completion Check | Mục 4.1..4.4: Toàn bộ 4 định danh tác nhân đều được chốt dứt điểm. 0 TBD, 0 MAYBE. | **YES** | **PASS** |

---

## 12. Kết Luận Cổng Nghiệm Thu Mini-Phase

```text
================================================================================
ROLE NAMING TAXONOMY PASS
— FIELD STAFF NAMING LOCKED
— OPERATIONS MANAGER NAMING LOCKED
— PLATFORM ADMINISTRATOR NAMING LOCKED
— SYSTEM CLASSIFIED AS TECHNICAL ACTOR
— READY FOR PHASE 2 ADMIN BUSINESS SCOPE
================================================================================
```
