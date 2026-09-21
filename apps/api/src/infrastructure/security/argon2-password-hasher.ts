import argon2 from 'argon2';
import type { IPasswordHasher, Argon2Options } from '../../modules/iam/application/ports/password-hasher.port';

export class Argon2PasswordHasher implements IPasswordHasher {
  constructor(private readonly defaultOptions?: Argon2Options) {}

  async hash(plain: string, options?: Argon2Options): Promise<string> {
    const memoryCost = options?.memoryCost ?? this.defaultOptions?.memoryCost;
    const timeCost = options?.timeCost ?? this.defaultOptions?.timeCost;
    const parallelism = options?.parallelism ?? this.defaultOptions?.parallelism;

    return argon2.hash(plain, {
      type: argon2.argon2id,
      ...(memoryCost ? { memoryCost } : {}),
      ...(timeCost ? { timeCost } : {}),
      ...(parallelism ? { parallelism } : {}),
    });
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  needsRehash(hash: string, options?: Argon2Options): boolean {
    const memoryCost = options?.memoryCost ?? this.defaultOptions?.memoryCost;
    const timeCost = options?.timeCost ?? this.defaultOptions?.timeCost;
    const parallelism = options?.parallelism ?? this.defaultOptions?.parallelism;

    return argon2.needsRehash(hash, {
      ...(memoryCost ? { memoryCost } : {}),
      ...(timeCost ? { timeCost } : {}),
      ...(parallelism ? { parallelism } : {}),
    });
  }
}
