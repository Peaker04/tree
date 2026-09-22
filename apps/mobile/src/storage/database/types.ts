export interface RunResult {
  rowsAffected: number;
  lastInsertRowId: number;
}

export interface IDatabaseConnection {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<RunResult>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  withTransactionAsync<T>(action: () => Promise<T>): Promise<T>;
  closeAsync?(): Promise<void>;
}

export interface MigrationStep {
  version: number;
  name: string;
  up: (db: IDatabaseConnection) => Promise<void>;
}
