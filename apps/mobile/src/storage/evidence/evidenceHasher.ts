export interface IEvidenceHasher {
  hashBytes(data: Uint8Array | ArrayBuffer | Buffer): Promise<string>;
  hashFile(fileUri: string): Promise<string>;
}

export function isValidSha256(hash: string): boolean {
  return /^[0-9a-f]{64}$/.test(hash);
}

/**
 * Node / Test Hasher using Node's standard crypto module.
 */
export class NodeEvidenceHasher implements IEvidenceHasher {
  async hashBytes(data: Uint8Array | ArrayBuffer | Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('node:crypto');
    const hash = crypto.createHash('sha256').update(data).digest('hex').toLowerCase();
    return hash;
  }

  async hashFile(fileUri: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    // Normalize file:// URI if present
    const cleanPath = fileUri.startsWith('file://') ? fileUri.replace('file://', '') : fileUri;
    const buffer = fs.readFileSync(cleanPath);
    return this.hashBytes(buffer);
  }
}

/**
 * Expo Native Hasher using expo-file-system and expo-crypto.
 */
export class ExpoEvidenceHasher implements IEvidenceHasher {
  async hashBytes(data: Uint8Array | ArrayBuffer | Buffer): Promise<string> {
    const Crypto = await import('expo-crypto');
    let binaryString = '';
    const bytes = new Uint8Array(data);
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, binaryString, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
    return digest.toLowerCase();
  }

  async hashFile(fileUri: string): Promise<string> {
    const FileSystem = await import('expo-file-system/legacy');
    const Crypto = await import('expo-crypto');

    // Read file as Base64 to handle binary data safely
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to binary byte string for proper byte-level SHA-256
    const binary = atob(base64);
    const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, binary, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
    return digest.toLowerCase();
  }
}

let defaultHasher: IEvidenceHasher | null = null;

export function getDefaultEvidenceHasher(): IEvidenceHasher {
  if (defaultHasher) {
    return defaultHasher;
  }
  // Detect if running in Node / Vitest
  if (typeof process !== 'undefined' && process.versions && process.versions.node && !process.env.EXPO_RUNTIME) {
    defaultHasher = new NodeEvidenceHasher();
  } else {
    defaultHasher = new ExpoEvidenceHasher();
  }
  return defaultHasher;
}

export function setDefaultEvidenceHasher(hasher: IEvidenceHasher): void {
  defaultHasher = hasher;
}
