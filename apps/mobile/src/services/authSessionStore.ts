import type { AuthSession } from '@novyx/contracts';

const SESSION_KEY = 'novyx.greenops.authSession.v1';

type SecureStoreModule = typeof import('expo-secure-store');
let cachedSecureStore: SecureStoreModule | null = null;

async function getSecureStore(): Promise<SecureStoreModule | null> {
  if (cachedSecureStore) {
    return cachedSecureStore;
  }
  try {
    cachedSecureStore = await import('expo-secure-store');
    return cachedSecureStore;
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const isStoredAuthSession = (value: unknown): value is AuthSession => {
  if (!isRecord(value) || !isRecord(value.user)) {
    return false;
  }

  return (
    typeof value.accessToken === 'string' &&
    typeof value.refreshToken === 'string' &&
    typeof value.expiresAt === 'string' &&
    typeof value.user.id === 'string' &&
    typeof value.user.email === 'string' &&
    (value.user.role === 'staff' || value.user.role === 'manager' || value.user.role === 'admin')
  );
};

export async function loadStoredAuthSession(): Promise<AuthSession | null> {
  const SecureStore = await getSecureStore();
  if (!SecureStore) {
    return null;
  }
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    return null;
  }

  const rawSession = await SecureStore.getItemAsync(SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSession) as unknown;
    if (isStoredAuthSession(parsed)) {
      return parsed;
    }
  } catch {
    // Invalid stored JSON should be treated like an expired/corrupt session.
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
  return null;
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  const SecureStore = await getSecureStore();
  if (!SecureStore) {
    return;
  }
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearAuthSession(): Promise<void> {
  const SecureStore = await getSecureStore();
  if (!SecureStore) {
    return;
  }
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}
