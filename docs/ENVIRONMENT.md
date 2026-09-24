# Environment

## Mobile Public Variables

Expo public variables are bundled into the app and must be non-secret:

- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_API_BASE_URL`

Validation helper lives in `packages/config`.

## Mobile Secure Storage

`expo-secure-store` stores API `AuthSession` locally after successful login. It does not require a new `.env` value, but
because it is a native module it requires rebuilding the Android dev client after the dependency/plugin is added.

## Backend Variables

Backend-only values must not use the `EXPO_PUBLIC_` prefix:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- provider keys
- storage keys

## Local Setup

The root `.env` is the single local source for API, database, seed, storage, and Expo launcher variables. API workspace scripts load it with Node's native `--env-file-if-exists` support; shell/CI variables still take precedence and production does not require a file.

```powershell
Copy-Item .env.example .env
npm install
npm run dev --workspace @novyx/api
npm run mobile:start
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8082 tcp:8082
npm run typecheck
```

Do not create a second API secret file unless an external deployment tool explicitly requires one. `apps/mobile/.env` may contain public Expo variables only; never copy database passwords, dev passwords, or storage credentials into it.

Never commit `.env`.
