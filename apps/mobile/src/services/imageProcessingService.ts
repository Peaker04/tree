import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import type { ActionResize } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export interface ProcessImageOptions {
  maxDimension?: number; // Default: 1440
  quality?: number; // Default: 0.75
  format?: 'jpeg' | 'png'; // Default: 'jpeg'
  knownDimensions?: { width: number; height: number };
  preserveRawCache?: boolean; // Default: false (purges raw cache)
}

export interface ProcessedImageResult {
  uri: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  isProcessed: boolean;
  error?: string;
}

const DEFAULT_MAX_DIMENSION = 1440;
const DEFAULT_QUALITY = 0.75;

/**
 * Calculates the bounding resize action clamping the dominant edge to maxDimension
 * while strictly preserving the camera aspect ratio.
 */
export function calculateTargetResizeAction(
  width: number,
  height: number,
  maxDimension: number = DEFAULT_MAX_DIMENSION,
): ActionResize | null {
  if (width <= 0 || height <= 0 || (width <= maxDimension && height <= maxDimension)) {
    return null;
  }

  // If landscape or square, clamp width; ImageManipulator will auto-calculate height
  if (width >= height) {
    return { resize: { width: maxDimension } };
  }

  // If portrait, clamp height; ImageManipulator will auto-calculate width
  return { resize: { height: maxDimension } };
}

/**
 * Checks if a URI is already a durable sandbox file or remote storage URL,
 * avoiding unnecessary re-processing or double compression.
 */
export function isAlreadyProcessedEvidence(uri: string): boolean {
  if (!uri) return true;
  if (/^https?:\/\//i.test(uri)) return true;
  if (uri.includes('/evidence/') && !uri.includes('/cache/')) return true;
  return false;
}

/**
 * Measures image dimensions safely.
 */
async function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 0, height: 0 }),
    );
  });
}

/**
 * Safely purges temporary raw camera cache file without blocking flow.
 */
async function safePurgeRawCache(rawUri: string): Promise<void> {
  try {
    if (rawUri.startsWith('file://') && rawUri.includes('/cache/')) {
      await FileSystem.deleteAsync(rawUri, { idempotent: true });
    }
  } catch {
    // Non-blocking cleanup suppression
  }
}

/**
 * Processes a raw camera capture URI through the native image pipeline:
 * 1. Clamps longest dimension to 1440px (aspect ratio preserved).
 * 2. Bakes EXIF orientation into bitmap pixels.
 * 3. Compresses to JPEG with quality 0.75.
 * 4. Asynchronously purges the raw camera cache file.
 */
export async function processEvidencePhoto(
  rawUri: string,
  options: ProcessImageOptions = {},
): Promise<ProcessedImageResult> {
  if (!rawUri || isAlreadyProcessedEvidence(rawUri)) {
    return {
      uri: rawUri,
      sizeBytes: 0,
      isProcessed: false,
    };
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const format = options.format ?? 'jpeg';

  try {
    const dimensions = options.knownDimensions ?? (await getImageDimensions(rawUri));
    const resizeAction = calculateTargetResizeAction(dimensions.width, dimensions.height, maxDimension);
    const actions = resizeAction ? [resizeAction] : [];

    const saveFormat = format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG;

    const manipulated = await ImageManipulator.manipulateAsync(rawUri, actions, {
      compress: quality,
      format: saveFormat,
    });

    let sizeBytes = 0;
    try {
      const info = await FileSystem.getInfoAsync(manipulated.uri);
      if (info.exists && !info.isDirectory && typeof info.size === 'number') {
        sizeBytes = info.size;
      }
    } catch {
      // ignore stat error
    }

    // Asynchronously delete the multi-megabyte raw capture file
    if (!options.preserveRawCache && manipulated.uri !== rawUri) {
      void safePurgeRawCache(rawUri);
    }

    return {
      uri: manipulated.uri,
      width: manipulated.width,
      height: manipulated.height,
      sizeBytes,
      isProcessed: true,
    };
  } catch (error) {
    // Resilient fallback: field worker must never be blocked by an image pipeline failure
    return {
      uri: rawUri,
      sizeBytes: 0,
      isProcessed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
