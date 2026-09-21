export interface IOperationalScopeRepository {
  hasScope(managerId: string, scopeKey: string): Promise<boolean>;
  addScope(managerId: string, scopeKey: string): Promise<void>;
  getScopes(managerId: string): Promise<string[]>;
}
