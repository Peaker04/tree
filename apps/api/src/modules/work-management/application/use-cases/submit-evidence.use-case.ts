import type { ITaskRepository } from '../ports/task-repository.port';
import type { IEvidenceRepository } from '../ports/evidence-repository.port';
import type { IObjectStoragePort } from '../ports/object-storage.port';
import type { ITreeRepository } from '../../../tree-asset-registry/application/ports/tree-repository.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../../../core/errors';
import type { SubmitEvidenceRequest } from '@novyx/contracts';
import type { Task } from '../../domain/task.entity';
import { randomUUID } from 'node:crypto';

export class SubmitEvidenceUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly evidenceRepo: IEvidenceRepository,
    private readonly storagePort: IObjectStoragePort,
    private readonly treeRepo: ITreeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    request: SubmitEvidenceRequest,
    context: { actorId: string; actorRole: 'staff' | 'manager' | 'admin' },
  ): Promise<Task> {
    if (context.actorRole !== 'staff') {
      throw new ForbiddenError('Only Field Staff may submit evidence');
    }

    const task = await this.taskRepo.findById(request.taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${request.taskId} not found`);
    }

    if (task.assignedStaffId !== context.actorId) {
      throw new ForbiddenError('Cannot submit evidence for a task assigned to another staff member');
    }

    if (task.version !== request.expectedVersion) {
      throw new ConflictError('Task version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: task.version,
        expectedVersion: request.expectedVersion,
      });
    }

    if (task.status !== 'IN_PROGRESS') {
      throw new ValidationError(
        `Cannot submit evidence in status ${task.status}. Evidence may only be submitted from IN_PROGRESS.`,
      );
    }

    // 1. Proof Profile match
    if (request.proof.proofProfile !== task.proofProfile) {
      throw new ValidationError(
        `Proof profile mismatch: Task requires ${task.proofProfile}, but submission provided ${request.proof.proofProfile}`,
      );
    }

    // 2. Tree validation for QR check
    const tree = await this.treeRepo.findById(task.treeId);
    if (!tree) {
      throw new NotFoundError(`Assigned tree ${task.treeId} not found`);
    }

    // 3. Location Verification (Section 19: GPS <= 10m or LocationException)
    const gpsVerified = request.siteVerification?.gpsCheck?.verified === true;
    const hasLocationException = Boolean(request.locationException);

    if (gpsVerified && hasLocationException) {
      throw new ValidationError('Ambiguous payload: cannot provide both verified GPS and LocationException');
    }
    if (!gpsVerified && !hasLocationException) {
      throw new ValidationError(
        'Location verification required: must provide verified GPS (<= 10m) or a valid LocationException',
      );
    }
    if (gpsVerified) {
      const distance = request.siteVerification?.gpsCheck?.distance ?? 999;
      if (distance > 10) {
        throw new ValidationError(`GPS distance (${distance}m) exceeds 10 meter threshold`);
      }
    }

    // 4. Identity Verification (Section 20: QR exact match to Task.treeId or IdentityException)
    const qrVerified = request.siteVerification?.qrCheck?.verified === true;
    const hasIdentityException = Boolean(request.identityException);

    if (qrVerified && hasIdentityException) {
      throw new ValidationError('Ambiguous payload: cannot provide both verified QR and IdentityException');
    }
    if (!qrVerified && !hasIdentityException) {
      throw new ValidationError(
        'Identity verification required: must provide verified QR code or a valid IdentityException',
      );
    }
    if (qrVerified) {
      const scannedCode = request.siteVerification?.qrCheck?.scannedCode;
      if (scannedCode !== tree.qrCode) {
        throw new ValidationError(
          `QR code "${scannedCode}" does not match assigned tree QR code "${tree.qrCode}" for tree ${tree.id}`,
        );
      }
    }

    // 5. Proof Profile specific payload verification
    const photoUrisToVerify: string[] = [];

    if (request.proof.proofProfile === 'CHANGE_PROOF') {
      photoUrisToVerify.push(request.proof.beforePhotoUri, request.proof.afterPhotoUri);
      if (!request.proof.checklist || request.proof.checklist.length === 0) {
        throw new ValidationError('CHANGE_PROOF requires checklist items');
      }
      const incomplete = request.proof.checklist.some((item) => !item.done);
      if (incomplete) {
        throw new ValidationError('All submitted checklist items must be 100% completed (done: true)');
      }
    } else if (request.proof.proofProfile === 'SERVICE_PROOF') {
      photoUrisToVerify.push(request.proof.completionPhotoUri);
      if (!request.proof.checklist || request.proof.checklist.length === 0) {
        throw new ValidationError('SERVICE_PROOF requires checklist items');
      }
      const incomplete = request.proof.checklist.some((item) => !item.done);
      if (incomplete) {
        throw new ValidationError('All submitted checklist items must be 100% completed (done: true)');
      }
    } else if (request.proof.proofProfile === 'INSPECTION_PROOF') {
      if (!request.proof.conditionPhotos || request.proof.conditionPhotos.length === 0) {
        throw new ValidationError('INSPECTION_PROOF requires at least one condition photo');
      }
      photoUrisToVerify.push(...request.proof.conditionPhotos);
      if (!request.proof.findings) {
        throw new ValidationError('INSPECTION_PROOF requires structured findings');
      }
    }

    if (request.locationException) {
      photoUrisToVerify.push(request.locationException.explanationPhotoUri);
    }
    if (request.identityException) {
      photoUrisToVerify.push(request.identityException.damagedQrPhotoUri);
    }

    // 6. Object Storage verification and durable metadata persistence (Sections 30, 31, 32)
    for (const uri of photoUrisToVerify) {
      const objectKey = this.extractObjectKey(uri);
      const metadata = await this.storagePort.getObjectMetadata(objectKey);
      if (!metadata) {
        throw new ValidationError(`Evidence photo object "${objectKey}" was not found in object storage`);
      }

      const existingObj = await this.evidenceRepo.findEvidenceObjectByKey(objectKey);
      if (!existingObj) {
        await this.evidenceRepo.saveEvidenceObject({
          id: `EVO-${randomUUID().slice(0, 8)}`,
          taskId: task.id,
          objectKey,
          storageRef: uri.startsWith('s3://') ? uri : `storage://${objectKey}`,
          contentHash: metadata.contentHash || metadata.etag || 'hash-verified',
          contentType: metadata.contentType || 'image/jpeg',
          sizeBytes: metadata.sizeBytes,
          uploadedByUserId: context.actorId,
          createdAt: new Date(),
        });
      }
    }

    // 7. Save immutable EvidenceAttempt (Section 21)
    const existingAttempts = await this.evidenceRepo.getEvidenceAttempts(task.id);
    const attemptNumber = existingAttempts.length + 1;
    const attemptId = `ATT-${randomUUID().slice(0, 8)}`;

    await this.evidenceRepo.saveEvidenceAttempt({
      id: attemptId,
      taskId: task.id,
      attemptNumber,
      submittedByUserId: context.actorId, // Historical authorship preserved!
      proofProfile: request.proof.proofProfile,
      proofData: request.proof as unknown as Record<string, unknown>,
      siteVerification: request.siteVerification as unknown as Record<string, unknown> | undefined,
      locationException: request.locationException as unknown as Record<string, unknown> | undefined,
      identityException: request.identityException as unknown as Record<string, unknown> | undefined,
      notes: request.notes,
      submittedAt: new Date(),
    });

    // 8. Mutate task to WAITING_REVIEW
    task.submitEvidence(context.actorId);

    const updated = await this.taskRepo.update(task, request.expectedVersion);
    if (!updated) {
      const current = await this.taskRepo.findById(request.taskId);
      throw new ConflictError('Task version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: current ? current.version : task.version,
        expectedVersion: request.expectedVersion,
      });
    }

    await this.auditService.logEvent({
      actorId: context.actorId,
      actorRole: context.actorRole,
      action: 'SubmitEvidence',
      targetResourceType: 'Task',
      targetResourceId: task.id,
      outcome: 'SUCCESS',
      details: {
        attemptNumber,
        proofProfile: task.proofProfile,
        newStatus: task.status,
        updatedVersion: task.version,
      },
    });

    return task;
  }

  private extractObjectKey(uri: string): string {
    if (uri.startsWith('s3://')) {
      const withoutScheme = uri.slice(5);
      const slashIdx = withoutScheme.indexOf('/');
      return slashIdx !== -1 ? withoutScheme.slice(slashIdx + 1) : withoutScheme;
    }
    if (uri.startsWith('storage://')) {
      return uri.slice(10);
    }
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const url = new URL(uri);
      return url.pathname.replace(/^\/+/, '');
    }
    return uri;
  }
}
