import type { AssignableStaffCatalogItem } from '@novyx/contracts';
import type { IUserRepository } from '../../../iam/application/ports/user-repository.port';
import type { IOperationalScopeRepository } from '../ports/operational-scope-repository.port';
import { ForbiddenError } from '../../../../core/errors';

export class ListAssignableStaffUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly scopeRepo: IOperationalScopeRepository,
  ) {}

  async execute(managerId: string): Promise<AssignableStaffCatalogItem[]> {
    const scopes = await this.scopeRepo.getScopes(managerId);
    if (scopes.length === 0) {
      throw new ForbiddenError('Manager has no operational scope');
    }

    // Staff accounts currently have no separate scope dimension. Manager scope is
    // enforced against the target tree when CreateTask executes; this catalog only
    // exposes globally active Staff accounts that can pass that command validation.
    const staff = await this.userRepo.listActiveStaff();
    return staff.map((user) => ({
      id: user.id,
      displayName: user.fullName || user.email.split('@')[0] || user.id,
      email: user.email,
    }));
  }
}
