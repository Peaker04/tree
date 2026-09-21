export type TaskStatus =
  'PENDING' | 'IN_PROGRESS' | 'BLOCKED' | 'WAITING_REVIEW' | 'REWORK_REQUIRED' | 'COMPLETED' | 'CANCELLED';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskProps {
  id: string;
  version: number;
  title: string;
  description: string;
  taskTypeId: string;
  taskTypeName: string;
  proofProfile: 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF';
  policyVersionId?: string | undefined;
  checklistTemplateVersionId?: string | undefined;
  treeId: string;
  treeName: string;
  treeAddress: string;
  assignedStaffId: string;
  assignedStaffName: string;
  deadline: string;
  status?: TaskStatus | undefined;
  checklistSnapshot?: ChecklistItem[] | undefined;
  cancellationReason?: string | undefined;
  cancelledBy?: string | undefined;
  cancelledAt?: Date | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export class Task {
  private readonly _id: string;
  private _version: number;
  private _title: string;
  private _description: string;
  private readonly _taskTypeId: string;
  private readonly _taskTypeName: string;
  private readonly _proofProfile: 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF';
  private readonly _policyVersionId?: string | undefined;
  private readonly _checklistTemplateVersionId?: string | undefined;
  private readonly _treeId: string; // IMMUTABLE (DR-HARD-01)
  private readonly _treeName: string;
  private readonly _treeAddress: string;
  private _assignedStaffId: string;
  private _assignedStaffName: string;
  private _deadline: string;
  private _status: TaskStatus;
  private _checklistSnapshot?: ChecklistItem[] | undefined;
  private _cancellationReason?: string | undefined;
  private _cancelledBy?: string | undefined;
  private _cancelledAt?: Date | undefined;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TaskProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('Task ID is required');
    }
    if (!props.treeId || props.treeId.trim().length === 0) {
      throw new Error('Tree ID is immutable and mandatory (DR-HARD-01)');
    }
    if (!props.taskTypeId || props.taskTypeId.trim().length === 0) {
      throw new Error('TaskType ID is mandatory');
    }
    if (!props.assignedStaffId || props.assignedStaffId.trim().length === 0) {
      throw new Error('Assigned staff ID is mandatory');
    }

    this._id = props.id;
    this._version = props.version ?? 0;
    this._title = props.title;
    this._description = props.description;
    this._taskTypeId = props.taskTypeId;
    this._taskTypeName = props.taskTypeName;
    this._proofProfile = props.proofProfile;
    this._policyVersionId = props.policyVersionId;
    this._checklistTemplateVersionId = props.checklistTemplateVersionId;
    this._treeId = props.treeId;
    this._treeName = props.treeName;
    this._treeAddress = props.treeAddress;
    this._assignedStaffId = props.assignedStaffId;
    this._assignedStaffName = props.assignedStaffName;
    this._deadline = props.deadline;
    this._status = props.status ?? 'PENDING';
    this._checklistSnapshot = props.checklistSnapshot;
    this._cancellationReason = props.cancellationReason;
    this._cancelledBy = props.cancelledBy;
    this._cancelledAt = props.cancelledAt;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }

  get version(): number {
    return this._version;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get taskTypeId(): string {
    return this._taskTypeId;
  }

  get taskTypeName(): string {
    return this._taskTypeName;
  }

  get proofProfile(): 'CHANGE_PROOF' | 'SERVICE_PROOF' | 'INSPECTION_PROOF' {
    return this._proofProfile;
  }

  get policyVersionId(): string | undefined {
    return this._policyVersionId;
  }

  get checklistTemplateVersionId(): string | undefined {
    return this._checklistTemplateVersionId;
  }

  get treeId(): string {
    return this._treeId;
  }

  get treeName(): string {
    return this._treeName;
  }

  get treeAddress(): string {
    return this._treeAddress;
  }

  get assignedStaffId(): string {
    return this._assignedStaffId;
  }

  get assignedStaffName(): string {
    return this._assignedStaffName;
  }

  get deadline(): string {
    return this._deadline;
  }

  get status(): TaskStatus {
    return this._status;
  }

  get checklistSnapshot(): ChecklistItem[] | undefined {
    return this._checklistSnapshot;
  }

  get cancellationReason(): string | undefined {
    return this._cancellationReason;
  }

  get cancelledBy(): string | undefined {
    return this._cancelledBy;
  }

  get cancelledAt(): Date | undefined {
    return this._cancelledAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * PENDING -> IN_PROGRESS
   * Only assigned Staff may start.
   */
  start(actorId: string): void {
    if (this._status !== 'PENDING') {
      throw new Error(`Cannot start task in status ${this._status}. Only PENDING tasks can be started.`);
    }
    if (this._assignedStaffId !== actorId) {
      throw new Error('Only the assigned staff member may start this task');
    }
    this._status = 'IN_PROGRESS';
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * ReassignTask:
   * Allowed from PENDING (Manager) -> PENDING
   * Allowed from BLOCKED (Manager) -> PENDING (Case B: DR-MVP-05)
   * FORBIDDEN from IN_PROGRESS (DR-HARD-06)
   * FORBIDDEN from WAITING_REVIEW and REWORK_REQUIRED
   * FORBIDDEN from terminal states (DR-HARD-05)
   */
  reassign(newStaffId: string, newStaffName: string, reason: string): void {
    if (this.isTerminal()) {
      throw new Error(`Cannot reassign terminal task in status ${this._status}`);
    }
    if (this._status === 'IN_PROGRESS') {
      throw new Error(
        'Direct reassignment of an IN_PROGRESS task is forbidden (DR-HARD-06). Task must be reported as BLOCKED first.',
      );
    }
    if (this._status === 'WAITING_REVIEW' || this._status === 'REWORK_REQUIRED') {
      throw new Error(`Direct reassignment is forbidden when task is in ${this._status}`);
    }
    if (!reason || reason.trim().length < 3) {
      throw new Error('Reassignment reason is required');
    }
    if (newStaffId === this._assignedStaffId) {
      throw new Error('Cannot reassign to the same staff member');
    }

    this._assignedStaffId = newStaffId;
    this._assignedStaffName = newStaffName;
    this._status = 'PENDING';
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * IN_PROGRESS -> BLOCKED
   * Only assigned Staff may report field issue.
   */
  reportFieldIssue(actorId: string): void {
    if (this._status !== 'IN_PROGRESS') {
      throw new Error(
        `Cannot report field issue in status ${this._status}. Field issues can only be reported from IN_PROGRESS.`,
      );
    }
    if (this._assignedStaffId !== actorId) {
      throw new Error('Only the assigned staff member may report field issues on this task');
    }
    this._status = 'BLOCKED';
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * BLOCKED -> IN_PROGRESS
   * Only Manager. Same staff continues work.
   */
  resumeBlocked(): void {
    if (this._status !== 'BLOCKED') {
      throw new Error(`Cannot resume task in status ${this._status}. Only BLOCKED tasks can be resumed.`);
    }
    this._status = 'IN_PROGRESS';
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * IN_PROGRESS -> WAITING_REVIEW
   * Only assigned Staff. Server accepts evidence submission.
   */
  submitEvidence(actorId: string): void {
    if (this._status !== 'IN_PROGRESS') {
      throw new Error(`Cannot submit evidence in status ${this._status}. Submissions are only valid from IN_PROGRESS.`);
    }
    if (this._assignedStaffId !== actorId) {
      throw new Error('Only the assigned staff member may submit evidence for this task');
    }
    this._status = 'WAITING_REVIEW';
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * WAITING_REVIEW -> COMPLETED
   * Manager approves task.
   */
  approve(): void {
    if (this._status !== 'WAITING_REVIEW') {
      throw new Error(`Cannot approve task in status ${this._status}. Approvals are only valid from WAITING_REVIEW.`);
    }
    this._status = 'COMPLETED';
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * WAITING_REVIEW -> COMPLETED (with exception flag)
   * Manager approves task with exception.
   */
  approveWithException(exceptionReason: string): void {
    if (this._status !== 'WAITING_REVIEW') {
      throw new Error(
        `Cannot approve task with exception in status ${this._status}. Only WAITING_REVIEW tasks can be approved.`,
      );
    }
    if (!exceptionReason || exceptionReason.trim().length < 5) {
      throw new Error('Exception reason must be at least 5 characters');
    }
    this._status = 'COMPLETED';
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * WAITING_REVIEW -> REWORK_REQUIRED
   * Manager requests rework.
   */
  requestRework(targetedArea: string, reworkReason: string): void {
    if (this._status !== 'WAITING_REVIEW') {
      throw new Error(
        `Cannot request rework in status ${this._status}. Rework can only be requested from WAITING_REVIEW.`,
      );
    }
    if (!targetedArea || targetedArea.trim().length === 0) {
      throw new Error('Targeted area is required for rework request');
    }
    if (!reworkReason || reworkReason.trim().length < 5) {
      throw new Error('Rework reason must be at least 5 characters');
    }
    this._status = 'REWORK_REQUIRED';
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * REWORK_REQUIRED -> WAITING_REVIEW
   * Assigned staff resubmits rework.
   */
  resubmitRework(actorId: string): void {
    if (this._status !== 'REWORK_REQUIRED') {
      throw new Error(
        `Cannot resubmit rework in status ${this._status}. Resubmissions are only valid from REWORK_REQUIRED.`,
      );
    }
    if (this._assignedStaffId !== actorId) {
      throw new Error('Only the assigned staff member may resubmit rework for this task');
    }
    this._status = 'WAITING_REVIEW';
    this._version += 1;
    this._updatedAt = new Date();
  }

  /**
   * CancelTask:
   * Allowed from ANY non-terminal state -> CANCELLED.
   * Terminal states (COMPLETED, CANCELLED) cannot be cancelled (DR-HARD-05).
   */
  cancel(cancelledBy: string, cancelReason: string): void {
    if (this.isTerminal()) {
      throw new Error(`Cannot cancel task in terminal status ${this._status} (DR-HARD-05)`);
    }
    if (!cancelReason || cancelReason.trim().length < 3) {
      throw new Error('Cancellation reason is required (DR-POL-04)');
    }
    this._status = 'CANCELLED';
    this._cancelledBy = cancelledBy;
    this._cancellationReason = cancelReason;
    this._cancelledAt = new Date();
    this._version += 1;
    this._updatedAt = new Date();
  }

  isTerminal(): boolean {
    return this._status === 'COMPLETED' || this._status === 'CANCELLED';
  }
}
