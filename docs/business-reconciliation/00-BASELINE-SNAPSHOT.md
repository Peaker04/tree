# NOVYX GreenOps — Business Baseline Snapshot (Phase 0)

> **Tài liệu thuộc Phase 0 — Baseline Freeze & Change Control**  
> Tuân thủ chuẩn mực kiểm soát chất lượng tại [`docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md`](../NOVYX_Business_Baseline_Reconciliation_Master_Plan.md).  
> Trạng thái: **PASS** (100% tiêu chuẩn có bằng chứng kiểm chứng cụ thể, cấm self-report không bằng chứng).

---

## 1. Thông tin Định danh Baseline (P0-01, P0-02, P0-04)

Các thông số nhận diện đường cơ sở được trích xuất trực tiếp từ Git:

| ID | Chỉ tiêu kiểm tra | Lệnh kiểm tra | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| **P0-01** | Branch làm việc | `git branch --show-current` | `base-setup` | **PASS** |
| **P0-02** | Baseline Commit HEAD | `git rev-parse HEAD` | `8c21f7cd6f70628d4be07794af0821ed623a389c` | **PASS** |
| **P0-04** | Git Tree Hash | `git rev-parse HEAD^{tree}` | `76090d603387646666ec6cdc465aece5b02a6ac3` | **PASS** |

---

## 2. Kiểm soát Working Tree & Ranh giới Mã nguồn (P0-03, P0-07)

### 2.1. Trạng thái Working Tree (P0-03)

- **Tại thời điểm bắt đầu snapshot capture**: Toàn bộ mã nguồn ứng dụng (`apps/`, `packages/`) hoàn toàn không bị thay đổi (`0 files changed`). Các tài liệu quản trị và Master Plan mới được thêm vào ở trạng thái chưa theo dõi (untracked):
  ```text
  ?? docs/NOVYX_Business_Baseline_Reconciliation_Master_Plan.md
  ?? docs/business-reconciliation/
  ```
