export type UuidGenerator = () => string;

let customUuidGenerator: UuidGenerator | null = null;

export function setUuidGenerator(generator: UuidGenerator | null): void {
  customUuidGenerator = generator;
}

/**
 * Generates a cryptographically secure UUIDv4.
 * Uses native CSPRNG capabilities (crypto.randomUUID / expo-crypto.randomUUID).
 * Explicitly rejects non-cryptographic weak pseudo-random fallbacks.
 */
export function generateSecureUuid(): string {
  if (customUuidGenerator) {
    return customUuidGenerator();
  }

  // 1. Web / React Native 0.86+ / Node global crypto.randomUUID
  const globalCrypto =
    typeof crypto !== 'undefined'
      ? crypto
      : (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto;
  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return globalCrypto.randomUUID();
  }

  // 3. Expo runtime environment
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ExpoCrypto = require('expo-crypto');
    if (typeof ExpoCrypto.randomUUID === 'function') {
      return ExpoCrypto.randomUUID();
    }
  } catch {
    // expo-crypto not available via synchronous require
  }

  throw new Error('Storage security error: Cryptographically secure UUID generator is unavailable in current runtime');
}

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates that a string matches the RFC 4122 version 4 UUID specification.
 * Validates:
 * - 8-4-4-4-12 hex layout
 * - version digit == 4
 * - variant bits == [8, 9, a, b]
 */
export function isValidUuidV4(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  return UUID_V4_REGEX.test(value);
}

/**
 * Asserts that a value is a valid RFC 4122 version 4 UUID.
 * Throws an explicit error if validation fails.
 */
export function assertValidUuidV4(value: unknown, fieldName = 'idempotencyKey'): string {
  if (!isValidUuidV4(value)) {
    throw new Error(`Storage validation error: ${fieldName} must be a valid RFC 4122 UUIDv4 (got: ${String(value)})`);
  }
  return value;
}
