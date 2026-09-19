# NOVYX GreenOps — Business Baseline Reconciliation Master Plan

## Mục tiêu

Thiết lập lại baseline nghiệp vụ theo hướng có kiểm soát chất lượng chặt chẽ, đặc biệt bổ sung và chuẩn hóa vai trò **Admin** bên cạnh **Staff**, **Manager** và **System**, trước khi bước sang Technical Architecture hoặc implementation.

Baseline bắt đầu:

```text
Repository: Peaker04/tree
Branch: base-setup
Business/Diagram baseline:
8c21f7cd6f70628d4be07794af0821ed623a389c
```

---

# 1. Nguyên tắc kiểm soát chất lượng toàn kế hoạch

Mọi phase chỉ được coi là `PASS` khi đồng thời thỏa:

| Quy tắc | Bắt buộc |
|---|---|
| Requirement đã định nghĩa trước khi sửa | YES |
| Acceptance Criteria nhị phân, kiểm được | YES |
| Có artifact hoặc diff chứng minh | YES |
| Có command/test/manual review phù hợp | YES |
| Working tree được kiểm soát | YES |
| Không tự suy PASS từ “đã sửa” | YES |
| Không dùng checklist `[x]` làm evidence | YES |
| Không mở phase sau khi phase hiện tại còn blocker | YES |
| `NOT_RUN`, `INCONCLUSIVE`, thiếu evidence | = NOT READY |
| Agent self-report | Không được xem là bằng chứng độc lập |

Trạng thái duy nhất dùng:

```text
PASS
FAIL
NOT_RUN
INCONCLUSIVE
NOT_APPLICABLE
```

Đối với gate blocking:

```text
effective PASS
=
requirement satisfied
AND verification executed
AND evidence exists
AND evidence matches current commit
```

---

# PHASE 0 — BASELINE FREEZE & CHANGE CONTROL

## Mục tiêu
Khóa trạng thái hiện tại trước khi thay đổi nghiệp vụ Admin.

## Checklist

| ID | Kiểm tra | Evidence bắt buộc |
|---|---|---|
| P0-01 | Branch đúng `base-setup` | `git branch --show-current` |
| P0-02 | HEAD đúng baseline bắt đầu | `git rev-parse HEAD` |
| P0-03 | Working tree sạch | `git status --porcelain` |
| P0-04 | Lưu tree hash | `git rev-parse HEAD^{tree}` |
| P0-05 | Snapshot danh sách canonical docs | file inventory |
| P0-06 | Snapshot 16 HTML diagrams | `docs/diagrams/README.md` + filesystem |
| P0-07 | Xác nhận không sửa application source trong business phases | diff boundary |
| P0-08 | Ghi rõ Admin hiện đang ở trạng thái `OUT_OF_MVP / RESERVED` | PRODUCT + ACCESS-CONTROL |
| P0-09 | Ghi rõ runtime defect `admin → Manager` | source evidence |
| P0-10 | Tạo Business Optimization Gap Register | artifact mới |

## Artifact

```text
docs/business-reconciliation/
  00-BASELINE-SNAPSHOT.md
  01-BUSINESS-GAP-REGISTER.md
```

## Exit Gate

```text
P0 PASS
```

chỉ khi baseline, gaps và scope đã được khóa.

---

# PHASE 1 — ACTOR MODEL RECONCILIATION

## Mục tiêu
Chốt mô hình tác nhân trước mọi workflow.

Không thiết kế màn hình. Không code Admin.

## Quyết định bắt buộc

| ID | Decision |
|---|---|
| P1-D01 | Admin có trở thành active product role không? |
| P1-D02 | Admin là human actor độc lập hay subtype của Manager? |
| P1-D03 | Admin có được tham gia task operations thông thường không? |
| P1-D04 | System actor giữ phạm vi nào? |
| P1-D05 | Có Service/System Administrator khác Admin hay không? |

## Baseline đề xuất cần kiểm chứng

```text
Staff
Manager
Admin
System
```

Với nguyên tắc:

```text
Admin ≠ Manager
```

## Checklist

