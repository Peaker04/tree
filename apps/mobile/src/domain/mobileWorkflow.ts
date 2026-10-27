import { Task, TaskStatus, Tree, TreeRiskStatus } from '../types';

export type StaffStep =
  | 'HOME'
  | 'MY_TREES'
  | 'WORK'
  | 'MAP'
  | 'DETAIL'
  | 'GPS'
  | 'QR'
  | 'BEFORE'
  | 'CHECKLIST'
  | 'AFTER'
  | 'REVIEW'
  | 'SUCCESS'
  | 'NOTIFICATIONS'
  | 'ACCOUNT';

export type TreeFilter = 'all' | TreeRiskStatus;
export type TaskFilter = 'all' | 'open' | 'overdue' | TaskStatus;

export const formatTreeAge = (ageYears: number) => (ageYears > 0 ? `${ageYears} năm` : 'Chưa xác định');

export const formatActorDisplayName = (value?: string | null): string => {
  const raw = (value ?? '').trim();
  if (!raw) return 'Nhân viên hiện trường';
  const lower = raw.toLowerCase();
  if (lower === 'staff@novyx.local' || lower === 'staff') return 'Nhân viên hiện trường';
  if (lower === 'supervisor@novyx.local' || lower === 'supervisor') return 'Giám sát hiện trường';
  if (lower === 'manager@novyx.local' || lower === 'manager') return 'Quản lý điều phối';
  return raw;
};

export const sanitizeNotificationText = (value: string): string =>
  value
    .replace(/staff@novyx\.local/gi, 'Nhân viên hiện trường')
    .replace(/supervisor@novyx\.local/gi, 'Giám sát hiện trường')
    .replace(/manager@novyx\.local/gi, 'Quản lý điều phối');

export const TREE_FILTER_OPTIONS: { id: TreeFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'abnormal', label: 'Cần chú ý' },
  { id: 'overdue', label: 'Quá hạn' },
  { id: 'healthy', label: 'Khỏe' },
];

export const TASK_FILTER_OPTIONS: { id: TaskFilter; label: string }[] = [
  { id: 'open', label: 'Việc mở' },
  { id: 'all', label: 'Tất cả' },
  { id: 'overdue', label: 'Quá hạn' },
  { id: TaskStatus.PENDING, label: 'Chờ bắt đầu' },
  { id: TaskStatus.IN_PROGRESS, label: 'Đang làm' },
  { id: TaskStatus.WAITING_REVIEW, label: 'Chờ duyệt' },
  { id: TaskStatus.REWORK_REQUIRED, label: 'Làm lại' },
  { id: TaskStatus.COMPLETED, label: 'Hoàn thành' },
];

export const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const getTreeRiskStatus = (tree: Tree): TreeRiskStatus => {
  if (tree.riskStatus) return tree.riskStatus;
  if (tree.healthStatus === 'Sâu bệnh') return 'pest_risk';
  if (tree.healthStatus === 'Cần chăm sóc') return 'abnormal';
  return 'healthy';
};

const matchesTreeQuery = (tree: Tree, query: string) => {
  const cleanQuery = normalizeSearch(query.trim());
  if (!cleanQuery) return true;

  return normalizeSearch([tree.id, tree.name, tree.species, tree.address, tree.qrCode].join(' ')).includes(cleanQuery);
};

export const filterTrees = (trees: Tree[], query: string, filter: TreeFilter) =>
  trees.filter((tree) => {
    const risk = getTreeRiskStatus(tree);
    const matchesFilter =
      filter === 'all' || risk === filter || (filter === 'abnormal' && ['pest_risk', 'leaning'].includes(risk));

    return matchesFilter && matchesTreeQuery(tree, query);
  });

export const filterTasks = (tasks: Task[], filter: TaskFilter) => {
  if (filter === 'all') return tasks;
  if (filter === 'open') {
    return tasks.filter((task) => task.status !== TaskStatus.COMPLETED && task.status !== 'CANCELLED');
  }
  if (filter === 'overdue') {
    return tasks.filter(isTaskOverdue);
  }
  return tasks.filter((task) => task.status === filter);
};

export const matchesTaskQuery = (task: Task, query: string) => {
  const cleanQuery = normalizeSearch(query.trim());
  if (!cleanQuery) return true;
  return normalizeSearch(
    [task.id, task.title, task.taskType, task.treeName, task.treeAddress, task.assignedStaffName].join(' '),
  ).includes(cleanQuery);
};

