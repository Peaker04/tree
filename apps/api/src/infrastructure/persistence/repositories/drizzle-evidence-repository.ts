import { eq, desc, asc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  IEvidenceRepository,
  EvidenceObjectRecord,
  EvidenceAttemptRecord,
  FieldIssueRecord,
  TaskReviewRecord,
} from '../../../modules/work-management/application/ports/evidence-repository.port';
import * as schema from '../schema';

export class DrizzleEvidenceRepository implements IEvidenceRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  async saveEvidenceObject(obj: EvidenceObjectRecord): Promise<void> {
    await this.db.insert(schema.evidenceObjects).values({
      id: obj.id,
      taskId: obj.taskId,
      objectKey: obj.objectKey,
      storageRef: obj.storageRef,
      contentHash: obj.contentHash,
      contentType: obj.contentType,
      sizeBytes: obj.sizeBytes,
      uploadedByUserId: obj.uploadedByUserId,
      createdAt: obj.createdAt ?? new Date(),
    });
  }

  async findEvidenceObjectByKey(objectKey: string): Promise<EvidenceObjectRecord | null> {
    const rows = await this.db
      .select()
      .from(schema.evidenceObjects)
      .where(eq(schema.evidenceObjects.objectKey, objectKey))
      .limit(1);

    if (!rows || rows.length === 0 || !rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      taskId: r.taskId,
      objectKey: r.objectKey,
      storageRef: r.storageRef,
      contentHash: r.contentHash,
      contentType: r.contentType,
      sizeBytes: Number(r.sizeBytes),
      uploadedByUserId: r.uploadedByUserId,
      createdAt: r.createdAt,
    };
  }

  async saveEvidenceAttempt(attempt: EvidenceAttemptRecord): Promise<void> {
    await this.db.insert(schema.evidenceAttempts).values({
      id: attempt.id,
      taskId: attempt.taskId,
      attemptNumber: attempt.attemptNumber,
      submittedByUserId: attempt.submittedByUserId,
      proofProfile: attempt.proofProfile,
      proofData: attempt.proofData,
      siteVerification: attempt.siteVerification ?? null,
      locationException: attempt.locationException ?? null,
      identityException: attempt.identityException ?? null,
      notes: attempt.notes ?? null,
      submittedAt: attempt.submittedAt ?? new Date(),
    });
  }

  async getEvidenceAttempts(taskId: string): Promise<EvidenceAttemptRecord[]> {
    const rows = await this.db
      .select()
      .from(schema.evidenceAttempts)
      .where(eq(schema.evidenceAttempts.taskId, taskId))
      .orderBy(asc(schema.evidenceAttempts.attemptNumber));

    return rows.map((r) => ({
      id: r.id,
      taskId: r.taskId,
      attemptNumber: r.attemptNumber,
      submittedByUserId: r.submittedByUserId,
      proofProfile: r.proofProfile,
      proofData: r.proofData as Record<string, unknown>,
      siteVerification: (r.siteVerification as Record<string, unknown>) ?? undefined,
      locationException: (r.locationException as Record<string, unknown>) ?? undefined,
      identityException: (r.identityException as Record<string, unknown>) ?? undefined,
      notes: r.notes ?? undefined,
      submittedAt: r.submittedAt,
    }));
  }

  async saveFieldIssue(issue: FieldIssueRecord): Promise<void> {
    await this.db.insert(schema.fieldIssues).values({
      id: issue.id,
      taskId: issue.taskId,
      reportedByUserId: issue.reportedByUserId,
      issueDescription: issue.issueDescription,
      issuePhotoStorageRef: issue.issuePhotoStorageRef,
      reportedAt: issue.reportedAt ?? new Date(),
      resolvedAt: issue.resolvedAt ?? null,
      resolvedByUserId: issue.resolvedByUserId ?? null,
      resolutionNotes: issue.resolutionNotes ?? null,
    });
  }

  async getFieldIssues(taskId: string): Promise<FieldIssueRecord[]> {
    const rows = await this.db
      .select()
      .from(schema.fieldIssues)
      .where(eq(schema.fieldIssues.taskId, taskId))
      .orderBy(desc(schema.fieldIssues.reportedAt));

    return rows.map((r) => ({
      id: r.id,
      taskId: r.taskId,
      reportedByUserId: r.reportedByUserId,
      issueDescription: r.issueDescription,
      issuePhotoStorageRef: r.issuePhotoStorageRef,
      reportedAt: r.reportedAt,
      resolvedAt: r.resolvedAt ?? undefined,
      resolvedByUserId: r.resolvedByUserId ?? undefined,
      resolutionNotes: r.resolutionNotes ?? undefined,
    }));
  }

  async saveTaskReview(review: TaskReviewRecord): Promise<void> {
    await this.db.insert(schema.taskReviews).values({
      id: review.id,
      taskId: review.taskId,
      evidenceAttemptId: review.evidenceAttemptId ?? null,
      reviewerId: review.reviewerId,
      decision: review.decision,
      notes: review.notes ?? null,
      exceptionReason: review.exceptionReason ?? null,
      targetedArea: review.targetedArea ?? null,
      reworkReason: review.reworkReason ?? null,
      reviewedAt: review.reviewedAt ?? new Date(),
    });
  }

  async getTaskReviews(taskId: string): Promise<TaskReviewRecord[]> {
    const rows = await this.db
      .select()
      .from(schema.taskReviews)
      .where(eq(schema.taskReviews.taskId, taskId))
      .orderBy(desc(schema.taskReviews.reviewedAt));

    return rows.map((r) => ({
      id: r.id,
      taskId: r.taskId,
      evidenceAttemptId: r.evidenceAttemptId ?? undefined,
      reviewerId: r.reviewerId,
      decision: r.decision,
      notes: r.notes ?? undefined,
      exceptionReason: r.exceptionReason ?? undefined,
      targetedArea: r.targetedArea ?? undefined,
      reworkReason: r.reworkReason ?? undefined,
      reviewedAt: r.reviewedAt,
    }));
  }
}
