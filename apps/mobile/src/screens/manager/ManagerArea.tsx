import React from 'react';
import { AppNotification, CareHistory, Staff, Task, Tree } from '../../types';
import type { CreateNotificationRequest, CreateTaskRequest, ReviewDecisionRequest } from '@novyx/contracts';
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
  tasks: Task[];
  trees: Tree[];
  staff: Staff[];
  notifications: AppNotification[];
  activeStep: ManagerStep;
  setActiveStep: (step: ManagerStep) => void;
  reviewTask: Task | null;
  setReviewTask: (task: Task | null) => void;
  getCareHistoryByTree: (treeId: string) => CareHistory[];
  loadCareHistoryByTree: (treeId: string) => Promise<CareHistory[]>;
  lookupTreeByQr: (payload: string) => Promise<Tree | null>;
  createTask: (request: CreateTaskRequest, fallbackTask: Task) => Promise<Task>;
  createNotification: (request: CreateNotificationRequest) => Promise<AppNotification>;
  reviewTaskDecision: (request: ReviewDecisionRequest, fallbackTask: Task) => Promise<Task>;
  onLogout: () => void;
};

export function ManagerArea(props: ManagerAreaProps) {
  if (props.activeStep === 'QR_LOOKUP') {
    return <ManagerQrLookup {...props} />;
  }

  if (props.activeStep === 'ACCOUNT') {
    return <ManagerAccount {...props} />;
  }

  if (props.activeStep === 'TREES') {
    return <ManagerTrees {...props} />;
  }

  if (props.activeStep === 'CREATE') {
    return <ManagerCreateTask {...props} />;
  }

  if (props.activeStep === 'REVIEW' || props.activeStep === 'REVIEW_DETAIL') {
    return <ManagerReview {...props} />;
  }

  return <ManagerDashboard {...props} />;
}
