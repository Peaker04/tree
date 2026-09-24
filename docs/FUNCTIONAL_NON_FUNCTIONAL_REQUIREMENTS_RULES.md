# Functional & Non-Functional Requirements Rules

## 1. Mục đích

Tài liệu này định nghĩa các nguyên tắc chung khi phân tích, thiết kế, triển khai và đánh giá hệ thống.

Đây không phải specification cứng cho từng màn hình, component, API hay database.

AI Agent phải:

- Đọc codebase hiện tại.
- Đọc tài liệu nghiệp vụ hiện có.
- Đọc architecture và conventions hiện tại.
- Xác định context của feature.
- Áp dụng các nguyên tắc phù hợp với dự án.

Không được biến các nguyên tắc trong tài liệu này thành các cấu trúc hoặc implementation cố định nếu dự án không yêu cầu.

# I. FUNCTIONAL REQUIREMENTS

## FR-01. Business Intent

Mỗi chức năng phải phục vụ một mục tiêu nghiệp vụ xác định.

Trước khi thay đổi hoặc implement, cần hiểu:

- Ai sử dụng chức năng.
- Người dùng muốn đạt mục tiêu gì.
- Điều kiện để thực hiện.
- Dữ liệu liên quan.
- Kết quả mong đợi.
- Các quy tắc nghiệp vụ liên quan.

Không suy luận nghiệp vụ chỉ từ giao diện.

## FR-02. Business Rules

Business rule phải xuất phát từ:

- Requirement.
- Domain.
- Existing workflow.
- Tài liệu dự án.
- Implementation đã được xác nhận.

Nếu business rule chưa rõ, không tự tạo thêm rule chỉ để thuận tiện cho implementation.

Ưu tiên giữ nguyên ý nghĩa nghiệp vụ hiện tại trừ khi có bằng chứng rõ ràng rằng nó cần thay đổi.

## FR-03. Data Operations

Các thao tác tạo, đọc, cập nhật hoặc xoá dữ liệu phải tuân theo domain của đối tượng.

Cần xem xét:

- Dữ liệu nào bắt buộc.
- Dữ liệu nào có thể thay đổi.
- Quan hệ với dữ liệu khác.
- Quyền thao tác.
- Hậu quả của thao tác.
- Khả năng ảnh hưởng tới dữ liệu liên quan.

Không mặc định một phương pháp xử lý nếu domain chưa yêu cầu.

## FR-04. State & Lifecycle

Đối tượng có vòng đời nghiệp vụ cần có trạng thái và quy tắc chuyển trạng thái rõ ràng khi cần thiết.

State phải phản ánh business meaning, không tồn tại chỉ để phục vụ presentation.

Agent cần xác định từ domain hiện tại:

- State đang tồn tại.
- State nào hợp lệ.
- Action nào được phép.
- Điều kiện chuyển state.
- State nào kết thúc workflow.

Không tự thêm, xoá hoặc đổi state nếu chưa hiểu tác động nghiệp vụ.

## FR-05. Validation

Dữ liệu đầu vào phải được kiểm tra ở lớp phù hợp.

Validation có thể bao gồm:

- Cấu trúc dữ liệu.
- Format.
- Required data.
- Business constraint.
- Permission.
- Relationship.
- State constraint.

Client-side validation chủ yếu hỗ trợ trải nghiệm người dùng.

Các rule ảnh hưởng đến tính đúng đắn hoặc bảo mật của hệ thống không được phụ thuộc hoàn toàn vào client.

## FR-06. Data Retrieval

Việc lấy dữ liệu phải phù hợp với mục đích sử dụng.

Agent cần xem xét:

- Người dùng thực sự cần dữ liệu gì.
- Khối lượng dữ liệu.
- Search.
- Filter.
- Sort.
- Pagination hoặc incremental loading nếu phù hợp.

Không fetch dữ liệu chỉ vì dữ liệu đó tồn tại.

## FR-07. User Actions

Mọi action quan trọng phải có lifecycle rõ ràng.

Hệ thống cần xử lý phù hợp các tình huống:

- Trước khi thực hiện.
- Đang xử lý.
- Thành công.
- Thất bại.
- Retry nếu phù hợp.

Tránh việc người dùng không biết action đã được nhận hay chưa.

## FR-08. Destructive Actions

Các thao tác có khả năng gây mất dữ liệu hoặc thay đổi nghiệp vụ đáng kể phải được xử lý cẩn thận.

Mức độ bảo vệ phụ thuộc vào mức độ ảnh hưởng thực tế của action.

Không sử dụng confirmation một cách máy móc cho mọi thao tác.

