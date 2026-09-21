import type { ITaskRepository } from '../ports/task-repository.port';
import type { IEvidenceRepository } from '../ports/evidence-repository.port';
import type { IObjectStoragePort, PresignedUploadResult } from '../ports/object-storage.port';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../../core/errors';
import type { PresignedUploadRequest } from '@novyx/contracts';
import { randomUUID } from 'node:crypto';

export class PresignEvidenceUploadUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly storagePort: IObjectStoragePort,
    private readonly evidenceRepo?: IEvidenceRepository,
  ) {}

  async execute(
    taskId: string,
    request: PresignedUploadRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<PresignedUploadResult> {
    if (context.actorRole !== 'staff') {
      throw new ForbiddenError('Only Field Staff may request evidence upload URLs');
    }

    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    if (task.assignedStaffId !== context.actorId) {
      throw new ForbiddenError('Cannot upload evidence for a task assigned to another staff member');
    }

    if (task.status !== 'IN_PROGRESS' && task.status !== 'REWORK_REQUIRED') {
      throw new ValidationError(
        `Cannot upload evidence for task in status ${task.status}. Evidence may only be uploaded in IN_PROGRESS or REWORK_REQUIRED.`,
      );
    }

    const sanitizedFileName = request.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    const presigned = await this.storagePort.generatePresignedUploadUrl({
      taskId: task.id,
      actorId: context.actorId,
      fileName: sanitizedFileName,
      contentType: request.contentType,
      expiresInSeconds: 900, // 15-minute temporary presigned URL
    });

    if (this.evidenceRepo) {
      await this.evidenceRepo.saveReservation({
        id: randomUUID(),
        taskId: task.id,
        actorId: context.actorId,
        objectKey: presigned.objectKey,
        storageRef: presigned.storageRef,
        expectedContentType: request.contentType,
        expectedSizeBytes: request.sizeBytes,
        expectedContentHash: request.contentHash,
        createdAt: new Date(),
        expiresAt: presigned.expiresAt,
      });
    }

    return presigned;
  }
}
