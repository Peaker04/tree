import { describe, it, expect } from 'vitest';
import * as contracts from '../../packages/contracts/src';
import {
  // Canonical Enums & Constants
  CANONICAL_TASK_STATUSES,
  TaskStatusSchema,
  CANONICAL_REVIEW_DECISIONS,
  ReviewDecisionSchema,
  CANONICAL_PROOF_PROFILES,
  ProofProfileSchema,
  CANONICAL_ACCOUNT_STATUSES,
  AccountStatusSchema,
  HUMAN_ROLES,
  HumanRoleSchema,
  ERROR_CODES,
  ErrorCodeSchema,
  API_VERSION,
  ApiVersionSchema,

  // Common Schemas
  ConflictErrorDetailsSchema,
  ApiErrorSchema,
  createApiSuccessSchema,
  ApiFailureSchema,
  ApiListMetaSchema,
  createApiListSchema,
  PaginationQuerySchema,
  StrictUuidv4Schema,
  LatitudeSchema,
  LongitudeSchema,
  IdempotencyKeyHeaderSchema,
  StrictMutationHeadersSchema,

  // Operational Schemas
  GpsCheckSchema,
  QrCheckSchema,
  SiteVerificationSchema,
  LocationExceptionSchema,
  IdentityExceptionSchema,
  FieldIssueDtoSchema,
  ReportFieldIssueRequestSchema,
  ResumeBlockedTaskRequestSchema,
  ChecklistItemSchema,
  SubmittedChecklistItemSchema,
  StructuredFindingsSchema,
  ChangeProofPayloadSchema,
  ServiceProofPayloadSchema,
  InspectionProofPayloadSchema,
  ProofPayloadSchema,
  SubmitEvidenceRequestSchema,
  TaskTypeIdSchema,
  CreateTaskRequestSchema,
  AssignTaskRequestSchema,
  StartTaskRequestSchema,
  ReassignTaskRequestSchema,
  CancelTaskRequestSchema,
  ApproveTaskRequestSchema,
  ApproveWithExceptionRequestSchema,
  RequestReworkRequestSchema,
  ResubmitReworkRequestSchema,
  TaskDtoSchema,
  ListTasksQuerySchema,
  CareHistoryDtoSchema,

  // Governance Schemas
  ProvisionUserRequestSchema,
  AssignRoleRequestSchema,
  ActivateAccountRequestSchema,
  SuspendAccountRequestSchema,
  DisableAccountRequestSchema,
  UnlockAccountRequestSchema,
  ResetCredentialSetupRequestSchema,
  TreeHealthStatusSchema,
  TreeRiskStatusSchema,
  CreateTreeRequestSchema,
  UpdateTreeMasterDataRequestSchema,
  ReplaceTreeQrCodeRequestSchema,
  UpdateCanonicalCoordinatesRequestSchema,
  RetireTreeRequestSchema,
  TreeDtoSchema,
  ListTreesQuerySchema,
  CreateTaskTypeRequestSchema,
  ActivateTaskTypeRequestSchema,
  DeactivateTaskTypeRequestSchema,
  PublishProofPolicyVersionRequestSchema,
  PublishChecklistTemplateVersionRequestSchema,

  // Audit Schemas
  AuditEventDtoSchema,
  ListAuditLogsQuerySchema,

  // Legacy Transitional Exports
  LegacyTaskStatus,
  LegacyTaskTypeSchema,
  TaskStatus,
} from '../../packages/contracts/src';

