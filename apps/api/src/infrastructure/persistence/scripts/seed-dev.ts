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
  const supervisorEmail = process.env.NOVYX_DEV_SUPERVISOR_EMAIL || 'supervisor@novyx.local';
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

  // STAFF (Default)
  const existingStaff = await db.select().from(users).where(eq(users.email, staffEmail)).limit(1);
  let staffId = existingStaff[0]?.id;
  if (!staffId) {
    staffId = crypto.randomUUID();
    await db.insert(users).values({
      id: staffId,
      email: staffEmail,
      fullName: 'Nhân viên hiện trường',
      initialRole: 'staff',
      role: 'staff',
      accountStatus: 'ACTIVE',
      passwordHash,
      authVersion: 1,
    });
    console.log(' -> Created Staff');
  } else {
    await db.update(users).set({ fullName: 'Nhân viên hiện trường' }).where(eq(users.id, staffId));
    console.log(' -> Staff exists');
  }

  // ADDITIONAL REAL NAMED STAFF
  const additionalStaff = [
    { email: 'ngocdiem@novyx.local', name: 'Ngọc Diễm' },
    { email: 'duyhung@novyx.local', name: 'Duy Hưng' },
    { email: 'duyphong@novyx.local', name: 'Duy Phong' },
  ];
  for (const s of additionalStaff) {
    const existing = await db.select().from(users).where(eq(users.email, s.email)).limit(1);
    if (!existing[0]) {
      await db.insert(users).values({
        id: crypto.randomUUID(),
        email: s.email,
        fullName: s.name,
        initialRole: 'staff',
        role: 'staff',
        accountStatus: 'ACTIVE',
        passwordHash,
        authVersion: 1,
      });
      console.log(` -> Created Staff ${s.name} (${s.email})`);
    } else {
      await db.update(users).set({ fullName: s.name }).where(eq(users.id, existing[0].id));
      console.log(` -> Staff ${s.name} exists`);
    }
  }

  // SUPERVISOR
  const existingSupervisor = await db.select().from(users).where(eq(users.email, supervisorEmail)).limit(1);
  let supervisorId = existingSupervisor[0]?.id;
  if (!supervisorId) {
    supervisorId = crypto.randomUUID();
    await db.insert(users).values({
      id: supervisorId,
      email: supervisorEmail,
      fullName: 'Giám sát hiện trường',
      initialRole: 'supervisor',
      role: 'supervisor',
      accountStatus: 'ACTIVE',
      passwordHash,
      authVersion: 1,
    });
    console.log(' -> Created Supervisor');
  } else {
    await db.update(users).set({ fullName: 'Giám sát hiện trường' }).where(eq(users.id, supervisorId));
    console.log(' -> Supervisor exists');
  }

  // MANAGER
  const existingManager = await db.select().from(users).where(eq(users.email, managerEmail)).limit(1);
  let managerId = existingManager[0]?.id;
  if (!managerId) {
    managerId = crypto.randomUUID();
    await db.insert(users).values({
      id: managerId,
      email: managerEmail,
      fullName: 'Quản lý điều phối',
      initialRole: 'manager',
      role: 'manager',
      accountStatus: 'ACTIVE',
      passwordHash,
      authVersion: 1,
    });
    console.log(' -> Created Manager');
  } else {
    await db.update(users).set({ fullName: 'Quản lý điều phối' }).where(eq(users.id, managerId));
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

  // TREES
  const devTrees = [
    {
      id: 'TRE-DEV-01',
      name: 'Cây sao đen khu A',
      species: 'Sao đen',
      ageYears: 10,
      lat: '10.7740',
      lng: '106.6910',
      address: 'Khu A, Công viên Tao Đàn, Q.1',
      healthStatus: 'Khỏe mạnh' as const,
      riskStatus: 'healthy' as const,
      qrCode: 'QR-DEV-01',
      version: 1,
    },
    {
      id: 'TRE-DEV-02',
      name: 'Cây dầu rái số 12',
      species: 'Dầu rái',
      ageYears: 25,
      lat: '10.7812',
      lng: '106.6985',
      address: 'Đường Lê Duẩn, Bến Nghé, Q.1',
      healthStatus: 'Khỏe mạnh' as const,
      riskStatus: 'healthy' as const,
      qrCode: 'NOVYX-TRE-02',
      version: 1,
    },
    {
      id: 'TRE-DEV-03',
      name: 'Cây xà cừ cổ thụ',
      species: 'Xà cừ',
      ageYears: 45,
      lat: '10.7785',
      lng: '106.6952',
      address: 'Đường Pasteur, P.6, Q.3',
      healthStatus: 'Cần chăm sóc' as const,
      riskStatus: 'abnormal' as const,
      qrCode: 'NOVYX-TRE-03',
      version: 1,
    },
    {
      id: 'TRE-DEV-04',
      name: 'Cây bàng đài loan',
      species: 'Bàng đài loan',
      ageYears: 8,
      lat: '10.7874',
      lng: '106.7051',
      address: 'Khuôn viên Thảo Cầm Viên, Q.1',
      healthStatus: 'Khỏe mạnh' as const,
      riskStatus: 'healthy' as const,
      qrCode: 'NOVYX-TRE-04',
      version: 1,
    },
    {
      id: 'TRE-DEV-05',
      name: 'Cây me tây râm mát',
      species: 'Me tây',
      ageYears: 30,
      lat: '10.7836',
      lng: '106.6924',
      address: 'Đường Nam Kỳ Khởi Nghĩa, Q.3',
      healthStatus: 'Sâu bệnh' as const,
      riskStatus: 'pest_risk' as const,
      qrCode: 'NOVYX-TRE-05',
      version: 1,
    },
    {
      id: 'TRE-DEV-06',
      name: 'Cây lim xẹt hoa vàng',
      species: 'Lim xẹt',
      ageYears: 15,
      lat: '10.7770',
      lng: '106.6970',
      address: 'Công viên 30/4, Bến Nghé, Q.1',
      healthStatus: 'Khỏe mạnh' as const,
      riskStatus: 'healthy' as const,
      qrCode: 'NOVYX-TRE-06',
      version: 1,
    },
    {
      id: 'TRE-DEV-07',
      name: 'Cây giáng hương',
      species: 'Giáng hương',
      ageYears: 12,
      lat: '10.7735',
      lng: '106.7032',
      address: 'Phố đi bộ Nguyễn Huệ, Q.1',
      healthStatus: 'Khỏe mạnh' as const,
      riskStatus: 'healthy' as const,
      qrCode: 'NOVYX-TRE-07',
      version: 1,
    },
    {
      id: 'TRE-DEV-08',
      name: 'Cây phượng vĩ vỉa hè',
      species: 'Phượng vĩ',
      ageYears: 18,
      lat: '10.7755',
      lng: '106.6930',
      address: 'Đường Trương Định, Q.3',
      healthStatus: 'Cần chăm sóc' as const,
      riskStatus: 'abnormal' as const,
      qrCode: 'NOVYX-TRE-08',
      version: 1,
    },
  ];

  for (const treeSeed of devTrees) {
    const existing = await db.select().from(trees).where(eq(trees.id, treeSeed.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(trees).values(treeSeed);
    } else {
      await db.update(trees).set(treeSeed).where(eq(trees.id, treeSeed.id));
    }
  }
  console.log(` -> Seeded ${devTrees.length} Trees across urban park areas`);

  const firstTree = devTrees[0];
  if (firstTree) {
    await db
      .update(tasks)
      .set({ treeName: firstTree.name, treeAddress: firstTree.address, assignedStaffName: staffEmail })
      .where(eq(tasks.treeId, firstTree.id));
  }

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