| ID | Acceptance Oracle |
|---|---|
| P1-01 | Actor Registry chứa chính xác mọi actor được hỗ trợ |
| P1-02 | Mỗi actor có purpose rõ |
| P1-03 | Mỗi actor có readable scope |
| P1-04 | Mỗi actor có writable scope |
| P1-05 | Mỗi actor có forbidden actions |
| P1-06 | Không còn rule “mọi non-staff = Manager” |
| P1-07 | Staff không có Manager/Admin privileges |
| P1-08 | Manager không mặc nhiên có Admin privileges |
| P1-09 | Admin không mặc nhiên trở thành super-manager |
| P1-10 | System actor không được dùng như human role |
| P1-11 | Separation of Duties được định nghĩa |
| P1-12 | Open decisions được ghi riêng, không silently assume |

## Artifact

```text
02-ACTOR-MODEL-DECISION.md
03-ROLE-NAMING-TAXONOMY.md (Role Naming & Taxonomy Mini-Phase)
```

## Exit Gate
Chưa PASS nếu còn câu hỏi:

```text
Admin thực chất làm gì?
```

---

# PHASE 2 — ADMIN BUSINESS SCOPE & GOVERNANCE

## Mục tiêu
Định nghĩa đúng nghiệp vụ Admin trước khi đưa Admin vào diagram.

## Capability candidates

| Capability | Decision cần chốt |
|---|---|
| User Management | create / invite / activate / suspend |
| Role Assignment | Staff / Manager / Admin |
| Account Recovery | reset/unlock |
| Audit Log | read/filter/export |
| Tree Master Data Governance | create/update/retire? |
| TaskType Catalog | ai quản trị? |
| ProofProfile Mapping | system/admin controlled? |
| Checklist Template | versioned? |
| Findings Template | versioned? |
| Break-glass | có hay không? |
| System Configuration | cấu hình nào thật sự business-relevant? |

## Checklist

| ID | Acceptance Oracle |
|---|---|
| P2-01 | Mỗi Admin capability có business purpose |
| P2-02 | Không tồn tại capability chỉ vì “Admin thường có” |
| P2-03 | Mỗi mutation xác định resource owner |
| P2-04 | Role assignment có audit trail |
| P2-05 | Suspend account không xóa lịch sử |
| P2-06 | Role change không rewrite historical authorship |
| P2-07 | Tree master-data mutation có audit |
| P2-08 | TaskType → ProofProfile không downgrade per-task tùy tiện |
| P2-09 | Template change có versioning nếu ảnh hưởng task đang chạy |
| P2-10 | Break-glass có reason + actor + timestamp |
| P2-11 | Break-glass không silently bypass audit |
| P2-12 | Admin không tự duyệt công việc do chính mình thực hiện nếu sau này được phép task access |
| P2-13 | Scope MVP / post-MVP từng capability được đánh dấu rõ |

## Artifact

```text
docs/business-reconciliation/
  04-ADMIN-BUSINESS-SCOPE-DECISION.md
```

## Exit Gate
Mỗi Admin capability phải ở đúng một trạng thái:

```text
MVP
NEXT
RESERVED
REJECTED
```

Không để kiểu “có thể sau này” mà vẫn xuất hiện như capability đang hoạt động.

---

# PHASE 3 — DOMAIN OWNERSHIP & BOUNDED CONTEXT RECONCILIATION

## Mục tiêu
Tối ưu ownership nghiệp vụ, tránh Admin bị nhét vào mọi context.

## Contexts cần audit

| Context | Câu hỏi cần chốt |
|---|---|
| Identity & Access | Ai sở hữu user/role lifecycle? |
| Work Management | Admin có quyền operational task không? |
| Tree Asset Registry | Ai sở hữu master data? |
| Review & QC | Admin có review không? |
| Field Verification | Admin có tham gia không? |
| Operational Notifications | Admin nhận loại notification nào? |
| Governance/Audit | Có cần context riêng không? |

## Hướng mô hình nên kiểm tra

```text
Identity & Access Management
           +
Administration & Audit
```

là Generic/Supporting contexts riêng, thay vì đẩy Admin vào Core Field Verification.

## Checklist

