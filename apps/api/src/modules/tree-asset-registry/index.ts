/**
 * Tree Asset Registry Bounded Context (Supporting Subdomain)
 *
 * Owns tree master data, canonical coordinates, QR codes, and risk/health classifications.
 * Implementation of domain behavior is scheduled for Wave 4.
 */
export const TREE_ASSET_REGISTRY_MODULE = {
  name: 'Tree Asset Registry',
  slug: 'tree-asset-registry',
  type: 'SUPPORTING_SUBDOMAIN',
} as const;

export interface ITreeAssetRegistryPort {
  readonly moduleName: string;
}
