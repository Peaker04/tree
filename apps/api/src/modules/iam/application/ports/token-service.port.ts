export interface ITokenService {
  /**
   * Generates a cryptographically strong, high-entropy opaque bearer credential.
   */
  generateToken(byteLength?: number): string;

  /**
   * Computes a deterministic cryptographic digest (SHA-256) of the bearer credential
   * for secure server-side storage and lookup. Plaintext is never persisted.
   */
  hashToken(token: string): string;
}
