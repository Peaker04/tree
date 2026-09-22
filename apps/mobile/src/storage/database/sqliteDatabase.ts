import type { IDatabaseConnection, RunResult } from './types';
import { runMigrations } from './migrations';

export class ExpoSqliteAdapter implements IDatabaseConnection {
  private db: import('expo-sqlite').SQLiteDatabase;

  constructor(db: import('expo-sqlite').SQLiteDatabase) {
    this.db = db;
  }

  async execAsync(sql: string): Promise<void> {
    await this.db.execAsync(sql);
  }

  async runAsync(sql: string, params?: unknown[]): Promise<RunResult> {
    const result = await this.db.runAsync(sql, (params ?? []) as (string | number | null)[]);
    return {
      rowsAffected: result.changes,
      lastInsertRowId: result.lastInsertRowId,
    };
  }

  async getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]> {
    return await this.db.getAllAsync<T>(sql, (params ?? []) as (string | number | null)[]);
  }

  async getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null> {
    return await this.db.getFirstAsync<T>(sql, (params ?? []) as (string | number | null)[]);
  }

  async withTransactionAsync<T>(action: () => Promise<T>): Promise<T> {
    let result: T;
    await this.db.withTransactionAsync(async () => {
      result = await action();
    });
    return result!;
  }

  async closeAsync(): Promise<void> {
    await this.db.closeAsync();
  }
}

export class BetterSqliteAdapter implements IDatabaseConnection {
  private db: import('better-sqlite3').Database;

  constructor(db: import('better-sqlite3').Database) {
    this.db = db;
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, params?: unknown[]): Promise<RunResult> {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...(params ?? []));
    return {
      rowsAffected: info.changes,
      lastInsertRowId: Number(info.lastInsertRowid),
    };
  }

  async getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...(params ?? [])) as T[];
  }

  async getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const row = stmt.get(...(params ?? []));
    return (row as T) ?? null;
  }

  async withTransactionAsync<T>(action: () => Promise<T>): Promise<T> {
    this.db.exec('SAVEPOINT tx_sp;');
    try {
      const result = await action();
      this.db.exec('RELEASE SAVEPOINT tx_sp;');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK TO SAVEPOINT tx_sp; RELEASE SAVEPOINT tx_sp;');
      throw err;
    }
  }

  async closeAsync(): Promise<void> {
    this.db.close();
  }
}

export async function openAppDatabase(dbName = 'novyx_greenops_v1.db'): Promise<IDatabaseConnection> {
  const SQLite = await import('expo-sqlite');
  const db = await SQLite.openDatabaseAsync(dbName);
  const adapter = new ExpoSqliteAdapter(db);
  await runMigrations(adapter);
  return adapter;
}

export async function createInMemoryTestDatabase(): Promise<IDatabaseConnection> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  const adapter = new BetterSqliteAdapter(db);
  await runMigrations(adapter);
  return adapter;
}
