import type { CanonicalTaskDto, TaskDto } from '@novyx/contracts';
import type { IDatabaseConnection } from '../database/types';
import type { PersistedEvidenceFile } from '../evidence/evidenceFileStore';
import type { LocalSubmissionStatus } from '../outbox/types';

export interface LocalDraftData {
  taskId: string;
  submissionStatus: LocalSubmissionStatus;
  gpsLat: number | null;
  gpsLng: number | null;
  gpsDistanceMeters: number | null;
  gpsVerified: boolean;
  gpsTimestamp: string | null;
  qrScannedCode: string | null;
  qrVerified: boolean;
  qrTimestamp: string | null;
  locationExceptionJson: string | null;
  identityExceptionJson: string | null;
  checklistJson: string | null;
  findingsJson: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IMobileTaskRepository {
  cacheTasks(tasks: Array<TaskDto | CanonicalTaskDto>): Promise<void>;
  getCachedTask(taskId: string): Promise<TaskDto | null>;
  listCachedTasks(): Promise<TaskDto[]>;
  saveDraft(draft: Partial<LocalDraftData> & { taskId: string }): Promise<void>;
  getDraft(taskId: string): Promise<LocalDraftData | null>;
  saveEvidenceMetadata(evidence: PersistedEvidenceFile): Promise<void>;
  listEvidenceByTask(taskId: string): Promise<PersistedEvidenceFile[]>;
  recoverTaskSession(taskId: string): Promise<{
    task: TaskDto | null;
    draft: LocalDraftData | null;
    evidence: PersistedEvidenceFile[];
  }>;
}

export class SqliteMobileTaskRepository implements IMobileTaskRepository {
  private db: IDatabaseConnection;

  constructor(db: IDatabaseConnection) {
    this.db = db;
  }

  async cacheTasks(tasks: Array<TaskDto | CanonicalTaskDto>): Promise<void> {
    if (tasks.length === 0) return;
    const now = new Date().toISOString();
    const CHUNK_SIZE = 25;

    await this.db.withTransactionAsync(async () => {
      for (let i = 0; i < tasks.length; i += CHUNK_SIZE) {
        const chunk = tasks.slice(i, i + CHUNK_SIZE);
        const valuePlaceholders: string[] = [];
        const params: unknown[] = [];

        for (const task of chunk) {
          const raw = task as unknown as Record<string, unknown>;
          const taskTypeId = (raw.taskTypeId ?? raw.taskType ?? null) as string | null;
          const taskTypeName = (raw.taskTypeName ?? raw.taskType ?? null) as string | null;
          const proofProfile = (raw.proofProfile ?? null) as string | null;
          const priority = (raw.priority ?? null) as string | null;

          valuePlaceholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
          params.push(
            task.id,
            task.treeId,
            taskTypeId,
            taskTypeName,
            task.status,
            task.assignedStaffId ?? null,
            task.assignedStaffName ?? null,
            task.deadline ?? null,
            task.version ?? 0,
            proofProfile,
            task.title,
            task.description ?? null,
            priority,
            JSON.stringify(task),
            now,
          );
        }

        const query = `
          INSERT INTO cached_tasks (
            id,
            tree_id,
            task_type_id,
            task_type_name,
            status,
            assigned_staff_id,
            assigned_staff_name,
            deadline,
            version,
            proof_profile,
            title,
            description,
            priority,
            raw_json,
            updated_at
          ) VALUES ${valuePlaceholders.join(', ')}
          ON CONFLICT(id) DO UPDATE SET
            tree_id = excluded.tree_id,
            task_type_id = excluded.task_type_id,
            task_type_name = excluded.task_type_name,
            status = excluded.status,
            assigned_staff_id = excluded.assigned_staff_id,
            assigned_staff_name = excluded.assigned_staff_name,
            deadline = excluded.deadline,
            version = excluded.version,
            proof_profile = excluded.proof_profile,
            title = excluded.title,
            description = excluded.description,
            priority = excluded.priority,
            raw_json = excluded.raw_json,
            updated_at = excluded.updated_at;
        `;

        await this.db.runAsync(query, params);
      }
    });
  }

  async getCachedTask(taskId: string): Promise<TaskDto | null> {
    const row = await this.db.getFirstAsync<{ raw_json: string }>('SELECT raw_json FROM cached_tasks WHERE id = ?;', [
      taskId,
    ]);
    if (!row || !row.raw_json) {
      return null;
    }
    return JSON.parse(row.raw_json) as TaskDto;
  }

  async listCachedTasks(): Promise<TaskDto[]> {
    const rows = await this.db.getAllAsync<{ raw_json: string }>(
      'SELECT raw_json FROM cached_tasks ORDER BY updated_at DESC;',
    );
    return rows.map((r) => JSON.parse(r.raw_json) as TaskDto);
  }

