import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-native for node environment
vi.mock('react-native', () => ({
  Image: {
    getSize: vi.fn((_uri, success) => success(4032, 3024)),
  },
}));

import {
  calculateTargetResizeAction,
  isAlreadyProcessedEvidence,
  processEvidencePhoto,
} from '../../apps/mobile/src/services/imageProcessingService';

// Mock FileSystem
vi.mock('expo-file-system/legacy', () => ({
  getInfoAsync: vi.fn().mockResolvedValue({ exists: true, size: 245000, isDirectory: false }),
  deleteAsync: vi.fn().mockResolvedValue(undefined),
}));

// Mock ImageManipulator
const mockManipulateAsync = vi.fn();
vi.mock('expo-image-manipulator', () => ({
  manipulateAsync: (...args: unknown[]) => mockManipulateAsync(...args),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
    WEBP: 'webp',
  },
}));

describe('ImageProcessingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateTargetResizeAction', () => {
    it('returns width clamp for landscape photos exceeding max dimension', () => {
      const action = calculateTargetResizeAction(4032, 3024, 1440);
      expect(action).toEqual({ resize: { width: 1440 } });
    });

    it('returns height clamp for portrait photos exceeding max dimension', () => {
      const action = calculateTargetResizeAction(3024, 4032, 1440);
      expect(action).toEqual({ resize: { height: 1440 } });
    });

    it('returns width clamp for square photos exceeding max dimension', () => {
      const action = calculateTargetResizeAction(2000, 2000, 1440);
      expect(action).toEqual({ resize: { width: 1440 } });
    });

    it('returns null if photo is already smaller than max dimension', () => {
      const action = calculateTargetResizeAction(1280, 960, 1440);
      expect(action).toBeNull();
    });
  });

  describe('isAlreadyProcessedEvidence', () => {
    it('recognizes remote storage URLs as already processed', () => {
      expect(isAlreadyProcessedEvidence('https://r2.novyx.local/evidence/task-1/before.jpg')).toBe(true);
      expect(isAlreadyProcessedEvidence('http://s3.novyx.local/evidence.jpg')).toBe(true);
    });

    it('recognizes sandbox evidence directory URIs as already processed', () => {
      expect(isAlreadyProcessedEvidence('file:///data/user/0/com.novyx.greenops/files/evidence/task-1/before.jpg')).toBe(true);
    });

    it('identifies raw camera cache URIs as needing processing', () => {
      expect(isAlreadyProcessedEvidence('file:///data/user/0/com.novyx.greenops/cache/Camera/raw_123.jpg')).toBe(false);
    });
  });

  describe('processEvidencePhoto', () => {
    it('processes raw image through ImageManipulator with default 1440px and 0.75 JPEG', async () => {
      mockManipulateAsync.mockResolvedValueOnce({
        uri: 'file:///cache/ImageManipulator/processed.jpg',
        width: 1440,
        height: 1080,
      });

      const rawUri = 'file:///cache/Camera/raw_camera.jpg';
      const result = await processEvidencePhoto(rawUri, {
        knownDimensions: { width: 4032, height: 3024 },
      });

      expect(mockManipulateAsync).toHaveBeenCalledTimes(1);
      expect(mockManipulateAsync).toHaveBeenCalledWith(
        rawUri,
        [{ resize: { width: 1440 } }],
        expect.objectContaining({ compress: 0.75, format: 'jpeg' }),
      );
      expect(result.uri).toBe('file:///cache/ImageManipulator/processed.jpg');
      expect(result.isProcessed).toBe(true);
      expect(result.sizeBytes).toBe(245000);
    });

    it('bypasses processing if URI is already persisted in sandbox or remote', async () => {
      const sandboxUri = 'file:///files/evidence/task-1/persisted.jpg';
      const result = await processEvidencePhoto(sandboxUri);

      expect(mockManipulateAsync).not.toHaveBeenCalled();
      expect(result.uri).toBe(sandboxUri);
      expect(result.isProcessed).toBe(false);
    });

    it('gracefully falls back to raw URI when ImageManipulator fails', async () => {
      mockManipulateAsync.mockRejectedValueOnce(new Error('Native manipulator failed'));

      const rawUri = 'file:///cache/Camera/corrupt.jpg';
      const result = await processEvidencePhoto(rawUri, {
        knownDimensions: { width: 4032, height: 3024 },
      });

      expect(result.uri).toBe(rawUri);
      expect(result.isProcessed).toBe(false);
    });
  });
});
