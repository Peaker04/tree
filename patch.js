const fs = require('fs');

// AuthScreens.tsx
let c1 = fs.readFileSync('apps/mobile/src/screens/auth/AuthScreens.tsx', 'utf-8');
c1 = c1.replace(
  "onForgot: () => void;",
  "onForgot: () => void;\n  errorMessage?: string;"
);
c1 = c1.replace(
  "onForgot,",
  "onForgot,\n  errorMessage,"
);
c1 = c1.replace(
  "{error ? (",
  "{(error || errorMessage) ? (\n            <Card tone=\"danger\" style={styles.alertRow}>\n              <Ionicons name=\"alert-circle-outline\" size={17} color={colors.danger} />\n              <Text style={styles.alertText}>{error || errorMessage}</Text>\n            </Card>\n          ) : null}\n          {/*"
);
c1 = c1.replace(
  "</Card>\n          ) : null}",
  "</Card>\n          ) : null} */\n"
);
fs.writeFileSync('apps/mobile/src/screens/auth/AuthScreens.tsx', c1);

// MobileApp.tsx
let c2 = fs.readFileSync('apps/mobile/src/screens/MobileApp.tsx', 'utf-8');
c2 = c2.replace(
  "const [role, setRole] = useState<Role | null>(null);",
  "const [role, setRole] = useState<Role | 'UNSUPPORTED' | null>(null);"
);
// Replace in loadStoredAuthSession
c2 = c2.replace(
  /if \(result\.role === 'Staff'\) \{\s*setStaffStep\('HOME'\);\s*setScreen\('Main'\);\s*\} else \{\s*setManagerStep\('HOME'\);\s*setScreen\('Main'\);\s*\}/,
  `if (result.role === 'Staff') {
          setStaffStep('HOME');
          setScreen('Main');
        } else if (result.role === 'Manager') {
          setManagerStep('HOME');
          setScreen('Main');
        } else {
          setScreen('Login');
          setAuthSource({ source: 'rest', message: 'Ứng dụng mobile không hỗ trợ quyển admin.' });
        }`
);
// Replace in login
c2 = c2.replace(
  `if (result.role === 'Staff') {
        setStaffStep('HOME');
        setScreen('Main');
      } else {
        setManagerStep('HOME');
        setScreen('Main');
      }`,
  `if (result.role === 'Staff') {
        setStaffStep('HOME');
        setScreen('Main');
      } else if (result.role === 'Manager') {
        setManagerStep('HOME');
        setScreen('Main');
      } else {
        setScreen('Login');
        // error handled above
      }`
);
c2 = c2.replace(
  "authLoading={authLoading}",
  "authLoading={authLoading} errorMessage={authSource.message}"
);

fs.writeFileSync('apps/mobile/src/screens/MobileApp.tsx', c2);