## FR-09. Authorization

Quyền truy cập và quyền thao tác phải phản ánh authorization model thực tế của hệ thống.

UI có thể hỗ trợ bằng việc ẩn hoặc vô hiệu hóa action không hợp lệ, nhưng không được xem đó là cơ chế bảo vệ duy nhất.

## FR-10. Error Flow

Functional flow không chỉ bao gồm happy path.

Khi phù hợp cần xem xét:

- Invalid input.
- Không đủ quyền.
- Dữ liệu không tồn tại.
- Conflict nghiệp vụ.
- Network failure.
- Server failure.
- Concurrent changes.

Cách xử lý phải phù hợp với mức độ ảnh hưởng của từng trường hợp.

# II. NON-FUNCTIONAL REQUIREMENTS

## NFR-01. Performance

Hệ thống cần tránh các thao tác gây chi phí không cần thiết.

Khi phân tích performance cần xem xét toàn bộ flow:

- UI rendering.
- Client state.
- Network.
- API.
- Application logic.
- Database.
- External services.

Không tối ưu dựa trên giả định.

Performance optimization phải dựa trên vấn đề thực tế hoặc nguy cơ hợp lý.

## NFR-02. Perceived Performance

Ngay cả khi operation cần thời gian xử lý, người dùng cần nhận biết hệ thống đang hoạt động.

Feedback loading phải phù hợp với:

- Loại thao tác.
- Thời gian chờ.
- Khu vực bị ảnh hưởng.
- Context của người dùng.

Không sử dụng một loading pattern duy nhất cho mọi trường hợp.

## NFR-03. Layout Stability

Dữ liệu bất đồng bộ không nên làm giao diện thay đổi vị trí bất ngờ một cách không cần thiết.

Khi thiết kế loading và rendering cần xem xét:

- Kích thước nội dung.
- Vùng dữ liệu động.
- CTA quan trọng.
- Scroll position.
- Content replacement.

Không áp dụng skeleton hoặc placeholder nếu chúng không cải thiện trải nghiệm.

## NFR-04. Loading State

Loading state phải đủ cụ thể để UI phản ánh đúng operation đang xảy ra.

Không nên để một state tổng quát vô tình khóa hoặc thay đổi những vùng giao diện không liên quan.

Cách quản lý loading phụ thuộc architecture hiện tại.

## NFR-05. Empty State

Không phải mọi trường hợp không có item đều có cùng ý nghĩa.

Agent cần xác định nguyên nhân thực tế, ví dụ:

- Chưa có dữ liệu.
- Query không có kết quả.
- Filter loại bỏ toàn bộ kết quả.
- Workflow đã hoàn thành.
- Người dùng không có quyền thấy dữ liệu.

UI phải truyền đạt đúng ý nghĩa nghiệp vụ.

## NFR-06. Error Handling

Thông báo lỗi cho người dùng phải:

- Dễ hiểu.
- Có liên quan tới action vừa thực hiện.
- Không tiết lộ thông tin kỹ thuật không cần thiết.
- Có hướng xử lý tiếp theo khi phù hợp.

Technical diagnostics nên được xử lý riêng.

## NFR-07. User Feedback

Feedback phải xuất hiện ở mức context phù hợp.

Có thể là:

- Field-level.
- Component-level.
- Section-level.
- Page-level.
- Application-level.

Không mặc định sử dụng toast cho tất cả thông báo.

### Validation timing

Feedback gần control không có nghĩa là feedback phải xuất hiện ngay khi control vừa được mở.

Đối với picker, selector, modal hoặc bottom sheet bắt buộc:

```text
Open → neutral/in-progress
Select valid value → valid
Dismiss without a required value → corrective feedback
Submit intent with missing value → corrective feedback
```

Opening a control is not evidence of invalid input. Agent must distinguish interaction start, interaction completion, cancellation and submission intent. Do not mutate the underlying screen into an error state before the overlay used to complete that input is visible.

## NFR-08. Status Semantics

Presentation của status phải bắt nguồn từ business meaning.

Không để màu sắc hoặc tên component trở thành định nghĩa của business state.

Khi chuẩn hóa status cần hiểu trước:

- Ý nghĩa nghiệp vụ.
- Mức độ quan trọng.
- Action liên quan.
- Context hiển thị.

Sau đó mới quyết định cách thể hiện.

## NFR-09. UI Consistency

Các pattern có cùng mục đích nên có cách hoạt động và presentation nhất quán.

Tuy nhiên không ép các trường hợp khác nhau về nghiệp vụ vào cùng một component chỉ để đạt reuse.

