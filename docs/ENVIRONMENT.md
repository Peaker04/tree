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

```powershell
Copy-Item .env.example .env
npm install
npm run api:dev
npm run mobile:start
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8082 tcp:8082
npm run typecheck
```

Never commit `.env`.