export const getTaskStatusMeta = (
  status: TaskStatus,
): { label: string; tone: 'green' | 'sky' | 'amber' | 'danger' } => {
  if (status === TaskStatus.WAITING_REVIEW) return { label: 'Chờ duyệt', tone: 'amber' };
  if (status === TaskStatus.REWORK_REQUIRED) return { label: 'Cần làm lại', tone: 'danger' };
  if (status === TaskStatus.COMPLETED) return { label: 'Hoàn thành', tone: 'green' };
  if (status === TaskStatus.IN_PROGRESS) return { label: 'Đang làm', tone: 'sky' };
  return { label: 'Chờ bắt đầu', tone: 'sky' };
};

export const formatTaskDate = (value: string) => new Date(value).toLocaleDateString('vi-VN');

export const formatTaskDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export const isTaskOverdue = (task: Task) => {
  if (task.status === TaskStatus.COMPLETED || task.status === 'CANCELLED') return false;
  const deadline = new Date(task.deadline);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() < Date.now();
};

export const getTaskProofGaps = (task: Task) => {
  const gaps: string[] = [];
  const hasLocationEx = Boolean(
    task.notes?.includes('Ngoại lệ GPS:') || (task as unknown as { locationException?: unknown }).locationException,
  );
  if (!task.gpsCheck?.verified && !hasLocationEx) gaps.push('GPS chưa xác minh trong bán kính hợp lệ');
  if (!task.qrCheck?.verified) gaps.push('QR cây chưa khớp nhiệm vụ');
  if (!task.beforePhoto) gaps.push('Thiếu ảnh trước khi xử lý');
  if (!task.afterPhoto) gaps.push('Thiếu ảnh sau khi xử lý');
  if (task.checklist.some((item) => !item.done)) gaps.push('Checklist chưa hoàn thành đủ');
  return gaps;
};

export const getTaskProofCount = (task: Task) => {
  const hasLocationEx = Boolean(
    task.notes?.includes('Ngoại lệ GPS:') || (task as unknown as { locationException?: unknown }).locationException,
  );
  return [
    task.gpsCheck?.verified || hasLocationEx,
    task.qrCheck?.verified,
    Boolean(task.beforePhoto),
    Boolean(task.afterPhoto),
    task.checklist.every((item) => item.done),
  ].filter(Boolean).length;
};

export const getTaskActionPriority = (task: Task) => {
  if (task.status === TaskStatus.REWORK_REQUIRED) return 0;
  if (task.status === TaskStatus.IN_PROGRESS) return 1;
  if (task.status === TaskStatus.PENDING) return 2;
  if (task.status === TaskStatus.WAITING_REVIEW) return 3;
  return 4;
};

export const getNextActionTask = (tasks: Task[], staffId?: string) =>
  [...tasks]
    .filter(
      (task) =>
        (!staffId || task.assignedStaffId === staffId) &&
        (task.status === TaskStatus.PENDING ||
          task.status === TaskStatus.IN_PROGRESS ||
          task.status === TaskStatus.REWORK_REQUIRED),
    )
    .sort((first, second) => {
      const priority = getTaskActionPriority(first) - getTaskActionPriority(second);
      if (priority !== 0) return priority;
      return new Date(first.deadline).getTime() - new Date(second.deadline).getTime();
    })[0] ?? null;

const inferReworkStep = (task: Task): StaffStep | null => {
  if (task.status !== TaskStatus.REWORK_REQUIRED) return null;
  const target = task.reworkTarget?.toUpperCase();
  if (target === 'GPS') return 'GPS';
  if (target === 'QR') return 'QR';
  if (target === 'BEFORE') return 'BEFORE';
  if (target === 'CHECKLIST') return 'CHECKLIST';
  if (target === 'AFTER' || target === 'EVIDENCE') return 'AFTER';

  const reason = normalizeSearch(task.rejectReason ?? '');
  if (reason.includes('gps')) return 'GPS';
  if (reason.includes('qr')) return 'QR';
  if (reason.includes('checklist')) return 'CHECKLIST';
  if (reason.includes('anh sau')) return 'AFTER';
  if (reason.includes('anh truoc')) return 'BEFORE';
  return 'DETAIL';
};

export const STAFF_STEPS = ['GPS', 'QR', 'CHECKLIST', 'REVIEW'] as const;
export const SUPERVISOR_STEPS = ['GPS', 'BEFORE', 'AFTER', 'REVIEW'] as const;

export const isTaskAwaitingSupervisor = (task: Task): boolean =>
  task.status === TaskStatus.IN_PROGRESS && Boolean(task.staffCompletedAt) && (!task.beforePhoto || !task.afterPhoto);

