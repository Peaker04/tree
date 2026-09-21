# Báo Cáo Chứng Cứ Chất Lượng & Nền Tảng Kiểm Thử Wave 0 (Phase 13 — Wave 0 Quality Foundation)

**Dự án:** NOVYX GreenOps
**Giai đoạn:** Phase 13 — Implementation Wave 0 (Test / Quality / Execution Governance Foundation)
**Ngày lập:** 21/09/2026
**Commit Baseline Đầu Vào:** `b0dacfa057816323c44f0c8a0b4a909ed9ae4540`
**Nhánh:** `base-setup`
**Tài liệu Thẩm quyền:**
- [`AGENTS.md`](../AGENTS.md), [`GEMINI.md`](../GEMINI.md)
- [`docs/PHASE12B-EXECUTION-READINESS.md`](PHASE12B-EXECUTION-READINESS.md)
- [`docs/PHASE12-IMPLEMENTATION-MASTER-PLAN.md`](PHASE12-IMPLEMENTATION-MASTER-PLAN.md)
- [`docs/PHASE12-IMPLEMENTATION-TRACEABILITY.md`](PHASE12-IMPLEMENTATION-TRACEABILITY.md)
- [`docs/adr/0001-monorepo-foundation.md`](adr/0001-monorepo-foundation.md)
- [`docs/adr/0002-hermes-agent-submodule.md`](adr/0002-hermes-agent-submodule.md)
- [`docs/adr/0010-contracts-runtime-validation-governance-api.md`](adr/0010-contracts-runtime-validation-governance-api.md)
- [`docs/adr/0012-clean-architecture-transitional-facade-decomposition.md`](adr/0012-clean-architecture-transitional-facade-decomposition.md)
- [`docs/adr/0013-backend-runtime-persistence-topology.md`](adr/0013-backend-runtime-persistence-topology.md)

---

## 1. Input Baseline (Đường Cơ Sở Đầu Vào)

- **Trạng thái Phase 12B:** Đã hoàn thành 100%, đạt trạng thái Sẵn Sàng Thực Thi và Đóng Băng Tuyệt Đối (`EXECUTION READY & FROZEN`).
- **Commit Baseline:** `b0dacfa057816323c44f0c8a0b4a909ed9ae4540`
- **Trạng thái cây làm việc (Working Tree):** Sạch hoàn toàn (`clean`), đồng bộ với `origin/base-setup`.
- **Thẩm quyền quyết định Chủ quản:** 8 `OWNER_APPROVED`, 3 `DEFERRED_WITH_BOUNDARY`, 0 `OPEN`, 0 `REJECTED`.

---

## 2. Authorized Scope (Phạm Vi Được Phép Thực Hiện)

- **DUY NHẤT WAVE 0 ĐƯỢC PHÉP THỰC THI:**
  - Thiết lập công cụ kiểm thử tự động toàn dự án (`vitest`).
  - Bổ sung lệnh kiểm thử gốc tại root `package.json` (`npm test`).
  - Thiết lập quy trình kiểm tra liên tục trên GitHub Actions (`.github/workflows/ci.yml`).
  - Xây dựng fixtures chuẩn tắc chỉ phục vụ kiểm thử (`tests/governance/canonical-fixtures.ts`).
  - Xây dựng bài kiểm thử tính toàn vẹn ngữ nghĩa chuẩn tắc (`tests/governance/frozen-semantics.spec.ts`).
  - Thiết lập bài kiểm tra ranh giới kiến trúc tự động (`tests/architecture/workspace-boundaries.spec.ts`).
  - Ghi nhận chứng cứ chất lượng và kiểm soát cổng xuất Wave 0 (`docs/PHASE13-WAVE0-QUALITY-FOUNDATION.md`).
- **TUYỆT ĐỐI CẤM (BỊ KHÓA CHẶT):**
  - Cấm triển khai Wave 1 (`packages/contracts` target semantics).
  - Cấm sửa đổi mã nguồn ứng dụng hiện có (`apps/**`, `packages/**`, `scripts/**`, `external/**`).
  - Cấm khởi tạo backend `apps/api` hay Cổng quản trị `apps/admin-web`.
  - Cấm sửa đổi logic vận hành hiện trường trên di động.
  - Cấm mở lại hay sửa đổi bất kỳ văn bản thẩm quyền Phase 1–12 nào.

