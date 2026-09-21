export interface CareHistoryProps {
  id: string;
  treeId: string;
  taskId: string;
  taskTitle: string;
  staffId: string;
  staffName: string;
  completedAt: Date;
  status: string;
  hasException?: boolean | undefined;
  exceptionReason?: string | undefined;
  gpsCheck?: Record<string, unknown> | undefined;
  qrCheck?: Record<string, unknown> | undefined;
  beforePhoto?: string | undefined;
  afterPhoto?: string | undefined;
  notes?: string | undefined;
  createdAt?: Date | undefined;
}

export class CareHistoryRecord {
  readonly id: string;
  readonly treeId: string;
  readonly taskId: string;
  readonly taskTitle: string;
  readonly staffId: string;
  readonly staffName: string;
  readonly completedAt: Date;
  readonly status: string;
  readonly hasException: boolean;
  readonly exceptionReason?: string | undefined;
  readonly gpsCheck?: Record<string, unknown> | undefined;
  readonly qrCheck?: Record<string, unknown> | undefined;
  readonly beforePhoto?: string | undefined;
  readonly afterPhoto?: string | undefined;
  readonly notes?: string | undefined;
  readonly createdAt: Date;

  constructor(props: CareHistoryProps) {
    if (props.status !== 'COMPLETED') {
      throw new Error('CareHistory records may only be created for COMPLETED tasks (DR-HARD-07)');
    }
    this.id = props.id;
    this.treeId = props.treeId;
    this.taskId = props.taskId;
    this.taskTitle = props.taskTitle;
    this.staffId = props.staffId;
    this.staffName = props.staffName;
    this.completedAt = props.completedAt;
    this.status = props.status;
    this.hasException = props.hasException ?? false;
    this.exceptionReason = props.exceptionReason;
    this.gpsCheck = props.gpsCheck;
    this.qrCheck = props.qrCheck;
    this.beforePhoto = props.beforePhoto;
    this.afterPhoto = props.afterPhoto;
    this.notes = props.notes;
    this.createdAt = props.createdAt ?? new Date();
  }
}
