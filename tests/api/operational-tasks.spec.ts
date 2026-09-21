import { describe, it, expect, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../apps/api/src/app';
import {
  InMemoryUserRepository,
  InMemorySessionRepository,
  InMemoryAuditWriter,
  InMemoryIamUnitOfWork,
} from './test-doubles';
import {
  InMemoryTreeRepository,
  InMemoryCareHistoryRepository,
  InMemoryTaskTypeRepository,
  InMemoryPolicyRepository,
  InMemoryTaskRepository,
  InMemoryEvidenceRepository,
  InMemoryIdempotencyRepository,
  InMemoryOperationalScopeRepository,
  InMemoryObjectStorageAdapter,
} from './operational-test-doubles';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';
import { randomUUID } from 'node:crypto';

describe('Phase 13 Wave 4: Operational Domain API Integration Tests (Sections 63, 64, 65, 66)', () => {
  let app: FastifyInstance;
  let userRepo: InMemoryUserRepository;
  let sessionRepo: InMemorySessionRepository;
  let auditWriter: InMemoryAuditWriter;
  let unitOfWork: InMemoryIamUnitOfWork;
  let tokenService: CryptoTokenService;

  let treeRepo: InMemoryTreeRepository;
  let careHistoryRepo: InMemoryCareHistoryRepository;
  let taskTypeRepo: InMemoryTaskTypeRepository;
  let policyRepo: InMemoryPolicyRepository;
  let taskRepo: InMemoryTaskRepository;
  let evidenceRepo: InMemoryEvidenceRepository;
  let idempotencyRepo: InMemoryIdempotencyRepository;
  let scopeRepo: InMemoryOperationalScopeRepository;
  let storagePort: InMemoryObjectStorageAdapter;

  const adminId = 'admin-user-01';
  const managerId = 'manager-user-01';
  const otherManagerId = 'manager-user-02';
  const staff1Id = 'staff-user-01';
  const staff2Id = 'staff-user-02';

  let adminToken: string;
  let managerToken: string;
  let otherManagerToken: string;
  let staff1Token: string;
  let staff2Token: string;

  async function createSessionFor(userId: string): Promise<string> {
    const rawToken = `tok_${randomUUID()}`;
    const tokenHash = tokenService.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    await sessionRepo.createSession({
      id: randomUUID(),
      userId,
      tokenFamily: randomUUID(),
      accessTokenHash: tokenHash,
      refreshTokenHash: tokenService.hashToken(`ref_${randomUUID()}`),
      authVersion: 1,
      sessionVersion: 1,
      accessExpiresAt: expiresAt,
      refreshExpiresAt: expiresAt,
      expiresAt,
    });
    return rawToken;
  }

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    sessionRepo = new InMemorySessionRepository();
    auditWriter = new InMemoryAuditWriter();
    unitOfWork = new InMemoryIamUnitOfWork(userRepo, sessionRepo, auditWriter);
    tokenService = new CryptoTokenService();

    treeRepo = new InMemoryTreeRepository();
    careHistoryRepo = new InMemoryCareHistoryRepository();
    taskTypeRepo = new InMemoryTaskTypeRepository();
    policyRepo = new InMemoryPolicyRepository();
    taskRepo = new InMemoryTaskRepository();
    evidenceRepo = new InMemoryEvidenceRepository(taskRepo);
    idempotencyRepo = new InMemoryIdempotencyRepository();
    scopeRepo = new InMemoryOperationalScopeRepository();
    storagePort = new InMemoryObjectStorageAdapter();

    // 1. Seed Active Users: Admin, Manager, Other Manager, Staff 1, Staff 2
    await userRepo.create({
      id: adminId,
      version: 1,
      email: 'admin@novyx.test',
      initialRole: 'admin',
      role: 'admin',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });
    await userRepo.create({
      id: managerId,
      version: 1,
      email: 'manager@novyx.test',
      initialRole: 'manager',
      role: 'manager',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });
    await userRepo.create({
      id: otherManagerId,
      version: 1,
      email: 'other.manager@novyx.test',
      initialRole: 'manager',
      role: 'manager',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });
    await userRepo.create({
      id: staff1Id,
      version: 1,
      email: 'staff1@novyx.test',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });
    await userRepo.create({
      id: staff2Id,
      version: 1,
      email: 'staff2@novyx.test',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      authVersion: 1,
    });

    adminToken = await createSessionFor(adminId);
    managerToken = await createSessionFor(managerId);
    otherManagerToken = await createSessionFor(otherManagerId);
    staff1Token = await createSessionFor(staff1Id);
    staff2Token = await createSessionFor(staff2Id);

    app = buildApp({
      userRepository: userRepo,
      sessionRepository: sessionRepo,
      auditWriter,
      unitOfWork,
      tokenService,
      treeRepository: treeRepo,
      careHistoryRepository: careHistoryRepo,
      taskTypeRepository: taskTypeRepo,
      policyRepository: policyRepo,
      taskRepository: taskRepo,
      evidenceRepository: evidenceRepo,
      idempotencyRepository: idempotencyRepo,
      operationalScopeRepository: scopeRepo,
      storagePort,
    });
  });

  describe('Section 63: Full E2E Happy Path Server Flow', () => {
    it('executes full create -> execute -> submit -> review -> CareHistory E2E lifecycle', async () => {
      // 1. Establish Manager Operational Scope
      await scopeRepo.addScope(managerId, 'TREE-001');

      // 2. Admin creates Tree
      const treeRes = await app.inject({
        method: 'POST',
        url: '/v1/governance/trees',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          treeId: 'TREE-001',
          qrCode: 'QR-TREE-001',
          name: 'Central Park Mahogany #1',
          species: 'Swietenia macrophylla',
          lat: 10.7769,
          lng: 106.7009,
          address: 'Central Park, District 1, HCMC',
          healthStatus: 'Cần chăm sóc',
          ageYears: 25,
          riskStatus: 'healthy',
        },
      });
      expect(treeRes.statusCode).toBe(201);
      const createdTree = treeRes.json().data;
      expect(createdTree.id).toBe('TREE-001');
      expect(createdTree.qrCode).toBe('QR-TREE-001');

      // 3. Admin creates & activates TaskType
      const taskTypeRes = await app.inject({
        method: 'POST',
        url: '/v1/governance/task-types',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: 'Canopy Pruning & Deep Watering',
          defaultProofProfile: 'CHANGE_PROOF',
          description: 'Quarterly seasonal canopy maintenance',
        },
      });
      expect(taskTypeRes.statusCode).toBe(201);
      const taskType = taskTypeRes.json().data;
      expect(taskType.isActive).toBe(true);

      // 4. Admin publishes Proof Policy Version
      const policyRes = await app.inject({
        method: 'POST',
        url: '/v1/governance/policies/proof',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          taskTypeId: taskType.id,
          proofProfile: 'CHANGE_PROOF',
          policyDescription: 'Requires before + after photo and safety checklist',
        },
      });
      expect(policyRes.statusCode).toBe(201);
      const policy = policyRes.json().data;
      expect(policy.versionNumber).toBe(1);

      // 5. Admin publishes Checklist Template Version
      const templateRes = await app.inject({
        method: 'POST',
        url: '/v1/governance/policies/checklist',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          taskTypeId: taskType.id,
          templateItems: [
            { text: 'Inspect overhead power lines', order: 1 },
            { text: 'Verify pedestrian safety zone', order: 2 },
          ],
          templateDescription: 'Pruning safety checklist template v1',
        },
      });
      expect(templateRes.statusCode).toBe(201);
      const template = templateRes.json().data;
      expect(template.versionNumber).toBe(1);

      // 6. Manager CreateTask (OP-03) with Idempotency Key
      const createIdempotencyKey = randomUUID();
      const createTaskPayload = {
        title: 'Prune Mahogany Canopy',
        description: 'Remove deadwood and water roots',
        taskTypeId: taskType.id,
        treeId: 'TREE-001',
        assignedStaffId: staff1Id,
        deadline: '2026-10-15T18:00:00Z',
      };

      const createTaskRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: {
          authorization: `Bearer ${managerToken}`,
          'idempotency-key': createIdempotencyKey,
        },
        payload: createTaskPayload,
      });
      expect(createTaskRes.statusCode).toBe(201);
      const task = createTaskRes.json().data;
      expect(task.status).toBe('PENDING');
      expect(task.proofProfile).toBe('CHANGE_PROOF');
      expect(task.treeId).toBe('TREE-001');
      expect(task.checklist).toHaveLength(2);

      // 6b. Verify Idempotent Replay on CreateTask
      const replayCreateRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: {
          authorization: `Bearer ${managerToken}`,
          'idempotency-key': createIdempotencyKey,
        },
        payload: createTaskPayload,
      });
      expect(replayCreateRes.statusCode).toBe(201);
      expect(replayCreateRes.json().data.id).toBe(task.id);
      expect(taskRepo.tasks.size).toBe(1); // No duplicate task!

      // 7. Staff views assigned task (OP-02)
      const staffViewRes = await app.inject({
        method: 'GET',
        url: `/v1/tasks/${task.id}`,
        headers: { authorization: `Bearer ${staff1Token}` },
      });
      expect(staffViewRes.statusCode).toBe(200);
      expect(staffViewRes.json().data.id).toBe(task.id);

      // 8. Staff starts task (OP-05): PENDING -> IN_PROGRESS
      const startRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/start`,
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: {
          taskId: task.id,
          expectedVersion: task.version,
        },
      });
      expect(startRes.statusCode).toBe(200);
      const startedTask = startRes.json().data;
      expect(startedTask.status).toBe('IN_PROGRESS');
      expect(startedTask.version).toBe(task.version + 1);

      // 9. Staff requests presigned upload URLs for evidence photos
      const presignBeforeRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/evidence/presign`,
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: {
          fileName: 'before.jpg',
          contentType: 'image/jpeg',
        },
      });
      expect(presignBeforeRes.statusCode).toBe(200);
      const beforeUpload = presignBeforeRes.json().data;
      expect(beforeUpload.objectKey).toContain(`tasks/${task.id}/evidence/`);

      const presignAfterRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/evidence/presign`,
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: {
          fileName: 'after.jpg',
          contentType: 'image/jpeg',
        },
      });
      expect(presignAfterRes.statusCode).toBe(200);
      const afterUpload = presignAfterRes.json().data;

      // Simulate direct binary upload into storage
      await storagePort.putObjectDirect({
        objectKey: beforeUpload.objectKey,
        data: Buffer.from('simulated-before-image-bytes'),
        contentType: 'image/jpeg',
      });
      await storagePort.putObjectDirect({
        objectKey: afterUpload.objectKey,
        data: Buffer.from('simulated-after-image-bytes'),
        contentType: 'image/jpeg',
      });

      // Verify: Binary upload alone does NOT change TaskStatus (P13W4-N13)
      const taskAfterBinaryUpload = await taskRepo.findById(task.id);
      expect(taskAfterBinaryUpload?.status).toBe('IN_PROGRESS');

      // 10. Staff submits evidence (OP-14): IN_PROGRESS -> WAITING_REVIEW
      const submitPayload = {
        taskId: task.id,
        expectedVersion: startedTask.version,
        siteVerification: {
          gpsCheck: {
            lat: 10.77691,
            lng: 106.70092,
            distance: 4.2, // <= 10m verified
            verified: true,
            timestamp: new Date().toISOString(),
          },
          qrCheck: {
            scannedCode: 'QR-TREE-001',
            verified: true,
            timestamp: new Date().toISOString(),
          },
        },
        proof: {
          proofProfile: 'CHANGE_PROOF',
          beforePhotoUri: beforeUpload.objectKey,
          afterPhotoUri: afterUpload.objectKey,
          checklist: [
            { id: '1', text: 'Inspect overhead power lines', done: true },
            { id: '2', text: 'Verify pedestrian safety zone', done: true },
          ],
        },
        notes: 'Pruning completed smoothly with safety perimeter in place',
      };

      const submitRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/evidence`,
        headers: {
          authorization: `Bearer ${staff1Token}`,
          'idempotency-key': randomUUID(),
        },
        payload: submitPayload,
      });
      expect(submitRes.statusCode).toBe(200);
      const waitingTask = submitRes.json().data;
      expect(waitingTask.status).toBe('WAITING_REVIEW');
      expect(waitingTask.version).toBe(startedTask.version + 1);

      // Verify evidence attempt recorded
      const attempts = await evidenceRepo.getEvidenceAttempts(task.id);
      expect(attempts).toHaveLength(1);
      expect(attempts[0]?.submittedByUserId).toBe(staff1Id);
      expect(attempts[0]?.proofProfile).toBe('CHANGE_PROOF');

      // 11. Manager views review queue
      const reviewQueueRes = await app.inject({
        method: 'GET',
        url: '/v1/tasks?status=WAITING_REVIEW',
        headers: { authorization: `Bearer ${managerToken}` },
      });
      expect(reviewQueueRes.statusCode).toBe(200);
      expect(reviewQueueRes.json().data.length).toBeGreaterThan(0);

      // 12. Manager approves task: WAITING_REVIEW -> COMPLETED
      const approveRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/review`,
        headers: {
          authorization: `Bearer ${managerToken}`,
          'idempotency-key': randomUUID(),
        },
        payload: {
          expectedVersion: waitingTask.version,
          decision: 'APPROVE',
          notes: 'Excellent pruning, well within safety standards',
        },
      });
      expect(approveRes.statusCode).toBe(200);
      const completedTask = approveRes.json().data;
      expect(completedTask.status).toBe('COMPLETED');

      // 13. Verify CareHistory projection was created for COMPLETED task (DR-HARD-07 / Section 23)
      const careHistoryRes = await app.inject({
        method: 'GET',
        url: `/v1/trees/TREE-001/care-history`,
        headers: { authorization: `Bearer ${staff1Token}` },
      });
      expect(careHistoryRes.statusCode).toBe(200);
      const historyItems = careHistoryRes.json().data;
      expect(historyItems).toHaveLength(1);
      expect(historyItems[0].taskId).toBe(task.id);
      expect(historyItems[0].status).toBe('COMPLETED');
      expect(historyItems[0].staffId).toBe(staff1Id);
      expect(historyItems[0].hasException).toBe(false);

      // 14. Verify append-only audit events were recorded
      expect(auditWriter.events.length).toBeGreaterThan(0);
      const actionTypes = auditWriter.events.map((e) => e.actionType);
      expect(actionTypes).toContain('CreateTree');
      expect(actionTypes).toContain('CreateTask');
      expect(actionTypes).toContain('StartTask');
      expect(actionTypes).toContain('SubmitEvidence');
      expect(actionTypes).toContain('ApproveTask');
    });
  });

  describe('Section 64: Second E2E — Targeted Rework Path', () => {
    it('executes Create -> Start -> Submit -> RequestRework -> ResubmitRework -> ApproveWithException', async () => {
      await scopeRepo.addScope(managerId, 'GLOBAL');

      // Seed tree and active task type
      await treeRepo.save(
        new (await import('../../apps/api/src/modules/tree-asset-registry/domain/tree.entity')).Tree({
          id: 'TREE-REWORK-1',
          version: 0,
          name: 'Park Oak',
          species: 'Quercus robur',
          lat: 10.78,
          lng: 106.7,
          address: 'District 3, HCMC',
          qrCode: 'QR-OAK-01',
          healthStatus: 'Cần chăm sóc',
          ageYears: 30,
        }),
      );

      const tt = new (
        await import('../../apps/api/src/modules/policy-template-governance/domain/task-type.entity')
      ).TaskType({
        id: 'TT-SERVICE-1',
        version: 0,
        name: 'Root Aeration',
        defaultProofProfile: 'SERVICE_PROOF',
        isActive: true,
      });
      await taskTypeRepo.save(tt);

      await policyRepo.saveProofPolicyVersion(
        new (
          await import('../../apps/api/src/modules/policy-template-governance/domain/policy-version.entity')
        ).ProofPolicyVersion({
          id: 'POL-SERVICE-1',
          taskTypeId: tt.id,
          versionNumber: 1,
          proofProfile: 'SERVICE_PROOF',
        }),
      );
      await policyRepo.saveChecklistTemplateVersion(
        new (
          await import('../../apps/api/src/modules/policy-template-governance/domain/policy-version.entity')
        ).ChecklistTemplateVersion({
          id: 'CHK-SERVICE-1',
          taskTypeId: tt.id,
          versionNumber: 1,
          templateItems: [{ text: 'Clear root perimeter', order: 1 }],
        }),
      );

      // 1. Manager CreateTask
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          title: 'Aerate Oak Roots',
          description: 'Decompact soil around root zone',
          taskTypeId: tt.id,
          treeId: 'TREE-REWORK-1',
          assignedStaffId: staff1Id,
          deadline: '2026-10-20T17:00:00Z',
        },
      });
      const task = createRes.json().data;

      // 2. Staff starts task
      const startRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/start`,
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: { taskId: task.id, expectedVersion: task.version },
      });
      const started = startRes.json().data;

      // Setup simulated upload in storage
      const photoKey = `tasks/${task.id}/evidence/completion.jpg`;
      await storagePort.putObjectDirect({
        objectKey: photoKey,
        data: Buffer.from('completion-photo-1'),
        contentType: 'image/jpeg',
      });

      // 3. Staff submits initial evidence
      const submit1Res = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/evidence`,
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: {
          taskId: task.id,
          expectedVersion: started.version,
          siteVerification: {
            gpsCheck: { lat: 10.78, lng: 106.7, distance: 3.0, verified: true, timestamp: new Date().toISOString() },
            qrCheck: { scannedCode: 'QR-OAK-01', verified: true, timestamp: new Date().toISOString() },
          },
          proof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: photoKey,
            checklist: [{ id: '1', text: 'Clear root perimeter', done: true }],
          },
          notes: 'Attempt 1 completion',
        },
      });
      expect(submit1Res.statusCode).toBe(200);
      const waitingTask = submit1Res.json().data;
      expect(waitingTask.status).toBe('WAITING_REVIEW');

      // 4. Manager requests targeted rework: WAITING_REVIEW -> REWORK_REQUIRED
      const reworkRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/review`,
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          expectedVersion: waitingTask.version,
          decision: 'REQUEST_REWORK',
          targetedArea: 'completion_photo',
          reworkReason: 'Root zone compaction still visible on northern quadrant',
        },
      });
      expect(reworkRes.statusCode).toBe(200);
      const reworkTask = reworkRes.json().data;
      expect(reworkTask.status).toBe('REWORK_REQUIRED');

      // Verify NO CareHistory created during rework (Section 48)
      const careHistoryDuringRework = await careHistoryRepo.findByTreeId('TREE-REWORK-1');
      expect(careHistoryDuringRework).toHaveLength(0);

      // 5. Staff resubmits rework: REWORK_REQUIRED -> WAITING_REVIEW
      const photoKey2 = `tasks/${task.id}/evidence/completion_v2.jpg`;
      await storagePort.putObjectDirect({
        objectKey: photoKey2,
        data: Buffer.from('completion-photo-2'),
        contentType: 'image/jpeg',
      });

      const resubmitRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/rework/resubmit`,
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: {
          taskId: task.id,
          expectedVersion: reworkTask.version,
          reworkedProof: {
            proofProfile: 'SERVICE_PROOF',
            completionPhotoUri: photoKey2,
            checklist: [{ id: '1', text: 'Clear root perimeter', done: true }],
          },
          reworkNotes: 'Re-aerated northern quadrant and added mulch layer',
        },
      });
      expect(resubmitRes.statusCode).toBe(200);
      const reWaitingTask = resubmitRes.json().data;
      expect(reWaitingTask.status).toBe('WAITING_REVIEW');

      // 6. Verify evidence attempts history preserved both attempts (Section 21, 22)
      const allAttempts = await evidenceRepo.getEvidenceAttempts(task.id);
      expect(allAttempts).toHaveLength(2);
      expect(allAttempts[0]?.attemptNumber).toBe(1);
      expect(allAttempts[1]?.attemptNumber).toBe(2);
      expect(allAttempts[0]?.submittedByUserId).toBe(staff1Id);
      expect(allAttempts[1]?.submittedByUserId).toBe(staff1Id);

      // 7. Manager ApproveWithException: WAITING_REVIEW -> COMPLETED
      const approveRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/review`,
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          expectedVersion: reWaitingTask.version,
          decision: 'APPROVE_WITH_EXCEPTION',
          exceptionReason: 'Slight mulch irregularity accepted due to heavy root surfacing',
        },
      });
      expect(approveRes.statusCode).toBe(200);
      expect(approveRes.json().data.status).toBe('COMPLETED');

      // 8. CareHistory created only upon COMPLETED
      const finalCareHistory = await careHistoryRepo.findByTreeId('TREE-REWORK-1');
      expect(finalCareHistory).toHaveLength(1);
      expect(finalCareHistory[0]?.hasException).toBe(true);
      expect(finalCareHistory[0]?.exceptionReason).toBe(
        'Slight mulch irregularity accepted due to heavy root surfacing',
      );
    });
  });

  describe('Section 65: Third E2E — Blocked & Reassignment Path', () => {
    it('executes Create -> Start -> ReportFieldIssue -> Reassign -> New Staff Starts', async () => {
      await scopeRepo.addScope(managerId, 'GLOBAL');

      // Seed tree and active task type
      await treeRepo.save(
        new (await import('../../apps/api/src/modules/tree-asset-registry/domain/tree.entity')).Tree({
          id: 'TREE-BLOCKED-1',
          version: 0,
          name: 'Banyan Tree',
          species: 'Ficus benghalensis',
          lat: 10.79,
          lng: 106.71,
          address: 'District 1, HCMC',
          qrCode: 'QR-BANYAN-01',
          healthStatus: 'Khỏe mạnh',
          ageYears: 50,
        }),
      );

      const tt = new (
        await import('../../apps/api/src/modules/policy-template-governance/domain/task-type.entity')
      ).TaskType({
        id: 'TT-INSPECT-1',
        version: 0,
        name: 'Health Inspection',
        defaultProofProfile: 'INSPECTION_PROOF',
        isActive: true,
      });
      await taskTypeRepo.save(tt);

      await policyRepo.saveProofPolicyVersion(
        new (
          await import('../../apps/api/src/modules/policy-template-governance/domain/policy-version.entity')
        ).ProofPolicyVersion({
          id: 'POL-INSPECT-1',
          taskTypeId: tt.id,
          versionNumber: 1,
          proofProfile: 'INSPECTION_PROOF',
        }),
      );

      // 1. Create Task assigned to Staff 1
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          title: 'Inspect Banyan Health',
          description: 'Quarterly health and lean check',
          taskTypeId: tt.id,
          treeId: 'TREE-BLOCKED-1',
          assignedStaffId: staff1Id,
          deadline: '2026-10-25T17:00:00Z',
        },
      });
      const task = createRes.json().data;

      // 2. Staff 1 starts task: PENDING -> IN_PROGRESS
      const startRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/start`,
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: { taskId: task.id, expectedVersion: task.version },
      });
      const started = startRes.json().data;

      // 3. Verify: Direct Reassign from IN_PROGRESS is strictly forbidden (Section 7, DR-HARD-06)
      const directReassignRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/reassign`,
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          taskId: task.id,
          expectedVersion: started.version,
          newStaffId: staff2Id,
          reason: 'Attempting direct reassignment while in progress',
        },
      });
      expect(directReassignRes.statusCode).toBe(400); // Throws validation error (DR-HARD-06)

      // 4. Staff 1 reports Field Issue: IN_PROGRESS -> BLOCKED
      const issueRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/field-issue`,
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: {
          taskId: task.id,
          expectedVersion: started.version,
          issueDescription: 'Bees nest in lower branch prevents safe climbing without suit',
          issuePhotoUri: 's3://mock-bucket/tasks/issues/bees.jpg',
        },
      });
      expect(issueRes.statusCode).toBe(200);
      const blockedTask = issueRes.json().data;
      expect(blockedTask.status).toBe('BLOCKED');

      // 5. Manager reassigns from BLOCKED: BLOCKED -> PENDING (Case B: DR-MVP-05)
      const reassignRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/reassign`,
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          taskId: task.id,
          expectedVersion: blockedTask.version,
          newStaffId: staff2Id,
          reason: 'Staff 2 equipped with protective suit reassigned to site',
        },
      });
      expect(reassignRes.statusCode).toBe(200);
      const reassignedTask = reassignRes.json().data;
      expect(reassignedTask.status).toBe('PENDING');
      expect(reassignedTask.assignedStaffId).toBe(staff2Id);
      expect(reassignedTask.treeId).toBe('TREE-BLOCKED-1'); // DR-HARD-01 treeId immutable!

      // 6. Old staff (Staff 1) loses mutation authority
      const oldStaffStartRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/start`,
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: { taskId: task.id, expectedVersion: reassignedTask.version },
      });
      expect(oldStaffStartRes.statusCode).toBe(403); // Forbidden!

      // 7. New staff (Staff 2) starts task successfully
      const newStaffStartRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/start`,
        headers: { authorization: `Bearer ${staff2Token}` },
        payload: { taskId: task.id, expectedVersion: reassignedTask.version },
      });
      expect(newStaffStartRes.statusCode).toBe(200);
      expect(newStaffStartRes.json().data.status).toBe('IN_PROGRESS');
      expect(newStaffStartRes.json().data.assignedStaffId).toBe(staff2Id);
    });
  });

  describe('Section 66: Negative Business Rules, Separation of Duties & OCC', () => {
    it('proves Platform Administrator CANNOT perform operational Task mutations (Section 14, P13W4-N08)', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: 'Admin created task',
          description: 'Forbidden admin mutation',
          taskTypeId: 'TT-1',
          treeId: 'TREE-1',
          assignedStaffId: staff1Id,
          deadline: '2026-10-30T17:00:00Z',
        },
      });
      expect(createRes.statusCode).toBe(403);
    });

    it('proves Field Staff CANNOT create tasks (Section 12)', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: {
          title: 'Staff created task',
          description: 'Forbidden staff creation',
          taskTypeId: 'TT-1',
          treeId: 'TREE-1',
          assignedStaffId: staff1Id,
          deadline: '2026-10-30T17:00:00Z',
        },
      });
      expect(createRes.statusCode).toBe(403);
    });

    it('proves Manager CANNOT operate outside authorized operational scope (Section 13)', async () => {
      // managerId has scope for TREE-001, otherManagerId has no scope
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: { authorization: `Bearer ${otherManagerToken}` },
        payload: {
          title: 'Out of scope task',
          description: 'Should fail scope check',
          taskTypeId: 'TT-1',
          treeId: 'TREE-OUT-OF-SCOPE',
          assignedStaffId: staff1Id,
          deadline: '2026-10-30T17:00:00Z',
        },
      });
      expect(createRes.statusCode).toBe(403);
    });

    it('proves Separation of Duties (DR-HARD-02): Reviewer cannot approve their own historical evidence (Section 10, P13W4-N10)', async () => {
      await scopeRepo.addScope(managerId, 'GLOBAL');

      // Seed task directly in WAITING_REVIEW where managerId was an evidence submitter!
      const task = new (await import('../../apps/api/src/modules/work-management/domain/task.entity')).Task({
        id: 'TASK-SOD-1',
        version: 2,
        title: 'Task for SoD test',
        description: 'Testing DR-HARD-02',
        taskTypeId: 'TT-1',
        taskTypeName: 'Maintenance',
        proofProfile: 'SERVICE_PROOF',
        treeId: 'TREE-1',
        treeName: 'Tree 1',
        treeAddress: 'Address 1',
        assignedStaffId: staff1Id,
        assignedStaffName: 'Staff 1',
        deadline: '2026-10-30T17:00:00Z',
        status: 'WAITING_REVIEW',
      });
      await taskRepo.save(task);

      // Record managerId as a historical evidence author on this task
      await evidenceRepo.saveEvidenceAttempt({
        id: 'ATT-1',
        taskId: task.id,
        attemptNumber: 1,
        submittedByUserId: managerId, // Manager previously authored evidence!
        proofProfile: 'SERVICE_PROOF',
        proofData: {},
      });

      // Manager attempts to review/approve this task
      const reviewRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/review`,
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          expectedVersion: 2,
          decision: 'APPROVE',
          notes: 'Attempting self-approval',
        },
      });

      expect(reviewRes.statusCode).toBe(403);
      expect(reviewRes.json().error.message).toContain('Separation of Duties violation (DR-HARD-02)');
    });

    it('proves OCC returns 409 CONFLICT with STALE_VERSION details on mismatched expectedVersion (Section 38, P13W4-P19)', async () => {
      const task = new (await import('../../apps/api/src/modules/work-management/domain/task.entity')).Task({
        id: 'TASK-OCC-1',
        version: 5,
        title: 'OCC Task',
        description: 'OCC testing',
        taskTypeId: 'TT-1',
        taskTypeName: 'Maintenance',
        proofProfile: 'SERVICE_PROOF',
        treeId: 'TREE-1',
        treeName: 'Tree 1',
        treeAddress: 'Address 1',
        assignedStaffId: staff1Id,
        assignedStaffName: 'Staff 1',
        deadline: '2026-10-30T17:00:00Z',
        status: 'PENDING',
      });
      await taskRepo.save(task);

      // Staff attempts start with expectedVersion 4 instead of current version 5
      const startRes = await app.inject({
        method: 'POST',
        url: `/v1/tasks/${task.id}/start`,
        headers: { authorization: `Bearer ${staff1Token}` },
        payload: {
          taskId: task.id,
          expectedVersion: 4, // Stale version!
        },
      });

      expect(startRes.statusCode).toBe(409);
      const err = startRes.json().error;
      expect(err.code).toBe('CONFLICT');
      expect(err.details.subtype).toBe('STALE_VERSION');
      expect(err.details.currentVersion).toBe(5);
      expect(err.details.expectedVersion).toBe(4);
    });

    it('proves Idempotency Key with different request payload is rejected with 409 CONFLICT (Section 39)', async () => {
      await scopeRepo.addScope(managerId, 'GLOBAL');

      const idempotencyKey = randomUUID();

      // Seed tree and active task type
      await treeRepo.save(
        new (await import('../../apps/api/src/modules/tree-asset-registry/domain/tree.entity')).Tree({
          id: 'TREE-IDEMP-1',
          version: 0,
          name: 'Idemp Tree',
          species: 'Species',
          lat: 10.7,
          lng: 106.7,
          address: 'Address',
          qrCode: 'QR-IDEMP-1',
          healthStatus: 'Khỏe mạnh',
          ageYears: 10,
        }),
      );
      const tt = new (
        await import('../../apps/api/src/modules/policy-template-governance/domain/task-type.entity')
      ).TaskType({
        id: 'TT-IDEMP-1',
        version: 0,
        name: 'TaskType',
        defaultProofProfile: 'SERVICE_PROOF',
        isActive: true,
      });
      await taskTypeRepo.save(tt);
      await policyRepo.saveProofPolicyVersion(
        new (
          await import('../../apps/api/src/modules/policy-template-governance/domain/policy-version.entity')
        ).ProofPolicyVersion({
          id: 'POL-IDEMP-1',
          taskTypeId: tt.id,
          versionNumber: 1,
          proofProfile: 'SERVICE_PROOF',
        }),
      );
      await policyRepo.saveChecklistTemplateVersion(
        new (
          await import('../../apps/api/src/modules/policy-template-governance/domain/policy-version.entity')
        ).ChecklistTemplateVersion({
          id: 'CHK-IDEMP-1',
          taskTypeId: tt.id,
          versionNumber: 1,
          templateItems: [{ text: 'Check 1', order: 1 }],
        }),
      );

      // First request with idempotency key
      const res1 = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: {
          authorization: `Bearer ${managerToken}`,
          'idempotency-key': idempotencyKey,
        },
        payload: {
          title: 'Initial Task',
          description: 'Payload 1',
          taskTypeId: tt.id,
          treeId: 'TREE-IDEMP-1',
          assignedStaffId: staff1Id,
          deadline: '2026-10-30T17:00:00Z',
        },
      });
      expect(res1.statusCode).toBe(201);

      // Second request with SAME idempotency key but DIFFERENT payload
      const res2 = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: {
          authorization: `Bearer ${managerToken}`,
          'idempotency-key': idempotencyKey,
        },
        payload: {
          title: 'DIFFERENT Task Title',
          description: 'Payload 2 (conflict)',
          taskTypeId: tt.id,
          treeId: 'TREE-IDEMP-1',
          assignedStaffId: staff1Id,
          deadline: '2026-10-30T17:00:00Z',
        },
      });

      expect(res2.statusCode).toBe(409);
      expect(res2.json().error.code).toBe('CONFLICT');
      expect(res2.json().error.message).toContain('Idempotency key reused with different request payload');
    });

    it('proves cannot create task on RETIRED tree (Section 24, 41)', async () => {
      await scopeRepo.addScope(managerId, 'GLOBAL');

      // Seed retired tree
      await treeRepo.save(
        new (await import('../../apps/api/src/modules/tree-asset-registry/domain/tree.entity')).Tree({
          id: 'TREE-RETIRED-1',
          version: 1,
          name: 'Felled Tree',
          species: 'Dead tree',
          lat: 10.7,
          lng: 106.7,
          address: 'Address',
          qrCode: 'QR-DEAD-1',
          healthStatus: 'Cần chăm sóc',
          ageYears: 10,
          isRetired: true,
          retiredAt: new Date(),
        }),
      );

      const tt = new (
        await import('../../apps/api/src/modules/policy-template-governance/domain/task-type.entity')
      ).TaskType({
        id: 'TT-RET-1',
        version: 0,
        name: 'Type 1',
        defaultProofProfile: 'SERVICE_PROOF',
        isActive: true,
      });
      await taskTypeRepo.save(tt);

      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          title: 'Task on retired tree',
          description: 'Must fail',
          taskTypeId: tt.id,
          treeId: 'TREE-RETIRED-1',
          assignedStaffId: staff1Id,
          deadline: '2026-10-30T17:00:00Z',
        },
      });

      expect(createRes.statusCode).toBe(400);
      expect(createRes.json().error.message).toContain('Cannot create task on retired tree');
    });

    it('proves cannot create task with INACTIVE TaskType (Section 25, 41)', async () => {
      await scopeRepo.addScope(managerId, 'GLOBAL');

      await treeRepo.save(
        new (await import('../../apps/api/src/modules/tree-asset-registry/domain/tree.entity')).Tree({
          id: 'TREE-ACTIVE-1',
          version: 0,
          name: 'Active Tree',
          species: 'Species',
          lat: 10.7,
          lng: 106.7,
          address: 'Address',
          qrCode: 'QR-ACTIVE-1',
          healthStatus: 'Khỏe mạnh',
          ageYears: 10,
        }),
      );

      // Inactive task type
      const tt = new (
        await import('../../apps/api/src/modules/policy-template-governance/domain/task-type.entity')
      ).TaskType({
        id: 'TT-INACTIVE-1',
        version: 1,
        name: 'Deprecated Task',
        defaultProofProfile: 'SERVICE_PROOF',
        isActive: false, // INACTIVE
      });
      await taskTypeRepo.save(tt);

      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/tasks',
        headers: { authorization: `Bearer ${managerToken}` },
        payload: {
          title: 'Task on inactive type',
          description: 'Must fail',
          taskTypeId: tt.id,
          treeId: 'TREE-ACTIVE-1',
          assignedStaffId: staff1Id,
          deadline: '2026-10-30T17:00:00Z',
        },
      });

      expect(createRes.statusCode).toBe(400);
      expect(createRes.json().error.message).toContain('is currently inactive');
    });
  });
});