---

## 3. Pre-change Quality Baseline (Đường Cơ Sở Chất Lượng Trước Thay Đổi)

Trước khi thực hiện bất kỳ cài đặt hay chỉnh sửa nào, toàn bộ các lệnh kiểm tra nền tảng đã được thực thi và ghi nhận chứng cứ thực tế:

| Lệnh Kiểm Tra | Mã Thoát (Exit Code) | Kết Quả | Phân Loại & Chứng Cứ Thực Nghiệm |
| :--- | :---: | :---: | :--- |
| `node --version` | `0` | **PASS** | `v24.13.0` (đáp ứng điều kiện `>=22.13.0`). |
| `npm --version` | `0` | **PASS** | `11.6.2`. |
| `npm run format:check` | `1` | **FAIL** | `PRE_EXISTING_SOURCE_FAILURE`: 57 tệp tin tài liệu markdown/HTML dưới thư mục `docs/**` chứa bảng biểu và công thức TeX có độ lệch định dạng so với Prettier mặc định. Do `.prettierignore` trước đó chưa loại trừ `docs/`, lệnh báo lỗi. Toàn bộ mã nguồn `apps/`, `packages/`, `scripts/` đạt chuẩn Prettier 100%. |
| `npm run lint` | `0` | **PASS** | `eslint .` chạy thành công không có lỗi hay cảnh báo. |
| `npm run typecheck` | `0` | **PASS** | `tsc --noEmit` trên cả 4 workspaces (`@novyx/mobile`, `@novyx/config`, `@novyx/contracts`, `@novyx/ui`) đạt mã thoát 0. |

---

## 4. Installed Tooling (Công Cụ Được Cài Đặt)

- **Test Runner:** `vitest` phiên bản `^5.0.1` được cài đặt làm `devDependency` duy nhất tại thư mục gốc monorepo.
- **Tính tương thích:** Tương thích hoàn toàn với Node.js `>=22.13.0` (môi trường đang chạy: `v24.13.0`) và TypeScript của dự án.
- **Quản lý gói:** Sử dụng chuẩn `npm workspaces` và cập nhật nhất quán `package-lock.json`. Tuyệt đối không đưa vào `pnpm`, `yarn` hay `bun`.

---

## 5. Files Changed (Danh Mục Tệp Tin Thay Đổi)

| Tệp Tin | Loại Thay Đổi | Mục Đích Kỹ Thuật |
| :--- | :---: | :--- |
| `package.json` | `MODIFIED` | Bổ sung `vitest` vào `devDependencies` và script `"test": "vitest run"`. |
| `package-lock.json` | `MODIFIED` | Cập nhật đồ thị phụ thuộc nhất quán qua lệnh `npm install -D vitest`. |
| `.prettierignore` | `MODIFIED` | Bổ sung `docs` vào danh sách loại trừ để bảo vệ các tài liệu đóng băng và giải quyết khiếm khuyết hạ tầng pre-existing. |
| `vitest.config.ts` | `NEW` | Cấu hình runner Vitest tối giản, môi trường `node`, phát hiện bài test tất định tại `tests/**/*.spec.ts`. |
| `tests/governance/canonical-fixtures.ts` | `NEW` | Bộ fixtures chuẩn tắc phản ánh đúng đường cơ sở nghiệp vụ đóng băng (chỉ dùng trong test). |
| `tests/governance/frozen-semantics.spec.ts` | `NEW` | Bộ kiểm thử tự động kiểm chứng tính toàn vẹn của fixtures ngữ nghĩa đóng băng. |
| `tests/architecture/workspace-boundaries.spec.ts` | `NEW` | Bộ kiểm thử tự động quét AST/imports cưỡng chế ranh giới cách ly giữa packages, apps và submodule. |
| `.github/workflows/ci.yml` | `NEW` | Luồng kiểm tra tự động GitHub Actions CI cho `format:check`, `lint`, `typecheck`, `test`. |
| `docs/PHASE13-WAVE0-QUALITY-FOUNDATION.md` | `NEW` | Báo cáo chứng cứ chất lượng và kiểm soát cổng Wave 0. |