| ID | Acceptance Oracle |
|---|---|
| P3-01 | Mọi aggregate có owner duy nhất |
| P3-02 | User/Role ownership rõ |
| P3-03 | Tree master-data ownership rõ |
| P3-04 | Task operational ownership vẫn rõ |
| P3-05 | Proof policy owner rõ |
| P3-06 | Audit Event owner rõ |
| P3-07 | Không có context chồng trách nhiệm vô lý |
| P3-08 | Admin governance không xâm nhập core field workflow không cần thiết |
| P3-09 | Historical actor/action được bảo toàn |
| P3-10 | Domain terms được cập nhật vào Ubiquitous Language |

## Artifact

```text
05-DOMAIN-OWNERSHIP-MATRIX.md
06-BOUNDED-CONTEXT-DECISIONS.md
```

---

# PHASE 4 — AUTHORIZATION & ACTION ELIGIBILITY

## Mục tiêu
Xây lại authorization model 3 role thay vì chỉ thêm một cột Admin vào diagram.

Công thức:

```text
Action Eligibility
=
Role
∧ Resource Scope
∧ State
∧ Preconditions
```

## Tách thành hai matrix

```text
A. Operational Action Matrix
   Staff / Manager

B. Governance Action Matrix
   Admin
```

## Checklist

| ID | Acceptance Oracle |
|---|---|
| P4-01 | Mọi command có actor |
| P4-02 | Mọi command có resource |
| P4-03 | Mọi command có valid states |
| P4-04 | Mọi command có preconditions |
| P4-05 | Mọi forbidden action rõ |
| P4-06 | Staff matrix hoàn chỉnh |
| P4-07 | Manager matrix hoàn chỉnh |
| P4-08 | Admin governance matrix hoàn chỉnh |
| P4-09 | Admin không được operational override mặc định |
| P4-10 | Manager không được user-role administration mặc định |
| P4-11 | Break-glass tách riêng normal authorization |
| P4-12 | Read permission và mutate permission không bị gộp |

## Quality test

```text
Actor × Action × Resource × State
```

Không được có command không actor, không state hoặc không scope.

---

# PHASE 5 — WORKFLOW OPTIMIZATION

## Mục tiêu
Audit business flow đầu-cuối sau khi có Admin.

Admin **không tự động có lane** trong Operational Task Swimlane.

## Workflow cần rà

| Workflow | Expected actors |
|---|---|
| Task Execution | Manager → Staff → System |
| Site Verification | Staff + System |
| Proof Acquisition | Staff |
| Review/Rework | Manager + Staff |
| Blocked Resolution | Manager + Staff |
| User Provisioning | Admin + System |
| Role Change | Admin + System |
| Account Suspension | Admin + System |
| Master Data Governance | Admin + System / Manager read |
| Break-glass | Admin + System + Audit |

## Checklist

| ID | Acceptance Oracle |
|---|---|
| P5-01 | Không thêm Admin lane vào field flow nếu không có action |
| P5-02 | User provisioning workflow xác định |
| P5-03 | Role-change workflow xác định |
| P5-04 | Suspension workflow xác định |
| P5-05 | Audit event được tạo đúng lúc |
| P5-06 | Break-glass flow nếu được duyệt |
| P5-07 | Existing 7-state Task lifecycle không bị phá |
| P5-08 | ProofProfile semantics không bị phá |
| P5-09 | CareHistory chỉ COMPLETED |
| P5-10 | Offline semantics không bị trộn với TaskStatus |
| P5-11 | Reassignment rules giữ nguyên trừ khi có decision explicit |

## Stop rule

```text
Nếu thêm Admin buộc thay đổi Task lifecycle
mà không có business requirement rõ:
STOP → REJECT CHANGE
```

---

# PHASE 6 — CANONICAL DOCUMENT RECONCILIATION

## Thứ tự sửa bắt buộc

```text
PRODUCT.md
    ↓
DOMAIN.md
    ↓
ACCESS-CONTROL.md
    ↓
WORKFLOWS.md
    ↓
REQUIREMENTS-TRACEABILITY.md
```

Không sửa diagram trước docs.

## Checklist theo tài liệu

