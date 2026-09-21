import { describe, it, expect } from 'vitest';
import { Task } from '../../apps/api/src/modules/work-management/domain/task.entity';

describe('Phase 13 Wave 4: Task Aggregate Lifecycle & Invariant Verification (Sections 5, 6, 7, 8, 58, 59)', () => {
  const defaultTaskProps = {
    id: 'TASK-100',
    version: 0,
    title: 'Watering and pruning',
    description: 'Quarterly maintenance for assigned mahogany',
    taskTypeId: 'TT-WATER-01',
    taskTypeName: 'Quarterly Watering',
    proofProfile: 'CHANGE_PROOF' as const,
    policyVersionId: 'POL-1',
    checklistTemplateVersionId: 'CHK-1',
    treeId: 'TREE-MAHOGANY-42',
    treeName: 'Old Town Mahogany',
    treeAddress: '42 Le Loi, District 1',
    assignedStaffId: 'staff-1',
    assignedStaffName: 'Nguyen Van A',
    deadline: '2026-10-01T17:00:00Z',
  };

  function createPendingTask(): Task {
    return new Task({ ...defaultTaskProps });
  }

  describe('Section 5 & 6: Allowed Lifecycle Transitions', () => {
    it('1. PENDING -> StartTask -> IN_PROGRESS (only assigned staff)', () => {
      const task = createPendingTask();
      expect(task.status).toBe('PENDING');
      expect(task.version).toBe(0);

      task.start('staff-1');
      expect(task.status).toBe('IN_PROGRESS');
      expect(task.version).toBe(1);
    });

    it('2. PENDING -> ReassignTask -> PENDING (version increments, new staff assigned)', () => {
      const task = createPendingTask();
      task.reassign('staff-2', 'Tran Van B', 'Staff 1 on sick leave');

      expect(task.status).toBe('PENDING');
      expect(task.assignedStaffId).toBe('staff-2');
      expect(task.assignedStaffName).toBe('Tran Van B');
      expect(task.version).toBe(1);
    });

    it('3. PENDING -> CancelTask -> CANCELLED (records reason, actor, timestamp)', () => {
      const task = createPendingTask();
      task.cancel('mgr-1', 'Weather emergency: typhoon warning');

      expect(task.status).toBe('CANCELLED');
      expect(task.cancelledBy).toBe('mgr-1');
      expect(task.cancellationReason).toBe('Weather emergency: typhoon warning');
      expect(task.cancelledAt).toBeInstanceOf(Date);
      expect(task.isTerminal()).toBe(true);
    });

    it('4. IN_PROGRESS -> ReportFieldIssue -> BLOCKED', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.reportFieldIssue('staff-1');

      expect(task.status).toBe('BLOCKED');
      expect(task.version).toBe(2);
    });

    it('5. IN_PROGRESS -> SubmitEvidence -> WAITING_REVIEW', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');

      expect(task.status).toBe('WAITING_REVIEW');
      expect(task.version).toBe(2);
    });

    it('6. IN_PROGRESS -> CancelTask -> CANCELLED', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.cancel('mgr-1', 'Operations cancelled by city council order');

      expect(task.status).toBe('CANCELLED');
      expect(task.isTerminal()).toBe(true);
    });

    it('7. BLOCKED -> ResumeBlockedTask -> IN_PROGRESS (same staff continues)', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.reportFieldIssue('staff-1');
      expect(task.status).toBe('BLOCKED');

      task.resumeBlocked();
      expect(task.status).toBe('IN_PROGRESS');
      expect(task.assignedStaffId).toBe('staff-1');
      expect(task.version).toBe(3);
    });

    it('8. BLOCKED -> ReassignTask -> PENDING (Case B: DR-MVP-05)', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.reportFieldIssue('staff-1');
      expect(task.status).toBe('BLOCKED');

      task.reassign('staff-2', 'Tran Van B', 'Equipment reallocated to new staff');
      expect(task.status).toBe('PENDING');
      expect(task.assignedStaffId).toBe('staff-2');
      expect(task.version).toBe(3);
    });

    it('9. BLOCKED -> CancelTask -> CANCELLED', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.reportFieldIssue('staff-1');
      task.cancel('mgr-1', 'Site inaccessible indefinitely');

      expect(task.status).toBe('CANCELLED');
      expect(task.isTerminal()).toBe(true);
    });

    it('10. WAITING_REVIEW -> ApproveTask -> COMPLETED', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');
      task.approve();

      expect(task.status).toBe('COMPLETED');
      expect(task.isTerminal()).toBe(true);
    });

    it('11. WAITING_REVIEW -> ApproveWithException -> COMPLETED', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');
      task.approveWithException('GPS offset verified by on-site photographic landmark proof');

      expect(task.status).toBe('COMPLETED');
      expect(task.isTerminal()).toBe(true);
    });

    it('12. WAITING_REVIEW -> RequestRework -> REWORK_REQUIRED', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');
      task.requestRework('after_photo', 'After photo is blurred and canopy cut angle is unclear');

      expect(task.status).toBe('REWORK_REQUIRED');
      expect(task.version).toBe(3);
    });

    it('13. WAITING_REVIEW -> CancelTask -> CANCELLED', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');
      task.cancel('mgr-1', 'Work order duplicated');

      expect(task.status).toBe('CANCELLED');
    });

    it('14. REWORK_REQUIRED -> ResubmitRework -> WAITING_REVIEW', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');
      task.requestRework('after_photo', 'Photo unclear');
      task.resubmitRework('staff-1');

      expect(task.status).toBe('WAITING_REVIEW');
      expect(task.version).toBe(4);
    });

    it('15. REWORK_REQUIRED -> CancelTask -> CANCELLED', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');
      task.requestRework('after_photo', 'Photo unclear');
      task.cancel('mgr-1', 'Subcontractor terminated');

      expect(task.status).toBe('CANCELLED');
    });
  });

  describe('Section 7, 8 & 58: Forbidden Transitions & Hard Invariants', () => {
    it('DR-HARD-06 / Section 7: IN_PROGRESS direct Reassign is FORBIDDEN', () => {
      const task = createPendingTask();
      task.start('staff-1');
      expect(task.status).toBe('IN_PROGRESS');

      expect(() => {
        task.reassign('staff-2', 'Tran Van B', 'Direct reassignment attempt');
      }).toThrowError(/Direct reassignment of an IN_PROGRESS task is forbidden/);
    });

    it('WAITING_REVIEW direct Reassign is FORBIDDEN', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');
      expect(task.status).toBe('WAITING_REVIEW');

      expect(() => {
        task.reassign('staff-2', 'Tran Van B', 'Attempting reassignment in review');
      }).toThrowError(/Direct reassignment is forbidden when task is in WAITING_REVIEW/);
    });

    it('REWORK_REQUIRED direct Reassign is FORBIDDEN', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');
      task.requestRework('after_photo', 'Photo unclear');
      expect(task.status).toBe('REWORK_REQUIRED');

      expect(() => {
        task.reassign('staff-2', 'Tran Van B', 'Attempting reassignment during rework');
      }).toThrowError(/Direct reassignment is forbidden when task is in REWORK_REQUIRED/);
    });

    it('REWORK_REQUIRED -> ReportFieldIssue is FORBIDDEN', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');
      task.requestRework('after_photo', 'Photo unclear');

      expect(() => {
        task.reportFieldIssue('staff-1');
      }).toThrowError(/Field issues can only be reported from IN_PROGRESS/);
    });

    it('COMPLETED terminal state is IMMUTABLE (DR-HARD-05)', () => {
      const task = createPendingTask();
      task.start('staff-1');
      task.submitEvidence('staff-1');
      task.approve();
      expect(task.status).toBe('COMPLETED');

      expect(() => task.start('staff-1')).toThrowError();
      expect(() => task.reassign('staff-2', 'Tran Van B', 'Cannot reassign completed')).toThrowError();
      expect(() => task.reportFieldIssue('staff-1')).toThrowError();
      expect(() => task.submitEvidence('staff-1')).toThrowError();
      expect(() => task.approve()).toThrowError();
      expect(() => task.requestRework('area', 'Cannot rework completed')).toThrowError();
      expect(() => task.cancel('mgr-1', 'Cannot cancel completed')).toThrowError();
    });

    it('CANCELLED terminal state is IMMUTABLE (DR-HARD-05)', () => {
      const task = createPendingTask();
      task.cancel('mgr-1', 'Initial cancellation');
      expect(task.status).toBe('CANCELLED');

      expect(() => task.start('staff-1')).toThrowError();
      expect(() => task.reassign('staff-2', 'Tran Van B', 'Cannot reassign cancelled')).toThrowError();
      expect(() => task.reportFieldIssue('staff-1')).toThrowError();
      expect(() => task.submitEvidence('staff-1')).toThrowError();
      expect(() => task.approve()).toThrowError();
      expect(() => task.cancel('mgr-1', 'No terminal -> terminal transition')).toThrowError();
    });

    it('DR-HARD-01: Task.treeId is strictly immutable', () => {
      const task = createPendingTask();
      expect(task.treeId).toBe('TREE-MAHOGANY-42');

      // No setter or mutator exists on entity
      // Verify TypeScript/Object descriptor prevents writing or mutating treeId
      expect(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(task), 'treeId')?.set).toBeUndefined();
    });

    it('Only assigned staff member can start task or submit evidence', () => {
      const task = createPendingTask();

      // Wrong staff attempt start
      expect(() => task.start('wrong-staff')).toThrowError(/Only the assigned staff member/);

      task.start('staff-1');

      // Wrong staff attempt submit
      expect(() => task.submitEvidence('wrong-staff')).toThrowError(/Only the assigned staff member/);
    });
  });
});
