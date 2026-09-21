export interface EvidenceObjectRecord {
  id: string;
  taskId: string;
  objectKey: string;
  storageRef: string;
  contentHash: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId: string;
  createdAt?: Date | undefined;
}

export interface EvidenceAttemptRecord {
  id: string;
  taskId: string;
  attemptNumber: number;
  submittedByUserId: string;
  proofProfile: string;
  proofData: Record<string, unknown>;
  siteVerification?: Record<string, unknown> | undefined;
  locationException?: Record<string, unknown> | undefined;
  identityException?: Record<string, unknown> | undefined;
  notes?: string | undefined;
  submittedAt?: Date | undefined;
}

export interface FieldIssueRecord {
  id: string;
  taskId: string;
  reportedByUserId: string;
  issueDescription: string;
  issuePhotoStorageRef: string;
  reportedAt?: Date | undefined;
  resolvedAt?: Date | undefined;
  resolvedByUserId?: string | undefined;
  resolutionNotes?: string | undefined;
}

export interface TaskReviewRecord {
  id: string;
  taskId: string;
  evidenceAttemptId?: string | undefined;
  reviewerId: string;
  decision: string;
  notes?: string | undefined;
  exceptionReason?: string | undefined;
  targetedArea?: string | undefined;
  reworkReason?: string | undefined;
  reviewedAt?: Date | undefined;
}

export interface IEvidenceRepository {
  saveEvidenceObject(obj: EvidenceObjectRecord): Promise<void>;
  findEvidenceObjectByKey(objectKey: string): Promise<EvidenceObjectRecord | null>;
  saveEvidenceAttempt(attempt: EvidenceAttemptRecord): Promise<void>;
  getEvidenceAttempts(taskId: string): Promise<EvidenceAttemptRecord[]>;
  saveFieldIssue(issue: FieldIssueRecord): Promise<void>;
  getFieldIssues(taskId: string): Promise<FieldIssueRecord[]>;
  saveTaskReview(review: TaskReviewRecord): Promise<void>;
  getTaskReviews(taskId: string): Promise<TaskReviewRecord[]>;
}
