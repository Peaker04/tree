const fs = require('fs');
let c = fs.readFileSync('tests/api/governance-users.spec.ts', 'utf-8');

const anchor = "  describe('POST /v1/governance/users', () => {";
const payload = `  describe('GET /v1/governance/users', () => {
    it('R1-B: rejects anonymous requests (401)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/governance/users',
      });
      expect(response.statusCode).toBe(401);
    });

    it('R1-B: rejects staff requests (403)', async () => {
      const { session } = users.staff;
      const response = await app.inject({
        method: 'GET',
        url: '/v1/governance/users',
        headers: { authorization: \`Bearer \${session.accessToken}\` },
      });
      expect(response.statusCode).toBe(403);
    });

    it('R1-B: rejects manager requests (403)', async () => {
      const { session } = users.manager;
      const response = await app.inject({
        method: 'GET',
        url: '/v1/governance/users',
        headers: { authorization: \`Bearer \${session.accessToken}\` },
      });
      expect(response.statusCode).toBe(403);
    });

    it('R1-B: allows admin requests (200)', async () => {
      const { session } = users.admin;
      const response = await app.inject({
        method: 'GET',
        url: '/v1/governance/users',
        headers: { authorization: \`Bearer \${session.accessToken}\` },
      });
      expect(response.statusCode).toBe(200);
      const json = response.json();
      expect(Array.isArray(json.data)).toBe(true);
    });
  });\n\n`;

c = c.replace(anchor, payload + anchor);
fs.writeFileSync('tests/api/governance-users.spec.ts', c);