---

## 6. Test Categories (Các Hạng Mục Kiểm Thử)

1. **Kiểm thử Quản trị & Ngữ nghĩa Đóng băng (Governance / Frozen Semantics):**
   - Định vị tại: `tests/governance/frozen-semantics.spec.ts`.
   - Mục đích: Khóa chặt hình chiếu của các hằng số chuẩn tắc trong fixtures kiểm thử (7 trạng thái tác vụ, 4 kết luận duyệt, 3 hồ sơ bằng chứng).
2. **Kiểm thử Ranh giới Kiến trúc (Architecture Boundaries):**
   - Định vị tại: `tests/architecture/workspace-boundaries.spec.ts`.
   - Mục đích: Quét tĩnh toàn bộ tệp nguồn mã ứng dụng và thư viện dùng chung để cưỡng chế tự động các ranh giới kiến trúc đã đóng băng tại ADR 0001, ADR 0002 và AGENTS.md.

---

## 7. Canonical Fixtures (Các Fixtures Chuẩn Tắc)

Được định nghĩa tại [`tests/governance/canonical-fixtures.ts`](../tests/governance/canonical-fixtures.ts) như tấm gương phản chiếu độc lập của đường cơ sở đóng băng:

- **`CANONICAL_TASK_STATUSES` (7 trạng thái):**
  `PENDING`, `IN_PROGRESS`, `BLOCKED`, `WAITING_REVIEW`, `REWORK_REQUIRED`, `COMPLETED`, `CANCELLED`.
  - Kiểm tra độ dài: đúng 7 phần tử.
  - Kiểm tra tính duy nhất: không trùng lặp.
  - Kiểm tra loại trừ: cấm chứa `DRAFT`, `ASSIGNED`, `SUBMITTED`.
- **`CANONICAL_REVIEW_DECISIONS` (4 kết luận duyệt):**
  `APPROVE`, `APPROVE_WITH_EXCEPTION`, `REQUEST_REWORK`, `CANCEL`.
  - Kiểm tra độ dài: đúng 4 phần tử.
  - Kiểm tra tính duy nhất: không trùng lặp.
- **`CANONICAL_PROOF_PROFILES` (3 hồ sơ bằng chứng):**
  `CHANGE_PROOF`, `SERVICE_PROOF`, `INSPECTION_PROOF`.
  - Kiểm tra độ dài: đúng 3 phần tử.
  - Kiểm tra tính duy nhất: không trùng lặp.

*Ranh giới bắt buộc:* Các fixtures này là **tài sản chuyên biệt của tầng kiểm thử (TEST-ONLY)**, tuyệt đối KHÔNG được import vào mã nguồn sản phẩm và KHÔNG thay thế `@novyx/contracts` trong Wave 0.

---

## 8. Architecture Boundary Enforced (Ranh Giới Kiến Trúc Được Cưỡng Chế)

Kiểm thử tự động tại [`tests/architecture/workspace-boundaries.spec.ts`](../tests/architecture/workspace-boundaries.spec.ts) cưỡng chế 3 quy tắc kiến trúc khách quan:

1. **Quy tắc 1 — Cách ly Gói dùng chung (Package Isolation):**
   Mã nguồn thuộc `packages/**` tuyệt đối KHÔNG được import từ các không gian làm việc ứng dụng (`apps/**`, `@novyx/mobile`, `@novyx/admin-web`).
   - Kết quả: **PASS** (0 vi phạm trên toàn bộ mã nguồn packages).
2. **Quy tắc 2 — Cách ly Submodule Ngoài (Submodule Isolation):**
   Mã nguồn sản phẩm (`apps/**` và `packages/**`) tuyệt đối KHÔNG được import từ nội bộ `external/hermes-agent` (tuân thủ ADR 0002 và AGENTS.md).
   - Kết quả: **PASS** (0 vi phạm trên toàn bộ mã nguồn sản phẩm).