| Document | Điều phải đồng bộ |
|---|---|
| PRODUCT | actors, capability scope, MVP status |
| DOMAIN | contexts, ownership, ubiquitous language |
| ACCESS-CONTROL | role matrix, admin governance |
| WORKFLOWS | admin-specific workflows nếu có |
| RTM | requirement → actor → command → oracle |

## Cross-document gates

| ID | Gate |
|---|---|
| P6-01 | Actor names identical |
| P6-02 | Role taxonomy identical |
| P6-03 | Capability IDs identical |
| P6-04 | Command names identical |
| P6-05 | Resource ownership identical |
| P6-06 | MVP status identical |
| P6-07 | No contradictory Admin scope |
| P6-08 | No doc says Admin RESERVED while another says CURRENT |
| P6-09 | No silent promotion proposed→canonical |
| P6-10 | Every new business requirement appears in RTM |

---

# PHASE 7 — RTM EXPANSION & ACCEPTANCE ORACLES

## Mục tiêu
Mọi Admin requirement phải test được trước implementation.

Ví dụ đúng:

```text
BR-ADMIN-001
Actor: Admin
Command: AssignRole
Precondition:
- target user exists
- requested role is allowed
Acceptance:
- role changes
- actor/timestamp/reason stored
- previous role remains visible in audit history
```

Ví dụ sai:

```text
Admin quản lý user hiệu quả.
```

## Checklist

| ID | Oracle |
|---|---|
| P7-01 | Requirement IDs unique |
| P7-02 | Actor non-empty |
| P7-03 | Command explicit |
| P7-04 | Resource explicit |
| P7-05 | Preconditions explicit |
| P7-06 | Result explicit |
| P7-07 | Error/forbidden behavior explicit |
| P7-08 | Audit requirement explicit where needed |
| P7-09 | MVP classification explicit |
| P7-10 | Acceptance criteria binary |
| P7-11 | No vague words like “appropriate”, “secure”, “good” without metric |
| P7-12 | No implementation technology baked into business requirement |

---

# PHASE 8 — DIAGRAM SUITE RECONCILIATION

Chỉ bắt đầu khi Phase 1–7 PASS.

## Diagram impact matrix

| Diagram | Action |
|---|---|
| `01-product-capability-map` | REVISE |
| `02-domain-context-map` | REVISE |
| `03` historical | KEEP |
| `04` historical | KEEP |
| `05` historical | KEEP |
| `06` historical | KEEP |
| `07-action-eligibility-security-matrix` | REVISE / split |
| `08-role-information-architecture` | REVISE |
| `09-system-current-state` | KEEP AS-IS |
| `10-system-target-architecture` | DEFER business content until architecture phase |
| `11` historical | KEEP |
| `12-architecture-dependency-map` | DEFER until ADR |
| `proposed-01` | KEEP unless docs changed semantics |
| `proposed-02` | KEEP core operational flow |
| `proposed-03` | KEEP lifecycle |
| `proposed-04` | KEEP proof/rework |

## Có thể thêm

```text
13-admin-governance-capability-map.html
14-admin-action-eligibility-matrix.html
15-admin-account-role-lifecycle.html
```

Nhưng chỉ khi các view này thật sự khác biệt và có giá trị.

## Diagram gates

```text
Content correctness
→ terminology consistency
→ source authority
→ classification
→ geometry
→ export
→ manual visual review
```

Không được chỉ validate geometry rồi kết luận nghiệp vụ đúng.

---

# PHASE 9 — BUSINESS CONSISTENCY AUDIT

Đây là vòng audit cuối của **business**, không phải quality-engine audit vô tận.

## Machine checks

```text
stale terms
old role taxonomy
Staff/Manager-only claims
Admin reserved contradictions
old capability IDs
broken source references
diagram inventory mismatch
```

## Manual semantic checks

| ID | Question |
|---|---|
| P9-01 | Có action nào không rõ owner? |
| P9-02 | Admin có vô tình thành superuser nghiệp vụ? |
| P9-03 | Manager có bị mất quyền operational cần thiết? |
| P9-04 | Staff flow có bị phức tạp hóa bởi Admin? |
| P9-05 | Có quyền nào vi phạm separation of duties? |
| P9-06 | Audit history có bị rewrite? |
| P9-07 | Existing canonical task semantics còn nguyên? |
| P9-08 | Diagram có phản ánh docs hay tự phát minh? |

