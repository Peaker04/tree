export interface IEvidenceHasher {
  hashBytes(data: Uint8Array | ArrayBuffer | Buffer): Promise<string>;
  hashFile(fileUri: string): Promise<string>;
}

export function isValidSha256(hash: string): boolean {
  return /^[0-9a-f]{64}$/.test(hash);
}

/**
 * Converts an ArrayBuffer or Uint8Array to a 64-character lowercase hexadecimal string.
 */
export function bytesToHex(bufferSource: ArrayBuffer | Uint8Array): string {
  const bytes = bufferSource instanceof Uint8Array ? bufferSource : new Uint8Array(bufferSource);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex.toLowerCase();
}

/**
 * Pure byte-fidelity Base64 decoder converting a Base64 string directly into a Uint8Array.
 * Does NOT pass binary bytes through JavaScript UTF-16/Latin1 strings.
 * Correctly preserves all byte values 0x00 through 0xFF (including bytes >= 0x80).
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  // Strip optional data URI scheme prefix and whitespace
  const clean = base64.replace(/^data:.*?;base64,/, '').replace(/[\r\n\s]/g, '');

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(clean, 'base64'));
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  const len = clean.length;
  if (len === 0) {
    return new Uint8Array(0);
  }

  let placeHolders = 0;
  if (clean.charAt(len - 1) === '=') placeHolders++;
  if (clean.charAt(len - 2) === '=') placeHolders++;

  const byteLength = ((len * 3) >> 2) - placeHolders;
  const bytes = new Uint8Array(byteLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const b0 = lookup[clean.charCodeAt(i)];
    const b1 = lookup[clean.charCodeAt(i + 1)];
    const b2 = lookup[clean.charCodeAt(i + 2)];
    const b3 = lookup[clean.charCodeAt(i + 3)];

    bytes[p++] = (b0 << 2) | (b1 >> 4);
    if (p < byteLength) bytes[p++] = ((b1 & 15) << 4) | (b2 >> 2);
    if (p < byteLength) bytes[p++] = ((b2 & 3) << 6) | (b3 & 63);
  }

  return bytes;
}

/**
 * Node / Test Hasher using Node's standard crypto module on exact binary bytes.
 */
export class NodeEvidenceHasher implements IEvidenceHasher {
  async hashBytes(data: Uint8Array | ArrayBuffer | Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('node:crypto');
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const hash = crypto.createHash('sha256').update(bytes).digest('hex').toLowerCase();
    return hash;
  }

  async hashFile(fileUri: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    const cleanPath = fileUri.startsWith('file://') ? fileUri.replace('file://', '') : fileUri;
    const buffer = fs.readFileSync(cleanPath);
    return this.hashBytes(buffer);
  }
}

/**
 * Expo Native Hasher using exact byte buffer hashing via Crypto.digest(BufferSource).
 * Completely avoids JavaScript binary-string conversions.
 */
export class ExpoEvidenceHasher implements IEvidenceHasher {
  async hashBytes(data: Uint8Array | ArrayBuffer | Buffer): Promise<string> {
    const Crypto = await import('expo-crypto');
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const digestArrayBuffer = await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA256,
      bytes as unknown as BufferSource,
    );
    return bytesToHex(digestArrayBuffer);
  }

  async hashFile(fileUri: string): Promise<string> {
    const FileSystem = await import('expo-file-system/legacy');
    // Read file as Base64 to transport binary data from OS sandbox safely
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    // Decode Base64 to exact Uint8Array bytes without string degradation
    const rawBytes = base64ToUint8Array(base64);
    return this.hashBytes(rawBytes);
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