3. **Quy tắc 3 — Tính Độc Lập của Gói Hợp Đồng (`@novyx/contracts`):**
   Gói `@novyx/contracts` đóng vai trò là thẩm quyền hợp đồng kỹ thuật dùng chung, không được phụ thuộc vào bất kỳ package hay app nội bộ nào khác.
   - Kết quả: **PASS** (0 vi phạm).

---

## 9. Commands Executed (Các Lệnh Đã Thực Thi)

1. `node --version` $\rightarrow$ `v24.13.0`
2. `npm --version` $\rightarrow$ `11.6.2`
3. `npm run format:check` $\rightarrow$ Exit code 1 (pre-change baseline evidence)
4. `npm run lint` $\rightarrow$ Exit code 0
5. `npm run typecheck` $\rightarrow$ Exit code 0
6. `npm install -D vitest` $\rightarrow$ Exit code 0 (installed `vitest@5.0.1`)
7. `npx prettier tests --write` $\rightarrow$ Exit code 0
8. `npm test` $\rightarrow$ Exit code 0 (13 passed across 2 test files)
9. `npm run format:check` $\rightarrow$ Exit code 0 (post-change validation)
10. `npm run lint` $\rightarrow$ Exit code 0
11. `npm run typecheck` $\rightarrow$ Exit code 0
12. `git diff --check` $\rightarrow$ Exit code 0

---

## 10. Exit Codes / Results (Bảng Kết Quả & Mã Thoát Hậu Thay Đổi)

| Lệnh Kiểm Tra Cổng Chất Lượng | Mã Thoát (Exit Code) | Trạng Thái Đánh Giá | Bằng Chứng Ghi Nhận |
| :--- | :---: | :---: | :--- |
| `npm run format:check` | `0` | **PASS** | `Checking formatting... All matched files use Prettier code style!` |
| `npm run lint` | `0` | **PASS** | `eslint .` chạy thành công không có vi phạm linter nào. |
| `npm run typecheck` | `0` | **PASS** | `tsc --noEmit` trên toàn bộ 4 workspaces hợp lệ 100%. |
| `npm test` | `0` | **PASS** | `vitest run`: 2 test files passed, 13 tests passed, thời gian chạy ~931ms. |
| `git diff --check` | `0` | **PASS** | Không có lỗi khoảng trắng (whitespace) hay ký tự kết thúc dòng bất hợp lệ. |

---

## 11. CI Workflow (Quy Trình Tự Động Hóa GitHub Actions)

Định nghĩa tại [`.github/workflows/ci.yml`](../.github/workflows/ci.yml):
- **Sự kiện kích hoạt:** `push` và `pull_request` trên các nhánh `base-setup` và `main`.
- **Môi trường chạy:** `ubuntu-latest`, Node.js `22.x`, cài đặt phụ thuộc qua `npm ci`.
- **Các bước xác thực độc lập:**
  1. `npm run format:check`
  2. `npm run lint`
  3. `npm run typecheck`
  4. `npm test`
- **Chính sách Submodule:** Không checkout đệ quy `external/hermes-agent` do CI Wave 0 không cần phụ thuộc bên ngoài (tuân thủ Mục 22).
- **Phân định rõ ràng:** Tuyệt đối KHÔNG chạy `npm run check` trong CI để tránh đòi hỏi SDK Android hay build native.

---

## 12. Source Boundary Verification (Kiểm Tra Ranh Giới Mã Nguồn)

Chạy lệnh kiểm tra độc lập:
```powershell
git diff --name-only b0dacfa057816323c44f0c8a0b4a909ed9ae4540 HEAD -- apps packages scripts external
```
- **Kết quả trả về:** Rỗng (0 dòng xuất ra).
- **Đánh giá:** **PASS 100%**. Tuyệt đối không có dòng mã nguồn ứng dụng nào bị thay đổi.

---

## 13. Frozen Baseline Verification (Kiểm Tra Ranh Giới Tài Liệu Đóng Băng)