## Required final evidence

```text
Business consistency report
Role/action matrix
Capability matrix
Requirement traceability report
Diagram semantic review
Source boundary report
```

---

# PHASE 10 — BUSINESS BASELINE FREEZE

Chỉ PASS khi:

```text
Phase 0 PASS
Phase 1 PASS
Phase 2 PASS
Phase 3 PASS
Phase 4 PASS
Phase 5 PASS
Phase 6 PASS
Phase 7 PASS
Phase 8 PASS
Phase 9 PASS
```

## Final gate

| Metric | Required |
|---|---:|
| Blocking FAIL | 0 |
| NOT_RUN | 0 |
| INCONCLUSIVE | 0 |
| Missing evidence | 0 |
| Cross-doc contradiction | 0 |
| Unmapped requirement | 0 |
| Unowned command | 0 |
| Undefined actor | 0 |
| Diagram semantic mismatch | 0 |
| Application source change | 0 |

Final status khi đạt:

```text
BUSINESS BASELINE RECONCILIATION PASS
— 3-ROLE ACTOR MODEL ESTABLISHED
— ADMIN GOVERNANCE SCOPE LOCKED
— DIAGRAMS RECONCILED
— READY FOR TECHNICAL ARCHITECTURE
```

---

# PHASE 11 — TECHNICAL ARCHITECTURE, CHƯA IMPLEMENT

Sau khi business freeze mới quyết định:

```text
Admin dùng cùng mobile app?
        hay
Admin Web Console riêng?

Identity/IAM architecture?
Audit log persistence?
Role endpoint/contracts?
Master-data APIs?
Break-glass technical enforcement?
Package/app boundaries?
```

Các quyết định này phải đi qua ADR.

Ví dụ:

```text
ADR-ADMIN-001
Admin Client Topology

ADR-ADMIN-002
Identity & Role Administration

ADR-ADMIN-003
Audit Trail Persistence

ADR-ADMIN-004
Master Data Ownership

ADR-ADMIN-005
Break-glass Authorization
```

Sau khi ADR được `ACCEPTED` mới lập implementation plan.

---

# 2. Cơ chế chống “PASS giả” cho mọi phase

Mỗi phase tạo một bảng evidence dạng:

| Gate ID | Requirement | Verification | Evidence | Blocking | Status |
|---|---|---|---|---|---|
| P2-04 | Role changes audited | Manual + deterministic doc check | `02-ACTOR...#...` | YES | PASS |
| P2-08 | Cannot downgrade ProofProfile per-task | Cross-doc semantic check | DOMAIN + ACCESS | YES | PASS |
| P2-10 | Break-glass requires reason | RTM oracle | BR-ADMIN-xxx | YES | PASS |

Không cho phép:

```text
Status = PASS
Evidence = "Implemented"
```

hoặc:

```text
PASS vì Antigravity nói đã làm.
```

Phải là:

```text
Requirement
→ Verification
→ Evidence
→ PASS
```

---

# 3. Trình tự thực thi tổng thể

```text
P0 Baseline
 ↓
P1 Actors
 ↓
P2 Admin Scope
 ↓
P3 Domain Ownership
 ↓
P4 Authorization
 ↓
P5 Workflows
 ↓
P6 Canonical Docs
 ↓
P7 RTM
 ↓
P8 Diagrams
 ↓
P9 Semantic Audit
 ↓
P10 Business Freeze
 ↓
P11 Technical Architecture / ADR
 ↓
Implementation
```

---

# 4. Nguyên tắc thực thi bắt buộc

Không cho Antigravity nhảy thẳng từ:

```text
“thiếu Admin”
```

sang:

```text
sửa UI / sửa code / thêm màn hình
```

Trước hết phải khóa theo thứ tự:

```text
Admin là ai
→ sở hữu gì
→ làm gì
→ không được làm gì
→ workflow nào có Admin
→ requirement nào kiểm được
→ docs canonical nào bị ảnh hưởng
→ diagram nào phải sửa
→ architecture nào cần ADR
→ implementation
```

Chỉ sau khi **Business Baseline Freeze PASS** mới được phép sang Technical Architecture.
