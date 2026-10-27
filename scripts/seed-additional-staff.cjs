const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_MIGRATION_URL || 'postgresql://novyx_migrator:123456789@localhost:5432/novyx',
});

const passwordHash = '$argon2id$v=19$m=65536,p=1,t=3$BrUA0zRS9veZyLOmaparNQ$ymGRb3yA+MyZHFlX7Tq9cCSbdaYLm9ucVhpm5ZGad4c';

const staffMembers = [
  { email: 'ngocdiem@novyx.local', name: 'Ngọc Diễm' },
  { email: 'duyhung@novyx.local', name: 'Duy Hưng' },
  { email: 'duyphong@novyx.local', name: 'Duy Phong' },
];

async function seed() {
  await client.connect();
  for (const s of staffMembers) {
    const check = await client.query('SELECT id FROM users WHERE email = $1', [s.email]);
    if (check.rows.length === 0) {
      const id = crypto.randomUUID();
      await client.query(
        `INSERT INTO users (id, email, initial_role, role, account_status, password_hash, auth_version, version)
         VALUES ($1, $2, 'staff', 'staff', 'ACTIVE', $3, 1, 0)`,
        [id, s.email, passwordHash]
      );
      console.log(`[PASS] Created staff account: ${s.name} (${s.email}) -> ID: ${id}`);
    } else {
      console.log(`[EXISTS] Staff account: ${s.name} (${s.email}) -> ID: ${check.rows[0].id}`);
    }
  }
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