Reuse phải dựa trên semantic similarity, không chỉ visual similarity.

## NFR-10. Overlay & Temporary Surfaces

Các UI như dialog, modal, sheet, popover hoặc full-screen flow phải được lựa chọn dựa trên context của task.

Cần cân nhắc:

- Độ dài workflow.
- Mức độ gián đoạn.
- Context cần giữ lại.
- Platform.
- Accessibility.
- Navigation behaviour.

Không mặc định mọi interaction phụ đều sử dụng modal.

## NFR-11. Accessibility

Giao diện cần hỗ trợ khả năng sử dụng cho nhiều nhóm người dùng.

Cần xem xét phù hợp với platform:

- Readability.
- Contrast.
- Focus.
- Keyboard interaction.
- Touch interaction.
- Screen reader semantics.
- Dynamic content.

Không dựa duy nhất vào màu sắc để truyền đạt thông tin quan trọng.

## NFR-12. Responsive & Adaptive Behaviour

UI cần thích ứng với environment mà dự án hỗ trợ.

Không giả định một screen size, device hoặc orientation duy nhất nếu sản phẩm không có constraint đó.

Implementation phải dựa trên target platform thực tế.

## NFR-13. Typography

Typography phải giữ hierarchy rõ ràng và nhất quán với design system hiện tại.

Không tạo variant mới nếu design system hiện tại đã có semantic style phù hợp.

Không ép một typography scale mới nếu dự án đã có hệ thống riêng.

## NFR-14. Spacing & Layout

Spacing cần có tính hệ thống.

Agent phải ưu tiên token hoặc convention hiện có.

Không đưa giá trị spacing mới vào chỉ để sửa riêng một màn hình nếu vấn đề thực tế nằm ở shared layout pattern.

## NFR-15. Visual Hierarchy

Visual hierarchy phải phản ánh tầm quan trọng của thông tin và action.

Người dùng cần dễ dàng nhận biết:

- Nội dung chính.
- Nội dung hỗ trợ.
- Action chính.
- Action phụ.
- Trạng thái quan trọng.

Không tăng emphasis cho mọi thành phần cùng lúc.

## NFR-16. Information Density

Chỉ nên hiển thị thông tin giúp người dùng:

- Hiểu context.
- Đưa ra quyết định.
- Thực hiện action.
- Xác nhận kết quả.

Không hiển thị field chỉ vì backend trả về field đó.

Mức độ information density phải phù hợp với task và platform.

## NFR-17. Security

Security phải được xem xét xuyên suốt hệ thống.

Bao gồm khi phù hợp:

- Authentication.
- Authorization.
- Input handling.
- Secrets.
- Sensitive data.
- File handling.
- Transport.
- Storage.
- Logging.

Không coi frontend là security boundary.

## NFR-18. Data Integrity

Dữ liệu phải duy trì tính đúng đắn và nhất quán.

Các constraint nên được đặt ở lớp có khả năng bảo vệ dữ liệu đáng tin cậy nhất.

Không duplicate cùng một business rule ở nhiều nơi nếu có thể có một authoritative source.

## NFR-19. Concurrency

Nếu nhiều action có khả năng cùng thay đổi một resource, cần đánh giá concurrency.

Không thêm cơ chế concurrency phức tạp nếu hệ thống không có nhu cầu thực tế.

Ngược lại, không bỏ qua race condition chỉ vì UI thường chỉ có một người thao tác.

## NFR-20. API Consistency

API cùng domain nên có convention nhất quán.

Tuy nhiên không thay đổi contract hiện tại chỉ để ép tất cả endpoint vào một format mới nếu lợi ích không đủ lớn hoặc gây breaking change.

## NFR-21. Network Resilience

Client cần xử lý phù hợp khi network không ổn định.

Behaviour phụ thuộc vào:

- Loại request.
- Khả năng retry.
- Idempotency.
- Mức độ quan trọng.
- Platform.

Không retry mutation một cách mù quáng.

## NFR-22. Caching

Caching chỉ nên được thêm khi có lý do rõ ràng.

Trước khi cache cần hiểu:

- Source of truth.
- Freshness requirement.
- Invalidation.
- Mutation behaviour.
- User context.

Không cache chỉ vì muốn giảm request.

## NFR-23. Observability

Hệ thống cần cung cấp đủ thông tin để xác định nguyên nhân lỗi khi cần.

User-facing feedback và technical diagnostics là hai concern khác nhau.

Diagnostics phải hỗ trợ developer nhưng không được làm xấu trải nghiệm hoặc làm lộ thông tin nhạy cảm.

