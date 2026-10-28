import type { ITaskRepository } from '../ports/task-repository.port';
import type { IEvidenceRepository, EvidenceObjectRecord } from '../ports/evidence-repository.port';
import type { IObjectStoragePort } from '../ports/object-storage.port';
import type { ITreeRepository } from '../../../tree-asset-registry/application/ports/tree-repository.port';
import type { IOperationalUnitOfWork } from '../ports/operational-unit-of-work.port';
import type { AuditService } from '../../../audit-compliance/application/services/audit.service';
import { NotFoundError, ConflictError, ForbiddenError, ValidationError } from '../../../../core/errors';
import type { SubmitEvidenceRequest, StaffExecutionSubmitRequest, HumanRole } from '@novyx/contracts';
import type { Task } from '../../domain/task.entity';
import { randomUUID } from 'node:crypto';

export class SubmitEvidenceUseCase {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly evidenceRepo: IEvidenceRepository,
    private readonly storagePort: IObjectStoragePort,
    private readonly treeRepo: ITreeRepository,
    private readonly auditService: AuditService,
    private readonly uow?: IOperationalUnitOfWork,
  ) {}

  async submitStaffCheckin(
    request: StaffExecutionSubmitRequest & { taskId: string },
    context: { actorId: string; actorRole: HumanRole },
  ): Promise<Task> {
    if (context.actorRole !== 'staff') {
      throw new ForbiddenError('Only Field Staff may submit field check-in');
    }

    const expectedVersion = request.expectedVersion ?? request.version ?? 0;
    const task = await this.taskRepo.findById(request.taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${request.taskId} not found`);
    }

    if (task.assignedStaffId !== context.actorId) {
      throw new ForbiddenError('Cannot submit field check-in for a task assigned to another staff member');
    }

    if (task.version !== expectedVersion) {
      throw new ConflictError('Task version conflict', {
        subtype: 'STALE_VERSION',
        currentVersion: task.version,
        expectedVersion,
      });
    }

    if (task.status !== 'IN_PROGRESS') {
      throw new ValidationError(
        `Cannot submit field check-in in status ${task.status}. Check-in is only valid from IN_PROGRESS.`,
      );
    }

    const tree = await this.treeRepo.findById(task.treeId);
    if (!tree) {
      throw new NotFoundError(`Assigned tree ${task.treeId} not found`);
    }

    const rawGps = request.siteVerification?.gpsCheck as Record<string, unknown> | undefined;
    const gpsVerified = rawGps?.['verified'] === true;
    const hasLocationException = Boolean(request.locationException);

    if (gpsVerified && hasLocationException) {
      throw new ValidationError('Ambiguous payload: cannot provide both verified GPS and LocationException');
    }
    if (!gpsVerified && !hasLocationException) {
      throw new ValidationError(
        'Location verification required: must provide verified GPS (<= 10m) or a valid LocationException',
      );
    }
    const distance =
      typeof rawGps?.['distance'] === 'number'
        ? (rawGps['distance'] as number)
        : typeof rawGps?.['distanceMeters'] === 'number'
          ? (rawGps['distanceMeters'] as number)
          : 999;
    if (gpsVerified && distance > 10) {
      throw new ValidationError(`GPS distance (${distance}m) exceeds 10 meter threshold`);
    }

    const rawQr = request.siteVerification?.qrCheck as Record<string, unknown> | undefined;
    const qrVerified = rawQr?.['verified'] === true || rawQr?.['matched'] === true;
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
      const scannedCode = rawQr?.['scannedCode'] as string | undefined;
      if (scannedCode !== tree.qrCode) {
        throw new ValidationError(
          `QR code "${scannedCode}" does not match assigned tree QR code "${tree.qrCode}" for tree ${tree.id}`,
        );
      }
    }

    const normalizedChecklist = (request.checklist ?? []).map((item) => {
      const record = item as Record<string, unknown>;
      return {
        id: String(record['id'] ?? ''),
        text: String(record['text'] ?? record['label'] ?? ''),
        done: Boolean(record['done'] ?? record['completed']),
      };
    });

    if (normalizedChecklist.length === 0 || normalizedChecklist.some((item) => !item.done)) {
      throw new ValidationError('All submitted checklist items must be 100% completed');
    }

    const normalizedSiteVerification: Record<string, unknown> = {};
    if (rawGps) {
      normalizedSiteVerification['gpsCheck'] = {
        lat: rawGps['lat'],
        lng: rawGps['lng'],
        distance,
        verified: Boolean(rawGps['verified']),
        timestamp: String(rawGps['timestamp'] ?? new Date().toISOString()),
        ...(typeof rawGps['accuracyMeters'] === 'number' ? { accuracyMeters: rawGps['accuracyMeters'] } : {}),
      };
    }
    if (rawQr) {
      normalizedSiteVerification['qrCheck'] = {
        scannedCode: String(rawQr['scannedCode'] ?? ''),
        verified: qrVerified,
        timestamp: String(rawQr['timestamp'] ?? new Date().toISOString()),
      };
    }

    const attemptId = `ATT-${randomUUID().slice(0, 8)}`;
    const performCheckinAcceptance = async (
      taskRepo: ITaskRepository,
      evidenceRepo: IEvidenceRepository,
      auditService: AuditService,
    ) => {
      const authoritativeTask = await taskRepo.findById(request.taskId);
      if (!authoritativeTask || authoritativeTask.version !== expectedVersion) {
        throw new ConflictError('Task version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: authoritativeTask ? authoritativeTask.version : task.version,
          expectedVersion,
        });
      }
      if (authoritativeTask.status !== 'IN_PROGRESS') {
        throw new ValidationError(
          `Cannot submit field check-in in status ${authoritativeTask.status}. Check-in is only valid from IN_PROGRESS.`,
        );
      }

      const existingAttempts = await evidenceRepo.getEvidenceAttempts(task.id);
      const attemptNumber = existingAttempts.length + 1;

      await evidenceRepo.saveEvidenceAttempt({
        id: attemptId,
        taskId: task.id,
        attemptNumber,
        submittedByUserId: context.actorId,
        proofProfile: task.proofProfile,
        proofData: { checklist: normalizedChecklist },
        siteVerification: normalizedSiteVerification,
        locationException: request.locationException as unknown as Record<string, unknown> | undefined,
        identityException: request.identityException as unknown as Record<string, unknown> | undefined,
        notes: request.notes,
        submittedAt: new Date(),
      });

      authoritativeTask.recordStaffCheckin(context.actorId);

      const updated = await taskRepo.update(authoritativeTask, expectedVersion);
      if (!updated) {
        throw new ConflictError('Task version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: authoritativeTask.version,
          expectedVersion,
        });
      }

      await auditService.logEvent({
        actorId: context.actorId,
        actorRole: context.actorRole,
        action: 'SubmitStaffCheckin',
        targetResourceType: 'Task',
        targetResourceId: authoritativeTask.id,
        outcome: 'SUCCESS',
        details: {
          attemptNumber,
          staffCompletedAt: authoritativeTask.staffCompletedAt,
          newStatus: authoritativeTask.status,
          updatedVersion: authoritativeTask.version,
        },
      });

      return authoritativeTask;
    };

    if (this.uow) {
      return await this.uow.execute(async (tx) => {
        return await performCheckinAcceptance(tx.taskRepo, tx.evidenceRepo, tx.auditService);
      });
    }
    return await performCheckinAcceptance(this.taskRepo, this.evidenceRepo, this.auditService);
  }

  async execute(
    request: SubmitEvidenceRequest & { supervisorGpsCheck?: Record<string, unknown> | undefined },
    context: { actorId: string; actorRole: HumanRole },
  ): Promise<Task> {
    if (context.actorRole !== 'staff' && context.actorRole !== 'supervisor') {
      throw new ForbiddenError('Only Field Staff or Field Supervisors may submit evidence');
    }

    const task = await this.taskRepo.findById(request.taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${request.taskId} not found`);
    }

    if (context.actorRole === 'staff' && task.assignedStaffId !== context.actorId) {
      throw new ForbiddenError('Cannot submit evidence for a task assigned to another staff member');
    }

    if (context.actorRole === 'supervisor') {
      if (task.assignedStaffId === context.actorId) {
        throw new ForbiddenError(
          'Separation of Duties violation (DR-HARD-02): Assigned staff member cannot submit supervisor evidence for the same task',
        );
      }
      if (task.assignedSupervisorId && task.assignedSupervisorId !== context.actorId) {
        throw new ForbiddenError('Cannot submit supervisor evidence for a task assigned to another supervisor');
      }
      const existingAttempts = await this.evidenceRepo.getEvidenceAttempts(task.id);
      const hasStaffCheckin =
        Boolean(task.staffCompletedAt) ||
        existingAttempts.some(
          (a) => a.submittedByUserId === task.assignedStaffId || a.proofData?.['submissionStage'] === 'STAFF_EXECUTION',
        );
      if (!hasStaffCheckin) {
        throw new ConflictError(
          'Staff must complete GPS, QR, and checklist check-in before supervisor submits photo evidence',
        );
      }
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

    if (context.actorRole === 'staff' || request.siteVerification) {
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

    // 6. Read-Only Object Storage & Authoritative Reservation Verification (W4-F01, Sections 7, 8, 9)
    const verifiedObjects: EvidenceObjectRecord[] = [];

    for (const uri of photoUrisToVerify) {
      // W4-C03: Strictly reject temporary presigned HTTP/HTTPS URLs
      const objectKey = this.extractObjectKey(uri);

      // Section 8: Authoritative server-created reservation MUST exist
      const reservation = await this.evidenceRepo.findReservationByKey(objectKey);
      if (!reservation) {
        throw new ForbiddenError(
          `Evidence object "${objectKey}" does not have an authorized upload reservation for task ${task.id}`,
        );
      }

      // Cross-task: DENY
      if (reservation.taskId !== task.id) {
        throw new ForbiddenError(
          `Evidence object "${objectKey}" belongs to task ${reservation.taskId}, cannot be submitted for task ${task.id}`,
        );
      }

      // Cross-actor: DENY
      if (reservation.actorId !== context.actorId) {
        throw new ForbiddenError(
          `Evidence object "${objectKey}" was uploaded by another user, cannot be claimed by ${context.actorId}`,
        );
      }

      // Reservation expiry check
      if (reservation.expiresAt < new Date()) {
        throw new ValidationError(`Evidence upload reservation for object "${objectKey}" has expired`);
      }

      // Query actual object integrity from storage port (streaming SHA-256)
      const integrity = await this.storagePort.getObjectIntegrity(objectKey);
      if (!integrity) {
        throw new ValidationError(`Evidence photo object "${objectKey}" was not found in object storage`);
      }

      // Storage metadata cross-checks if present
      if (integrity.taskId && integrity.taskId !== task.id) {
        throw new ForbiddenError(
          `Evidence object "${objectKey}" belongs to task ${integrity.taskId}, cannot be submitted for task ${task.id}`,
        );
      }
      if (integrity.uploadedBy && integrity.uploadedBy !== context.actorId) {
        throw new ForbiddenError(
          `Evidence object "${objectKey}" was uploaded by another user, cannot be claimed by ${context.actorId}`,
        );
      }

      // Content-type mismatch: DENY
      if (
        reservation.expectedContentType &&
        integrity.contentType &&
        reservation.expectedContentType.toLowerCase() !== integrity.contentType.toLowerCase()
      ) {
        throw new ValidationError(
          `Content-type mismatch for evidence object "${objectKey}": expected ${reservation.expectedContentType}, got ${integrity.contentType}`,
        );
      }

      // Size mismatch: DENY (when provided/required)
      if (
        reservation.expectedSizeBytes !== undefined &&
        reservation.expectedSizeBytes !== null &&
        integrity.sizeBytes !== reservation.expectedSizeBytes
      ) {
        throw new ValidationError(
          `Size mismatch for evidence object "${objectKey}": expected ${reservation.expectedSizeBytes} bytes, got ${integrity.sizeBytes} bytes`,
        );
      }

      // Checksum mismatch: DENY
      if (!reservation.expectedContentHash) {
        throw new ValidationError(
          `Evidence upload reservation for object "${objectKey}" is missing expected SHA-256 checksum`,
        );
      }

      const expectedSha256 = reservation.expectedContentHash.toLowerCase();
      const actualSha256 = integrity.sha256.toLowerCase();

      if (expectedSha256 !== actualSha256) {
        throw new ValidationError(
          `Checksum mismatch for evidence object "${objectKey}": expected ${expectedSha256}, got ${actualSha256}`,
        );
      }

      verifiedObjects.push({
        id: `EVO-${randomUUID().slice(0, 8)}`,
        taskId: task.id,
        objectKey,
        storageRef: uri.startsWith('s3://') ? uri : `storage://${objectKey}`,
        contentHash: actualSha256,
        contentType: integrity.contentType || 'image/jpeg',
        sizeBytes: integrity.sizeBytes,
        uploadedByUserId: context.actorId,
        createdAt: new Date(),
      });
    }

    // 7. Atomic DB-side acceptance in ONE PostgreSQL transaction (W4-C01, Section 5)
    const attemptId = `ATT-${randomUUID().slice(0, 8)}`;

    const performDbAcceptance = async (
      taskRepo: ITaskRepository,
      evidenceRepo: IEvidenceRepository,
      auditService: AuditService,
    ) => {
      // Re-verify authoritative version and state under transaction lock
      const authoritativeTask = await taskRepo.findById(request.taskId);
      if (!authoritativeTask || authoritativeTask.version !== request.expectedVersion) {
        throw new ConflictError('Task version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: authoritativeTask ? authoritativeTask.version : task.version,
          expectedVersion: request.expectedVersion,
        });
      }
      if (authoritativeTask.status !== 'IN_PROGRESS') {
        throw new ValidationError(
          `Cannot submit evidence in status ${authoritativeTask.status}. Evidence may only be submitted from IN_PROGRESS.`,
        );
      }

      // Save durable evidence objects metadata
      for (const obj of verifiedObjects) {
        const existing = await evidenceRepo.findEvidenceObjectByKey(obj.objectKey);
        if (!existing) {
          await evidenceRepo.saveEvidenceObject(obj);
        }
      }

      // Save EvidenceAttempt
      const existingAttempts = await evidenceRepo.getEvidenceAttempts(task.id);
      const attemptNumber = existingAttempts.length + 1;

      await evidenceRepo.saveEvidenceAttempt({
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

      // OCC transition Task: IN_PROGRESS -> WAITING_REVIEW
      authoritativeTask.submitEvidence(
        context.actorId,
        context.actorRole === 'supervisor'
          ? {
              supervisorId: context.actorId,
              supervisorName: authoritativeTask.assignedSupervisorName,
              supervisorGpsCheck: request.supervisorGpsCheck,
              supervisorNotes: request.notes,
            }
          : undefined,
      );

      const updated = await taskRepo.update(authoritativeTask, request.expectedVersion);
      if (!updated) {
        throw new ConflictError('Task version conflict', {
          subtype: 'STALE_VERSION',
          currentVersion: authoritativeTask.version,
          expectedVersion: request.expectedVersion,
        });
      }

      // Write SUCCESS audit
      await auditService.logEvent({
        actorId: context.actorId,
        actorRole: context.actorRole,
        action: 'SubmitEvidence',
        targetResourceType: 'Task',
        targetResourceId: authoritativeTask.id,
        outcome: 'SUCCESS',
        details: {
          attemptNumber,
          proofProfile: authoritativeTask.proofProfile,
          newStatus: authoritativeTask.status,
          updatedVersion: authoritativeTask.version,
        },
      });

      return authoritativeTask;
    };

    if (this.uow) {
      return await this.uow.execute(async (tx) => {
        return await performDbAcceptance(tx.taskRepo, tx.evidenceRepo, tx.auditService);
      });
    } else {
      return await performDbAcceptance(this.taskRepo, this.evidenceRepo, this.auditService);
    }
  }

  private extractObjectKey(uri: string): string {
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      throw new ValidationError(
        'Temporary presigned HTTP/HTTPS URLs are rejected as durable evidence identity. Provide server-issued objectKey or storageRef.',
      );
    }
    if (uri.startsWith('s3://')) {
      const withoutScheme = uri.slice(5);
      const slashIdx = withoutScheme.indexOf('/');
      return slashIdx !== -1 ? withoutScheme.slice(slashIdx + 1) : withoutScheme;
    }
    if (uri.startsWith('storage://')) {
      return uri.slice(10);
    }
    return uri;
  }
}
