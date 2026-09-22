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
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // 2. Node.js environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('node:crypto');
    if (typeof nodeCrypto.randomUUID === 'function') {
      return nodeCrypto.randomUUID();
    }
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