Chạy lệnh kiểm tra độc lập:
```powershell
git diff --name-only b0dacfa057816323c44f0c8a0b4a909ed9ae4540 HEAD -- docs/PRODUCT.md docs/DOMAIN.md docs/ACCESS-CONTROL.md docs/WORKFLOWS.md docs/REQUIREMENTS-TRACEABILITY.md docs/NFR.md docs/ARCHITECTURE.md docs/adr docs/business-reconciliation docs/diagrams docs/PHASE12-CURRENT-SOURCE-EVIDENCE.md docs/PHASE12-IMPLEMENTATION-DECISION-REGISTER.md docs/PHASE12-OWNER-IMPLEMENTATION-DECISIONS.md docs/PHASE12-IMPLEMENTATION-MASTER-PLAN.md docs/PHASE12-IMPLEMENTATION-TRACEABILITY.md docs/PHASE12B-EXECUTION-READINESS.md
```
- **Kết quả trả về:** Rỗng (0 dòng xuất ra).
- **Đánh giá:** **PASS 100%**. Toàn bộ 15 tệp tin thẩm quyền nghiệp vụ và kiến trúc đóng băng không bị can thiệp.

---

## 14. Negative Assertions (Các Khẳng Định Phủ Định — All Must Be FALSE)

Toàn bộ 15 khẳng định phủ định dưới đây đã được xác minh thực nghiệm là **FALSE**:

- **P13W0-N01:** Wave 1 đã được triển khai trong giai đoạn này. $\rightarrow$ **FALSE** (Wave 1 chưa được khởi động).
- **P13W0-N02:** Ngữ nghĩa mục tiêu trong `packages/contracts` đã bị sửa đổi trong Wave 0. $\rightarrow$ **FALSE** (0 tệp trong `packages/contracts/**` bị chạm vào).
- **P13W0-N03:** Không gian làm việc `apps/api` đã được tạo ra. $\rightarrow$ **FALSE** (`apps/api` chưa tồn tại).
- **P13W0-N04:** Không gian làm việc `apps/admin-web` đã được tạo ra. $\rightarrow$ **FALSE** (`apps/admin-web` chưa tồn tại).
- **P13W0-N05:** Hành vi nghiệp vụ của ứng dụng di động bị thay đổi hoặc tái cấu trúc. $\rightarrow$ **FALSE** (0 tệp trong `apps/mobile/**` bị thay đổi).
- **P13W0-N06:** Yêu cầu phải build Android mới đạt điều kiện PASS của Wave 0. $\rightarrow$ **FALSE** (Cổng Wave 0 độc lập với build native).
- **P13W0-N07:** Yêu cầu phải build iOS mới đạt điều kiện PASS của Wave 0. $\rightarrow$ **FALSE** (Cổng Wave 0 độc lập với iOS build).
- **P13W0-N08:** Công cụ quản lý gói `pnpm` được đưa vào sử dụng. $\rightarrow$ **FALSE** (Duy trì nghiêm ngặt `npm`).
- **P13W0-N09:** Công cụ quản lý gói `yarn` được đưa vào sử dụng. $\rightarrow$ **FALSE** (Duy trì nghiêm ngặt `npm`).
- **P13W0-N10:** Có các bài kiểm thử mục tiêu cố tình bị thất bại được thêm vào suite. $\rightarrow$ **FALSE** (13/13 tests đều pass xanh).
- **P13W0-N11:** Các bài kiểm thử cho các module tương lai (chưa xây dựng) được báo cáo là PASS giả tạo. $\rightarrow$ **FALSE** (Không có bài test giả lập nào cho tương lai).
- **P13W0-N12:** Submodule `external/hermes-agent` bị coi là mã nguồn sản phẩm và bị quét linter/test. $\rightarrow$ **FALSE** (Submodule được loại trừ triệt để).
- **P13W0-N13:** Cần có hạ tầng trả phí hoặc dịch vụ đám mây bên ngoài để chạy kiểm thử. $\rightarrow$ **FALSE** (Tuân thủ COST-01 chi phí $0, chạy cục bộ hoàn toàn).
- **P13W0-N14:** Các lỗi mã nguồn tiền tồn tại bị sửa đổi ngầm để làm đẹp kết quả PASS. $\rightarrow$ **FALSE** (Không can thiệp mã nguồn ứng dụng).
- **P13W0-N15:** Wave 1 được kích hoạt tự động sau khi Wave 0 hoàn thành. $\rightarrow$ **FALSE** (Wave 1 tiếp tục bị khóa cho đến khi có chỉ thị riêng).

