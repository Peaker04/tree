import { createDatabaseConnection } from '../db';
import { Argon2PasswordHasher } from '../../security/argon2-password-hasher';
import { getSecurityConfig, loadEnv } from '../../../config/env';
import {
  users,
  managerOperationalScopes,
  trees,
  taskTypes,
  proofPolicyVersions,
  checklistTemplateVersions,
  tasks,
} from '../schema';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';

async function main() {
  const connStr = process.env.DATABASE_RUNTIME_URL || 'postgres://postgres:postgres@localhost:5432/novyx';
  const conn = createDatabaseConnection(connStr);
  const db = conn.db;

  const env = loadEnv();
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to run dev seed in production environment');
  }

  const staffEmail = process.env.NOVYX_DEV_STAFF_EMAIL || 'staff@novyx.local';
  const managerEmail = process.env.NOVYX_DEV_MANAGER_EMAIL || 'manager@novyx.local';
  const password = process.env.NOVYX_DEV_PASSWORD;

  if (!password) {
    throw new Error('NOVYX_DEV_PASSWORD must be provided via environment definition');
  }

  console.log('Seeding dev environment...');

  const securityConfig = getSecurityConfig(env);
  const hasher = new Argon2PasswordHasher(securityConfig.argon2);
  const passwordHash = await hasher.hash(password);

  console.log('1. Seeding users...');

  // STAFF
  const existingStaff = await db.select().from(users).where(eq(users.email, staffEmail)).limit(1);
  let staffId = existingStaff[0]?.id;
  if (!staffId) {
    staffId = crypto.randomUUID();
    await db.insert(users).values({
      id: staffId,
      email: staffEmail,
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      passwordHash,
      authVersion: 1,
    });
    console.log(' -> Created Staff');
  } else {
    console.log(' -> Staff exists');
  }

  // MANAGER
  const existingManager = await db.select().from(users).where(eq(users.email, managerEmail)).limit(1);
  let managerId = existingManager[0]?.id;
  if (!managerId) {
    managerId = crypto.randomUUID();
    await db.insert(users).values({
      id: managerId,
      email: managerEmail,
      initialRole: 'manager',
      role: 'manager',
      accountStatus: 'ACTIVE',
      passwordHash,
      authVersion: 1,
    });
    console.log(' -> Created Manager');
  } else {
    console.log(' -> Manager exists');
  }

  console.log('2. Seeding domain scopes and entities...');

  // MANAGER SCOPE
  const existingScope = await db
    .select()
    .from(managerOperationalScopes)
    .where(eq(managerOperationalScopes.managerId, managerId))
    .limit(1);
  if (existingScope.length === 0) {
    await db.insert(managerOperationalScopes).values({
      id: crypto.randomUUID(),
      managerId,
      scopeKey: 'GLOBAL',
    });
    console.log(' -> Created Manager Scope');
  }

  // TREE
  const treeId = 'TRE-DEV-01';
  const existingTree = await db.select().from(trees).where(eq(trees.id, treeId)).limit(1);
  const treeSeed = {
    name: 'Cây sao đen khu A',
    species: 'Sao đen',
    ageYears: 10,
    lat: '10.774',
    lng: '106.691',
    address: 'Khu A, công viên trung tâm',
    healthStatus: 'Khỏe mạnh' as const,
    riskStatus: 'healthy' as const,
    qrCode: 'QR-DEV-01',
    version: 1,
  };
  if (existingTree.length === 0) {
    await db.insert(trees).values({ id: treeId, ...treeSeed });
    console.log(' -> Created Tree');
  } else {
    await db.update(trees).set(treeSeed).where(eq(trees.id, treeId));
  }
  await db
    .update(tasks)
    .set({ treeName: treeSeed.name, treeAddress: treeSeed.address, assignedStaffName: staffEmail })
    .where(eq(tasks.treeId, treeId));

  // POLICY & TASK TYPE

  const ttId = 'TT-DEV-01';
  const existingTT = await db.select().from(taskTypes).where(eq(taskTypes.id, ttId)).limit(1);
  if (existingTT.length === 0) {
    await db.insert(taskTypes).values({
      id: ttId,
      name: 'Cắt tỉa thử nghiệm',
      defaultProofProfile: 'CHANGE_PROOF',
      description: 'Công việc cắt tỉa cây tại hiện trường',
      isActive: true,
    });

    await db.insert(proofPolicyVersions).values({
      id: crypto.randomUUID(),
      taskTypeId: ttId,
      versionNumber: 1,
      proofProfile: 'CHANGE_PROOF',
      policyDescription: 'Yêu cầu bằng chứng thay đổi trước và sau xử lý',
    });

    await db.insert(checklistTemplateVersions).values({
      id: crypto.randomUUID(),
      taskTypeId: ttId,
      versionNumber: 1,
      templateItems: [{ text: 'An toàn khu vực', order: 1 }],
      templateDescription: 'Danh sách kiểm tra cắt tỉa',
    });

    console.log(' -> Created TaskType, Auth Policy and Checklist');
  }

  console.log('Seed dev environment complete.');
  await conn.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
