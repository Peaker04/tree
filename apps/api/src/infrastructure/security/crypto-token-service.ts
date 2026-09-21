import crypto from 'node:crypto';
import type { ITokenService } from '../../modules/iam/application/ports/token-service.port';

export class CryptoTokenService implements ITokenService {
  /**
   * Generates a CSPRNG opaque bearer credential (default 32 bytes = 256 bits entropy).
   * Format: base64url string.
   */
  generateToken(byteLength = 32): string {
    return crypto.randomBytes(byteLength).toString('base64url');
  }

  /**
   * Computes SHA-256 hex digest for server-side token storage and lookup.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
  }
}
