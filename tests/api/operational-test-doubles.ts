import { randomUUID } from 'node:crypto';
import type {
  ITreeRepository,
  ListTreesParams,
  ListTreesResult,
} from '../../apps/api/src/modules/tree-asset-registry/application/ports/tree-repository.port';
import type { ICareHistoryRepository } from '../../apps/api/src/modules/tree-asset-registry/application/ports/care-history-repository.port';
import type { ITaskTypeRepository } from '../../apps/api/src/modules/policy-template-governance/application/ports/task-type-repository.port';
import type { IPolicyRepository } from '../../apps/api/src/modules/policy-template-governance/application/ports/policy-repository.port';
import type {
  ITaskRepository,
  ListTasksParams,
  ListTasksResult,
} from '../../apps/api/src/modules/work-management/application/ports/task-repository.port';
import type {
  IEvidenceRepository,
  EvidenceObjectRecord,
  EvidenceAttemptRecord,
  FieldIssueRecord,
  TaskReviewRecord,
} from '../../apps/api/src/modules/work-management/application/ports/evidence-repository.port';
import type {
  IIdempotencyRepository,
  IdempotencyRecord,
} from '../../apps/api/src/modules/work-management/application/ports/idempotency-repository.port';
import type { IOperationalScopeRepository } from '../../apps/api/src/modules/work-management/application/ports/operational-scope-repository.port';
import type {
  IObjectStoragePort,
  PresignedUploadResult,
  ObjectMetadata,
} from '../../apps/api/src/modules/work-management/application/ports/object-storage.port';
import type { Tree } from '../../apps/api/src/modules/tree-asset-registry/domain/tree.entity';
import type { CareHistoryRecord } from '../../apps/api/src/modules/tree-asset-registry/domain/care-history.entity';
import type { TaskType } from '../../apps/api/src/modules/policy-template-governance/domain/task-type.entity';
import type {
  ProofPolicyVersion,
  ChecklistTemplateVersion,
} from '../../apps/api/src/modules/policy-template-governance/domain/policy-version.entity';
import { Task } from '../../apps/api/src/modules/work-management/domain/task.entity';

export class InMemoryTreeRepository implements ITreeRepository {
  public trees = new Map<string, Tree>();

  async findById(id: string): Promise<Tree | null> {
    return this.trees.get(id) ?? null;
  }

  async findByQrCode(qrCode: string): Promise<Tree | null> {
    for (const tree of this.trees.values()) {
      if (tree.qrCode === qrCode) return tree;
    }
    return null;
  }

  async save(tree: Tree): Promise<void> {
    this.trees.set(tree.id, tree);
  }

  async update(tree: Tree, expectedVersion: number): Promise<boolean> {
    const existing = this.trees.get(tree.id);
    if (!existing || existing.version !== expectedVersion) {
      return false;
    }
    this.trees.set(tree.id, tree);
    return true;
  }

  async list(params: ListTreesParams): Promise<ListTreesResult> {
    let items = Array.from(this.trees.values());
    if (params.q) {
      const q = params.q.toLowerCase();
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) || t.species.toLowerCase().includes(q) || t.qrCode.toLowerCase().includes(q),
      );
    }
    if (params.riskStatus) {
      items = items.filter((t) => t.riskStatus === params.riskStatus);
    }
    const limit = params.limit ?? 50;
    const hasMore = items.length > limit;
    const pageItems = items.slice(0, limit);
    return {
      trees: pageItems,
      nextCursor: hasMore && pageItems.length > 0 ? pageItems[pageItems.length - 1]!.id : null,
      hasMore,
    };
  }
}

export class InMemoryCareHistoryRepository implements ICareHistoryRepository {
  public records: CareHistoryRecord[] = [];

