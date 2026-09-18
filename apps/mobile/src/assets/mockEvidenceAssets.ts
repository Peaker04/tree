import type { ImageSourcePropType } from 'react-native';

import treeLandscape from '../../assets/smoke/tree-landscape.webp';
import treeQrDauRai from '../../assets/smoke/tree-qr-dau-rai.jpg';

export const mockTreeQrPhoto = treeQrDauRai as ImageSourcePropType;
export const mockTreeLandscapePhoto = treeLandscape as ImageSourcePropType;

export const mockBeforePhotoUri = 'mock://novyx/tree-qr-dau-rai';
export const mockAfterPhotoUri = 'mock://novyx/tree-landscape';

export const getMockEvidenceSource = (uri: string | undefined, stage: 'before' | 'after'): ImageSourcePropType => {
  if (uri?.startsWith('file://')) return { uri };
  return stage === 'before' ? mockTreeQrPhoto : mockTreeLandscapePhoto;
};

export const getMockPhotoSource = (uri: string | undefined, stage: 'before' | 'after'): ImageSourcePropType => {
  if (uri?.startsWith('file://')) return { uri };
  return getMockEvidenceSource(uri, stage);
};
