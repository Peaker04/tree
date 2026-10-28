# Native Image Processing Pipeline Design

## Executive Summary
This design specification defines the client-side **Native Image Processing Pipeline** for NOVYX GreenOps mobile application on Expo SDK 57 / React Native. The pipeline replaces uncompressed, high-resolution raw camera sensor captures (12MP–108MP, 4MB–12MB per image) with an optimized native downscaling, compression, orientation-normalization, and cache-pruning architecture. The output target is high-fidelity audit evidence (1440px max edge, JPEG quality 0.75, ~200KB–350KB payload), reducing cellular network transmission times by 95% and eliminating memory (RAM) allocation pressure in the mobile React Native runtime.

---

## 1. Problem Statement & Root Cause

### 1.1 The Raw Sensor Problem
Currently in `StaffProofFlow.tsx`:
```ts
uri = (await cameraRef.current.takePictureAsync({ quality: 0.55 })).uri;
```
Modern mobile hardware (such as the Samsung Galaxy Note 20 Ultra testbed or iPhone 14/15/16) outputs raw camera sensor frames directly to JPEG:
- Resolution: `4032 × 3024` (12.2 Megapixels) or higher.
- File size: `4.5 MB` to `12.0 MB` per photo.
- In field operations, each maintenance task requires two photos (**Trước xử lý** and **Sau xử lý**), creating **9 MB – 24 MB** per task submission.

### 1.2 Systemic Failure Modes
1. **Field Network Latency & Outbox Timeouts**: Over spotty 3G/4G connections or public Ngrok tunnels, uploading 20MB of raw evidence takes 30–90 seconds per task. This causes socket timeouts, user frustration, and outbox queue stalls.
2. **React Native Memory (RAM) Inefficiency**: Rendering a `4032 × 3024` 32-bit RGBA bitmap in an `<Image>` component allocates:
   $$\text{RAM} = 4032 \times 3024 \times 4 \text{ bytes} \approx 48.8 \text{ MB uncompressed memory per photo}.$$
   Displaying Before & After preview images requires ~100MB of RAM, causing garbage collection hitching, UI frame drops, and risks of Android Low Memory Killer (LMK) termination.
3. **EXIF Orientation Bugs**: Samsung and Android OEM sensors write raw pixels in horizontal sensor layout with an EXIF tag (`Orientation: 6`). When displayed in web dashboards or legacy viewers without EXIF auto-rotation, images appear rotated sideways.
4. **Device Cache Bloat**: The raw images captured by `expo-camera` remain in `FileSystem.cacheDirectory` indefinitely, consuming gigabytes of disk space on the field worker's phone.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- **Native Resizing**: Clamp the longest edge to `1440px` while strictly preserving aspect ratio (ideal for tree inspection, leaf disease identification, and pruning cuts).
- **Compression & Fidelity**: Compress to JPEG quality `0.75` (SSIM > 0.95), achieving file sizes between `180 KB` and `350 KB` (a 95% reduction).
- **EXIF & Orientation Normalization**: Permanently bake orientation directly into the bitmap pixel matrix so orientation is universally upright (Orientation = 1).
- **Immediate Raw Purge**: Automatically delete the raw temporary camera capture file from `cacheDirectory` as soon as the processed version is generated.
- **Fail-Safe Fallback**: If native manipulation fails for any unexpected hardware reason, gracefully fall back to the original URI without blocking staff field operations.
- **Durable Sandbox Integration**: Integrate seamlessly with `ExpoEvidenceFileStore`, ensuring SHA-256 calculation and outbox persistence occur on the processed file.
- **Native Parity**: Build and verify on Android native APK (`app-debug.apk`) and export iOS bundle with zero regressions.

### 2.2 Non-Goals
- On-device machine learning or AI object segmentation during capture.
- Video stream compression (this pipeline strictly targets static photo evidence).
- Introducing web-only Canvas or heavy third-party native dependencies outside official Expo SDK 57 modules.

---

## 3. Architecture & Data Flow

```
                      [ CameraView Hardware ]
                                 │
                                 │  takePictureAsync({ quality: 0.85, skipProcessing: false })
                                 ▼
                    [ 1. Raw Temporary File ]
                     (Cache: ~6MB, 4032x3024)
                                 │
                                 ▼
               [ 2. ImageProcessingService ]
                 (expo-image-manipulator Native)
                   ├── Inspect dimensions
                   ├── Clamp longest edge to 1440px (aspect ratio locked)
                   ├── Bake orientation (rotate to upright)
                   └── Compress to JPEG (quality: 0.75)
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
        [ 3. Processed File ]      [ Immediate Purge ]
        (Cache: ~250KB, 1440x1080)   (Delete Raw File from cache)
                    │
                    ├── Render fast preview in UI (<16ms, RAM ~6MB)
                    │
                    ▼
         [ 4. ExpoEvidenceFileStore ]
           ├── Move to sandbox: evidence/${taskId}/${id}_${stage}.jpg
           ├── Calculate binary SHA-256 on 250KB file
           └── Submit to Outbox / R2 Object Storage (<1.0s over 4G)
```

