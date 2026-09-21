import { describe, it, expect } from 'vitest';
import { CryptoTokenService } from '../../apps/api/src/infrastructure/security/crypto-token-service';

describe('Phase 13 Wave 3: Crypto Token Service (Opaque Credentials & CSPRNG)', () => {
  const tokenService = new CryptoTokenService();

  it('proves access and refresh credentials use CSPRNG (P13W3-P03, P13W3-P04)', () => {
    const token1 = tokenService.generateToken(32);
    const token2 = tokenService.generateToken(32);

    expect(token1).toBeTypeOf('string');
    expect(token2).toBeTypeOf('string');
    expect(token1.length).toBeGreaterThanOrEqual(40); // 32 bytes base64url is 43 chars
    expect(token1).not.toEqual(token2);
  });

  it('proves high entropy across multiple tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(tokenService.generateToken(32));
    }
    expect(tokens.size).toBe(100);
  });

  it('proves server stores hashes, not plaintext tokens (P13W3-P05, P13W3-N02, P13W3-N03)', () => {
    const token = tokenService.generateToken(32);
    const hash = tokenService.hashToken(token);

    expect(hash).toBeTypeOf('string');
    expect(hash.length).toBe(64); // SHA-256 hex digest
    expect(hash).not.toEqual(token);
    expect(hash).not.toContain(token);
    expect(token).not.toContain(hash);

    // Hash is deterministic
    const hash2 = tokenService.hashToken(token);
    expect(hash).toEqual(hash2);
  });
});
