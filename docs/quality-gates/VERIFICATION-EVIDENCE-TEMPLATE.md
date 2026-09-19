# KHUÔN MẪU SỔ BỘ BẰNG CHỨNG & GIAO THỨC PHÂN LOẠI

## Verification Evidence Protocol & Classification Template

> **Mục tiêu:** Quy chuẩn hóa việc thu thập, lưu trữ và chứng minh tính xác thực của mọi kết quả kiểm tra trong dự án NOVYX GreenOps. Ngăn chặn việc báo cáo kết quả dựa trên giả định hoặc nhầm lẫn giữa môi trường kiểm thử cục bộ và đường ống CI tự động.  
> **Nguyên tắc:** _Mọi dòng chữ `[PASS]` trong báo cáo bắt buộc phải đối ứng với một bản ghi bằng chứng có thể tra cứu được trong Sổ Bộ Bằng Chứng (`VERIFICATION-EVIDENCE.md`)._

---

## 1. Phân Loại Môi Trường Bằng Chứng (Evidence Scope Taxonomy)

Mọi bằng chứng kiểm chứng trong dự án bắt buộc phải được gắn đúng một nhãn phân loại môi trường:

| Phân loại                | Định nghĩa chuẩn mực                                                                                             | Điều kiện ghi nhận hợp lệ                                                                            | Trường hợp nghiêm cấm                                                                 |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `LOCAL_VERIFIED`         | Kiểm tra được thực thi trực tiếp trên máy cục bộ của kỹ sư hoặc agent thông qua terminal lệnh.                   | Có lệnh thực thi, mã thoát (exit code), và log tóm tắt stdout/stderr.                                | **CẤM** gọi là "CI PASS" hoặc "GitHub Verified" nếu chỉ chạy local.                   |
| `CI_VERIFIED`            | Kiểm tra được thực thi tự động trên hạ tầng CI (ví dụ: GitHub Actions workflow runner).                          | Có URL dẫn tới GitHub Actions Run ID cụ thể kèm trạng thái xanh (Success).                           | **CẤM** ghi CI_VERIFIED khi repo chưa cấu hình workflow hoặc workflow chưa kích hoạt. |
| `MANUAL_VISUAL_VERIFIED` | Kiểm tra thị giác thủ công do kỹ sư hoặc công cụ phân tích hình ảnh thực hiện trên tệp ảnh đã xuất (`.png` @2x). | Có ảnh chụp màn hình hoặc file ảnh xuất bản lưu trong artifact/dist; có kết luận trực quan chi tiết. | **CẤM** suy đoán hình ảnh đẹp chỉ dựa trên việc validator code không báo lỗi.         |
| `CI_NOT_AVAILABLE`       | Trạng thái ghi nhận khi dự án chưa thiết lập workflow CI tự động cho mục kiểm tra tương ứng.                     | Ghi nhận rõ lý do hạ tầng chưa hỗ trợ; chỉ phụ thuộc vào `LOCAL_VERIFIED`.                           | Không được lấy cớ thiếu CI để bỏ qua việc kiểm tra cục bộ.                            |

---

## 2. Cấu Trúc Bản Ghi Sổ Bộ Bằng Chứng (Evidence Ledger Schema)

Mỗi lần chạy kiểm tra phục vụ việc đóng một Cổng Chất Lượng (Quality Gate) phải được ghi thành một dòng trong bảng Sổ Bộ Bằng Chứng theo đúng cấu trúc:

```markdown
| Mã Check ID | Thời điểm (ISO/Local) | Commit SHA | Lệnh thực thi / Công cụ | Môi trường | Tiêu chí kỳ vọng (Expected) | Kết quả thực tế (Actual) | Exit Code | Đường dẫn Artifact Bằng chứng | Trạng thái | Ghi chú kỹ thuật |
```

### Giải nghĩa các trường:

1. **Mã Check ID:** Mã định danh tương ứng trong checklist (ví dụ: `CAN-007`, `RTM-009`, `DG-GEO-001`, `VAL-001`).
2. **Thời điểm:** Timestamp thời gian thực khi lệnh kết thúc.
3. **Commit SHA:** 7 ký tự hoặc đầy đủ mã SHA của commit tại thời điểm chạy kiểm tra.
4. **Lệnh thực thi:** Câu lệnh chính xác được chạy trên PowerShell / Bash (không dùng giả lệnh).
5. **Môi trường:** `LOCAL_VERIFIED`, `CI_VERIFIED`, hoặc `MANUAL_VISUAL_VERIFIED`.
6. **Tiêu chí kỳ vọng:** Giá trị hoặc điều kiện biên nhị phân cần đạt (ví dụ: `Zero collision, exit 0`).
7. **Kết quả thực tế:** Dữ liệu trích xuất thực tế (ví dụ: `51 texts, 0 collision, 0 overflow`).
8. **Exit Code:** Mã thoát của tiến trình (`0`, `1`, `2`).
9. **Đường dẫn Artifact:** File log, file JSON, hoặc ảnh PNG lưu lại bằng chứng.
10. **Trạng thái:** `PASS`, `FAIL`, `WARN`, `INCONCLUSIVE`.
11. **Ghi chú:** Thông tin bổ trợ (tọa độ lỗi, số font nạp được, hoặc cảnh báo đệm).

---

## 3. Quy Trình Xác Thực Hai Lượt Bắt Buộc (Two-Pass Verification Protocol)

Để triệt tiêu lỗi "vừa sửa xong thấy chạy được vội kết luận PASS mà không biết thay đổi đó làm hỏng phần khác", mọi Cổng Chất Lượng Bắt Buộc (`Blocking: YES`) phải trải qua quy trình 2 lượt:

```
[Thay đổi Docs / Tool]
        │
        ▼
   [LƯỢT A: Kiểm Tra Cục Bộ Sau Sửa Đổi (Pass A)]
        │ (Chạy ngay sau khi sửa file để xác minh lỗi đã biến mất)
        ▼
   [DỌN DẸP MÔI TRƯỜNG & ĐỒNG BỘ TRẠNG THÁI]
        │ (Reload file từ đĩa, xóa cache tạm, kiểm tra working tree)
        ▼
   [LƯỢT B: Tái Kiểm Tra Độc Lập Từ Trạng Thái Sạch (Pass B)]
        │ (Chạy lại toàn bộ bộ lệnh kiểm tra từ đầu trên trạng thái sạch)
        ▼
[KẾT LUẬN CỔNG CHẤT LƯỢNG CHỈ LẤY TỪ LƯỢT B]
```

### Các điều kiện khắt khe của Lượt B (Pass B):

1. **Không tái sử dụng kết quả Lượt A:** Dù Lượt A đã báo PASS, Lượt B vẫn phải chạy lại câu lệnh độc lập từ terminal.
2. **Kiểm tra trạng thái sạch:** `git status` phải được kiểm tra; không có tệp rác, không có artifact tạm chưa xóa ngoài ý muốn.
3. **Kiểm tra ranh giới:** Xác nhận lại lần cuối `apps/mobile/src/**` và `packages/**/src/**` bằng **0 tệp sửa đổi**.
4. **Quyết định:** Kết quả phán quyết cuối cùng của Gate bắt buộc lấy từ Pass B. Nếu Pass B phát hiện bất kỳ sai lệch nào, Gate bị coi là `FAIL`.