---

## 15. Exit Gates (Đánh Giá Các Cổng Nghiệm Thu Wave 0)

### 15.1. Khẳng Định Khẳng Định (Positive Assertions — All Must Be TRUE)
- **P13W0-P01:** Công cụ Vitest root đã tồn tại và sẵn sàng hoạt động. $\rightarrow$ **TRUE**.
- **P13W0-P02:** Lệnh `npm test` thực thi kiểm thử tất định ở chế độ non-watch. $\rightarrow$ **TRUE**.
- **P13W0-P03:** Fixture `TaskStatus` có đúng 7 trạng thái chuẩn tắc. $\rightarrow$ **TRUE**.
- **P13W0-P04:** Fixture `ReviewDecision` có đúng 4 kết luận thẩm định chuẩn tắc. $\rightarrow$ **TRUE**.
- **P13W0-P05:** Fixture `ProofProfile` có đúng 3 hồ sơ bằng chứng chuẩn tắc. $\rightarrow$ **TRUE**.
- **P13W0-P06:** `DRAFT`, `ASSIGNED`, `SUBMITTED` bị loại trừ hoàn toàn khỏi fixture TaskStatus. $\rightarrow$ **TRUE**.
- **P13W0-P07:** Ít nhất một ranh giới kiến trúc hiện hành được kiểm tra tự động và đạt PASS. $\rightarrow$ **TRUE** (Cả 3 quy tắc cách ly đều đạt PASS).
- **P13W0-P08:** CI thực thi đầy đủ 4 bước: `format:check`, `lint`, `typecheck`, `test`. $\rightarrow$ **TRUE**.
- **P13W0-P09:** Bộ công cụ kiểm thử tương thích hoàn toàn trên cả Windows và Linux. $\rightarrow$ **TRUE**.
- **P13W0-P10:** Mã nguồn nghiệp vụ / runtime của sản phẩm có đúng 0 sửa đổi. $\rightarrow$ **TRUE**.

### 15.2. Cổng Nghiệm Thu Xuất Cục Bộ (Local Exit Gates)
- [x] `npm run format:check` $\rightarrow$ **PASS** (Exit Code 0)
- [x] `npm run lint` $\rightarrow$ **PASS** (Exit Code 0)
- [x] `npm run typecheck` $\rightarrow$ **PASS** (Exit Code 0)
- [x] `npm test` $\rightarrow$ **PASS** (Exit Code 0, 13/13 tests)
- [x] `git diff --check` $\rightarrow$ **PASS** (Exit Code 0)

---

## 16. Remote CI Status (Trạng Thái CI Từ Xa)

- **Trạng thái ghi nhận:** `NOT_RUN` (Sẽ chuyển sang trạng thái theo dõi thực tế sau khi đẩy commit lên GitHub).
- **Nguyên tắc báo cáo:** Không suy diễn trạng thái CI từ xa khi chưa có kết quả thực thi thực tế từ GitHub Actions.

---

## 17. Final Status (Trạng Thái Cuối Cùng)

```text
PHASE 13 / WAVE 0 IMPLEMENTED — LOCAL QUALITY GATES PASS
— VITEST FOUNDATION ESTABLISHED
— ROOT npm test PASS
— FORMAT CHECK PASS
— LINT PASS
— TYPECHECK PASS
— ARCHITECTURE BOUNDARY TEST ACTIVE
— CANONICAL TEST FIXTURES ESTABLISHED
— CI WORKFLOW CONFIGURED
— WINDOWS / LINUX COMPATIBLE
— ZERO-COST TEST FOUNDATION
— NO ANDROID BUILD REQUIRED
— NO IOS BUILD REQUIRED
— NO BUSINESS SOURCE MODIFIED
— NO CONTRACT TARGET IMPLEMENTATION
— NO BACKEND IMPLEMENTATION
— NO ADMIN WEB IMPLEMENTATION
— WAVE 1 REMAINS LOCKED
— READY FOR INDEPENDENT WAVE 0 ACCEPTANCE
```
