export interface Argon2Options {
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
}

export interface IPasswordHasher {
  hash(plain: string, options?: Argon2Options): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
  needsRehash(hash: string, options?: Argon2Options): boolean;
}