describe('Phase 13 Wave 1: Contract-First + Zod Runtime Validation (@novyx/contracts)', () => {
  // ============================================================================
  // 1. Exact 7 TaskStatus values
  // ============================================================================
  describe('1. Canonical TaskStatus: Exact 7 States', () => {
    it('has exactly 7 canonical states', () => {
      expect(CANONICAL_TASK_STATUSES).toHaveLength(7);
      expect([...CANONICAL_TASK_STATUSES]).toEqual([
        'PENDING',
        'IN_PROGRESS',
        'BLOCKED',
        'WAITING_REVIEW',
        'REWORK_REQUIRED',
        'COMPLETED',
        'CANCELLED',
      ]);
    });

    it('parses all 7 canonical states successfully', () => {
      for (const status of CANONICAL_TASK_STATUSES) {
        expect(TaskStatusSchema.parse(status)).toBe(status);
      }
    });
  });

  // ============================================================================
  // 2. Reject noncanonical TaskStatus
  // ============================================================================
  describe('2. Reject Non-Canonical TaskStatus', () => {
    it('rejects business noncanonical aliases (DRAFT, ASSIGNED, SUBMITTED)', () => {
      expect(TaskStatusSchema.safeParse('DRAFT').success).toBe(false);
      expect(TaskStatusSchema.safeParse('ASSIGNED').success).toBe(false);
      expect(TaskStatusSchema.safeParse('SUBMITTED').success).toBe(false);
    });

    it('rejects legacy Pascal-style network values from canonical schema', () => {
      expect(TaskStatusSchema.safeParse('Pending').success).toBe(false);
      expect(TaskStatusSchema.safeParse('In_Progress').success).toBe(false);
      expect(TaskStatusSchema.safeParse('Waiting_Review').success).toBe(false);
      expect(TaskStatusSchema.safeParse('Completed').success).toBe(false);
      expect(TaskStatusSchema.safeParse('Rework_Required').success).toBe(false);
    });

    it('rejects arbitrary lowercase or malformed strings', () => {
      expect(TaskStatusSchema.safeParse('pending').success).toBe(false);
      expect(TaskStatusSchema.safeParse('in_progress').success).toBe(false);
      expect(TaskStatusSchema.safeParse('UNKNOWN_STATE').success).toBe(false);
      expect(TaskStatusSchema.safeParse('').success).toBe(false);
    });
  });

  // ============================================================================
  // 3. Exact 4 ReviewDecision values
  // ============================================================================
  describe('3. Canonical ReviewDecision: Exact 4 Outcomes', () => {
    it('has exactly 4 canonical review outcomes', () => {
      expect(CANONICAL_REVIEW_DECISIONS).toHaveLength(4);
      expect([...CANONICAL_REVIEW_DECISIONS]).toEqual([
        'APPROVE',
        'APPROVE_WITH_EXCEPTION',
        'REQUEST_REWORK',
        'CANCEL',
      ]);
    });

    it('parses all 4 canonical review decisions', () => {
      for (const decision of CANONICAL_REVIEW_DECISIONS) {
        expect(ReviewDecisionSchema.parse(decision)).toBe(decision);
      }
    });

    it('rejects legacy lowercase or noncanonical values (approve, request_rework, reject)', () => {
      expect(ReviewDecisionSchema.safeParse('approve').success).toBe(false);
      expect(ReviewDecisionSchema.safeParse('request_rework').success).toBe(false);
      expect(ReviewDecisionSchema.safeParse('reject').success).toBe(false);
      expect(ReviewDecisionSchema.safeParse('REJECT').success).toBe(false);
    });
  });

  // ============================================================================
  // 4. Exact 3 ProofProfile values
  // ============================================================================
  describe('4. Canonical ProofProfile: Exact 3 Profiles', () => {
    it('has exactly 3 canonical proof profiles', () => {
      expect(CANONICAL_PROOF_PROFILES).toHaveLength(3);
      expect([...CANONICAL_PROOF_PROFILES]).toEqual(['CHANGE_PROOF', 'SERVICE_PROOF', 'INSPECTION_PROOF']);
    });

    it('parses all 3 canonical proof profiles', () => {
      for (const profile of CANONICAL_PROOF_PROFILES) {
        expect(ProofProfileSchema.parse(profile)).toBe(profile);
      }
    });

    it('rejects non-canonical profiles or arbitrary configurable profiles', () => {
      expect(ProofProfileSchema.safeParse('MAINTENANCE_PROOF').success).toBe(false);
      expect(ProofProfileSchema.safeParse('CUSTOM_PROOF').success).toBe(false);
      expect(ProofProfileSchema.safeParse('FOURTH_PROFILE').success).toBe(false);
    });
  });

  // ============================================================================
  // 5. Exact 4 AccountStatus values
  // ============================================================================
  describe('5. Canonical AccountStatus: Exact 4 States (No LOCKED)', () => {
    it('has exactly 4 canonical account lifecycle states', () => {
      expect(CANONICAL_ACCOUNT_STATUSES).toHaveLength(4);
      expect([...CANONICAL_ACCOUNT_STATUSES]).toEqual(['INVITED', 'ACTIVE', 'SUSPENDED', 'DISABLED']);
    });

    it('parses all 4 account statuses', () => {
      for (const status of CANONICAL_ACCOUNT_STATUSES) {
        expect(AccountStatusSchema.parse(status)).toBe(status);
      }
    });

    it('strictly rejects LOCKED as AccountStatus (auth lock is not AccountStatus)', () => {
      expect(AccountStatusSchema.safeParse('LOCKED').success).toBe(false);
      expect(AccountStatusSchema.safeParse('locked').success).toBe(false);
      expect(AccountStatusSchema.safeParse('DELETED').success).toBe(false);
    });
  });

  // ============================================================================
  // 6. Exact Human Role IDs
  // ============================================================================
  describe('6. Canonical Human Roles: staff, manager, admin', () => {
    it('has exactly 3 human roles', () => {
      expect(HUMAN_ROLES).toHaveLength(3);
      expect([...HUMAN_ROLES]).toEqual(['staff', 'manager', 'admin']);
    });

    it('parses all 3 human roles', () => {
      for (const role of HUMAN_ROLES) {
        expect(HumanRoleSchema.parse(role)).toBe(role);
      }
    });

    it('strictly rejects technical System or non-human roles', () => {
      expect(HumanRoleSchema.safeParse('System').success).toBe(false);
      expect(HumanRoleSchema.safeParse('system').success).toBe(false);
      expect(HumanRoleSchema.safeParse('superadmin').success).toBe(false);
      expect(HumanRoleSchema.safeParse('Staff').success).toBe(false);
    });
  });

  // ============================================================================
  // 7. Valid / Invalid Proof-Profile Structures
  // ============================================================================
  describe('7. Structural Evidence Differentiation by ProofProfile', () => {
    describe('CHANGE_PROOF', () => {
      it('validates a complete CHANGE_PROOF payload', () => {
        const payload = {
          proofProfile: 'CHANGE_PROOF',
          beforePhotoUri: 'file:///sandbox/before.jpg',
          afterPhotoUri: 'file:///sandbox/after.jpg',
          checklist: [{ id: 'chk-1', text: 'Tưới nước đẫm gốc', done: true }],
        };
        const result = ChangeProofPayloadSchema.safeParse(payload);
        expect(result.success).toBe(true);
        expect(ProofPayloadSchema.safeParse(payload).success).toBe(true);
      });

      it('rejects CHANGE_PROOF missing beforePhotoUri', () => {
        const payload = {
          proofProfile: 'CHANGE_PROOF',
          afterPhotoUri: 'file:///sandbox/after.jpg',
          checklist: [{ id: 'chk-1', text: 'Tưới nước đẫm gốc', done: true }],
        };
        expect(ChangeProofPayloadSchema.safeParse(payload).success).toBe(false);
        expect(ProofPayloadSchema.safeParse(payload).success).toBe(false);
      });

      it('rejects CHANGE_PROOF missing afterPhotoUri', () => {
        const payload = {
          proofProfile: 'CHANGE_PROOF',
          beforePhotoUri: 'file:///sandbox/before.jpg',
          checklist: [{ id: 'chk-1', text: 'Tưới nước đẫm gốc', done: true }],
        };
        expect(ChangeProofPayloadSchema.safeParse(payload).success).toBe(false);
      });

      it('rejects CHANGE_PROOF with empty checklist', () => {
        const payload = {
          proofProfile: 'CHANGE_PROOF',
          beforePhotoUri: 'file:///sandbox/before.jpg',
          afterPhotoUri: 'file:///sandbox/after.jpg',
          checklist: [],
        };
        expect(ChangeProofPayloadSchema.safeParse(payload).success).toBe(false);
      });
    });

    describe('SERVICE_PROOF', () => {
      it('validates a complete SERVICE_PROOF payload (completionPhoto + checklist)', () => {
        const payload = {
          proofProfile: 'SERVICE_PROOF',
          completionPhotoUri: 'file:///sandbox/completion.jpg',
          checklist: [{ id: 'chk-1', text: 'Bón phân NPK 200g', done: true }],
        };
        const result = ServiceProofPayloadSchema.safeParse(payload);
        expect(result.success).toBe(true);
        expect(ProofPayloadSchema.safeParse(payload).success).toBe(true);
      });

      it('rejects SERVICE_PROOF missing completionPhotoUri', () => {
        const payload = {
          proofProfile: 'SERVICE_PROOF',
          checklist: [{ id: 'chk-1', text: 'Bón phân NPK 200g', done: true }],
        };
        expect(ServiceProofPayloadSchema.safeParse(payload).success).toBe(false);
      });

      it('does NOT require beforePhotoUri in SERVICE_PROOF', () => {
        const payload = {
          proofProfile: 'SERVICE_PROOF',
          completionPhotoUri: 'file:///sandbox/completion.jpg',
          checklist: [{ id: 'chk-1', text: 'Bón phân NPK 200g', done: true }],
        };
        expect(ServiceProofPayloadSchema.parse(payload)).not.toHaveProperty('beforePhotoUri');
      });
    });

    describe('INSPECTION_PROOF', () => {
      it('validates a complete INSPECTION_PROOF payload (findings + conditionPhotos)', () => {
        const payload = {
          proofProfile: 'INSPECTION_PROOF',
          findings: {
            trunkLeanAngle: 12.5,
            cavityRotPercentage: 25,
            pestSeverity: 'moderate',
            deadwoodRisk: 'medium',
            notes: 'Phát hiện sâu đục thân nhánh cấp 2',
          },
          conditionPhotos: ['file:///sandbox/pest-1.jpg', 'file:///sandbox/cavity-1.jpg'],
        };
        const result = InspectionProofPayloadSchema.safeParse(payload);
        expect(result.success).toBe(true);
        expect(ProofPayloadSchema.safeParse(payload).success).toBe(true);
      });

      it('rejects INSPECTION_PROOF missing findings', () => {
        const payload = {
          proofProfile: 'INSPECTION_PROOF',
          conditionPhotos: ['file:///sandbox/pest-1.jpg'],
        };
        expect(InspectionProofPayloadSchema.safeParse(payload).success).toBe(false);
      });

      it('rejects INSPECTION_PROOF with empty conditionPhotos', () => {
        const payload = {
          proofProfile: 'INSPECTION_PROOF',
          findings: {
            trunkLeanAngle: 0,
            cavityRotPercentage: 0,
            pestSeverity: 'none',
            deadwoodRisk: 'low',
          },
          conditionPhotos: [],
        };
        expect(InspectionProofPayloadSchema.safeParse(payload).success).toBe(false);
      });

      it('does NOT require generic operational checklist in INSPECTION_PROOF', () => {
        const payload = {
          proofProfile: 'INSPECTION_PROOF',
          findings: {
            trunkLeanAngle: 0,
            cavityRotPercentage: 0,
            pestSeverity: 'none',
            deadwoodRisk: 'low',
          },
          conditionPhotos: ['file:///sandbox/tree-healthy.jpg'],
        };
        expect(InspectionProofPayloadSchema.parse(payload)).not.toHaveProperty('checklist');
      });
    });
  });

  // ============================================================================
  // 8. Runtime DTO Parsing
  // ============================================================================
  describe('8. Runtime DTO Parsing & Validation', () => {
    it('parses valid CreateTaskRequest and rejects invalid', () => {
      const valid = {
        title: 'Tưới nước xà cừ cổ thụ',
        taskTypeId: 'tt-watering-01',
        description: 'Tưới 200L nước vào sáng sớm',
        treeId: 'TRE-001',
        assignedStaffId: 'STF-01',
        deadline: '2026-09-25T17:00:00Z',
      };
      expect(CreateTaskRequestSchema.safeParse(valid).success).toBe(true);

      const invalidTitle = { ...valid, title: 'ab' }; // min 3 chars
      expect(CreateTaskRequestSchema.safeParse(invalidTitle).success).toBe(false);

      const invalidType = { ...valid, taskTypeId: '' }; // empty string fails min(1)
      expect(CreateTaskRequestSchema.safeParse(invalidType).success).toBe(false);
    });

    it('parses valid CanonicalTaskDto with version number', () => {
      const valid = {
        id: 'TSK-101',
        version: 3,
        title: 'Tưới nước',
        taskTypeId: 'tt-watering-01',
        taskTypeName: 'Tưới nước',
        proofProfile: 'SERVICE_PROOF',
        description: 'Tưới nước định kỳ',
        treeId: 'TRE-001',
        treeName: 'Xà Cừ #01',
        treeAddress: 'Công viên Tao Đàn',
        assignedStaffId: 'STF-01',
        assignedStaffName: 'Nguyễn Văn Hùng',
        deadline: '2026-09-25T17:00:00Z',
        status: 'IN_PROGRESS',
        checklist: [{ id: 'chk-1', text: 'Tưới nước', done: false }],
        createdAt: '2026-09-20T08:00:00Z',
        updatedAt: '2026-09-20T09:00:00Z',
      };
      expect(TaskDtoSchema.safeParse(valid).success).toBe(true);
    });

    it('parses valid CanonicalTreeDto with version number', () => {
      const valid = {
        id: 'TRE-001',
        version: 1,
        name: 'Xà Cừ Cổ Thụ',
        species: 'Khaya senegalensis',
        lat: 10.7769,
        lng: 106.6908,
        address: 'Công viên Tao Đàn',
        qrCode: 'NOVYX-QR-TRE-001',
        healthStatus: 'Khỏe mạnh',
        ageYears: 45,
      };
      expect(TreeDtoSchema.safeParse(valid).success).toBe(true);
    });

    it('parses API envelopes and error codes', () => {
      expect(ApiVersionSchema.parse(API_VERSION)).toBe('v1');
      expect(ErrorCodeSchema.parse(ERROR_CODES.VALIDATION_FAILED)).toBe('VALIDATION_FAILED');
      expect(ErrorCodeSchema.parse(ERROR_CODES.CONFLICT)).toBe('CONFLICT');

      const successEnvelope = createApiSuccessSchema(TreeDtoSchema).parse({
        data: {
          id: 'TRE-001',
          version: 1,
          name: 'Xà Cừ',
          species: 'Khaya',
          lat: 10.7,
          lng: 106.6,
          address: 'Tao Đàn',
          qrCode: 'QR-1',
          healthStatus: 'Khỏe mạnh',
          ageYears: 20,
        },
      });
      expect(successEnvelope.data.id).toBe('TRE-001');

      const failureEnvelope = ApiFailureSchema.parse({
        error: {
          code: 'NOT_FOUND',
          message: 'Cây không tồn tại',
          requestId: 'req-999',
        },
      });
      expect(failureEnvelope.error.code).toBe('NOT_FOUND');

      const listEnvelope = createApiListSchema(ChecklistItemSchema).parse({
        data: [{ id: 'chk-1', text: 'Tưới nước', done: true }],
        meta: { nextCursor: null, hasMore: false },
      });
      expect(listEnvelope.data).toHaveLength(1);
      expect(ApiListMetaSchema.parse(listEnvelope.meta).hasMore).toBe(false);
    });

    it('parses site verification, exceptions, and field issues', () => {
      const gps = GpsCheckSchema.parse({
        verified: true,
        distance: 4.5,
        timestamp: '2026-09-21T10:00:00Z',
        lat: 10.7769,
        lng: 106.6908,
      });
      expect(gps.verified).toBe(true);

      const qr = QrCheckSchema.parse({
        verified: true,
        scannedCode: 'NOVYX-QR-001',
        timestamp: '2026-09-21T10:00:00Z',
      });
      expect(qr.verified).toBe(true);

      const siteVer = SiteVerificationSchema.parse({ gpsCheck: gps, qrCheck: qr });
      expect(siteVer.gpsCheck).toBeDefined();

      const locExc = LocationExceptionSchema.parse({
        reason: 'Tán cây dày gây trôi GPS ngoài 10m',
        distanceMeters: 14.2,
        explanationPhotoUri: 'file:///sandbox/loc-exc.jpg',
        recordedLat: 10.777,
        recordedLng: 106.691,
        timestamp: '2026-09-21T10:05:00Z',
      });
      expect(locExc.distanceMeters).toBe(14.2);

      const idExc = IdentityExceptionSchema.parse({
        reason: 'Tem QR bị cạo rách',
        damagedQrPhotoUri: 'file:///sandbox/damaged-qr.jpg',
        embossedCode: 'TRE-EMB-0824',
        timestamp: '2026-09-21T10:05:00Z',
      });
      expect(idExc.embossedCode).toBe('TRE-EMB-0824');

      const issue = FieldIssueDtoSchema.parse({
        taskId: 'TSK-101',
        issueDescription: 'Tổ ong vò vẽ nguy hiểm',
        issuePhotoUri: 'file:///sandbox/issue.jpg',
        reportedAt: '2026-09-21T10:10:00Z',
        reportedByUserId: 'STF-01',
      });
      expect(issue.reportedByUserId).toBe('STF-01');
    });

    it('parses CareHistory, TaskType, findings, and queries', () => {
      expect(TaskTypeIdSchema.parse('tt-watering-01')).toBe('tt-watering-01');
      expect(LegacyTaskTypeSchema.parse('Tưới nước')).toBe('Tưới nước');
      expect(TreeHealthStatusSchema.parse('Khỏe mạnh')).toBe('Khỏe mạnh');
      expect(TreeRiskStatusSchema.parse('healthy')).toBe('healthy');

      const care = CareHistoryDtoSchema.parse({
        id: 'care-001',
        treeId: 'TRE-001',
        taskId: 'TSK-101',
        taskTitle: 'Tưới nước',
        staffId: 'STF-01',
        staffName: 'Nguyễn Văn Hùng',
        completedAt: '2026-09-21T11:00:00Z',
        status: 'COMPLETED',
      });
      expect(care.status).toBe('COMPLETED');

      const treeQuery = ListTreesQuerySchema.parse({ q: 'Xà Cừ', riskStatus: 'healthy', limit: '15' });
      expect(treeQuery.limit).toBe(15);

      const findings = StructuredFindingsSchema.parse({
        trunkLeanAngle: 5,
        cavityRotPercentage: 0,
        pestSeverity: 'none',
        deadwoodRisk: 'low',
      });
      expect(findings.deadwoodRisk).toBe('low');

      expect(ActivateTaskTypeRequestSchema.parse({ taskTypeId: 'TT-1', expectedVersion: 1 }).taskTypeId).toBe('TT-1');
      expect(DeactivateTaskTypeRequestSchema.parse({ taskTypeId: 'TT-1', expectedVersion: 2 }).taskTypeId).toBe('TT-1');

      const auditEvent = AuditEventDtoSchema.parse({
        id: 'AUD-001',
        actorId: 'ADM-01',
        actorRole: 'admin',
        action: 'CreateTree',
        targetResourceType: 'Tree',
        targetResourceId: 'TRE-001',
        timestamp: '2026-09-21T08:00:00Z',
      });
      expect(auditEvent.actorRole).toBe('admin');

      const auditQuery = ListAuditLogsQuerySchema.parse({ actorId: 'ADM-01', limit: '25' });
      expect(auditQuery.limit).toBe(25);
    });
  });

  // ============================================================================
  // 9. Version Field Validation (OCC)
  // ============================================================================
  describe('9. Version Field Validation in Versioned Entities', () => {
    it('accepts non-negative integer version values', () => {
      expect(TaskDtoSchema.shape.version.safeParse(0).success).toBe(true);
      expect(TaskDtoSchema.shape.version.safeParse(1).success).toBe(true);
      expect(TaskDtoSchema.shape.version.safeParse(42).success).toBe(true);

      expect(TreeDtoSchema.shape.version.safeParse(0).success).toBe(true);
      expect(TreeDtoSchema.shape.version.safeParse(5).success).toBe(true);
    });

    it('rejects negative, non-integer, or string version values', () => {
      expect(TaskDtoSchema.shape.version.safeParse(-1).success).toBe(false);
      expect(TaskDtoSchema.shape.version.safeParse(1.5).success).toBe(false);
      expect(TaskDtoSchema.shape.version.safeParse('1').success).toBe(false);
      expect(TaskDtoSchema.shape.version.safeParse(null).success).toBe(false);

      expect(TreeDtoSchema.shape.version.safeParse(-5).success).toBe(false);
      expect(TreeDtoSchema.shape.version.safeParse(2.7).success).toBe(false);
    });
  });

  // ============================================================================
  // 10. expectedVersion Required on Applicable Existing-Resource Mutations
  // ============================================================================
  describe('10. expectedVersion Required on Existing-Resource Mutations', () => {
    it('requires expectedVersion on SubmitEvidenceRequest', () => {
      const validVerification = {
        siteVerification: {
          gpsCheck: {
            verified: true,
            distance: 5,
            lat: 10.7769,
            lng: 106.6908,
            timestamp: '2026-09-21T10:00:00Z',
          },
          qrCheck: {
            verified: true,
            scannedCode: 'NOVYX-QR-TRE-001',
            timestamp: '2026-09-21T10:00:00Z',
          },
        },
      };
      const payloadWithoutVersion = {
        taskId: 'TSK-101',
        proof: {
          proofProfile: 'SERVICE_PROOF',
          completionPhotoUri: 'file:///photo.jpg',
          checklist: [{ id: 'c1', text: 'Xong việc', done: true }],
        },
        ...validVerification,
      };
      expect(SubmitEvidenceRequestSchema.safeParse(payloadWithoutVersion).success).toBe(false);

      const payloadWithVersion = { ...payloadWithoutVersion, expectedVersion: 2 };
      expect(SubmitEvidenceRequestSchema.safeParse(payloadWithVersion).success).toBe(true);
    });

    it('requires expectedVersion on Operational Task mutating requests', () => {
      // AssignTask
      expect(AssignTaskRequestSchema.safeParse({ taskId: 'T-1', assignedStaffId: 'S-1' }).success).toBe(false);
      expect(
        AssignTaskRequestSchema.safeParse({ taskId: 'T-1', expectedVersion: 1, assignedStaffId: 'S-1' }).success,
      ).toBe(true);

      // StartTask
      expect(StartTaskRequestSchema.safeParse({ taskId: 'T-1' }).success).toBe(false);
      expect(StartTaskRequestSchema.safeParse({ taskId: 'T-1', expectedVersion: 0 }).success).toBe(true);

      // ReassignTask
      expect(
        ReassignTaskRequestSchema.safeParse({ taskId: 'T-1', newStaffId: 'S-2', reason: 'Nhân viên ốm' }).success,
      ).toBe(false);
      expect(
        ReassignTaskRequestSchema.safeParse({
          taskId: 'T-1',
          expectedVersion: 1,
          newStaffId: 'S-2',
          reason: 'Nhân viên ốm',
        }).success,
      ).toBe(true);

      // CancelTask
      expect(CancelTaskRequestSchema.safeParse({ taskId: 'T-1', cancelReason: 'Cây gãy đổ' }).success).toBe(false);
      expect(
        CancelTaskRequestSchema.safeParse({ taskId: 'T-1', expectedVersion: 1, cancelReason: 'Cây gãy đổ' }).success,
      ).toBe(true);

      // ApproveTask
      expect(ApproveTaskRequestSchema.safeParse({ taskId: 'T-1', reviewerId: 'MGR-1' }).success).toBe(false);
      expect(
        ApproveTaskRequestSchema.safeParse({ taskId: 'T-1', expectedVersion: 2, reviewerId: 'MGR-1' }).success,
      ).toBe(true);

      // ApproveWithException
      expect(
        ApproveWithExceptionRequestSchema.safeParse({
          taskId: 'T-1',
          reviewerId: 'MGR-1',
          exceptionReason: 'GPS trôi do nhà cao tầng',
        }).success,
      ).toBe(false);
      expect(
        ApproveWithExceptionRequestSchema.safeParse({
          taskId: 'T-1',
          expectedVersion: 2,
          reviewerId: 'MGR-1',
          exceptionReason: 'GPS trôi do nhà cao tầng',
        }).success,
      ).toBe(true);

      // RequestRework
      expect(
        RequestReworkRequestSchema.safeParse({
          taskId: 'T-1',
          reviewerId: 'MGR-1',
          targetedArea: 'afterPhoto',
          reworkReason: 'Ảnh mờ không rõ gốc',
        }).success,
      ).toBe(false);
      expect(
        RequestReworkRequestSchema.safeParse({
          taskId: 'T-1',
          expectedVersion: 2,
          reviewerId: 'MGR-1',
          targetedArea: 'afterPhoto',
          reworkReason: 'Ảnh mờ không rõ gốc',
        }).success,
      ).toBe(true);

      // ReportFieldIssue & ResumeBlockedTask
      expect(
        ReportFieldIssueRequestSchema.safeParse({
          taskId: 'T-1',
          issueDescription: 'Tổ ong vò vẽ',
          issuePhotoUri: 'uri',
        }).success,
      ).toBe(false);
      expect(
        ReportFieldIssueRequestSchema.safeParse({
          taskId: 'T-1',
          expectedVersion: 1,
          issueDescription: 'Tổ ong vò vẽ',
          issuePhotoUri: 'uri',
        }).success,
      ).toBe(true);

      expect(
        ResumeBlockedTaskRequestSchema.safeParse({
          taskId: 'T-1',
          resolutionNotes: 'Đã xử lý xong tổ ong',
        }).success,
      ).toBe(false);
      expect(
        ResumeBlockedTaskRequestSchema.safeParse({
          taskId: 'T-1',
          expectedVersion: 2,
          resolutionNotes: 'Đã xử lý xong tổ ong',
        }).success,
      ).toBe(true);
    });

    it('requires expectedVersion on Governance mutating requests', () => {
      // AssignRole
      expect(
        AssignRoleRequestSchema.safeParse({ userId: 'U-1', newRole: 'manager', reason: 'Thăng cấp' }).success,
      ).toBe(false);
      expect(
        AssignRoleRequestSchema.safeParse({
          userId: 'U-1',
          expectedVersion: 1,
          newRole: 'manager',
          reason: 'Thăng cấp quản lý',
        }).success,
      ).toBe(true);

      // UpdateTreeMasterData
      expect(
        UpdateTreeMasterDataRequestSchema.safeParse({
          treeId: 'TRE-001',
          name: 'Tên mới',
          reason: 'Đo lại số liệu',
        }).success,
      ).toBe(false);
      expect(
        UpdateTreeMasterDataRequestSchema.safeParse({
          treeId: 'TRE-001',
          expectedVersion: 3,
          name: 'Tên mới',
          reason: 'Đo lại số liệu',
        }).success,
      ).toBe(true);
    });
  });

  // ============================================================================
  // 11. expectedVersion Absent / Not Required on Creation Contracts
  // ============================================================================
  describe('11. expectedVersion NOT Required on Creation Contracts', () => {
    it('validates CreateTaskRequest without expectedVersion', () => {
      const request = {
        title: 'Kiểm tra sâu bệnh',
        taskTypeId: 'tt-pest-inspection',
        description: 'Khảo sát định kỳ',
        treeId: 'TRE-001',
        assignedStaffId: 'STF-01',
        deadline: '2026-10-01',
      };
      expect(CreateTaskRequestSchema.safeParse(request).success).toBe(true);
      expect(CreateTaskRequestSchema.shape).not.toHaveProperty('expectedVersion');
    });

    it('validates ProvisionUserRequest without expectedVersion', () => {
      const request = {
        email: 'staff1@novyx.vn',
        phone: '0901234567',
        initialRole: 'staff',
      };
      expect(ProvisionUserRequestSchema.safeParse(request).success).toBe(true);
      expect(ProvisionUserRequestSchema.shape).not.toHaveProperty('expectedVersion');
    });

    it('validates CreateTreeRequest without expectedVersion', () => {
      const request = {
        treeId: 'TRE-NEW-01',
        qrCode: 'NOVYX-QR-NEW-01',
        name: 'Bằng Lăng Tím',
        species: 'Lagerstroemia speciosa',
        lat: 10.776,
        lng: 106.69,
        address: 'Đường Nguyễn Du',
        healthStatus: 'Khỏe mạnh',
        ageYears: 5,
      };
      expect(CreateTreeRequestSchema.safeParse(request).success).toBe(true);
      expect(CreateTreeRequestSchema.shape).not.toHaveProperty('expectedVersion');
    });

    it('validates CreateTaskTypeRequest without expectedVersion', () => {
      const request = {
        name: 'Cắt cỏ sát gốc',
        defaultProofProfile: 'SERVICE_PROOF',
        description: 'Vệ sinh cỏ dại sát bồn cây',
      };
      expect(CreateTaskTypeRequestSchema.safeParse(request).success).toBe(true);
      expect(CreateTaskTypeRequestSchema.shape).not.toHaveProperty('expectedVersion');
    });
  });

  // ============================================================================
  // 12. Strict UUIDv4 Idempotency-Key Transport Header
  // ============================================================================
  describe('12. Strict UUIDv4 Idempotency-Key Header Schema', () => {
    it('accepts valid UUIDv4 strings', () => {
      const validUuid = 'c8b417c8-356a-4d2b-bbd7-628d0be4299b';
      expect(StrictUuidv4Schema.safeParse(validUuid).success).toBe(true);
      expect(StrictUuidv4Schema.safeParse('f47ac10b-58cc-4372-a567-0e02b2c3d479').success).toBe(true);
    });

    it('rejects invalid UUID formats', () => {
      expect(StrictUuidv4Schema.safeParse('not-a-uuid').success).toBe(false);
      expect(StrictUuidv4Schema.safeParse('123456789').success).toBe(false);
      expect(StrictUuidv4Schema.safeParse('').success).toBe(false);
      // UUIDv1 -> FAIL
      expect(StrictUuidv4Schema.safeParse('6ba7b810-9dad-11d1-80b4-00c04fd430c8').success).toBe(false);
      // UUIDv3 -> FAIL
      expect(StrictUuidv4Schema.safeParse('6ba7b811-9dad-31d1-80b4-00c04fd430c8').success).toBe(false);
      // UUIDv5 -> FAIL
      expect(StrictUuidv4Schema.safeParse('6ba7b812-9dad-51d1-80b4-00c04fd430c8').success).toBe(false);
    });

    it('validates IdempotencyKeyHeaderSchema with lowercase or canonical header name', () => {
      const validUuid = 'c8b417c8-356a-4d2b-bbd7-628d0be4299b';
      expect(IdempotencyKeyHeaderSchema.safeParse({ 'idempotency-key': validUuid }).success).toBe(true);
      expect(IdempotencyKeyHeaderSchema.safeParse({ 'Idempotency-Key': validUuid }).success).toBe(true);
      expect(IdempotencyKeyHeaderSchema.safeParse({ 'idempotency-key': 'invalid' }).success).toBe(false);
      expect(IdempotencyKeyHeaderSchema.safeParse({}).success).toBe(false);
    });

    it('validates StrictMutationHeadersSchema', () => {
      const validUuid = 'c8b417c8-356a-4d2b-bbd7-628d0be4299b';
      expect(StrictMutationHeadersSchema.safeParse({ 'idempotency-key': validUuid }).success).toBe(true);
      expect(StrictMutationHeadersSchema.safeParse({ 'idempotency-key': 'abc' }).success).toBe(false);
    });
  });

  // ============================================================================
  // 13. Idempotency-Key Absent from Canonical Business Bodies
  // ============================================================================
  describe('13. Separation: Idempotency-Key Absent from Business Request Bodies', () => {
    it('does NOT contain idempotencyKey or Idempotency-Key in mutating command body schemas', () => {
      const mutatingBodySchemas = [
        CreateTaskRequestSchema,
        SubmitEvidenceRequestSchema,
        ApproveTaskRequestSchema,
        ApproveWithExceptionRequestSchema,
        RequestReworkRequestSchema,
        ResubmitReworkRequestSchema,
        AssignTaskRequestSchema,
        StartTaskRequestSchema,
        ReassignTaskRequestSchema,
        CancelTaskRequestSchema,
        ReportFieldIssueRequestSchema,
        ResumeBlockedTaskRequestSchema,
        ProvisionUserRequestSchema,
        AssignRoleRequestSchema,
        UpdateTreeMasterDataRequestSchema,
      ];

      for (const schema of mutatingBodySchemas) {
        const schemaObj = schema as unknown as {
          shape?: Record<string, unknown>;
          _def?: { schema?: { shape?: Record<string, unknown> } };
        };
        const shape = schemaObj.shape ?? schemaObj._def?.schema?.shape;
        expect(shape).not.toHaveProperty('idempotencyKey');
        expect(shape).not.toHaveProperty('Idempotency-Key');
        expect(shape).not.toHaveProperty('idempotency-key');
      }
    });
  });

  // ============================================================================
  // 14. 409 CONFLICT / STALE_VERSION Error Contract
  // ============================================================================
  describe('14. OCC Error Contract: 409 CONFLICT / STALE_VERSION', () => {
    it('validates ConflictErrorDetailsSchema', () => {
      const validConflictDetails = {
        subtype: 'STALE_VERSION',
        currentVersion: 5,
        expectedVersion: 4,
      };
      expect(ConflictErrorDetailsSchema.safeParse(validConflictDetails).success).toBe(true);

      const invalidSubtype = { ...validConflictDetails, subtype: 'UNKNOWN_CONFLICT' };
      expect(ConflictErrorDetailsSchema.safeParse(invalidSubtype).success).toBe(false);

      const negativeVersion = { ...validConflictDetails, currentVersion: -1 };
      expect(ConflictErrorDetailsSchema.safeParse(negativeVersion).success).toBe(false);
    });

    it('validates ApiError with CONFLICT error code and STALE_VERSION details', () => {
      const conflictError = {
        code: 'CONFLICT',
        message: 'Task has been modified by another operation',
        details: {
          subtype: 'STALE_VERSION',
          currentVersion: 5,
          expectedVersion: 4,
        },
        requestId: 'req-uuid-1234',
      };
      const parseResult = ApiErrorSchema.safeParse(conflictError);
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.code).toBe('CONFLICT');
        expect(ConflictErrorDetailsSchema.safeParse(parseResult.data.details).success).toBe(true);
      }
    });
  });

  // ============================================================================
  // 15. Body / Query / Path / Header Separation
  // ============================================================================
  describe('15. Clean Separation of Transport Surfaces', () => {
    it('models body, query, and headers as distinct specialized schemas', () => {
      // Body Schema
      expect(SubmitEvidenceRequestSchema).toBeDefined();
      expect(typeof SubmitEvidenceRequestSchema.parse).toBe('function');

      // Query Schema
      expect(ListTasksQuerySchema).toBeDefined();
      expect(PaginationQuerySchema).toBeDefined();

      // Header Schema
      expect(IdempotencyKeyHeaderSchema).toBeDefined();

      // Ensure queries do not require bodies or headers
      const parsedQuery = ListTasksQuerySchema.parse({ staffId: 'STF-01', limit: '10' });
      expect(parsedQuery.limit).toBe(10);
    });
  });

  // ============================================================================
  // 16. Governance Exposure Boundaries (Active MVP vs Inactive/Future)
  // ============================================================================
  describe('16. Governance Exposure Boundaries', () => {
    it('exposes schemas for ACTIVE MVP governance actions', () => {
      expect(ProvisionUserRequestSchema).toBeDefined();
      expect(AssignRoleRequestSchema).toBeDefined();
      expect(ActivateAccountRequestSchema).toBeDefined();
      expect(SuspendAccountRequestSchema).toBeDefined();
      expect(DisableAccountRequestSchema).toBeDefined();
      expect(UnlockAccountRequestSchema).toBeDefined();
      expect(ResetCredentialSetupRequestSchema).toBeDefined();
      expect(CreateTreeRequestSchema).toBeDefined();
      expect(UpdateTreeMasterDataRequestSchema).toBeDefined();
      expect(ReplaceTreeQrCodeRequestSchema).toBeDefined();
      expect(UpdateCanonicalCoordinatesRequestSchema).toBeDefined();
      expect(RetireTreeRequestSchema).toBeDefined();
      expect(CreateTaskTypeRequestSchema).toBeDefined();
      expect(PublishProofPolicyVersionRequestSchema).toBeDefined();
      expect(PublishChecklistTemplateVersionRequestSchema).toBeDefined();
    });

    it('does NOT expose schemas for FUTURE_NOT_ACTIVE or REJECTED capabilities (GV-20, GV-21, GV-22)', () => {
      // Verified: No schemas exist for ManageDynamicFindingsTemplate, UseBreakGlass, ManagePlatformSystemConfig
      expect(contracts).not.toHaveProperty('ManageDynamicFindingsTemplateRequestSchema');
      expect(contracts).not.toHaveProperty('UseBreakGlassRequestSchema');
      expect(contracts).not.toHaveProperty('ManagePlatformSystemConfigRequestSchema');
      expect(contracts).not.toHaveProperty('ProjectCareHistoryRequestSchema');
    });
  });

  // ============================================================================
  // 17. Legacy Compatibility Does Not Contaminate Canonical Schemas
  // ============================================================================
  describe('17. Legacy Compatibility Layer Isolation', () => {
    it('provides legacy constants under LegacyTaskStatus without contaminating TaskStatusSchema', () => {
      expect(LegacyTaskStatus.PENDING).toBe('Pending');
      expect(LegacyTaskStatus.IN_PROGRESS).toBe('In_Progress');
      expect(LegacyTaskStatus.WAITING_REVIEW).toBe('Waiting_Review');
      expect(LegacyTaskStatus.COMPLETED).toBe('Completed');
      expect(LegacyTaskStatus.REWORK_REQUIRED).toBe('Rework_Required');

      // Canonical schema strictly rejects these legacy values
      expect(TaskStatusSchema.safeParse(LegacyTaskStatus.PENDING).success).toBe(false);
      expect(TaskStatusSchema.safeParse(LegacyTaskStatus.IN_PROGRESS).success).toBe(false);
      expect(TaskStatusSchema.safeParse(LegacyTaskStatus.WAITING_REVIEW).success).toBe(false);
      expect(TaskStatusSchema.safeParse(LegacyTaskStatus.COMPLETED).success).toBe(false);
      expect(TaskStatusSchema.safeParse(LegacyTaskStatus.REWORK_REQUIRED).success).toBe(false);
    });

    it('re-exports TaskStatus object identical to LegacyTaskStatus for mobile runtime compatibility', () => {
      expect(TaskStatus).toBe(LegacyTaskStatus);
    });
  });

  // ============================================================================
  // 18. Wave 1 Canonical Drift Corrections (W1-C01 .. W1-C06)
  // ============================================================================
  describe('18. Wave 1 Canonical Drift Corrections (W1-C01 .. W1-C06)', () => {
    // --------------------------------------------------------------------------
    // W1-C01: Remove Legacy Fixed TaskType from Canonical Contract
    // --------------------------------------------------------------------------
    describe('W1-C01: TaskType Catalog Identity & Canonical Decoupling', () => {
      it('accepts arbitrary catalog-based TaskType identifiers in operational commands', () => {
        expect(TaskTypeIdSchema.safeParse('tt-custom-deep-root-care').success).toBe(true);
        expect(TaskTypeIdSchema.safeParse('tt-hazardous-tree-removal').success).toBe(true);
        expect(TaskTypeIdSchema.safeParse('catalogue-item-999').success).toBe(true);
        expect(TaskTypeIdSchema.safeParse('').success).toBe(false);
      });

      it('ensures canonical TaskDto and CreateTaskRequest reference catalog identity, not fixed 6-enum', () => {
        const customCreate = {
          title: 'Đốn hạ cây nguy hiểm sau bão',
          taskTypeId: 'tt-emergency-fell-01',
          description: 'Cây nghiêng 45 độ sát đường điện',
          treeId: 'TRE-888',
          assignedStaffId: 'STF-99',
          deadline: '2026-10-15T18:00:00Z',
        };
        expect(CreateTaskRequestSchema.safeParse(customCreate).success).toBe(true);

        const customTaskDto = {
          id: 'TSK-999',
          version: 0,
          title: 'Đốn hạ cây nguy hiểm sau bão',
          taskTypeId: 'tt-emergency-fell-01',
          taskTypeName: 'Đốn hạ khẩn cấp',
          proofProfile: 'CHANGE_PROOF',
          description: 'Cây nghiêng 45 độ sát đường điện',
          treeId: 'TRE-888',
          treeName: 'Xà cừ ngã',
          treeAddress: 'Quận 1',
          assignedStaffId: 'STF-99',
          assignedStaffName: 'Lê Văn An',
          deadline: '2026-10-15T18:00:00Z',
          status: 'PENDING',
          createdAt: '2026-09-21T10:00:00Z',
          updatedAt: '2026-09-21T10:00:00Z',
        };
        expect(TaskDtoSchema.safeParse(customTaskDto).success).toBe(true);
      });

      it('allows CreateTaskType to produce catalog items beyond the 6 legacy demo names', () => {
        const newCatalogType = {
          name: 'Chăm sóc vi sinh rễ sâu',
          defaultProofProfile: 'SERVICE_PROOF',
          description: 'Bổ sung vi sinh vật đối kháng quanh bầu rễ',
        };
        expect(CreateTaskTypeRequestSchema.safeParse(newCatalogType).success).toBe(true);
      });

      it('isolates legacy 6 Vietnamese TaskType strings strictly inside TRANSITIONAL_COMPAT', () => {
        expect(LegacyTaskTypeSchema.safeParse('Tưới nước').success).toBe(true);
        expect(LegacyTaskTypeSchema.safeParse('Cắt tỉa cành').success).toBe(true);
        expect(LegacyTaskTypeSchema.safeParse('Bón phân').success).toBe(true);
        expect(LegacyTaskTypeSchema.safeParse('Phun thuốc').success).toBe(true);
        expect(LegacyTaskTypeSchema.safeParse('Kiểm tra sâu bệnh').success).toBe(true);
        expect(LegacyTaskTypeSchema.safeParse('Trồng mới').success).toBe(true);

        expect(LegacyTaskTypeSchema.safeParse('Chăm sóc vi sinh rễ sâu').success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // W1-C02: Create Task Must Not Accept Arbitrary Checklist Configuration
    // --------------------------------------------------------------------------
    describe('W1-C02: CreateTask Request Policy Ownership', () => {
      it('does NOT expose checklist in canonical CreateTaskRequestSchema.shape', () => {
        expect(CreateTaskRequestSchema.shape).not.toHaveProperty('checklist');
        expect(CreateTaskRequestSchema.shape).not.toHaveProperty('expectedVersion');
      });

      it('rejects client-owned arbitrary checklist when using strict schema validation', () => {
        const payloadWithChecklist = {
          title: 'Tưới nước định kỳ',
          taskTypeId: 'tt-watering-01',
          description: 'Tưới cây',
          treeId: 'TRE-001',
          assignedStaffId: 'STF-01',
          deadline: '2026-09-30T17:00:00Z',
          checklist: [{ id: 'c1', text: 'Tự biên tự diễn', done: false }],
        };
        expect(CreateTaskRequestSchema.strict().safeParse(payloadWithChecklist).success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // W1-C03: UUIDv4 Must Actually Be RFC 4122 UUIDv4
    // --------------------------------------------------------------------------
    describe('W1-C03: Real RFC 4122 UUIDv4 Validation', () => {
      it('accepts valid UUIDv4 strings (lowercase and uppercase)', () => {
        expect(StrictUuidv4Schema.safeParse('c8b417c8-356a-4d2b-bbd7-628d0be4299b').success).toBe(true);
        expect(StrictUuidv4Schema.safeParse('F47AC10B-58CC-4372-A567-0E02B2C3D479').success).toBe(true);
        expect(StrictUuidv4Schema.safeParse('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d').success).toBe(true);
      });

      it('rejects malformed UUID strings', () => {
        expect(StrictUuidv4Schema.safeParse('not-a-uuid').success).toBe(false);
        expect(StrictUuidv4Schema.safeParse('123456789').success).toBe(false);
        expect(StrictUuidv4Schema.safeParse('').success).toBe(false);
        expect(StrictUuidv4Schema.safeParse('c8b417c8-356a-4d2b-bbd7-628d0be4299').success).toBe(false); // too short
        expect(StrictUuidv4Schema.safeParse('c8b417c8-356a-4d2b-bbd7-628d0be4299bb').success).toBe(false); // too long
      });

      it('rejects non-v4 UUID versions: UUIDv1, UUIDv3, UUIDv5', () => {
        // UUIDv1 (version nibble is 1)
        expect(StrictUuidv4Schema.safeParse('6ba7b810-9dad-11d1-80b4-00c04fd430c8').success).toBe(false);
        // UUIDv3 (version nibble is 3)
        expect(StrictUuidv4Schema.safeParse('6ba7b811-9dad-31d1-80b4-00c04fd430c8').success).toBe(false);
        // UUIDv5 (version nibble is 5)
        expect(StrictUuidv4Schema.safeParse('6ba7b812-9dad-51d1-80b4-00c04fd430c8').success).toBe(false);
      });

      it('rejects UUIDs with invalid RFC variant nibbles', () => {
        // Variant nibble must be 8, 9, a, or b (binary 10xx)
        expect(StrictUuidv4Schema.safeParse('f47ac10b-58cc-4372-7567-0e02b2c3d479').success).toBe(false);
        expect(StrictUuidv4Schema.safeParse('f47ac10b-58cc-4372-c567-0e02b2c3d479').success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // W1-C04: Submit Evidence Verification Completeness & Checklist Invariants
    // --------------------------------------------------------------------------
    describe('W1-C04: Submit Evidence Verification Completeness & Completed Checklist', () => {
      const validGps = {
        verified: true,
        distance: 8.5,
        lat: 10.7769,
        lng: 106.6908,
        timestamp: '2026-09-21T10:00:00Z',
      };
      const validQr = {
        verified: true,
        scannedCode: 'NOVYX-QR-TRE-001',
        timestamp: '2026-09-21T10:00:00Z',
      };
      const validLocExc = {
        reason: 'GPS bị trôi dưới tán dày',
        distanceMeters: 15.0,
        explanationPhotoUri: 'file:///sandbox/gps-drift.jpg',
        recordedLat: 10.777,
        recordedLng: 106.691,
        timestamp: '2026-09-21T10:05:00Z',
      };
      const validIdExc = {
        reason: 'Tem QR bị mất trộm',
        damagedQrPhotoUri: 'file:///sandbox/tag-missing.jpg',
        timestamp: '2026-09-21T10:05:00Z',
      };
      const baseProof = {
        proofProfile: 'SERVICE_PROOF' as const,
        completionPhotoUri: 'file:///sandbox/done.jpg',
        checklist: [{ id: 'chk-1', text: 'Bón phân hoàn tất', done: true as const }],
      };

      it('requires both Location and Identity dimensions to have a resolved outcome', () => {
        // Case 1: GPS verified + QR verified -> PASS
        expect(
          SubmitEvidenceRequestSchema.safeParse({
            taskId: 'TSK-1',
            expectedVersion: 1,
            proof: baseProof,
            siteVerification: { gpsCheck: validGps, qrCheck: validQr },
          }).success,
        ).toBe(true);

        // Case 2: LocationException + QR verified -> PASS
        expect(
          SubmitEvidenceRequestSchema.safeParse({
            taskId: 'TSK-1',
            expectedVersion: 1,
            proof: baseProof,
            locationException: validLocExc,
            siteVerification: { qrCheck: validQr },
          }).success,
        ).toBe(true);

        // Case 3: GPS verified + IdentityException -> PASS
        expect(
          SubmitEvidenceRequestSchema.safeParse({
            taskId: 'TSK-1',
            expectedVersion: 1,
            proof: baseProof,
            identityException: validIdExc,
            siteVerification: { gpsCheck: validGps },
          }).success,
        ).toBe(true);

        // Case 4: LocationException + IdentityException -> PASS
        expect(
          SubmitEvidenceRequestSchema.safeParse({
            taskId: 'TSK-1',
            expectedVersion: 1,
            proof: baseProof,
            locationException: validLocExc,
            identityException: validIdExc,
          }).success,
        ).toBe(true);
      });

      it('rejects payload when Location dimension is unsatisfied', () => {
        // Only QR verified, no GPS and no LocationException
        const res = SubmitEvidenceRequestSchema.safeParse({
          taskId: 'TSK-1',
          expectedVersion: 1,
          proof: baseProof,
          siteVerification: { qrCheck: validQr },
        });
        expect(res.success).toBe(false);
      });

      it('rejects payload when Identity dimension is unsatisfied', () => {
        // Only GPS verified, no QR and no IdentityException
        const res = SubmitEvidenceRequestSchema.safeParse({
          taskId: 'TSK-1',
          expectedVersion: 1,
          proof: baseProof,
          siteVerification: { gpsCheck: validGps },
        });
        expect(res.success).toBe(false);
      });

      it('rejects payload when NEITHER Location nor Identity dimension is satisfied', () => {
        const res = SubmitEvidenceRequestSchema.safeParse({
          taskId: 'TSK-1',
          expectedVersion: 1,
          proof: baseProof,
        });
        expect(res.success).toBe(false);
      });

      it('rejects ambiguous payload providing both verified and exception for the same dimension', () => {
        // Ambiguous Location: both verified GPS and LocationException
        const ambiguousLoc = SubmitEvidenceRequestSchema.safeParse({
          taskId: 'TSK-1',
          expectedVersion: 1,
          proof: baseProof,
          siteVerification: { gpsCheck: validGps, qrCheck: validQr },
          locationException: validLocExc,
        });
        expect(ambiguousLoc.success).toBe(false);

        // Ambiguous Identity: both verified QR and IdentityException
        const ambiguousId = SubmitEvidenceRequestSchema.safeParse({
          taskId: 'TSK-1',
          expectedVersion: 1,
          proof: baseProof,
          siteVerification: { gpsCheck: validGps, qrCheck: validQr },
          identityException: validIdExc,
        });
        expect(ambiguousId.success).toBe(false);
      });

      it('validates SubmittedChecklistItemSchema requires done === true', () => {
        expect(SubmittedChecklistItemSchema.safeParse({ id: 'c1', text: 'Tưới đẫm tán', done: true }).success).toBe(
          true,
        );
        expect(SubmittedChecklistItemSchema.safeParse({ id: 'c1', text: 'Tưới đẫm tán', done: false }).success).toBe(
          false,
        );
      });

      it('requires 100% completed checklist (done: true) for CHANGE_PROOF submissions', () => {
        const changeProofIncomplete = {
          proofProfile: 'CHANGE_PROOF',
          beforePhotoUri: 'file:///before.jpg',
          afterPhotoUri: 'file:///after.jpg',
          checklist: [
            { id: 'c1', text: 'Xới đất', done: true },
            { id: 'c2', text: 'Bón lót', done: false }, // Incomplete!
          ],
        };
        expect(ChangeProofPayloadSchema.safeParse(changeProofIncomplete).success).toBe(false);

        const changeProofComplete = {
          ...changeProofIncomplete,
          checklist: [
            { id: 'c1', text: 'Xới đất', done: true },
            { id: 'c2', text: 'Bón lót', done: true },
          ],
        };
        expect(ChangeProofPayloadSchema.safeParse(changeProofComplete).success).toBe(true);
      });

      it('requires 100% completed checklist (done: true) for SERVICE_PROOF submissions', () => {
        const serviceProofIncomplete = {
          proofProfile: 'SERVICE_PROOF',
          completionPhotoUri: 'file:///done.jpg',
          checklist: [
            { id: 'c1', text: 'Tưới nước đẫm tán', done: false }, // Incomplete!
          ],
        };
        expect(ServiceProofPayloadSchema.safeParse(serviceProofIncomplete).success).toBe(false);

        const serviceProofComplete = {
          ...serviceProofIncomplete,
          checklist: [{ id: 'c1', text: 'Tưới nước đẫm tán', done: true }],
        };
        expect(ServiceProofPayloadSchema.safeParse(serviceProofComplete).success).toBe(true);
      });
    });

    // --------------------------------------------------------------------------
    // W1-C05: Identity Exception Optional Manual Code
    // --------------------------------------------------------------------------
    describe('W1-C05: Identity Exception Manual Code Optionality', () => {
      it('photo + reason + NO embossed code -> PASS', () => {
        const exc = {
          reason: 'QR tag bị rách do thời tiết',
          damagedQrPhotoUri: 'file:///sandbox/torn-qr.jpg',
          timestamp: '2026-09-21T10:00:00Z',
        };
        expect(IdentityExceptionSchema.safeParse(exc).success).toBe(true);
      });

      it('photo + reason + embossed code -> PASS', () => {
        const exc = {
          reason: 'QR tag bị mờ số',
          damagedQrPhotoUri: 'file:///sandbox/faded-qr.jpg',
          embossedCode: 'EMB-TRE-101',
          timestamp: '2026-09-21T10:00:00Z',
        };
        expect(IdentityExceptionSchema.safeParse(exc).success).toBe(true);
      });

      it('missing required photo -> FAIL', () => {
        const exc = {
          reason: 'QR tag bị mờ',
          embossedCode: 'EMB-TRE-101',
          timestamp: '2026-09-21T10:00:00Z',
        };
        expect(IdentityExceptionSchema.safeParse(exc).success).toBe(false);
      });

      it('missing reason -> FAIL', () => {
        const exc = {
          damagedQrPhotoUri: 'file:///sandbox/faded-qr.jpg',
          embossedCode: 'EMB-TRE-101',
          timestamp: '2026-09-21T10:00:00Z',
        };
        expect(IdentityExceptionSchema.safeParse(exc).success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // W1-C06: GPS Verification Threshold & Coordinate Range Invariants
    // --------------------------------------------------------------------------
    describe('W1-C06: GPS Threshold & Geographic Coordinate Ranges', () => {
      it('enforces verified GPS distance <= 10m', () => {
        const base = {
          lat: 10.7769,
          lng: 106.6908,
          timestamp: '2026-09-21T10:00:00Z',
        };

        // verified=true + distance <= 10 -> PASS
        expect(GpsCheckSchema.safeParse({ ...base, verified: true, distance: 0 }).success).toBe(true);
        expect(GpsCheckSchema.safeParse({ ...base, verified: true, distance: 5 }).success).toBe(true);
        expect(GpsCheckSchema.safeParse({ ...base, verified: true, distance: 10 }).success).toBe(true);

        // verified=true + distance > 10 -> FAIL
        expect(GpsCheckSchema.safeParse({ ...base, verified: true, distance: 10.1 }).success).toBe(false);
        expect(GpsCheckSchema.safeParse({ ...base, verified: true, distance: 50 }).success).toBe(false);

        // verified=false + distance > 10 -> PASS (unverified measurement / exception context)
        expect(GpsCheckSchema.safeParse({ ...base, verified: false, distance: 50 }).success).toBe(true);
      });

      it('enforces latitude range [-90, 90]', () => {
        expect(LatitudeSchema.safeParse(0).success).toBe(true);
        expect(LatitudeSchema.safeParse(90).success).toBe(true);
        expect(LatitudeSchema.safeParse(-90).success).toBe(true);

        expect(LatitudeSchema.safeParse(90.1).success).toBe(false);
        expect(LatitudeSchema.safeParse(-90.1).success).toBe(false);
        expect(LatitudeSchema.safeParse(100).success).toBe(false);
      });

      it('enforces longitude range [-180, 180]', () => {
        expect(LongitudeSchema.safeParse(0).success).toBe(true);
        expect(LongitudeSchema.safeParse(180).success).toBe(true);
        expect(LongitudeSchema.safeParse(-180).success).toBe(true);

        expect(LongitudeSchema.safeParse(180.1).success).toBe(false);
        expect(LongitudeSchema.safeParse(-180.1).success).toBe(false);
        expect(LongitudeSchema.safeParse(200).success).toBe(false);
      });

      it('validates coordinate boundaries across Tree and Verification schemas', () => {
        // CreateTreeRequestSchema
        const validTree = {
          treeId: 'TRE-01',
          qrCode: 'QR-01',
          name: 'Cây bàng',
          species: 'Terminalia catappa',
          lat: 10.5,
          lng: 106.5,
          address: 'Hồ Chí Minh',
          healthStatus: 'Khỏe mạnh' as const,
          ageYears: 10,
        };
        expect(CreateTreeRequestSchema.safeParse(validTree).success).toBe(true);
        expect(CreateTreeRequestSchema.safeParse({ ...validTree, lat: 90.1 }).success).toBe(false);
        expect(CreateTreeRequestSchema.safeParse({ ...validTree, lng: 180.1 }).success).toBe(false);

        // UpdateCanonicalCoordinatesRequestSchema
        const validCoordUpdate = {
          treeId: 'TRE-01',
          expectedVersion: 1,
          lat: -89.9,
          lng: 179.9,
          reason: 'Hiệu chỉnh tọa độ GPS chuẩn',
        };
        expect(UpdateCanonicalCoordinatesRequestSchema.safeParse(validCoordUpdate).success).toBe(true);
        expect(UpdateCanonicalCoordinatesRequestSchema.safeParse({ ...validCoordUpdate, lat: -90.1 }).success).toBe(
          false,
        );
        expect(UpdateCanonicalCoordinatesRequestSchema.safeParse({ ...validCoordUpdate, lng: 180.1 }).success).toBe(
          false,
        );

        // TreeDtoSchema
        const validTreeDto = {
          id: 'TRE-01',
          version: 2,
          name: 'Cây bàng',
          species: 'Terminalia catappa',
          lat: 0,
          lng: 0,
          address: 'Xích đạo',
          qrCode: 'QR-01',
          healthStatus: 'Khỏe mạnh' as const,
          ageYears: 10,
        };
        expect(TreeDtoSchema.safeParse(validTreeDto).success).toBe(true);
        expect(TreeDtoSchema.safeParse({ ...validTreeDto, lat: 100 }).success).toBe(false);
        expect(TreeDtoSchema.safeParse({ ...validTreeDto, lng: 200 }).success).toBe(false);

        // LocationExceptionSchema
        const validLocExc = {
          reason: 'Tán cây dày',
          distanceMeters: 20,
          explanationPhotoUri: 'file:///photo.jpg',
          recordedLat: 10.0,
          recordedLng: 106.0,
          timestamp: '2026-09-21T10:00:00Z',
        };
        expect(LocationExceptionSchema.safeParse(validLocExc).success).toBe(true);
        expect(LocationExceptionSchema.safeParse({ ...validLocExc, recordedLat: 95 }).success).toBe(false);
        expect(LocationExceptionSchema.safeParse({ ...validLocExc, recordedLng: -185 }).success).toBe(false);
      });
    });
  });
});