export const getNextProofStep = (task: Task, role?: 'Staff' | 'Supervisor'): StaffStep => {
  const reworkStep = inferReworkStep(task);
  const hasLocationEx = Boolean(
    task.notes?.includes('Ngoại lệ GPS:') || (task as unknown as { locationException?: unknown }).locationException,
  );

  if (role === 'Staff') {
    if (reworkStep === 'GPS' || reworkStep === 'QR' || reworkStep === 'CHECKLIST') {
      return reworkStep;
    }
    if (!task.gpsCheck?.verified && !hasLocationEx) return 'GPS';
    if (!task.qrCheck?.verified) return 'QR';
    if (task.checklist.some((item) => !item.done)) return 'CHECKLIST';
    return 'REVIEW';
  }

  if (role === 'Supervisor') {
    if (reworkStep === 'BEFORE' || reworkStep === 'AFTER') {
      return reworkStep;
    }
    const supGpsVerified = Boolean(
      task.supervisorGpsCheck?.verified || (task.status === TaskStatus.REWORK_REQUIRED && task.gpsCheck?.verified),
    );
    if (!supGpsVerified) return 'GPS';
    if (!task.beforePhoto) return 'BEFORE';
    if (!task.afterPhoto) return 'AFTER';
    return 'REVIEW';
  }

  if (reworkStep) return reworkStep;
  if (!task.gpsCheck?.verified && !hasLocationEx) return 'GPS';
  if (!task.qrCheck?.verified) return 'QR';
  if (!task.beforePhoto) return 'BEFORE';
  if (task.checklist.some((item) => !item.done)) return 'CHECKLIST';
  if (!task.afterPhoto) return 'AFTER';
  return 'REVIEW';
};

export type ProofStepKey = 'GPS' | 'QR' | 'BEFORE' | 'CHECKLIST' | 'AFTER' | 'REVIEW';

export type ProofStepStatus = 'done' | 'current' | 'pending';

export interface TaskProofStepInfo {
  key: ProofStepKey;
  label: string;
  status: ProofStepStatus;
  done: boolean;
  isCurrent: boolean;
  actionText: string;
}

export interface TaskProofWorkflowState {
  nextStep: StaffStep | null;
  isComplete: boolean;
  isSubmittedOrCompleted: boolean;
  proofCount: number;
  completedCount: number;
  totalRequired: number;
  readyToSubmit: boolean;
  activeActionText: string;
  steps: TaskProofStepInfo[];
}