## NFR-24. Logging

Logging phải có mục đích rõ ràng.

Log cần hỗ trợ debugging và observability nhưng không:

- Ghi secret.
- Ghi credential.
- Ghi dữ liệu nhạy cảm không cần thiết.
- Tạo noise quá mức.

## NFR-25. Maintainability

Implementation phải ưu tiên khả năng hiểu và thay đổi về sau.

Agent cần chú ý:

- Duplicate logic.
- Hidden dependency.
- Mixed responsibility.
- Unnecessary abstraction.
- Tight coupling.
- Inconsistent naming.

Không refactor rộng chỉ vì có thể làm code "đẹp hơn".

## NFR-26. Separation of Concerns

Business logic, presentation, data access và infrastructure nên có ranh giới hợp lý theo architecture hiện tại.

Không áp đặt một architectural pattern mới chỉ vì tài liệu này đề cập tới separation of concerns.

Mức độ phân tách phải phù hợp với quy mô dự án.

## NFR-27. Scalability

Thiết kế cần tránh những quyết định rõ ràng sẽ trở thành bottleneck khi dữ liệu hoặc số người dùng tăng.

Tuy nhiên không over-engineer dựa trên giả định tăng trưởng chưa có cơ sở.

## NFR-28. Testability

Các rule quan trọng phải có khả năng kiểm chứng.

Mức độ test phụ thuộc vào:

- Criticality.
- Complexity.
- Regression risk.
- Architecture.
- Existing testing strategy.

Không tạo test chỉ để tăng số lượng test.

## NFR-29. Compatibility

Thay đổi phải xem xét platform, runtime, browser, device hoặc environment thực tế mà dự án hỗ trợ.

Không fix cho một environment bằng cách làm hỏng environment khác.

## NFR-30. Backward Compatibility

Trước khi thay đổi contract đang được sử dụng cần xác định dependency và impact.

Đặc biệt lưu ý:

- Public interfaces.
- API.
- Database schema.
- Shared models.
- State definitions.
- Persisted data.

Breaking change phải có lý do rõ ràng.

## NFR-31. File & Media Handling

Nếu feature liên quan tới file hoặc media, cần đánh giá:

- Input validity.
- Size.
- Type.
- Storage.
- Permission.
- Failure.
- Security.
- Performance.

Cách xử lý cụ thể phụ thuộc infrastructure hiện tại.

## NFR-32. Date & Time

Date/time phải có semantic rõ ràng.

Cần phân biệt khi phù hợp:

- Date.
- Time.
- Date-time.
- Timezone.
- Local representation.
- Persisted representation.

Không tự đưa ra timezone strategy mới nếu dự án đã có convention.

## NFR-33. Internationalization

Nếu sản phẩm có yêu cầu đa ngôn ngữ hoặc đa locale, nội dung và format cần được thiết kế phù hợp.

Nếu sản phẩm không có requirement này, không cần tự thêm abstraction i18n chỉ để phòng xa.

## NFR-34. Auditability

Đối với operation quan trọng, cần đánh giá liệu hệ thống có cần truy vết:

- Actor.
- Action.
- Resource.
- Time.
- Relevant change.

Không phải mọi interaction đều cần audit log.

# III. RULES FOR AI AGENT

## 1. Context First

Trước khi implementation, Agent phải ưu tiên hiểu context hiện có.

Nguồn cần tham khảo khi tồn tại:

- Product documentation.
- Requirements.
- Domain documentation.
- Architecture documentation.
- Design rules.
- Existing code.
- Existing tests.
- Existing conventions.

Code hiện tại không tự động được coi là đúng tuyệt đối.

Documentation cũng không tự động được coi là đúng tuyệt đối nếu đã lệch implementation.

Khi có conflict, cần xác định source đáng tin cậy nhất dựa trên context.

## 2. Do Not Invent Requirements

Không tự tạo:

- Business rule.
- Role.
- Permission.
- State.
- Workflow.
- Validation.
- Feature.
- Domain entity.

chỉ để solution trở nên "đầy đủ hơn".

Nếu một yếu tố không tồn tại trong requirement và cũng không cần thiết về mặt kỹ thuật, không thêm nó.

## 3. Avoid Hard-Coded Interpretation

Các ví dụ trong documentation không được hiểu thành specification bắt buộc trừ khi được đánh dấu rõ ràng.

Không suy luận rằng:

- Một danh sách ví dụ là exhaustive list.
- Một tên state là state bắt buộc.
- Một component được nhắc tới phải tồn tại.
- Một architecture pattern phải được áp dụng.
- Một kỹ thuật optimization phải được implement.

