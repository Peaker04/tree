> NON-AUTHORITATIVE EXPLORATION ARTIFACT
> This file strictly governs Stitch design generation to prevent domain drift. Only concepts listed here may be rendered on the Staff Home screen.

# STITCH DOMAIN ALLOWLIST - STAFF HOME

## Allowed Domain Entities
*   Staff Member (Account)
*   Shift (Ca trực)
*   Task (Nhiệm vụ - primarily CHANGE_PROOF)
*   Tree (Cây xanh / Cây trồng)
*   Network/Cache connection (Trạng thái mạng)

## Allowed Staff Home Information
*   **Orientation**: Tên nhân viên (Ví dụ: Nguyễn Văn A), Chức vụ (Nhân viên hiện trường / Staff), Trạng thái mạng (Trực tuyến / Ngoại tuyến / Cache).
*   **Decision / Next Valid Action**: Trạng thái đợi việc, đang trong ca, hoặc công việc tiếp theo cần xử lý (e.g. "Nhiệm vụ tiếp theo", "Không có nhiệm vụ").
*   **Metrics**: Tối đa 3 chỉ số hỗ trợ quyết định (Ví dụ: Tổng số nhiệm vụ, Đã hoàn thành, Chờ duyệt). Cấn dùng placeholder trung tính nếu không có dữ liệu.
*   **Navigation**: 5 mục menu điều hướng phía dưới màn hình (Nhiệm vụ, [Cảnh báo / Thông báo], Quét mã, Danh mục / Cây trồng, Cá nhân).

## Allowed Statuses
*   Đang tải (Loading)
*   Sẵn sàng nhận việc (Actionable / Sẵn sàng)
*   Chờ duyệt (Waiting review)
*   Hoàn thành ca (Completed shift)
*   Không có nhiệm vụ (No assignment)
*   Ngoại tuyến (Offline / Cache)
*   Lỗi mạng (Error)

## Allowed Actions
*   `Kiểm tra việc` (Chỉ dùng khi không có nhiệm vụ đang active hoặc để làm mới).
*   Mở nhiệm vụ chi tiết (nếu có nhiệm vụ khả dụng).
*   Chuyển đổi tab điều hướng.
*   Thử lại (Retry) khi có lỗi.

## Allowed Proof / Site Verification Concepts
*   Bằng chứng thay đổi (CHANGE_PROOF). Thể hiện qua các bước thực địa vật lý (hình xăm cây, ảnh trước/sau sửa chữa cành gãy).

## Allowed Terminology
*   Sử dụng tiếng Việt theo chuẩn của dự án NOVYX. Không dùng văn bản kỹ thuật API nội dịch (VD: không dùng "CHANGE_PROOF" làm nhãn hiển thị, thay bằng "Nhiệm vụ chăm sóc/thực địa").

## Forbidden Invented Concepts
> STRICT RULE: If a concept, metric, entity, action, certification, device signal, or business term cannot be traced to the repository contract or current authoritative implementation, Stitch MUST NOT display it.

DO NOT INCLUDE OR INVENT:
*   GHG (Greenhouse Gas).
*   ISO 14064 hoặc bất kỳ chứng nhận môi trường/bền vững nào khác.
*   RTK (Real-Time Kinematic), sai số sóng vệ tinh, dữ liệu đo đạc trinh sát (trừ khi contract cụ thể yêu cầu).
*   RFID yard workflows (Kho bãi RFID).
*   Waste-processing (Quy trình xử lý rác/phế thải).
*   Material tonnage (Sản lượng tấn vật liệu).
*   Industrial recycling production metrics (Chỉ số tái chế công nghiệp).
*   Construction-site workflows (Quy trình công trường xây dựng).
*   Telemetry tự phác thảo (e.g. Nồng độ pH, độ ẩm đất đo trực tiếp trên Home, mức pin trạm Mesh IoT, nhiệt độ trạm).
*   Invented business KPIs (e.g. Hiệu suất phủ xanh, tốc độ sinh trưởng tự chế).
*   Giao diện Neon cực độ, Cyberpunk-style, Military, hoặc Industrial Terminal. Phải giữ "Botanical Restrained".