export const getTaskProofWorkflowState = (task: Task, role?: 'Staff' | 'Supervisor'): TaskProofWorkflowState => {
  const isSubmittedOrCompleted = task.status === TaskStatus.WAITING_REVIEW || task.status === TaskStatus.COMPLETED;

  const hasLocationEx = Boolean(
    task.notes?.includes('Ngoại lệ GPS:') ||
    task.supervisorNotes?.includes('Ngoại lệ GPS:') ||
    (task as unknown as { locationException?: unknown }).locationException,
  );
  const isGpsDone = Boolean(task.gpsCheck?.verified || hasLocationEx);
  const isQrDone = Boolean(task.qrCheck?.verified);
  const isBeforeDone = Boolean(task.beforePhoto);
  const isChecklistDone = task.checklist.length > 0 && task.checklist.every((item) => item.done);
  const isAfterDone = Boolean(task.afterPhoto);
  const isSupervisorGpsDone = Boolean(
    task.supervisorGpsCheck?.verified ||
    task.supervisorNotes?.includes('Ngoại lệ GPS:') ||
    hasLocationEx ||
    (task.status === TaskStatus.REWORK_REQUIRED && task.gpsCheck?.verified),
  );

  const rawNextStep = getNextProofStep(task, role);
  const nextStep: StaffStep | null = isSubmittedOrCompleted ? null : rawNextStep;

  if (role === 'Staff') {
    const reworkStep = inferReworkStep(task);
    const isStaffRework =
      task.status === TaskStatus.REWORK_REQUIRED &&
      (reworkStep === 'GPS' || reworkStep === 'QR' || reworkStep === 'CHECKLIST');
    const completedCount = [isGpsDone, isQrDone, isChecklistDone].filter(Boolean).length;
    const isStaffSubmitted = isSubmittedOrCompleted || (Boolean(task.staffCompletedAt) && !isStaffRework);
    const steps: TaskProofStepInfo[] = [
      {
        key: 'GPS',
        label: 'Định vị GPS',
        done: isGpsDone && reworkStep !== 'GPS',
        isCurrent: !isStaffSubmitted && rawNextStep === 'GPS',
        status:
          isGpsDone && reworkStep !== 'GPS'
            ? 'done'
            : rawNextStep === 'GPS' && !isStaffSubmitted
              ? 'current'
              : 'pending',
        actionText: reworkStep === 'GPS' ? 'Xác minh lại vị trí GPS tại gốc cây' : 'Xác thực vị trí GPS tại gốc cây',
      },
      {
        key: 'QR',
        label: 'Mã QR',
        done: isQrDone && reworkStep !== 'QR',
        isCurrent: !isStaffSubmitted && rawNextStep === 'QR',
        status:
          isQrDone && reworkStep !== 'QR' ? 'done' : rawNextStep === 'QR' && !isStaffSubmitted ? 'current' : 'pending',
        actionText: reworkStep === 'QR' ? 'Quét lại mã QR thân cây' : 'Quét mã QR thân cây',
      },
      {
        key: 'CHECKLIST',
        label: 'Nhiệm vụ',
        done: isChecklistDone && reworkStep !== 'CHECKLIST',
        isCurrent: !isStaffSubmitted && rawNextStep === 'CHECKLIST',
        status:
          isChecklistDone && reworkStep !== 'CHECKLIST'
            ? 'done'
            : rawNextStep === 'CHECKLIST' && !isStaffSubmitted
              ? 'current'
              : 'pending',
        actionText:
          reworkStep === 'CHECKLIST' ? 'Kiểm tra lại danh mục công việc' : 'Thực hiện kiểm tra danh mục công việc',
      },
    ];
    const activeActionText = isStaffSubmitted
      ? 'Đã gửi định vị — Chờ Giám sát chụp ảnh'
      : rawNextStep === 'REVIEW'
        ? isStaffRework
          ? 'Nộp lại xác nhận hiện trường'
          : 'Gửi định vị GPS & Xác nhận hoàn thành'
        : (steps.find((s) => s.isCurrent)?.actionText ?? 'Tiếp tục thực hiện nhiệm vụ');

    return {
      nextStep: isStaffSubmitted ? null : nextStep,
      isComplete: completedCount === 3,
      isSubmittedOrCompleted: isStaffSubmitted,
      proofCount: completedCount,
      completedCount,
      totalRequired: 3,
      readyToSubmit: completedCount === 3 && (!task.staffCompletedAt || isStaffRework),
      activeActionText,
      steps,
    };
  }

  if (role === 'Supervisor') {
    const completedCount = [isSupervisorGpsDone, isBeforeDone, isAfterDone].filter(Boolean).length;
    const steps: TaskProofStepInfo[] = [
      {
        key: 'GPS',
        label: 'Vị trí GS',
        done: isSupervisorGpsDone,
        isCurrent: !isSubmittedOrCompleted && rawNextStep === 'GPS',
        status: isSupervisorGpsDone ? 'done' : rawNextStep === 'GPS' && !isSubmittedOrCompleted ? 'current' : 'pending',
        actionText: 'Xác thực vị trí GPS Giám sát',
      },
      {
        key: 'BEFORE',
        label: 'Ảnh trước',
        done: isBeforeDone,
        isCurrent: !isSubmittedOrCompleted && rawNextStep === 'BEFORE',
        status: isBeforeDone ? 'done' : rawNextStep === 'BEFORE' && !isSubmittedOrCompleted ? 'current' : 'pending',
        actionText: 'Chụp ảnh hiện trạng trước xử lý',
      },
      {
        key: 'AFTER',
        label: 'Ảnh sau',
        done: isAfterDone,
        isCurrent: !isSubmittedOrCompleted && rawNextStep === 'AFTER',
        status: isAfterDone ? 'done' : rawNextStep === 'AFTER' && !isSubmittedOrCompleted ? 'current' : 'pending',
        actionText: 'Chụp ảnh nghiệm thu sau xử lý',
      },
    ];
    const activeActionText = isSubmittedOrCompleted
      ? 'Đã gửi bằng chứng cho Quản lý'
      : rawNextStep === 'REVIEW'
        ? 'Gửi bằng chứng giám sát'
        : (steps.find((s) => s.isCurrent)?.actionText ?? 'Chụp bằng chứng giám sát');

    return {
      nextStep,
      isComplete: completedCount === 3,
      isSubmittedOrCompleted,
      proofCount: completedCount,
      completedCount,
      totalRequired: 3,
      readyToSubmit: Boolean(task.staffCompletedAt) && completedCount === 3,
      activeActionText,
      steps,
    };
  }

  const proofCount = [isGpsDone, isQrDone, isBeforeDone, isChecklistDone, isAfterDone].filter(Boolean).length;

  const steps: TaskProofStepInfo[] = [
    {
      key: 'GPS',
      label: 'GPS',
      done: isGpsDone,
      isCurrent: !isSubmittedOrCompleted && rawNextStep === 'GPS',
      status: isGpsDone ? 'done' : rawNextStep === 'GPS' && !isSubmittedOrCompleted ? 'current' : 'pending',
      actionText: 'Xác thực GPS tại gốc cây',
    },
    {
      key: 'QR',
      label: 'Mã QR',
      done: isQrDone,
      isCurrent: !isSubmittedOrCompleted && rawNextStep === 'QR',
      status: isQrDone ? 'done' : rawNextStep === 'QR' && !isSubmittedOrCompleted ? 'current' : 'pending',
      actionText: 'Quét mã QR thân cây',
    },
    {
      key: 'BEFORE',
      label: 'Ảnh trước',
      done: isBeforeDone,
      isCurrent: !isSubmittedOrCompleted && rawNextStep === 'BEFORE',
      status: isBeforeDone ? 'done' : rawNextStep === 'BEFORE' && !isSubmittedOrCompleted ? 'current' : 'pending',
      actionText: 'Chụp ảnh trước tác nghiệp',
    },
    {
      key: 'CHECKLIST',
      label: 'Nhiệm vụ',
      done: isChecklistDone,
      isCurrent: !isSubmittedOrCompleted && rawNextStep === 'CHECKLIST',
      status: isChecklistDone ? 'done' : rawNextStep === 'CHECKLIST' && !isSubmittedOrCompleted ? 'current' : 'pending',
      actionText: 'Thực hiện kiểm tra checklist',
    },
    {
      key: 'AFTER',
      label: 'Ảnh sau',
      done: isAfterDone,
      isCurrent: !isSubmittedOrCompleted && rawNextStep === 'AFTER',
      status: isAfterDone ? 'done' : rawNextStep === 'AFTER' && !isSubmittedOrCompleted ? 'current' : 'pending',
      actionText: 'Chụp ảnh nghiệm thu sau làm',
    },
  ];

  let activeActionText = '';
  if (!isSubmittedOrCompleted) {
    if (task.status === TaskStatus.REWORK_REQUIRED && task.rejectReason) {
      activeActionText =
        rawNextStep === 'GPS'
          ? 'Xác minh lại GPS'
          : rawNextStep === 'QR'
            ? 'Quét lại mã cây'
            : rawNextStep === 'BEFORE'
              ? 'Chụp lại ảnh trước xử lý'
              : rawNextStep === 'CHECKLIST'
                ? 'Kiểm tra lại checklist'
                : rawNextStep === 'AFTER'
                  ? 'Chụp lại ảnh sau xử lý'
                  : 'Xem phần cần làm lại';
    } else if (rawNextStep === 'REVIEW') {
      activeActionText = 'Kiểm tra & Gửi duyệt kết quả';
    } else {
      const activeStep = steps.find((s) => s.isCurrent);
      activeActionText = activeStep?.actionText ?? 'Tiếp tục thực hiện nhiệm vụ';
    }
  }

  return {
    nextStep,
    isComplete: proofCount === 5,
    isSubmittedOrCompleted,
    proofCount,
    completedCount: proofCount,
    totalRequired: 5,
    readyToSubmit: proofCount === 5,
    activeActionText,
    steps,
  };
};