Luôn đối chiếu với project context.

## 4. Root Cause Before Patch

Khi phát hiện vấn đề:

```text
Symptom
→ Context
→ Root Cause
→ Scope
→ Appropriate Fix
→ Regression Check
```

Nếu root cause nằm ở shared layer, ưu tiên sửa ở shared layer.

Nếu vấn đề thực sự chỉ local, không mở rộng refactor không cần thiết.

## 5. Preserve Existing Intent

Không thay đổi:

- Business meaning.
- Product intent.
- Workflow.
- Architecture.
- User behaviour.

chỉ vì có một implementation khác "đẹp hơn".

Thay đổi phải giải quyết vấn đề cụ thể.

## 6. Prefer Existing Patterns

Nếu codebase đã có pattern phù hợp và ổn định, ưu tiên sử dụng pattern đó.

Không tạo parallel architecture hoặc parallel component system mà không có lý do rõ ràng.

## 7. Avoid Over-Engineering

Không thêm abstraction, dependency, layer hoặc infrastructure khi vấn đề có thể được giải quyết rõ ràng bằng architecture hiện tại.

Mọi abstraction phải giải quyết một vấn đề thực tế.

## 8. Scope Control

Chỉ thay đổi những khu vực cần thiết để giải quyết root cause.

Có thể sửa shared code nếu root cause thực sự nằm ở shared code.

Không dùng một issue nhỏ làm lý do refactor toàn hệ thống.

## 9. Validate Impact

Sau thay đổi cần đánh giá:

- Functional behaviour.
- Business rules.
- Existing flows.
- Data.
- UI states.
- API compatibility.
- Performance.
- Security.
- Regression risk.

Validation phải tương xứng với phạm vi thay đổi.

# IV. REQUIREMENT ANALYSIS TEMPLATE

Template này dùng làm hướng dẫn phân tích, không phải schema bắt buộc.

```text
Feature / Problem:

Context:
User / Actor:
Goal:

Existing Behaviour:
Expected Behaviour:

Relevant Business Rules:
Relevant Data:
Relevant States:
Relevant Permissions:

Main Flow:
Alternative / Failure Cases:

UI / Interaction Considerations:
Data / API Considerations:
Performance Considerations:
Security Considerations:
Accessibility Considerations:

Dependencies:
Potential Impact:
Acceptance Criteria:
```

Chỉ sử dụng các mục thực sự liên quan tới feature.

Không cần điền một mục nếu nó không có ý nghĩa trong context.

# V. DEFINITION OF DONE PRINCIPLE

Một thay đổi được xem là hoàn thành khi mức độ validation phù hợp với scope của thay đổi.

Cần xem xét khi liên quan:

- Functional behaviour đúng.
- Business rule không bị phá vỡ.
- Validation phù hợp.
- Permission phù hợp.
- Error handling phù hợp.
- Loading/feedback phù hợp.
- Existing flow không regression.
- Performance không suy giảm bất hợp lý.
- Security không bị suy giảm.
- Accessibility không bị suy giảm.
- Contract không bị phá vỡ ngoài ý muốn.
- Documentation được cập nhật nếu thay đổi làm documentation hiện tại không còn đúng.

Không bắt buộc mọi thay đổi phải tác động tới tất cả các mục trên.

# VI. DECISION PRINCIPLES

Các nguyên tắc dưới đây là định hướng, không phải luật tuyệt đối:

```text
Understand Domain Before Changing UI
Understand Context Before Applying Patterns
Business Meaning Before Visual Representation
Root Cause Before Local Workaround
Existing Convention Before New Abstraction
Correctness Before Optimization
Measure Before Performance Refactor
Shared Solution When the Problem Is Truly Shared
Local Solution When the Problem Is Truly Local
Explicit Behaviour Over Hidden Assumptions
Simplicity Over Unnecessary Complexity
Evidence Over Guessing
```

## Rule Calibration and Contextual Exceptions

Trước khi áp dụng một rule, Agent phải phân loại rule đó:

| Loại | Ví dụ | Cách áp dụng |
|---|---|---|
| Invariant | Domain truth, authorization, security, data integrity, accessibility, chống mất dữ liệu | Không được hạ thấp chỉ để đạt visual preference hoặc giảm code. |
| Contextual default | Một primary action, flat surface, progressive disclosure, picker, list virtualization, density | Áp dụng khi assumptions của rule khớp user task, data scale và device context. Có thể thay đổi khi evidence cho thấy default không phù hợp. |
| Example/evidence | Screenshot, implementation cũ, prior finding, sample flow | Dùng để hiểu vấn đề; không tự động trở thành specification. |

