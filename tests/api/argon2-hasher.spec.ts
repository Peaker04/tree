import { describe, it, expect } from 'vitest';
import { Argon2PasswordHasher } from '../../apps/api/src/infrastructure/security/argon2-password-hasher';

describe('Phase 13 Wave 3: Argon2id Password Hasher', () => {
  // Fast parameters for testing
  const testHasher = new Argon2PasswordHasher({
    memoryCost: 4096,
    timeCost: 1,
    parallelism: 1,
  });

  it('proves correct password returns true on verification (P13W3-P01)', async () => {
    const password = 'CorrectHorseBatteryStaple!123';
    const hash = await testHasher.hash(password);

    const isValid = await testHasher.verify(hash, password);
    expect(isValid).toBe(true);
  });

  it('proves wrong password returns false on verification', async () => {
    const password = 'CorrectHorseBatteryStaple!123';
    const hash = await testHasher.hash(password);

    const isValid = await testHasher.verify(hash, 'WrongPassword!456');
    expect(isValid).toBe(false);
  });

  it('proves two hashes of the same password are not identical due to unique salts', async () => {
    const password = 'SecretPassword!789';
    const hash1 = await testHasher.hash(password);
    const hash2 = await testHasher.hash(password);

    expect(hash1).not.toEqual(hash2);
    expect(await testHasher.verify(hash1, password)).toBe(true);
    expect(await testHasher.verify(hash2, password)).toBe(true);
  });

  it('proves hash identifies as Argon2id ($argon2id$ prefix)', async () => {
    const hash = await testHasher.hash('AnyPassword!123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('proves rehash-needed detection works with upgraded parameters (P13W3-P02)', async () => {
    // Generate hash with lower parameters
    const weakHasher = new Argon2PasswordHasher({
      memoryCost: 2048,
      timeCost: 1,
      parallelism: 1,
    });
    const lowCostHash = await weakHasher.hash('RehashTestPassword!');

    // Stronger hasher needs rehash
    const strongerHasher = new Argon2PasswordHasher({
      memoryCost: 8192,
      timeCost: 2,
      parallelism: 1,
    });

    const needsRehash = strongerHasher.needsRehash(lowCostHash);
    expect(needsRehash).toBe(true);

    // Rehash with stronger parameters
    const upgradedHash = await strongerHasher.hash('RehashTestPassword!');
    expect(strongerHasher.needsRehash(upgradedHash)).toBe(false);
    expect(await strongerHasher.verify(upgradedHash, 'RehashTestPassword!')).toBe(true);
  });
});