export const upsertPhotoEvidence = (
  task: Task,
  stage: 'before' | 'after',
  uri: string,
): NonNullable<Task['evidence']> => {
  const capturedAt = new Date().toISOString();
  const nextEvidence = {
    id: `ev-${task.id}-${stage}`,
    taskId: task.id,
    treeId: task.treeId,
    stage,
    uri,
    capturedAt,
    capturedByUserId: task.assignedStaffId,
    ...(task.gpsCheck ? { gpsCheck: { ...task.gpsCheck } } : {}),
  };

  return [...(task.evidence ?? []).filter((item) => item.stage !== stage), nextEvidence];
};

export const removePhotoEvidence = (task: Task, stage: 'before' | 'after') =>
  (task.evidence ?? []).filter((item) => item.stage !== stage);

export const isLocalPhotoUri = (uri: string) =>
  uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('asset-library://');

export const getEvidenceTransportMeta = (task: Task) => {
  const evidence = task.evidence ?? [];
  const localFiles = evidence.filter((item) => isLocalPhotoUri(item.uri));

  return {
    fileCount: localFiles.length,
    mode: localFiles.length > 0 ? 'multipart' : 'json',
    label:
      localFiles.length > 0
        ? `Multipart: ${localFiles.length} file ảnh thật + metadata`
        : 'JSON: metadata và URL ảnh đã đồng bộ',
  };
};