Một contextual exception hợp lệ phải:

1. chỉ rõ default nào không phù hợp và vì sao;
2. giữ nguyên invariant hoặc product intent mà default đó nhằm bảo vệ;
3. dùng deviation nhỏ nhất trong phạm vi cần thiết;
4. có verification phù hợp với rủi ro;
5. không tự động biến thành convention toàn dự án.

Known-failure rule chỉ áp dụng khi cùng root cause hoặc cùng failure mechanism tồn tại. Giống nhau về hình ảnh hoặc từ khóa không đủ để ép cùng solution.

## Evidence Retention

Evidence tạm thời do người dùng cung cấp qua chat, thư mục Downloads, attachment name hoặc đường dẫn ngoài repository không phải durable artifact.

Documentation lâu dài không lưu filename/path của evidence tạm thời. Documentation chỉ lưu:

- state hoặc interaction đã được kiểm tra;
- kết quả PASS/FAIL và giới hạn của kết quả;
- root cause và quyết định;
- device/platform context cần thiết;
- stable repository path nếu artifact đã được chủ động copy vào repository để lưu giữ.

Nếu artifact không được lưu bền vững, dùng mô tả semantic như “physical iPhone review confirmed compact tree row and filtered-empty state” thay vì tên file. Việc người dùng xóa evidence tạm thời sau review không được làm documentation mất nghĩa.

# VII. DESIGN PRINCIPLES VS DESIGN PATTERNS

## 1. Design Principles

Design Principles là tiêu chí định hướng để đánh giá chất lượng và tính hợp lý của quyết định UI/UX. Chúng trả lời:

- Vì sao thiết kế nên như vậy?
- Điều gì cần được ưu tiên trong context hiện tại?
- Quyết định có phục vụ đúng user goal và business meaning không?

Design Principles không tự quy định component, màu, spacing, radius hoặc layout cụ thể.

### Core principles

- Clarity over decoration.
- Business meaning before visual styling.
- Visual hierarchy reflects task priority.
- Primary actions are distinguishable from secondary actions.
- Information density matches the user task.
- Redundant information is reduced.
- Consistency does not force unlike cases into the same UI.
- Semantic meaning precedes visual treatment.
- Feedback appears near the action or state that caused it.
- Important states remain understandable without color alone.
- Readability and accessibility are preserved.
- Existing project conventions are preferred when they fit.
- Root causes are solved instead of screenshot-specific symptoms.
- Unnecessary visual and interaction complexity are avoided.
- Design follows the end-to-end workflow, not an isolated screen.
- Progressive disclosure is used when showing everything would overload the task.
- Destructive, exceptional, corrective and normal actions are not visually indistinguishable.

These are evaluative principles. A principle may support several valid patterns.

## 2. Design Patterns

Design Patterns are reusable interaction approaches that may realize one or more principles in a specific context. Examples include:

- search field, filter, tabs, segmented control;
- radio group, checkbox, inline validation;
- confirmation dialog, bottom sheet, modal, toast, banner;
- status badge, empty state, skeleton;
- pagination, infinite loading;
- sticky CTA, contextual action;
- list row, card, accordion, stepper;
- progressive disclosure, master-detail, before/after comparison.

This list is a vocabulary, not a required component inventory. Mentioning a pattern never means it must exist in the project.

## 3. Decision order

Use this sequence:

```text
Problem
→ User Goal
→ Business Context
→ Design Principle
→ Spatial Composition
→ Suitable Pattern
→ Existing Design System
→ Existing Component / Token
→ Implementation
```

Do not use:

```text
Screenshot
→ Copy Pattern
→ Hard-code UI
```

A screenshot may reveal a symptom, but cannot independently choose the pattern.

## 4. Principle before pattern

Before proposing a pattern, Agent must name the affected principle and the user/business problem.

Example:

```text
Issue: Primary action is difficult to identify.
Principle: Visual hierarchy and action priority.
Candidate patterns: stronger CTA treatment, action grouping,
reduced secondary emphasis, or sticky action.
```

This does not imply that sticky action is required. The final pattern depends on workflow focus, navigation ownership, keyboard/safe-area behavior, action frequency and risk.

## 5. Pattern selection criteria

Choose a pattern only after checking:

- user goal and workflow stage;
- business semantics;
- frequency and reversibility;
- consequence and risk;
- information amount and production cardinality;
- platform conventions;
- existing project components and patterns;
- accessibility and responsive behavior;
- failure, loading and interrupted-flow states.

