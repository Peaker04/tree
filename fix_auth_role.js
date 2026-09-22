const fs = require('fs');

let c = fs.readFileSync('apps/mobile/src/services/greenOpsService.ts', 'utf-8');

c = c.replace(/role: Role;/, "role: Role | 'UNSUPPORTED';");

c = c.replace(
  "const mapSessionRole = (session: AuthSession): Role => (session.user.role === 'staff' ? 'Staff' : 'Manager');",
  "const mapSessionRole = (session: AuthSession): Role | 'UNSUPPORTED' => {\n  if (session.user.role === 'staff') return 'Staff';\n  if (session.user.role === 'manager') return 'Manager';\n  return 'UNSUPPORTED';\n};"
);

fs.writeFileSync('apps/mobile/src/services/greenOpsService.ts', c);