- **Tại thời điểm hoàn tất đóng băng Phase 0**: Toàn bộ các tài liệu quản trị và snapshot đã được commit chính thức tại commit [`36b036909cbe2efbd635cfb0c1daacebd3cb971a`](https://github.com/Peaker04/tree/commit/36b036909cbe2efbd635cfb0c1daacebd3cb971a).
- **Kiểm tra trạng thái sạch cuối cùng (Final Clean-State Verification)**:
  Lệnh thực thi sau commit: `git status --porcelain`
  Kết quả: Rỗng (`0 untracked / 0 modified`). Working tree đạt trạng thái sạch hoàn toàn, bảo toàn 100% mã nguồn sản phẩm baseline.

### 2.2. Cam kết Ranh giới Diff — Diff Boundary (P0-07)

Trong toàn bộ chu trình **Business Reconciliation (Phase 0 đến Phase 10)**:
- Toàn bộ mã nguồn ứng dụng:
  - `apps/mobile/src/`
  - `packages/contracts/src/`
  - `packages/config/src/`
  - `packages/ui/src/`
- Trạng thái: **NGHIÊM CẤM CHỈNH SỬA (STRICT READ-ONLY)**.
- Mọi kiểm tra diff boundary định kỳ phải trả về `0 files changed`:
  ```powershell
  git diff --stat apps/ packages/
  ```

---

## 3. Snapshot Danh mục Toàn vẹn Tài liệu Chuẩn tắc (P0-05)

File inventory của toàn bộ tài liệu Markdown trong `docs/` tại baseline commit `8c21f7c`:

| Tên tệp | Kích thước (Bytes) | Số dòng | Checksum SHA256 |
|---|---:|---:|---|
| [`ACCESS-CONTROL.md`](../ACCESS-CONTROL.md) | 19,446 | 94 | `5a295fef3e602aeed7e8b2b602e5ea1d1c7ce93b0995a9b48479bfd240a82d58` |
| [`API_CONVENTIONS.md`](../API_CONVENTIONS.md) | 3,212 | 134 | `58567b88f19e4b076823787fd4279f1c19584c3c25a3794a87590cad7dfdccb6` |
| [`ARCHITECTURE.md`](../ARCHITECTURE.md) | 18,911 | 227 | `f0d728f68eb5782abebe58e9fc5afdaed8df9d9871de1f86c342a561f11c497c` |
| [`BUSINESS-PROCESS-REVIEW.md`](../BUSINESS-PROCESS-REVIEW.md) | 55,568 | 536 | `3b76d0b260583d50f6053d033b7f08b1bc65cea5dfb9ac809197697dd0bc0e25` |
| [`CANONICAL-BASELINE-INTEGRITY-REPORT.md`](../CANONICAL-BASELINE-INTEGRITY-REPORT.md) | 26,925 | 241 | `825c734ef36e47e4d4b0e848d60f5e0ec24ace375ffbe2baf6d07c5325dabe34` |
| [`CODE_QUALITY.md`](../CODE_QUALITY.md) | 427 | 19 | `23bfee4c0dc30abfde0a2742b429ed774f56ea1110e16ceff61165d0cc6f24e9` |
| [`DOMAIN.md`](../DOMAIN.md) | 32,401 | 203 | `313bfd5a0466dec99fb47c4d1ebb8ce576251edd62a9809c4b68f2d8f72edba1` |
| [`ENVIRONMENT.md`](../ENVIRONMENT.md) | 866 | 39 | `f949eae58bf120cecbebf0d5456d43f6b1a472507061ac83713c4a0c228889e0` |
| [`INCEPTION-GAP-REPORT.md`](../INCEPTION-GAP-REPORT.md) | 15,782 | 195 | `791ee11abaf19bc93a8ae91c39699198d57c24f55b388b6786453729e82a3b4f` |
| [`MOBILE_DESIGN_AUDIT.md`](../MOBILE_DESIGN_AUDIT.md) | 34,861 | 452 | `b457866c8d7be47d27158f968c6e19d3b171f1ddd297709f07385f50dd63ede9` |
| [`MOBILE_SMOKE_TEST.md`](../MOBILE_SMOKE_TEST.md) | 11,858 | 192 | `fd67ae5d81548756dda6161e0435cfccd531780f21ecfc78e9f6cbb493d00b66` |
| [`MOBILE_UI_RULES.md`](../MOBILE_UI_RULES.md) | 9,576 | 114 | `7bb9d52c6c0cdf44f8a5b4cb65c483fed6fb9ef4df7c9790d21ec046454ab8ad` |
| [`NFR.md`](../NFR.md) | 18,064 | 170 | `d503facdcb8d32aee317b352ac34ebe180ef9e070a119b5dff37f66992fb26eb` |
| [`POST-SYNC-IMPLEMENTATION-GAP-MAP.md`](../POST-SYNC-IMPLEMENTATION-GAP-MAP.md) | 17,456 | 76 | `8ddf1f038c8f6eaf6e3746148af0f1f0a495fe012284bfa3e67aa1287618848f` |
| [`PRODUCT.md`](../PRODUCT.md) | 22,322 | 208 | `83548d481e126ee6183770e6feba40acb02d4c743e15022863f11ccfd086ae5a` |
| [`README.md`](../README.md) | 10,693 | 79 | `aa9b4437a8046d49ac24cdd0601cba4cc3aeb5a084fe44b859ccfe3d34f6e8c2` |
| [`REQUIREMENTS-TRACEABILITY.md`](../REQUIREMENTS-TRACEABILITY.md) | 26,999 | 124 | `0cea8d5ecf479f12b6668cf86e9d142f24a9d2d6f595b72af3a570167cc1f782` |
| [`SOURCE_CONTROL.md`](../SOURCE_CONTROL.md) | 612 | 33 | `25f9438863d5d927b4d4c1c56ed404d26b7a2401bc9f05a430b6f3cb7bebccea` |
| [`TESTING.md`](../TESTING.md) | 436 | 15 | `dbc16852fe342d73e3277924b5a8fc461ecf56490d1b9391e8873a8e5bb97869` |
| [`WORKFLOWS.md`](../WORKFLOWS.md) | 36,217 | 352 | `1c5d2a15c30f3fa805ad947cdc02a66e68eea1127fc1685d248e9cd7cae70f9d` |

---

## 4. Snapshot Danh mục 16 Biểu đồ HTML (P0-06)

Đối chiếu đầy đủ giữa hệ thống file vật lý (`docs/diagrams/*.html`) và chỉ mục quản trị [`docs/diagrams/README.md`](../diagrams/README.md):

| STT | File sơ đồ HTML | Phân loại quản trị | Kích thước (Bytes) | Checksum SHA256 |
|---|---|---|---:|---|
| 1 | [`01-product-capability-map.html`](../diagrams/01-product-capability-map.html) | CANONICAL CURRENT-STATE | 22,520 | `a27600a2197f2bee925a73eeb3d383605a2cbdf8e796f49478cd387bd3498fe2` |
| 2 | [`02-domain-context-map.html`](../diagrams/02-domain-context-map.html) | CANONICAL CURRENT-STATE | 14,796 | `b1d42cea39df9c993da48d0d5a63acb8aeb204422c5e13ab67250f61f6855c29` |
| 3 | [`03-mvp-operational-swimlane.html`](../diagrams/03-mvp-operational-swimlane.html) | SUPERSEDED / HISTORICAL | 15,017 | `008d4f63ae1598fd0fc909fe78b5a2f10fc18c7e518bcc886f1c50f1d132243e` |
| 4 | [`04-task-lifecycle.html`](../diagrams/04-task-lifecycle.html) | SUPERSEDED / HISTORICAL | 10,946 | `01a0de9ddcdd8ac43052bf996884fcc09697b1626bfc5146d6130c91ffb5fc16` |
| 5 | [`05-proof-workflow.html`](../diagrams/05-proof-workflow.html) | SUPERSEDED / HISTORICAL | 16,641 | `c1c56991970bae36718730ccf7464a3c6c9c856753ac7520fef392e55e461a4f` |
| 6 | [`06-review-rework-lifecycle.html`](../diagrams/06-review-rework-lifecycle.html) | SUPERSEDED / HISTORICAL | 10,533 | `a945092a9f9a171d435e6d7228479c01811f1cfaed15de74ff0d132a4a07f64e` |
| 7 | [`07-action-eligibility-security-matrix.html`](../diagrams/07-action-eligibility-security-matrix.html) | CANONICAL CURRENT-STATE | 14,741 | `cf9a23b83fee195b2df5b3dd00368223793016925e7ea1ca9df85b6537d69e44` |
| 8 | [`08-role-information-architecture.html`](../diagrams/08-role-information-architecture.html) | CANONICAL CURRENT-STATE | 17,186 | `488ce504268577f30b5b6cb9af59f206faba9f4eeede8d97ac1e2c909c82f095` |
| 9 | [`09-system-current-state.html`](../diagrams/09-system-current-state.html) | CANONICAL CURRENT-STATE | 14,589 | `2a91a692fac9195e9d2f2eb25442f6683359ac94919580d576fa3b971fcaf27c` |
| 10 | [`10-system-target-architecture.html`](../diagrams/10-system-target-architecture.html) | PROPOSED TARGET | 13,121 | `c88ffe62dded9b631636ff3f8db93ff4e3666edf2697d38e40a6c45de3de1df3` |
| 11 | [`11-evidence-submission-sequence.html`](../diagrams/11-evidence-submission-sequence.html) | SUPERSEDED / HISTORICAL | 11,593 | `a9a8f848ecce43fc74b63fe4044883c69233b4c63bbf461a3fd8928839708127` |
| 12 | [`12-architecture-dependency-map.html`](../diagrams/12-architecture-dependency-map.html) | CANONICAL CURRENT-STATE | 12,322 | `61aa58a27e125a5db283d049d6b2d24d1169fda118302e4a13f81638bd4d6cd8` |
| 13 | [`proposed-01-current-vs-recommended-workflow.html`](../diagrams/proposed-01-current-vs-recommended-workflow.html) | PROPOSED TARGET | 17,855 | `e31c47fde50275dbc34adb96b6c79f909c9df6a7a202321562d471b5b6197fe2` |
| 14 | [`proposed-02-mvp-operational-swimlane.html`](../diagrams/proposed-02-mvp-operational-swimlane.html) | CANONICAL CURRENT-STATE | 20,333 | `4e293c2e2fd742415b7ac0ede23427fe63cc5b5452c3054a2957fefd2688c5f4` |
| 15 | [`proposed-03-minimal-task-lifecycle.html`](../diagrams/proposed-03-minimal-task-lifecycle.html) | CANONICAL CURRENT-STATE | 18,226 | `0d6ecf8b671ade4d01f08b169c55d82afc420c00633ca9d3c81bc0d0c81081c7` |
| 16 | [`proposed-04-proof-policy-and-rework.html`](../diagrams/proposed-04-proof-policy-and-rework.html) | CANONICAL CURRENT-STATE | 17,076 | `6c2f80d4f8ca470487037bd0707c13163257f6a901a9c9c3c0a7f40a2f937281` |

---

## 5. Trạng thái Admin trong Tài liệu Canonical Hiện thời (P0-08)

Trong tài liệu chuẩn tắc, vai trò Quản trị hệ thống (Admin) được định vị rõ:

1. **[`docs/PRODUCT.md`](../PRODUCT.md#L49) & [`docs/PRODUCT.md`](../PRODUCT.md#L197)**:
   - Dòng 49: `| **Quản trị hệ thống (Admin)** | Vận hành cấp cao... | Đảm bảo tính toàn vẹn dữ liệu... | _(Dự kiến cho tương lai — [OUT_OF_MVP], [RESERVED])_. |`
   - Dòng 197: `- Vai trò Quản trị viên hệ thống (Admin) — _Dành cho tương lai, [OUT_OF_MVP], [RESERVED]_`.
2. **[`docs/ACCESS-CONTROL.md`](../ACCESS-CONTROL.md#L15)**:
   - Dòng 15: `| **Quản trị hệ thống (Admin)** | **OUT OF MVP / RESERVED** | UserRole = 'admin' | ... | Quản trị nền tảng đô thị thông minh. Tuyệt đối không tạo màn hình hoặc tính năng Admin trong phạm vi MVP. |`

**Kết luận P0-08**: Toàn bộ tài liệu chuẩn tắc đồng thuận rằng Admin đang ở trạng thái `[OUT_OF_MVP]` và `[RESERVED]`.

---

## 6. Lỗi Runtime Hiện hữu: Đồng nhất Admin sang Manager (P0-09)

Trong mã nguồn thực tế của ứng dụng di động (`apps/mobile/src`), tồn tại sai lệch nghiêm trọng so với nguyên tắc phân tách vai trò:

| File nguồn | Vị trí dòng | Đoạn mã vi phạm | Bản chất khiếm khuyết |
|---|---:|---|---|
| `apps/mobile/src/screens/MobileApp.tsx` | 398 | `normalized.includes('manager') \|\| normalized.includes('admin') ? 'Manager' : 'Staff'` | **Ep Admin thành Manager**: Mọi tài khoản admin khi đăng nhập đều bị ép nhận persona `Manager`. |
| `apps/mobile/src/screens/MobileApp.tsx` | 475 | `<Text style={styles.quickDesc}>Admin (Manager)</Text>` | Nút quick login mô tả sai lệch rằng Admin là một dạng Manager. |
| `apps/mobile/src/screens/LoginScreen.tsx` | 41 & 117 | `setPassword('admin123');`<br>`Admin (Manager)` | Giả lập tài khoản admin với giao diện quản lý thực địa. |
| `apps/mobile/src/services/authSessionStore.ts` | 20 | `(value.user.role === 'staff' \|\| value.user.role === 'manager' \|\| value.user.role === 'admin')` | Session store công nhận role `admin`, nhưng tầng UI không có persona tương ứng. |

**Kết luận P0-09**: Mã nguồn hiện tại vi phạm nguyên tắc bất biến `Admin ≠ Manager`. Cần chuẩn hóa dứt điểm mô hình tác nhân tại Phase 1 trước khi xử lý kỹ thuật.

---

## 7. Bảng Tổng kết Nghiệm thu Cổng Exit Gate Phase 0

| Gate ID | Nội dung kiểm tra | Phương pháp xác minh | Bằng chứng cụ thể | Kết luận |
|---|---|---|---|:---:|
| **P0-01** | Branch `base-setup` | Git inspection | `git branch --show-current` = `base-setup` | **PASS** |
| **P0-02** | Baseline Commit | Git inspection | `git rev-parse HEAD` = `8c21f7c...` | **PASS** |
| **P0-03** | Working tree kiểm soát & sạch sau commit | Git inspection | Baseline code giữ nguyên; untracked docs tại capture; sạch 100% tại commit `36b0369` | **PASS** |
| **P0-04** | Tree Hash đã lưu | Git inspection | `HEAD^{tree}` = `76090d6...` | **PASS** |
| **P0-05** | Snapshot canonical docs | Checksum SHA256 | Bảng Mục 3 (20 file canonical) | **PASS** |
| **P0-06** | Snapshot 16 HTML diagrams | Checksum SHA256 | Bảng Mục 4 (16 file diagram) | **PASS** |
| **P0-07** | Diff boundary xác lập | Policy enforcement | `apps/` và `packages/` được khóa Read-Only | **PASS** |
| **P0-08** | Admin `OUT_OF_MVP / RESERVED` | Doc audit | Trích dẫn `PRODUCT.md:49,197` & `ACCESS-CONTROL.md:15` | **PASS** |
| **P0-09** | Ghi nhận lỗi runtime `admin → Manager` | Code audit | Trích dẫn `MobileApp.tsx:398,475`, `LoginScreen.tsx:41,117` | **PASS** |
| **P0-10** | Business Optimization Gap Register | Artifact creation | Xem [`01-BUSINESS-GAP-REGISTER.md`](01-BUSINESS-GAP-REGISTER.md) | **PASS** |

**PHASE 0 EXIT GATE: PASS**