Reuse an existing pattern when its semantics fit. Do not create or reuse a pattern merely because another screenshot has similar styling.

## 6. Pattern is not style

Pattern describes how an interaction behaves. Style describes how it is presented.

```text
Radio group = interaction pattern.
Border, fill, icon, spacing and radius = visual styling.
```

Do not change interaction semantics merely to achieve a different visual style. Likewise, visually similar controls must not be treated as the same pattern when their behavior differs.

## 7. Semantic patterns

Visual treatment starts from domain meaning. Useful semantic categories may include:

- normal;
- informational;
- success;
- attention;
- corrective;
- warning;
- exceptional;
- destructive.

These categories are guidance, not mandatory business states. Actual state names and transitions come from the domain.

## 8. Screenshot rule

Screenshots are visual evidence used to detect:

- hierarchy problems;
- density problems;
- inconsistency;
- interaction ambiguity;
- clipping, overlap, contrast and reflow symptoms.

Before changing UI, combine screenshot evidence with:

```text
Project Rules
+ Existing Components
+ Domain
+ User Flow
+ Implementation
```

Screenshots do not independently authorize a new pattern, visual system or hard-coded value.

## 9. Final decision rule

```text
Business Rules = source of meaning
Design Principles = evaluation criteria
Design Patterns = context-selected solution tools
Design Tokens = representation of visual decisions
Components = concrete implementation
```

Do not reverse this order. A component or token must not define business meaning, and a listed pattern must not become a requirement without a real problem and context.

# VIII. SPATIAL COMPOSITION

Spatial Composition defines how information, controls, actions, and visual elements occupy and relate to space within an interface. Its purpose is to make layout structure follow the actual information hierarchy and user task instead of forcing content into oversized, overly sparse, overly dense, fragmented, or visually unbalanced containers.

Spatial Composition is a context-sensitive evaluation layer, not a fixed layout specification. Before applying it, the Agent must inspect the product context, design system, existing components, content, platform, responsive constraints, and interaction requirements.

## 1. Core principle

Make the spatial structure fit the information and the user task.

Whitespace, large cards, spacious layouts, compact layouts, or high density are not inherently good or bad. When a screen feels sparse, dense, weak, fragmented, or unbalanced, first inspect:

- content-to-container ratio;
- information density and compression;
- semantic grouping and proximity;
- intrinsic sizing;
- vertical and horizontal rhythm;
- alignment and reading paths;
- visual anchors and focal emphasis;
- container economy and nesting;
- section separation;
- content priority;
- responsive behavior.

Do not solve spatial problems by adding decoration, larger typography, more cards, gradients, shadows, colors, or artificial content unless they serve a clear semantic or functional purpose.

## 2. Content-driven and intrinsic sizing

Container dimensions should follow actual content and interaction needs. Prefer intrinsic, content-driven sizing unless a fixed or minimum dimension is required by interaction, media presentation, accessibility, platform behavior, or a product contract.

Avoid:

- large fixed surfaces for small amounts of information;
- viewport-filling sections without a task requirement;
- equal-height cards when content differs materially;
- minimum heights used only to occupy available space;
- fixed heights that fail under Vietnamese wrapping or font scaling.

## 3. Container economy and nesting

A card, panel, surface, or wrapper should normally contribute at least one of:

- semantic grouping;
- hierarchy;
- interaction boundary;
- state distinction;
- visual separation;
- navigation context.

If removing a container preserves clarity, meaning, state understanding, and interaction safety, prefer removing it. Avoid structures such as:

```text
Page → Card → Section Card → Item Card → Badge
```

Each layer must justify its role. Do not create a new card merely because hierarchy is weak; first inspect grouping, proximity, typography, spacing, alignment, and content structure.

## 4. Content-to-container ratio and empty-space validation

Evaluate the amount of meaningful content against the space allocated to it. Large surfaces with little information require a functional reason.

When a region appears excessively empty, do not immediately fill it. First investigate:

- unnecessary fixed or minimum dimensions;
- content split across too many layers;
- excessive spacing;
- weak grouping or alignment;
- missing visual anchor;
- container nesting;
- inappropriate density;
- responsive behavior.

Do not add fake content merely to make a surface appear fuller. Preserve empty space when it intentionally supports focus, readability, touch operation, media capture, or another real task.

## 5. Proximity and grouping

Semantically related elements should generally be closer than unrelated elements. Use proximity before borders, cards, or decorative surfaces to communicate relationships.

Group information according to domain and task relationships, not merely visual similarity. A group should clarify:

- what belongs to one object or state;
- what can be acted on together;
- which label, value, metadata, status, and action form one understandable unit.

