import type { AppData } from '../../types';
import type { IDatabaseConnection } from '../database/types';

export interface CachedAuthenticatedSnapshot {
  data: AppData;
  updatedAt: string;
}

export interface IAuthenticatedSnapshotCache {
  load(userId: string): Promise<CachedAuthenticatedSnapshot | null>;
  save(userId: string, data: AppData): Promise<CachedAuthenticatedSnapshot>;
}

export class SqliteAuthenticatedSnapshotCache implements IAuthenticatedSnapshotCache {
  constructor(private readonly db: IDatabaseConnection) {}

  async load(userId: string): Promise<CachedAuthenticatedSnapshot | null> {
    const row = await this.db.getFirstAsync<{ snapshot_json: string; updated_at: string }>(
      'SELECT snapshot_json, updated_at FROM authenticated_snapshots WHERE user_id = ?;',
      [userId],
    );
    if (!row) return null;

    try {
      return {
        data: JSON.parse(row.snapshot_json) as AppData,
        updatedAt: row.updated_at,
      };
    } catch {
      return null;
    }
  }

  async save(userId: string, data: AppData): Promise<CachedAuthenticatedSnapshot> {
    const updatedAt = new Date().toISOString();
    const cachedData: AppData = { ...data, notifications: [] };
    await this.db.runAsync(
      `INSERT INTO authenticated_snapshots (user_id, snapshot_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         snapshot_json = excluded.snapshot_json,
         updated_at = excluded.updated_at;`,
      [userId, JSON.stringify(cachedData), updatedAt],
    );
    return { data: cachedData, updatedAt };
  }
}
