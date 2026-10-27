import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { colors, controlSize, layout, radius, typography } from '@novyx/ui';

describe('NOVYX mobile UI foundation contract', () => {
  it('exposes semantic status triplets instead of requiring screen-level palette mapping', () => {
    expect(colors).toMatchObject({
      successSurface: expect.any(String),
      successBorder: expect.any(String),
      successText: expect.any(String),
      infoSurface: expect.any(String),
      infoBorder: expect.any(String),
      infoText: expect.any(String),
      warningSurface: expect.any(String),
      warningBorder: expect.any(String),
      warningText: expect.any(String),
      criticalSurface: expect.any(String),
      criticalBorder: expect.any(String),
      criticalText: expect.any(String),
      neutralSurface: expect.any(String),
      neutralBorder: expect.any(String),
      neutralText: expect.any(String),
      iconSurface: expect.any(String),
      iconBorder: expect.any(String),
    });
  });

  it('keeps compact mobile dimensions and restrained typography locked', () => {
    expect(controlSize.minimumTouchTarget).toBeGreaterThanOrEqual(44);
    expect(controlSize.field).toBeGreaterThanOrEqual(52);
    expect(layout.screenPadding).toBe(16);
    expect(layout.bottomNavClearance).toBeGreaterThanOrEqual(96);
    expect(radius.control).toBeLessThan(radius.card);
    expect(Object.values(typography).every((role) => Number(role.fontWeight) <= 600)).toBe(true);
  });

  it('centers single-line field content without vertical padding drift', () => {
    const primitives = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/AppPrimitives.tsx'),
      'utf8',
    );

    expect(primitives).toContain('height: controlSize.field');
    expect(primitives).toContain('fontSize: typography.bodyStrong.fontSize');
    expect(primitives).toContain('fontWeight: typography.bodyStrong.fontWeight');
    expect(primitives).toContain('paddingVertical: 0');
    expect(primitives).toContain("textAlignVertical: 'center'");
    expect(primitives).toContain('props.multiline && styles.multilineInput');
    expect(primitives).toContain('paddingVertical: spacing.md');
    expect(primitives).toContain("textAlignVertical: 'top'");
  });

  it('keeps top-level Create Task on one navigation and information hierarchy', () => {
    const createTask = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerCreateTask.tsx'),
      'utf8',
    );

    expect(createTask).toContain('<ScreenHeader title="Tạo việc"');
    expect(createTask).not.toContain('Thông tin chính');
    expect(createTask).not.toContain("onBack={() => setActiveStep('HOME')}");
    expect(createTask).toContain(
      'const selectedStaffIdentity = selectedStaff ? getStaffIdentity(selectedStaff) : undefined;',
    );
    expect(createTask).toContain('value={selectedStaffIdentity?.title}');
    expect(createTask).not.toContain("if (!staff) return { title: '', subtitle: '' };");
    expect(createTask).toContain('...getStaffIdentity(staff)');
    expect(createTask).toContain('!/^staff$/i.test(displayName)');
    expect(createTask).toContain('getTaskTypeSummary(selectedTaskType)');
    expect(createTask).not.toContain("taskType.description?.trim() || 'Yêu cầu ảnh trước và sau'");
    expect(createTask).toContain('accessibilityRole="button"');
    expect(createTask).toContain("name={selected ? 'checkmark-circle' : 'chevron-forward'}");
    expect(createTask).not.toContain("name={selected ? 'checkmark-circle' : 'ellipse-outline'}");
    expect(createTask).not.toContain('<Text style={styles.changeText}>');
    expect(createTask).toContain('error && styles.selectionFieldInvalid');
    expect(createTask).not.toContain('assignmentGroupInvalid');
    expect(createTask).not.toContain('assignmentInvalid');
    expect(createTask).toContain('groupDivider: { height: 1, backgroundColor: colors.hairlineBorder }');
    expect(createTask).not.toContain('marginLeft: 68');
    expect(createTask).toContain('selectionError: { ...typography.metadata, color: colors.warningText');
    expect(createTask).toContain("if (selector === 'staff' && !assignedStaffId) setStaffTouched(true);");
    expect(createTask).toContain('onClose={closeSelector}');
    expect(createTask).toContain('if (!deadline) setDeadlineTouched(true);');
    expect(createTask).not.toContain("setStaffTouched(true);\n                setSelector('staff');");
    expect(createTask).not.toContain('setDeadlineTouched(true);\n              setDeadlinePickerVisible(true);');
    expect(createTask).toContain("error={deadlineTouched && !deadline ? 'Chọn ngày và giờ hoàn thành.' : undefined}");
    expect(createTask).toContain('const TIME_PRESETS = TASK_DEADLINE_TIMES;');
  });

  it('keeps shared icon tiles distinct from warm and white content surfaces', () => {
    const primitives = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/AppPrimitives.tsx'),
      'utf8',
    );
    const permission = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/DevicePermissionState.tsx'),
      'utf8',
    );

    expect(primitives).toContain('backgroundColor: colors.iconSurface');
    expect(primitives).toContain('borderColor: colors.iconBorder');
    expect(permission).toContain('backgroundColor: colors.iconSurface');
    expect(permission).toContain('borderColor: colors.iconBorder');
  });

  it('keeps high-frequency operational copy concise instead of repeating visible state', () => {
    const review = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerReview.tsx'),
      'utf8',
    );
    const taskSurfaces = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/TaskSurfaces.tsx'),
      'utf8',
    );

    expect(review).toContain('title={gaps.length ? `Thiếu ${gaps.length} hạng mục` : `Đủ ${proofCount}/5 hạng mục`}');
    expect(review).not.toContain('Bằng chứng đủ điều kiện duyệt');
    expect(review).not.toContain('Hoàn tất công việc khi toàn bộ bằng chứng hợp lệ.');
    expect(taskSurfaces).toContain('Ảnh trước và sau');
    expect(taskSurfaces).not.toContain('Đã lưu · chưa có bản xem trước');
  });

  it('keeps Manager core focused on operational decisions instead of legacy hero content', () => {
    const dashboard = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerDashboard.tsx'),
      'utf8',
    );
    const trees = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerTrees.tsx'),
      'utf8',
    );

    expect(dashboard).toContain('Ưu tiên vận hành cần xử lý');
    expect(dashboard).toContain("kind: 'blocked' as const");
    expect(dashboard).toContain("kind: 'overdue' as const");
    expect(dashboard).toContain('label="Cây chú ý"');
    expect(dashboard).toContain('heroCard');
    expect(dashboard).toContain('metricsBar');
    expect(dashboard).not.toContain('metricsGrid');
    expect(dashboard).not.toContain('Bảng điều khiển cây xanh');
    expect(dashboard).not.toContain('Mã QR cây');
    expect(dashboard).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(trees).toContain('title="Hồ sơ cây"');
    expect(trees).toContain('accessibilityState={{ expanded }}');
    expect(trees).toContain('await props.loadCareHistoryByTree(treeId)');
    expect(trees).not.toContain('TreeAssignmentCard');
    expect(trees).not.toContain('TreeIdentityVisual');
    expect(trees).not.toContain('Bản đồ danh mục cây');
    expect(trees).toContain('purpose="manager-tree-gps"');
    expect(trees).toContain('Location.reverseGeocodeAsync');
    expect(trees).toContain('Độ chính xác ±');
    expect(trees).toContain('accessibilityRole="radio"');
    expect(trees).not.toContain('requestForegroundPermissionsAsync');
    expect(trees).not.toContain("healthStatus: 'Khỏe mạnh'");
    expect(trees).not.toContain('Date.now()');
    expect(trees).toContain('<TreeQrModal');
    expect(trees).toContain('Mở mã QR');
    expect(trees).toContain('Tên hiển thị (không bắt buộc)');
    expect(trees).toContain('Tuổi cây (không bắt buộc)');
    expect(trees).not.toContain('Nhập tên hiển thị.');
  });

  it('exports the rendered tree QR as a shareable PNG on native devices', () => {
    const qrModal = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/TreeQrModal.tsx'),
      'utf8',
    );

    expect(qrModal).toContain('qrRef.current.toDataURL(resolve)');
    expect(qrModal).not.toContain('toDataURL(resolve, { width: 1024, height: 1024 })');
    expect(qrModal).toContain('-qr.png`');
    expect(qrModal).toContain('FileSystem.EncodingType.Base64');
    expect(qrModal).not.toContain('-qr.svg`');
  });

  it('refreshes contextual permissions when the app returns from system settings', () => {
    const permissions = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/hooks/useDevicePermissions.ts'),
      'utf8',
    );

    expect(permissions).toContain("AppState.addEventListener('change'");
    expect(permissions).toContain("state === 'active'");
    expect(permissions).toContain("current?.kind === 'location'");
    expect(permissions).toContain('classifyPermissionResponse(response)');
  });

  it('keeps R5 Staff overview focused, virtualized, and free of legacy presentation owners', () => {
    const home = fs.readFileSync(path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffHome.tsx'), 'utf8');
    const work = fs.readFileSync(path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffWork.tsx'), 'utf8');
    const trees = fs.readFileSync(path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffTrees.tsx'), 'utf8');
    const area = fs.readFileSync(path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffArea.tsx'), 'utf8');
    const mobileApp = fs.readFileSync(path.resolve(process.cwd(), 'apps/mobile/src/screens/MobileApp.tsx'), 'utf8');
    const proofFlow = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffProofFlow.tsx'),
      'utf8',
    );

    expect(home).toContain('Việc cần làm tiếp theo');
    expect(home).toContain('{workflow.activeActionText}');
    expect(home).not.toContain('NV: HÙNG');
    expect(home).not.toContain('avatarPhoto');
    expect(home).not.toContain('<Card');
    expect(work).toContain('<FlatList');
    expect(work).toContain('task.rejectReason');
    expect(work).not.toContain('TaskCard');
    expect(work).not.toContain('workHeroCard');
    expect(trees).toContain('<FlatList');
    expect(trees).toContain('const activeTask = getNextActionTask(related);');
    expect(trees).toContain('accessibilityState={{ expanded }}');
    expect(trees).toContain('await loadCareHistoryByTree(treeId)');
    expect(trees).not.toContain('TreeAssignmentCard');
    expect(trees).not.toContain('TreeIdentityVisual');
    expect(area).toContain("task.status !== TaskStatus.COMPLETED && task.status !== 'CANCELLED'");
    expect(area).toContain("const [mapReturnStep, setMapReturnStep] = useState<StaffStep>('MY_TREES')");
    expect(proofFlow).toContain('onBack={() => props.setStep(props.mapReturnStep)}');
    expect(proofFlow).toContain("onBack={() => props.setStep(isRework ? 'DETAIL' : 'CHECKLIST')}");
    expect(proofFlow).toContain('/^(https?:|file:|content:|data:)/i.test(capturedPhoto)');
    expect(proofFlow).toContain('Ảnh cũ đã lưu trên máy chủ');
    expect(proofFlow).toContain('if (task.status === TaskStatus.REWORK_REQUIRED)');
    expect(proofFlow).not.toContain("if (task.status === 'REWORK_REQUIRED')");
    expect(proofFlow).toContain('Chưa gửi được báo cáo. Ảnh đã được giữ.');
    expect(proofFlow).toContain("props.activeTask.notes?.startsWith('Fixture ')");
    expect(proofFlow).not.toContain('Kênh gửi bằng chứng');
    expect(proofFlow).not.toContain('subtitle={props.activeTask.id}');
    expect(proofFlow).not.toContain('// Stay on current step if unsupported or error');
    expect(proofFlow).not.toContain('Ảnh thật đã được ghi nhận từ camera thiết bị.');
    const cameraView = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/DeviceCameraView.tsx'),
      'utf8',
    );
    expect(cameraView).toContain('style={StyleSheet.absoluteFill}');

    const taskSurfaces = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/TaskSurfaces.tsx'),
      'utf8',
    );
    expect(taskSurfaces).toContain('color={colors.foreground}');
    expect(taskSurfaces).toContain('Đã quét đúng cây được giao');

    expect(proofFlow).toContain('<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.screenPad, styles.mapScreen]}>');
    expect(proofFlow).not.toContain('provider={providerGoogle}');
    expect(proofFlow).toContain('<WebMapView');
    expect(proofFlow).toContain('Khoảng cách tới cây');
    expect(proofFlow).toContain('Sai số GPS');
    expect(proofFlow).toContain('setScannedTree(matchedTree);');
    expect(proofFlow).toContain('releaseCamera();');
    expect(proofFlow).toContain('Quét mã khác');
    expect(proofFlow).toContain('Đã tìm thấy ${matchedTree.name}.');
    expect(proofFlow).not.toContain("scannedTree?.qrCode ?? 'Đưa mã QR cây vào khung'");
    expect(proofFlow).not.toContain('subtitle={props.activeTask.treeId}');
    expect(proofFlow).not.toContain('<Text style={styles.qrPayloadText}>{expectedQr}</Text>');
    expect(proofFlow).not.toContain('QR vừa quét (${payload})');
    expect(proofFlow).toContain('scannedCode: scannedTree.qrCode');
    expect(proofFlow).toContain("task.qrCheck?.verified ? 'CHECKLIST' : nextStep");
    expect(mobileApp).toContain('await runtime.taskRepo.cacheTasks(result.data.tasks);');
    expect(mobileApp).toContain('await runtime.taskRepo.cacheTasks([task]);');

    expect(trees).not.toContain('<Text style={styles.factValue}>{tree.qrCode}</Text>');

    const treeSurfaces = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/TreeSurfaces.tsx'),
      'utf8',
    );
    const treeIdentity = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/TreeIdentityVisual.tsx'),
      'utf8',
    );
    expect(treeSurfaces).not.toContain('<Text style={styles.treeMetaValue}>{tree.qrCode}</Text>');
    expect(treeSurfaces).not.toContain('{tree.lat.toFixed(5)}, {tree.lng.toFixed(5)}');
    expect(treeIdentity).not.toContain('{tree.qrCode}');
    expect(treeIdentity).not.toContain('{tree.id}');
  });

  it('keeps authenticated roles localized while preserving canonical authorization internally', () => {
    const managerAccount = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerAccount.tsx'),
      'utf8',
    );
    const staffAccount = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffAccount.tsx'),
      'utf8',
    );

    const userAvatar = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/UserAvatar.tsx'),
      'utf8',
    );

    expect(managerAccount).toContain('subtitle="Quản lý vận hành"');
    expect(managerAccount).not.toContain('subtitle="Manager"');
    expect(staffAccount).toContain('subtitle="Nhân viên hiện trường"');
    expect(staffAccount).not.toContain('subtitle="Staff"');
    expect(managerAccount).toContain('<UserAvatar email={email} />');
    expect(staffAccount).toContain('<UserAvatar email={email} />');
    expect(managerAccount).not.toContain('shield-checkmark-outline');
    expect(staffAccount).not.toContain('person-outline');
    expect(userAvatar).toContain('accessibilityRole="image"');
    expect(userAvatar).toContain('getInitials(email)');
    expect(userAvatar).not.toContain('<Image');
    expect(managerAccount).toContain("alignItems: 'flex-start'");
    expect(staffAccount).toContain("alignItems: 'flex-start'");
  });

  it('keeps R4 Manager review canonical and QR lookup evidence-neutral', () => {
    const review = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerReview.tsx'),
      'utf8',
    );
    const qr = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerQrLookup.tsx'),
      'utf8',
    );

    for (const decision of ['APPROVE', 'REQUEST_REWORK', 'APPROVE_WITH_EXCEPTION', 'CANCEL']) {
      expect(review).toContain(decision);
    }
    expect(review).toContain("decision === 'APPROVE' && gaps.length > 0");
    for (const tone of ['success', 'corrective', 'exceptional', 'destructive']) {
      expect(review).toContain(`tone="${tone}"`);
      expect(review).toContain(`decisionSelected_${tone}`);
    }
    expect(review).toContain("flexWrap: 'wrap'");
    expect(review).toContain("setReason('');");
    expect(review).toContain('setTouched(false);');
    expect(review).not.toContain('<ScrollView horizontal');
    expect(qr).toContain('Duyệt báo cáo');
    expect(qr).toContain('styles.factGroup');
    expect(qr).toContain('styles.secondaryActions');

    const photoSurfaces = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/TaskSurfaces.tsx'),
      'utf8',
    );
    expect(photoSurfaces).toContain('accessibilityLabel="Xem ảnh trước xử lý"');
    expect(photoSurfaces).toContain('accessibilityLabel="Xem ảnh sau xử lý"');
    expect(photoSurfaces).toContain('resizeMode="contain"');
    expect(review).toContain('Nhập lý do để xác nhận.');
    expect(review).toContain('numberOfLines={2} style={styles.reportTitle}');
    expect(review).toContain('`Đủ ${getTaskProofCount(task)}/5`');
    expect(review).toContain('`Thiếu ${gaps.length}`');
    expect(review).not.toContain("'Đủ bằng chứng'");
    expect(review).not.toContain('Bằng chứng {getTaskProofCount(task)}/5');
    expect(review).toContain(
      'getReviewStaffLabel(task.assignedStaffId, task.assignedStaffName, props.assignableStaff)',
    );
    expect(review).toContain('formatReviewAge(task.updatedAt)');
    expect(review).toContain('if (minutes < 60) return `Gửi ${minutes} phút trước`');
    expect(review).toContain("reportFooter: { flexDirection: 'row', alignItems: 'center'");
    expect(review).toContain('reportAssignee: { flex: 1 }');
    expect(review).not.toContain('reportStatusRow');
    expect(review).not.toContain('TaskCard');
    expect(review).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    const taskSurfaces = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/TaskSurfaces.tsx'),
      'utf8',
    );
    expect(taskSurfaces).toContain("task.beforePhoto ? 'Đã lưu' : 'Chưa có ảnh'");
    expect(taskSurfaces).toContain('photoStored');
    expect(taskSurfaces).not.toContain("'Chưa có metadata'");
    expect(qr).toContain('Chỉ tra cứu, không thay đổi công việc.');
    expect(qr).not.toContain('TreeLookupResult');
    expect(qr).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('exports BottomSheetModal primitive with soft botanical presentation and decoupled backdrop animation', () => {
    const primitives = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/AppPrimitives.tsx'),
      'utf8',
    );
    expect(primitives).toContain('export function BottomSheetModal(');
    expect(primitives).toContain('borderTopLeftRadius: 28');
    expect(primitives).toContain('borderTopRightRadius: 28');
    expect(primitives).toContain('sheetHandle');
    expect(primitives).toContain('backdropAnim');
    expect(primitives).toContain('sheetAnim');
  });

  it('provides specialized Soft Botanical DateRangePickerSheet with continuous ribbon track and TreeScopeSelectorSheet', () => {
    const dateSheet = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/DateRangePickerSheet.tsx'),
      'utf8',
    );
    expect(dateSheet).toContain('export function DateRangePickerSheet(');
    expect(dateSheet).toContain('Hôm nay');
    expect(dateSheet).toContain('Tuần này');
    expect(dateSheet).toContain('Ca:');
    expect(dateSheet).toContain('Áp dụng dải ngày');
    expect(dateSheet).toContain('BottomSheetModal');
    expect(dateSheet).toContain('ribbonTrack');
    expect(dateSheet).toContain('ribbonStart');
    expect(dateSheet).toContain('ribbonEnd');
    expect(dateSheet).toContain('ribbonMiddle');
    expect(dateSheet).not.toContain('dayCellInRange');

    const treeSheet = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/TreeScopeSelectorSheet.tsx'),
      'utf8',
    );
    expect(treeSheet).toContain('export function TreeScopeSelectorSheet(');
    expect(treeSheet).toContain('Khu vực');
    expect(treeSheet).toContain('Chọn nhiều cây');
    expect(treeSheet).toContain('1 cây đơn lẻ');
    expect(treeSheet).toContain('Áp dụng phạm vi');
    expect(treeSheet).toContain('BottomSheetModal');
  });

  it('provides WebMapView with interactive Leaflet OSM map fallback when native maps are absent', () => {
    const webMapView = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/WebMapView.tsx'),
      'utf8',
    );
    expect(webMapView).toContain('export function WebMapView(');
    expect(webMapView).toContain('leaflet.js');
    expect(webMapView).toContain('openstreetmap.org');
    expect(webMapView).toContain('treeCheckinCircle');
    expect(webMapView).toContain('updateUserLocation');
    expect(webMapView).toContain('Bản đồ Web (OSM)');

    const staffProofFlow = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffProofFlow.tsx'),
      'utf8',
    );
    expect(staffProofFlow).toContain("import { WebMapView } from '../../components/presentation/WebMapView'");
    expect(staffProofFlow).toContain('<WebMapView');
    expect(staffProofFlow).toContain('initialEngine="leaflet"');
    expect(staffProofFlow).not.toContain('Check-in và quét QR');
    expect(webMapView).toContain("initialEngine = 'leaflet'");
    expect(webMapView).toContain('<svg width="16" height="16"');
    expect(webMapView).not.toContain("html: '🌲'");
  });

  it('harmonizes design kit shape grammar, secondary button surface, and open filter rhythm', () => {
    const primitives = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/AppPrimitives.tsx'),
      'utf8',
    );
    const treeSurfaces = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/TreeSurfaces.tsx'),
      'utf8',
    );

    expect(primitives).toContain('borderRadius: radius.card');
    expect(primitives).toContain(
      'button_secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.hairlineBorder }',
    );
    expect(treeSurfaces).toContain('<View style={styles.treeFilterPanel}>');
    expect(treeSurfaces).toContain('<View style={styles.taskFilterPanel}>');
    expect(treeSurfaces).toContain('minHeight: 44');
  });

  it('enforces future operational task deadlines and prevents past shift assignment errors', () => {
    const createTask = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerCreateTask.tsx'),
      'utf8',
    );
    expect(createTask).toContain('export function computeOperationalDeadline(');
    expect(createTask).toContain('isDeadlineInPast');
    expect(createTask).toContain('Hạn hoàn thành đã qua. Vui lòng chọn ca hoặc ngày trong tương lai.');
    expect(createTask).toContain('Hạn hoàn thành phải là thời gian trong tương lai');
  });

  it('enforces BA acceptance audit invariants (BA-01 rework unlock, BA-02 RefreshControl, BA-03 BackHandler, BA-04 actor display names, BA-05 QR bottom clearance, BA-06 cubic easing & LayoutAnimation)', async () => {
    const { formatActorDisplayName, getTaskProofWorkflowState, sanitizeNotificationText } =
      await import('../../apps/mobile/src/domain/mobileWorkflow');
    const { TaskStatus } = await import('../../apps/mobile/src/types');

    // BA-01: Staff is unlocked for GPS/QR/CHECKLIST rework even when staffCompletedAt was previously set
    const reworkChecklistTask = {
      id: 'TSK-REWORK-STAFF',
      title: 'Cắt tỉa cành thấp',
      treeId: 'TRE-01',
      treeName: 'Sao đen #108',
      treeAddress: 'Công viên Tao Đàn',
      assignedStaffId: 'STF-01',
      assignedStaffName: 'staff@novyx.local',
      status: TaskStatus.REWORK_REQUIRED,
      reworkTarget: 'CHECKLIST' as const,
      rejectReason: 'Checklist còn thiếu',
      staffCompletedAt: '2026-10-24T08:00:00.000Z',
      gpsCheck: { verified: true, distance: 3.2, timestamp: '2026-10-24T07:55:00.000Z', lat: 10.77, lng: 106.69 },
      qrCheck: { verified: true, scannedCode: 'QR-01', timestamp: '2026-10-24T07:56:00.000Z' },
      checklist: [{ id: '1', text: 'An toàn', done: true }],
      deadline: '2026-10-25T17:00:00.000Z',
      updatedAt: '2026-10-24T09:00:00.000Z',
      proofProfile: 'CHANGE_PROOF' as const,
      evidence: [],
    };
    const staffReworkState = getTaskProofWorkflowState(reworkChecklistTask, 'Staff');
    expect(staffReworkState.isSubmittedOrCompleted).toBe(false);
    expect(staffReworkState.nextStep).toBe('CHECKLIST');
    expect(staffReworkState.activeActionText).toBe('Kiểm tra lại danh mục công việc');

    // BA-04: Clean Vietnamese actor display names
    expect(formatActorDisplayName('staff@novyx.local')).toBe('Nhân viên hiện trường');
    expect(formatActorDisplayName('supervisor@novyx.local')).toBe('Giám sát hiện trường');
    expect(formatActorDisplayName('manager@novyx.local')).toBe('Quản lý điều phối');
    expect(sanitizeNotificationText('Nhiệm vụ mới từ manager@novyx.local cho staff@novyx.local')).toBe(
      'Nhiệm vụ mới từ Quản lý điều phối cho Nhân viên hiện trường',
    );

    // BA-02, BA-03, BA-05, BA-06 source checks
    const mobileApp = fs.readFileSync(path.resolve(process.cwd(), 'apps/mobile/src/screens/MobileApp.tsx'), 'utf8');
    const proofFlow = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffProofFlow.tsx'),
      'utf8',
    );
    const primitives = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/AppPrimitives.tsx'),
      'utf8',
    );
    const managerReview = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerReview.tsx'),
      'utf8',
    );
    const staffTrees = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffTrees.tsx'),
      'utf8',
    );

    expect(mobileApp).toContain("BackHandler.addEventListener('hardwareBackPress'");
    expect(proofFlow).toContain("isRework ? 'Cần cập nhật'");
    expect(proofFlow).toContain('paddingBottom: 148');
    expect(primitives).toContain('Easing.out(Easing.cubic)');
    expect(primitives).toContain('Easing.in(Easing.cubic)');
    expect(managerReview).toContain('RefreshControl');
    expect(staffTrees).toContain('RefreshControl');
  });

  it('accurately detects exact-hour overdue tasks and supports overdue filtering', async () => {
    const { isTaskOverdue, filterTasks, TASK_FILTER_OPTIONS } = await import(
      '../../apps/mobile/src/domain/mobileWorkflow'
    );
    const { TaskStatus } = await import('@novyx/contracts');
    type MobileTask = import('../../apps/mobile/src/types').Task;

    const pastDeadline = new Date(Date.now() - 60000).toISOString();
    const futureDeadline = new Date(Date.now() + 3600000).toISOString();

    const overdueTask = {
      id: 'task-overdue-1',
      title: 'Tưới cây quá hạn',
      status: TaskStatus.IN_PROGRESS,
      deadline: pastDeadline,
    } as unknown as MobileTask;

    const futureTask = {
      id: 'task-future-1',
      title: 'Tưới cây tương lai',
      status: TaskStatus.IN_PROGRESS,
      deadline: futureDeadline,
    } as unknown as MobileTask;

    const completedTask = {
      id: 'task-completed-1',
      title: 'Đã xong',
      status: TaskStatus.COMPLETED,
      deadline: pastDeadline,
    } as unknown as MobileTask;

    expect(isTaskOverdue(overdueTask)).toBe(true);
    expect(isTaskOverdue(futureTask)).toBe(false);
    expect(isTaskOverdue(completedTask)).toBe(false);

    const filtered = filterTasks([overdueTask, futureTask, completedTask], 'overdue');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('task-overdue-1');

    expect(TASK_FILTER_OPTIONS).toContainEqual({ id: 'overdue', label: 'Quá hạn' });
  });

  it('enforces UI-038: real WebView map with genuine raster tiles and prohibits fake NativeVectorMap', () => {
    const webMapView = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/WebMapView.tsx'),
      'utf8',
    );

    expect(webMapView).toContain("import { WebView } from 'react-native-webview'");
    expect(webMapView).not.toContain('function NativeVectorMap');
    expect(webMapView).not.toContain("TurboModuleRegistry.get('RNCWebViewModule')");
    expect(webMapView).toContain('google.com/vt');
    expect(webMapView).toContain('updateWhenIdle: false');
    expect(webMapView).toContain('keepBuffer: 8');
  });

  it('enforces UI-040: unblocked 1-tap GPS acquisition with hardware service check and >=20s satellite timeout', () => {
    const proofFlow = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffProofFlow.tsx'),
      'utf8',
    );

    expect(proofFlow).toContain('hasServicesEnabledAsync');
    expect(proofFlow).toContain('20000');
    expect(proofFlow).not.toContain("showRationaleForPurpose('staff-gps')");
  });

  it('enforces UI-039: honest tree selection and prohibits address-split zone fabrication', () => {
    const createTask = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerCreateTask.tsx'),
      'utf8',
    );
    const scopeSheet = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/TreeScopeSelectorSheet.tsx'),
      'utf8',
    );

    expect(createTask).not.toContain(".split(',').pop()");
    expect(scopeSheet).not.toContain("activeMode === 'zone'");
    expect(scopeSheet).toContain('Chọn cây mục tiêu');
  });

  it('enforces UI-041: field check-in density 6/10 with above-the-fold actions and no redundant task list', () => {
    const proofFlow = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffProofFlow.tsx'),
      'utf8',
    );

    expect(proofFlow).not.toContain('bán kính 10m rồi quét QR');
    expect(proofFlow).not.toContain('mapTaskList');
    expect(proofFlow).toContain('size="field"');
    expect(proofFlow).toContain('adaptiveMapHeight');
  });

  it('enforces UI-042: standardizes bottom navigation bar geometry for iOS Home Indicator and Android 3-button nav', () => {
    const bottomNav = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/NotchedBottomNav.tsx'),
      'utf8',
    );

    expect(bottomNav).toContain("BASE_BAR_HEIGHT = Platform.OS === 'ios' ? 56 : 64");
    expect(bottomNav).not.toContain("BASE_BAR_HEIGHT = Platform.OS === 'ios' ? 82 : 72");
  });

  it('enforces UI-043: eliminates raw scrollbars across all mobile scrollviews, lists and webviews', () => {
    const staffHome = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffHome.tsx'),
      'utf8',
    );
    const staffWork = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffWork.tsx'),
      'utf8',
    );
    const staffTrees = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffTrees.tsx'),
      'utf8',
    );
    const managerCreate = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerCreateTask.tsx'),
      'utf8',
    );
    const webMapView = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/presentation/WebMapView.tsx'),
      'utf8',
    );

    expect(staffHome).toContain('showsVerticalScrollIndicator={false}');
    expect(staffWork).toContain('showsVerticalScrollIndicator={false}');
    expect(staffTrees).toContain('showsVerticalScrollIndicator={false}');
    expect(managerCreate).toContain('showsVerticalScrollIndicator={false}');
    expect(webMapView).toContain('::-webkit-scrollbar { display: none');
  });

  it('enforces UI-044: micro-spring button motion, AnimatedScreenTransition and eliminates Fabric LayoutAnimation', () => {
    const primitives = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/AppPrimitives.tsx'),
      'utf8',
    );
    const staffTrees = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/staff/StaffTrees.tsx'),
      'utf8',
    );
    const managerTrees = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerTrees.tsx'),
      'utf8',
    );

    expect(primitives).toContain('export function AnimatedScreenTransition');
    expect(primitives).toContain('scale');
    expect(staffTrees).not.toContain('LayoutAnimation.configureNext');
    expect(managerTrees).not.toContain('LayoutAnimation.configureNext');
  });

  it('enforces UI-045 and UI-046: BottomSheetModal explicit expanded geometry, spring physics and swipe-down dismissal', () => {
    const primitives = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/AppPrimitives.tsx'),
      'utf8',
    );

    expect(primitives).toContain("height: '82%'");
    expect(primitives).toContain('PanResponder.create');
    expect(primitives).toContain('Animated.spring(sheetAnim');
  });

  it('enforces UI-047: secure exps HTTPS scheme for tunnel QR codes and registers app scheme in app.json', () => {
    const appJson = fs.readFileSync(path.resolve(process.cwd(), 'apps/mobile/app.json'), 'utf8');
    const tunnelScript = fs.readFileSync(path.resolve(process.cwd(), 'scripts/field-tunnel.cjs'), 'utf8');

    expect(appJson).toContain('"scheme": "novyx-greenops"');
    expect(tunnelScript).toContain('exps://');
  });

  it('enforces UI-051: AnimatedScreenTransition keys on screenKey and eliminates children dependency to prevent flickering', () => {
    const primitives = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/AppPrimitives.tsx'),
      'utf8',
    );
    const managerArea = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerArea.tsx'),
      'utf8',
    );

    expect(primitives).toContain('screenKey');
    expect(primitives).not.toContain('}, [children, fadeAnim]);');
    expect(primitives).toContain('}, [screenKey, fadeAnim]);');
    expect(primitives).toContain('fadeAnim.setValue(0.7)');
    expect(managerArea).toContain('screenKey={');
  });

  it('enforces UI-052: eliminates eager tab refresh and layout shifts with gesture-bound pull refresh', () => {
    const managerReview = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerReview.tsx'),
      'utf8',
    );
    const managerDashboard = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerDashboard.tsx'),
      'utf8',
    );

    expect(managerReview).not.toContain("if (props.activeStep === 'REVIEW' && prevStepRef.current !== 'REVIEW')");
    expect(managerReview).toContain('pullRefreshing');
    expect(managerDashboard).toContain('pullRefreshing');
  });

  it('enforces UI-050: 3-tier tree scope hierarchy supporting single_tree, multi_trees, and zone dispatch', () => {
    const scopeSheet = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/components/TreeScopeSelectorSheet.tsx'),
      'utf8',
    );
    const createTask = fs.readFileSync(
      path.resolve(process.cwd(), 'apps/mobile/src/screens/manager/ManagerCreateTask.tsx'),
      'utf8',
    );

    expect(scopeSheet).toContain("'single_tree' | 'multi_trees' | 'zone'");
    expect(scopeSheet).toContain('single_tree');
    expect(scopeSheet).toContain('multi_trees');
    expect(scopeSheet).toContain('zone');
    expect(scopeSheet).toContain('Khu vực');
    expect(scopeSheet).toContain('Chọn tất cả');
    expect(createTask).toContain('scope');
  });
});
