declare module 'qrcode' {
  type QrModules = { size: number; data: Uint8Array | boolean[] };
  export function create(
    text: string,
    options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' },
  ): {
    modules: QrModules;
  };
}