---

## 4. Component & Implementation Details

### 4.1 Dependency Addition
Add `expo-image-manipulator` to `apps/mobile/package.json`:
- Version: `~57.0.21` (matches Expo SDK 57.0.4 core).
- Autolinking: Expo Autolinking automatically registers `expo.modules.imagemanipulator.ImageManipulatorModule` in `android/settings.gradle`.

### 4.2 `ImageProcessingService` (`apps/mobile/src/services/imageProcessingService.ts`)
A dedicated, isolated service module responsible for evidence image optimization:

```ts
export interface ProcessImageOptions {
  maxDimension?: number; // Default: 1440
  quality?: number;      // Default: 0.75
  format?: 'jpeg' | 'png'; // Default: 'jpeg'
}

export interface ProcessedImageResult {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number;
  isProcessed: boolean;
}

export async function processEvidencePhoto(
  rawUri: string,
  options?: ProcessImageOptions,
): Promise<ProcessedImageResult>;
```

#### Core Algorithm:
1. Dynamically import or load `expo-image-manipulator`.
2. Inspect image dimensions using `Image.getSize` or manipulator metadata.
3. Calculate target dimensions:
   - If `width >= height` and `width > maxDimension`: target width = `maxDimension`, height = `Math.round(height * (maxDimension / width))`.
   - If `height > width` and `height > maxDimension`: target height = `maxDimension`, width = `Math.round(width * (maxDimension / height))`.
   - If both dimensions are already $\le \text{maxDimension}$, omit resize action and only apply compression.
4. Execute `manipulateAsync(rawUri, actions, { compress: quality, format: SaveFormat.JPEG })`.
5. Check file size of the output URI via `FileSystem.getInfoAsync`.
6. Purge the temporary raw capture file (`rawUri`) asynchronously via `FileSystem.deleteAsync(rawUri, { idempotent: true })`.
7. Return processed file result.

### 4.3 Integration in `StaffProofFlow.tsx`
Update `captureEvidencePhoto`:
```ts
// 1. Capture raw from hardware
const rawCapture = await cameraRef.current.takePictureAsync({ quality: 0.85 });

// 2. Process via Native Pipeline
const processed = await processEvidencePhoto(rawCapture.uri, {
  maxDimension: 1440,
  quality: 0.75,
});

// 3. Update task state with processed lightweight URI
patchActiveTask({
  ...(isBefore ? { beforePhoto: processed.uri } : { afterPhoto: processed.uri }),
  evidence: upsertPhotoEvidence(props.activeTask, evidenceStage, processed.uri),
});
```

### 4.4 Sandbox Persistence & Outbox Dispatch
Because the URI supplied to `upsertPhotoEvidence` and `submitTaskEvidence` is already the processed `~250KB` file:
- `ExpoEvidenceFileStore.persistEvidence()` copies the 250KB file into durable sandbox storage (`evidence/${taskId}/...`).
- `ExpoEvidenceHasher.hashFile()` computes SHA-256 on the exact 250KB binary.
- `EvidenceUploadClient` uploads the 250KB binary to Cloudflare R2 / S3 in < 500ms.

---

## 5. Failure Handling & Resilience
- **Module Fallback**: If `expo-image-manipulator` fails or is somehow unavailable, the service catches the error, logs a non-fatal warning, and returns the original raw URI with `isProcessed: false`. Field work is **never blocked**.
- **File System Error Isolation**: If purging the temporary raw file fails, the error is suppressed so that the main photo flow continues uninterrupted.
- **Zero Double-Compression**: Files that are already loaded from remote URLs or previously processed sandbox paths are detected and skipped.

---

## 6. Verification & Acceptance Criteria

1. **Static Analysis & Type Safety**:
   - `npm run typecheck --workspace @novyx/mobile` passes with 0 errors.
   - `npm run lint` passes with 0 warnings/errors.
   - Vitest test suite passes with all tests green.
2. **Native Android Compilation**:
   - `expo-image-manipulator` autolinked into Android project.
   - `./gradlew assembleDebug` completes with `BUILD SUCCESSFUL`.
   - `app-debug.apk` installs cleanly on Samsung Galaxy Note 20 Ultra (`adb install -r -d ...`).
3. **Physical Device Verification (Samsung Note 20 Ultra)**:
   - Capture Before photo in `StaffProofFlow`.
   - Inspect resulting file info via ADB shell: file size must be between **150 KB and 400 KB** (down from > 4 MB).
   - Long edge dimension is exactly $\le 1440$px.
   - Orientation is upright and natural.
   - UI preview renders immediately with zero frame drops.
4. **End-to-End Operational Concurrency**:
   - Run `node scripts/multi-staff-operational-matrix.cjs` across all 5 concurrent roles over public Ngrok HTTPS tunnel. All 18/18 checks must PASS.
