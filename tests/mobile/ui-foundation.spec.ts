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

    expect(proofFlow).toContain('<ScrollView contentContainerStyle={[styles.screenPad, styles.mapScreen]}>');
    expect(proofFlow).not.toContain('provider={providerGoogle}');
    expect(proofFlow).toContain('region={mapRegion}');
    expect(proofFlow).toContain('title="Vị trí thiết bị"');
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
    expect(proofFlow).toContain("task.qrCheck?.verified ? 'BEFORE' : nextStep");
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
});