  async saveDraft(draft: Partial<LocalDraftData> & { taskId: string }): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `INSERT INTO local_drafts (
        task_id,
        submission_status,
        gps_lat,
        gps_lng,
        gps_distance_meters,
        gps_verified,
        gps_timestamp,
        qr_scanned_code,
        qr_verified,
        qr_timestamp,
        location_exception_json,
        identity_exception_json,
        checklist_json,
        findings_json,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(task_id) DO UPDATE SET
        submission_status = COALESCE(excluded.submission_status, local_drafts.submission_status),
        gps_lat = COALESCE(excluded.gps_lat, local_drafts.gps_lat),
        gps_lng = COALESCE(excluded.gps_lng, local_drafts.gps_lng),
        gps_distance_meters = COALESCE(excluded.gps_distance_meters, local_drafts.gps_distance_meters),
        gps_verified = COALESCE(excluded.gps_verified, local_drafts.gps_verified),
        gps_timestamp = COALESCE(excluded.gps_timestamp, local_drafts.gps_timestamp),
        qr_scanned_code = COALESCE(excluded.qr_scanned_code, local_drafts.qr_scanned_code),
        qr_verified = COALESCE(excluded.qr_verified, local_drafts.qr_verified),
        qr_timestamp = COALESCE(excluded.qr_timestamp, local_drafts.qr_timestamp),
        location_exception_json = COALESCE(excluded.location_exception_json, local_drafts.location_exception_json),
        identity_exception_json = COALESCE(excluded.identity_exception_json, local_drafts.identity_exception_json),
        checklist_json = COALESCE(excluded.checklist_json, local_drafts.checklist_json),
        findings_json = COALESCE(excluded.findings_json, local_drafts.findings_json),
        notes = COALESCE(excluded.notes, local_drafts.notes),
        updated_at = excluded.updated_at;`,
      [
        draft.taskId,
        draft.submissionStatus ?? 'SAVED_DRAFT',
        draft.gpsLat ?? null,
        draft.gpsLng ?? null,
        draft.gpsDistanceMeters ?? null,
        draft.gpsVerified ? 1 : 0,
        draft.gpsTimestamp ?? null,
        draft.qrScannedCode ?? null,
        draft.qrVerified ? 1 : 0,
        draft.qrTimestamp ?? null,
        draft.locationExceptionJson ?? null,
        draft.identityExceptionJson ?? null,
        draft.checklistJson ?? null,
        draft.findingsJson ?? null,
        draft.notes ?? null,
        draft.createdAt ?? now,
        now,
      ],
    );
  }

  async getDraft(taskId: string): Promise<LocalDraftData | null> {
    const row = await this.db.getFirstAsync<{
      task_id: string;
      submission_status: LocalSubmissionStatus;
      gps_lat: number | null;
      gps_lng: number | null;
      gps_distance_meters: number | null;
      gps_verified: number;
      gps_timestamp: string | null;
      qr_scanned_code: string | null;
      qr_verified: number;
      qr_timestamp: string | null;
      location_exception_json: string | null;
      identity_exception_json: string | null;
      checklist_json: string | null;
      findings_json: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM local_drafts WHERE task_id = ?;', [taskId]);

    if (!row) {
      return null;
    }

    return {
      taskId: row.task_id,
      submissionStatus: row.submission_status,
      gpsLat: row.gps_lat,
      gpsLng: row.gps_lng,
      gpsDistanceMeters: row.gps_distance_meters,
      gpsVerified: row.gps_verified === 1,
      gpsTimestamp: row.gps_timestamp,
      qrScannedCode: row.qr_scanned_code,
      qrVerified: row.qr_verified === 1,
      qrTimestamp: row.qr_timestamp,
      locationExceptionJson: row.location_exception_json,
      identityExceptionJson: row.identity_exception_json,
      checklistJson: row.checklist_json,
      findingsJson: row.findings_json,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async saveEvidenceMetadata(evidence: PersistedEvidenceFile): Promise<void> {
    const now = new Date().toISOString();
    await this.db.runAsync(
      `INSERT INTO local_evidence (
        id,
        task_id,
        stage,
        local_file_uri,
        file_name,
        content_type,
        size_bytes,
        sha256,
        captured_at,
        is_persisted_in_sandbox,
        sync_status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IDLE', ?)
      ON CONFLICT(id) DO UPDATE SET
        local_file_uri = excluded.local_file_uri,
        size_bytes = excluded.size_bytes,
        sha256 = excluded.sha256,
        is_persisted_in_sandbox = excluded.is_persisted_in_sandbox;`,
      [
        evidence.id,
        evidence.taskId,
        evidence.stage,
        evidence.sandboxFileUri,
        evidence.fileName,
        evidence.contentType,
        evidence.sizeBytes,
        evidence.sha256,
        evidence.capturedAt,
        evidence.isPersistedInSandbox ? 1 : 0,
        now,
      ],
    );
  }

  async listEvidenceByTask(taskId: string): Promise<PersistedEvidenceFile[]> {
    const rows = await this.db.getAllAsync<{
      id: string;
      task_id: string;
      stage: 'BEFORE' | 'AFTER' | 'COMPLETION' | 'CONDITION' | 'EXCEPTION';
      local_file_uri: string;
      file_name: string;
      content_type: string;
      size_bytes: number;
      sha256: string;
      captured_at: string;
      is_persisted_in_sandbox: number;
    }>('SELECT * FROM local_evidence WHERE task_id = ? ORDER BY captured_at ASC;', [taskId]);

    return rows.map((r) => ({
      id: r.id,
      taskId: r.task_id,
      stage: r.stage,
      sandboxFileUri: r.local_file_uri,
      fileName: r.file_name,
      contentType: r.content_type,
      sizeBytes: r.size_bytes,
      sha256: r.sha256,
      capturedAt: r.captured_at,
      isPersistedInSandbox: r.is_persisted_in_sandbox === 1,
    }));
  }

  async recoverTaskSession(taskId: string): Promise<{
    task: TaskDto | null;
    draft: LocalDraftData | null;
    evidence: PersistedEvidenceFile[];
  }> {
    const [task, draft, evidence] = await Promise.all([
      this.getCachedTask(taskId),
      this.getDraft(taskId),
      this.listEvidenceByTask(taskId),
    ]);

    return {
      task,
      draft,
      evidence,
    };
  }
}