Do not group unrelated information simply to fill a container.

## 6. Vertical and horizontal rhythm

Spacing communicates semantic distance. Use this default relationship unless context requires otherwise:

```text
within item < within group < between groups < between major sections
```

Do not use similarly large spacing between every element.

Maintain intentional horizontal relationships between page gutters, icons, labels, values, metadata, actions, and boundaries. Elements at the same structural level should normally follow a consistent alignment rhythm. Alignment should support scanning, not visual symmetry for its own sake.

## 7. Visual anchors, focal emphasis, and balance

Every important region should provide a clear starting point such as a heading, status, key value, primary object, media, meaningful indicator, or primary action.

Focal emphasis must follow user priority and business meaning. Do not make every element equally prominent or create emphasis solely through decoration.

Balance is the intentional distribution of visual weight and does not require symmetry. Investigate large empty areas beside dense areas, oversized decorative surfaces, one-sided visual weight, or weak focal regions surrounded by excessive space.

## 8. Information density and compression

Density must match task frequency, information volume, importance, platform, interaction needs, and accessibility.

Avoid both:

- compression that harms comprehension, touch safety, or readability;
- excessive spaciousness that increases scrolling and weakens relationships.

Related information may be presented compactly when clarity remains. Do not give every small datum its own card, large row, section, or excessive padding.

## 9. Section separation and progressive disclosure

Major sections must be distinguishable using the minimum treatment necessary, chosen from spacing, typography, dividers, background changes, or surfaces. A new card is not the default section separator.

Secondary or advanced information should not compete with the current task. Use progressive disclosure to reduce cognitive load, but never hide information required for the current decision.

## 10. Scanability, alignment, and content priority

Users should understand the important state through quick scanning. Support this with hierarchy, alignment, proximity, concise labels, predictable placement, consistent patterns, and appropriate density.

Visual space and emphasis must reflect information priority. Primary information and actions receive stronger placement than secondary metadata. Do not allocate more space to secondary information merely because it is easier to present visually.

## 11. Responsive space allocation

Spatial composition must adapt to:

- screen dimensions and orientation;
- safe areas and global navigation;
- keyboard and overlays;
- dynamic content and production cardinality;
- long Vietnamese copy and font scaling;
- platform conventions.

Do not assume spacing or dimensions that work only on one device. A layout must be reviewed on the smallest supported viewport and with representative content expansion.

## 12. Agent evaluation rule

A screenshot may reveal a spatial symptom, but it is not a layout specification. Use this sequence:

```text
Screenshot
→ Observe Symptom
→ Understand Business Context
→ Identify Design Principle
→ Evaluate Spatial Composition
→ Select Appropriate Design Pattern
→ Inspect Existing Design System / Components / Tokens
→ Determine Root Cause
→ Implement at the Correct Scope
```

Do not:

- copy screenshot dimensions;
- hard-code values based only on an image;
- resize elements based only on personal preference;
- add decoration or fake content to fill space;
- create cards to compensate for weak hierarchy;
- globally compact the UI because one screen is sparse;
- globally increase spacing because one screen is crowded.

Classify the root cause before editing:

- local layout;
- shared component;
- design token;
- design-system rule;
- content structure;
- responsive behavior;
- interaction pattern.

Fix the lowest appropriate root cause. Local evidence must not create a global convention unless the same causal mechanism is reusable.

## 13. Relationship to other design layers

```text
Business Rules = meaning and allowed behavior
Design Principles = why a decision is appropriate
Spatial Composition = how information occupies and relates in space
Design Patterns = interaction and structural solution tools
Design System / Tokens = reusable visual decisions
Components = implementation
```

The required reasoning order is:

```text
Problem
→ User Goal
→ Business Context
→ Design Principle
→ Spatial Composition
→ Design Pattern
→ Existing Design System
→ Component / Token
→ Implementation
```

Never reverse this process by allowing an existing component, screenshot, token, color, or layout pattern to define business meaning.

# IX. FINAL RULE

Tài liệu này không được dùng để ép dự án tuân theo một implementation cụ thể.

AI Agent phải sử dụng nó như một **bộ tiêu chí để reasoning và review**.

Mọi quyết định implementation cuối cùng phải dựa trên:

```text
Project Context
+ Product Intent
+ Domain Rules
+ Existing Architecture
+ Existing Conventions
+ Actual Problem
+ Evidence
```

Nếu một rule trong tài liệu không phù hợp với context thực tế của dự án, Agent phải ưu tiên context của dự án và giải thích lý do thay vì áp dụng rule một cách máy móc.
