import { AnimatedScreenTransition } from '../../components/AppPrimitives';
import { AppNotification, CareHistory, Staff, Task, Tree } from '../../types';
import type {
  AssignableStaffCatalogItem,
  AuthUser,
  CanonicalCreateTaskRequest,
  CancelTaskRequest,
  CreateNotificationRequest,
  CreateTreeRequest,
  OperationalTaskTypeCatalogItem,
  ReassignTaskRequest,
  ResumeBlockedTaskRequest,
  ReviewTaskRequest,
} from '@novyx/contracts';
import { ManagerAccount } from './ManagerAccount';
import { ManagerCreateTask } from './ManagerCreateTask';
import { ManagerDashboard } from './ManagerDashboard';
import { ManagerQrLookup } from './ManagerQrLookup';
import { ManagerReview } from './ManagerReview';
import { ManagerTrees } from './ManagerTrees';

export type ManagerStep = 'HOME' | 'CREATE' | 'TREES' | 'REVIEW' | 'ACCOUNT' | 'REVIEW_DETAIL' | 'QR_LOOKUP';

export const MANAGER_NAV_LEFT_ITEMS = [
  { id: 'HOME', label: 'Tổng quan', icon: 'grid-outline' },
  { id: 'CREATE', label: 'Giao việc', icon: 'add-circle-outline' },
] as const;

export const MANAGER_NAV_RIGHT_ITEMS = [
  { id: 'REVIEW', label: 'Duyệt', icon: 'checkmark-done-outline' },
  { id: 'ACCOUNT', label: 'Tài khoản', icon: 'person-outline' },
] as const;

export const MANAGER_NAV_FAB_ITEM = { id: 'QR_LOOKUP', icon: 'CUSTOM_SCAN' } as const;

export type ManagerAreaProps = {
  authenticatedUser: AuthUser | null;
  tasks: Task[];
  trees: Tree[];
  staff: Staff[];
  operationalTaskTypes: OperationalTaskTypeCatalogItem[];
  assignableStaff: AssignableStaffCatalogItem[];
  catalogsLoading: boolean;
  catalogsError?: string;
  onRetryCatalogs: () => Promise<void>;
  notifications: AppNotification[];
  activeStep: ManagerStep;
  setActiveStep: (step: ManagerStep) => void;
  reviewTask: Task | null;
  setReviewTask: (task: Task | null) => void;
  getCareHistoryByTree: (treeId: string) => CareHistory[];
  loadCareHistoryByTree: (treeId: string) => Promise<CareHistory[]>;
  lookupTreeByQr: (payload: string) => Promise<Tree | null>;
  createTask: (request: CanonicalCreateTaskRequest) => Promise<Task>;
  createTree: (request: Omit<CreateTreeRequest, 'treeId' | 'qrCode'>) => Promise<Tree>;
  createNotification: (request: CreateNotificationRequest) => Promise<AppNotification>;
  reviewTaskDecision: (request: ReviewTaskRequest) => Promise<Task>;
  resumeBlockedTask?: (request: ResumeBlockedTaskRequest) => Promise<Task>;
  reassignTask?: (request: ReassignTaskRequest) => Promise<Task>;
  cancelTask?: (request: CancelTaskRequest) => Promise<Task>;
  dataSource?: {
    source: 'rest' | 'cache' | 'error';
    loading: boolean;
    message?: string;
    cachedAt?: string;
  };
  onRefreshData?: () => Promise<void>;
  onLogout: () => void;
};

export function ManagerArea(props: ManagerAreaProps) {
  if (props.activeStep === 'QR_LOOKUP') {
    return (
      <AnimatedScreenTransition key="QR_LOOKUP">
        <ManagerQrLookup {...props} />
      </AnimatedScreenTransition>
    );
  }

  if (props.activeStep === 'ACCOUNT') {
    return (
      <AnimatedScreenTransition key="ACCOUNT">
        <ManagerAccount {...props} />
      </AnimatedScreenTransition>
    );
  }

  if (props.activeStep === 'TREES') {
    return (
      <AnimatedScreenTransition key="TREES">
        <ManagerTrees {...props} />
      </AnimatedScreenTransition>
    );
  }

  if (props.activeStep === 'CREATE') {
    return (
      <AnimatedScreenTransition key="CREATE">
        <ManagerCreateTask
          trees={props.trees}
          taskTypes={props.operationalTaskTypes}
          assignableStaff={props.assignableStaff}
          loading={props.catalogsLoading}
          error={props.catalogsError}
          onRetryCatalogs={props.onRetryCatalogs}
          setActiveStep={props.setActiveStep}
          createTask={props.createTask}
          createNotification={props.createNotification}
        />
      </AnimatedScreenTransition>
    );
  }

  if (props.activeStep === 'REVIEW' || props.activeStep === 'REVIEW_DETAIL') {
    return (
      <AnimatedScreenTransition key={props.activeStep}>
        <ManagerReview {...props} />
      </AnimatedScreenTransition>
    );
  }

  return (
    <AnimatedScreenTransition key="HOME">
      <ManagerDashboard {...props} />
    </AnimatedScreenTransition>
  );
}