  async findByTreeId(treeId: string): Promise<CareHistoryRecord[]> {
    return this.records
      .filter((r) => r.treeId === treeId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  async save(record: CareHistoryRecord): Promise<void> {
    this.records.push(record);
  }
}

export class InMemoryTaskTypeRepository implements ITaskTypeRepository {
  public taskTypes = new Map<string, TaskType>();

  async findById(id: string): Promise<TaskType | null> {
    return this.taskTypes.get(id) ?? null;
  }

  async findByName(name: string): Promise<TaskType | null> {
    for (const tt of this.taskTypes.values()) {
      if (tt.name.toLowerCase() === name.toLowerCase()) return tt;
    }
    return null;
  }

  async save(taskType: TaskType): Promise<void> {
    this.taskTypes.set(taskType.id, taskType);
  }

  async update(taskType: TaskType, expectedVersion: number): Promise<boolean> {
    const existing = this.taskTypes.get(taskType.id);
    if (!existing || existing.version !== expectedVersion) {
      return false;
    }
    this.taskTypes.set(taskType.id, taskType);
    return true;
  }

  async listAll(): Promise<TaskType[]> {
    return Array.from(this.taskTypes.values());
  }
}

export class InMemoryPolicyRepository implements IPolicyRepository {
  public proofPolicies: ProofPolicyVersion[] = [];
  public checklistTemplates: ChecklistTemplateVersion[] = [];

  async findLatestProofPolicy(taskTypeId: string): Promise<ProofPolicyVersion | null> {
    const matches = this.proofPolicies
      .filter((p) => p.taskTypeId === taskTypeId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return matches[0] ?? null;
  }

  async saveProofPolicyVersion(policy: ProofPolicyVersion): Promise<void> {
    this.proofPolicies.push(policy);
  }

  async findLatestChecklistTemplate(taskTypeId: string): Promise<ChecklistTemplateVersion | null> {
    const matches = this.checklistTemplates
      .filter((t) => t.taskTypeId === taskTypeId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
    return matches[0] ?? null;
  }

  async saveChecklistTemplateVersion(template: ChecklistTemplateVersion): Promise<void> {
    this.checklistTemplates.push(template);
  }
}

export class InMemoryTaskRepository implements ITaskRepository {
  public tasks = new Map<string, Task>();
  public historicalAuthors = new Map<string, Set<string>>();

  private clone(task: Task): Task {
    return new Task({
      id: task.id,
      version: task.version,
      title: task.title,
      description: task.description,
      taskTypeId: task.taskTypeId,
      taskTypeName: task.taskTypeName,
      proofProfile: task.proofProfile,
      policyVersionId: task.policyVersionId,
      checklistTemplateVersionId: task.checklistTemplateVersionId,
      treeId: task.treeId,
      treeName: task.treeName,
      treeAddress: task.treeAddress,
      assignedStaffId: task.assignedStaffId,
      assignedStaffName: task.assignedStaffName,
      deadline: task.deadline,
      status: task.status,
      checklistSnapshot: task.checklistSnapshot ? [...task.checklistSnapshot] : undefined,
      cancellationReason: task.cancellationReason,
      cancelledBy: task.cancelledBy,
      cancelledAt: task.cancelledAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  }

  async findById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task ? this.clone(task) : null;
  }

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, this.clone(task));
  }

  async update(task: Task, expectedVersion: number): Promise<boolean> {
    const existing = this.tasks.get(task.id);
    if (!existing || existing.version !== expectedVersion) {
      return false;
    }
    this.tasks.set(task.id, this.clone(task));
    return true;
  }

  async list(params: ListTasksParams): Promise<ListTasksResult> {
    let items = Array.from(this.tasks.values()).map((t) => this.clone(t));
    if (params.staffId) {
      items = items.filter((t) => t.assignedStaffId === params.staffId);
    }
    if (params.status) {
      items = items.filter((t) => t.status === params.status);
    }
    if (params.treeId) {
      items = items.filter((t) => t.treeId === params.treeId);
    }
    const limit = params.limit ?? 50;
    const hasMore = items.length > limit;
    const pageItems = items.slice(0, limit);
    return {
      tasks: pageItems,
      nextCursor: hasMore && pageItems.length > 0 ? pageItems[pageItems.length - 1]!.id : null,
      hasMore,
    };
  }

  async getHistoricalSubmissionAuthorIds(taskId: string): Promise<string[]> {
    const authors = this.historicalAuthors.get(taskId);
    return authors ? Array.from(authors) : [];
  }

  recordHistoricalAuthor(taskId: string, authorId: string): void {
    if (!this.historicalAuthors.has(taskId)) {
      this.historicalAuthors.set(taskId, new Set());
    }
    this.historicalAuthors.get(taskId)!.add(authorId);
  }
}

export class InMemoryEvidenceRepository implements IEvidenceRepository {
  public objects = new Map<string, EvidenceObjectRecord>();
  public attempts: EvidenceAttemptRecord[] = [];
  public issues: FieldIssueRecord[] = [];
  public reviews: TaskReviewRecord[] = [];

  constructor(private readonly taskRepo?: InMemoryTaskRepository) {}

  async saveEvidenceObject(obj: EvidenceObjectRecord): Promise<void> {
    this.objects.set(obj.objectKey, obj);
  }

  async findEvidenceObjectByKey(objectKey: string): Promise<EvidenceObjectRecord | null> {
    return this.objects.get(objectKey) ?? null;
  }

  async saveEvidenceAttempt(attempt: EvidenceAttemptRecord): Promise<void> {
    this.attempts.push(attempt);
    if (this.taskRepo) {
      this.taskRepo.recordHistoricalAuthor(attempt.taskId, attempt.submittedByUserId);
    }
  }

  async getEvidenceAttempts(taskId: string): Promise<EvidenceAttemptRecord[]> {
    return this.attempts.filter((a) => a.taskId === taskId).sort((a, b) => a.attemptNumber - b.attemptNumber);
  }

  async saveFieldIssue(issue: FieldIssueRecord): Promise<void> {
    this.issues.push(issue);
  }

  async getFieldIssues(taskId: string): Promise<FieldIssueRecord[]> {
    return this.issues.filter((i) => i.taskId === taskId);
  }

  async saveTaskReview(review: TaskReviewRecord): Promise<void> {
    this.reviews.push(review);
  }

  async getTaskReviews(taskId: string): Promise<TaskReviewRecord[]> {
    return this.reviews.filter((r) => r.taskId === taskId);
  }
}

export class InMemoryIdempotencyRepository implements IIdempotencyRepository {
  public records = new Map<string, IdempotencyRecord>();

  private key(actorId: string, idempotencyKey: string): string {
    return `${actorId}:::${idempotencyKey}`;
  }

  async findByKey(actorId: string, idempotencyKey: string): Promise<IdempotencyRecord | null> {
    return this.records.get(this.key(actorId, idempotencyKey)) ?? null;
  }

  async save(record: IdempotencyRecord): Promise<void> {
    this.records.set(this.key(record.actorId, record.idempotencyKey), record);
  }
}

export class InMemoryOperationalScopeRepository implements IOperationalScopeRepository {
  public scopes = new Map<string, Set<string>>();

  async hasScope(managerId: string, scopeKey: string): Promise<boolean> {
    const userScopes = this.scopes.get(managerId);
    if (!userScopes) return false;
    return userScopes.has('GLOBAL') || userScopes.has(scopeKey);
  }

  async addScope(managerId: string, scopeKey: string): Promise<void> {
    if (!this.scopes.has(managerId)) {
      this.scopes.set(managerId, new Set());
    }
    this.scopes.get(managerId)!.add(scopeKey);
  }

  async getScopes(managerId: string): Promise<string[]> {
    const userScopes = this.scopes.get(managerId);
    return userScopes ? Array.from(userScopes) : [];
  }
}

export class InMemoryObjectStorageAdapter implements IObjectStoragePort {
  public storedObjects = new Map<string, { data: Buffer; contentType: string; metadata: ObjectMetadata }>();

  async generatePresignedUploadUrl(params: {
    taskId: string;
    actorId: string;
    fileName: string;
    contentType: string;
    expiresInSeconds?: number | undefined;
  }): Promise<PresignedUploadResult> {
    const uniqueId = randomUUID();
    const objectKey = `tasks/${params.taskId}/evidence/${uniqueId}_${params.fileName}`;
    return {
      objectKey,
      storageRef: `s3://mock-bucket/${objectKey}`,
      uploadUrl: `https://storage.local.test/mock-bucket/${objectKey}?signature=test-sig`,
      expiresAt: new Date(Date.now() + (params.expiresInSeconds ?? 900) * 1000),
    };
  }

  async generatePresignedDownloadUrl(objectKey: string, _expiresInSeconds = 900): Promise<string> {
    return `https://storage.local.test/mock-bucket/${objectKey}?signature=download-sig`;
  }

  async getObjectMetadata(objectKey: string): Promise<ObjectMetadata | null> {
    const obj = this.storedObjects.get(objectKey);
    return obj ? obj.metadata : null;
  }

  async deleteObject(objectKey: string): Promise<void> {
    this.storedObjects.delete(objectKey);
  }

  async putObjectDirect(params: {
    objectKey: string;
    data: Buffer;
    contentType: string;
  }): Promise<{ contentHash?: string; etag?: string }> {
    const etag = 'mock-md5-hash-123';
    this.storedObjects.set(params.objectKey, {
      data: params.data,
      contentType: params.contentType,
      metadata: {
        sizeBytes: params.data.length,
        contentType: params.contentType,
        etag,
        contentHash: etag,
      },
    });
    return { etag, contentHash: etag };
  }
}
