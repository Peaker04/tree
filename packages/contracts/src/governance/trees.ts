import { z } from 'zod';
import { LatitudeSchema, LongitudeSchema } from '../common/coordinates';

export const TreeHealthStatusSchema = z.enum(['Khỏe mạnh', 'Cần chăm sóc', 'Sâu bệnh']);
export type TreeHealthStatus = z.infer<typeof TreeHealthStatusSchema>;

export const TreeRiskStatusSchema = z.enum(['healthy', 'abnormal', 'overdue', 'pest_risk', 'leaning']);
export type TreeRiskStatus = z.infer<typeof TreeRiskStatusSchema>;

/**
 * GV-10: CreateTreeRequest — Tree aggregate creation.
 * expectedVersion is NOT required for creation commands.
 */
export const CreateTreeRequestSchema = z.object({
  treeId: z.string().min(1),
  qrCode: z.string().min(1),
  name: z.string().min(1),
  species: z.string().min(1),
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  address: z.string().min(1),
  healthStatus: TreeHealthStatusSchema,
  ageYears: z.number().int().nonnegative(),
  riskStatus: TreeRiskStatusSchema.optional(),
});

export type CreateTreeRequest = z.infer<typeof CreateTreeRequestSchema>;

/**
 * GV-11: UpdateTreeMasterDataRequest — Mutation against existing tree. Requires expectedVersion.
 */
export const UpdateTreeMasterDataRequestSchema = z.object({
  treeId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  name: z.string().optional(),
  species: z.string().optional(),
  address: z.string().optional(),
  healthStatus: TreeHealthStatusSchema.optional(),
  ageYears: z.number().int().nonnegative().optional(),
  riskStatus: TreeRiskStatusSchema.optional(),
  reason: z.string().min(5),
});

export type UpdateTreeMasterDataRequest = z.infer<typeof UpdateTreeMasterDataRequestSchema>;

/**
 * GV-12: ReplaceTreeQrCodeRequest — Mutation against existing tree. Requires expectedVersion.
 */
export const ReplaceTreeQrCodeRequestSchema = z.object({
  treeId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  newQrCode: z.string().min(1),
  reason: z.string().min(5),
});

export type ReplaceTreeQrCodeRequest = z.infer<typeof ReplaceTreeQrCodeRequestSchema>;

/**
 * GV-13: UpdateCanonicalCoordinatesRequest — Mutation against existing tree. Requires expectedVersion.
 */
export const UpdateCanonicalCoordinatesRequestSchema = z.object({
  treeId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  reason: z.string().min(5),
});

export type UpdateCanonicalCoordinatesRequest = z.infer<typeof UpdateCanonicalCoordinatesRequestSchema>;

/**
 * GV-14: RetireTreeRequest — Mutation against existing tree. Requires expectedVersion.
 */
export const RetireTreeRequestSchema = z.object({
  treeId: z.string().min(1),
  expectedVersion: z.number().int().nonnegative(),
  reason: z.string().min(5),
});

export type RetireTreeRequest = z.infer<typeof RetireTreeRequestSchema>;

/**
 * Canonical Tree DTO Schema — includes version: number for OCC and validated coordinates.
 */
export const TreeDtoSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().nonnegative(),
  name: z.string(),
  species: z.string(),
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  address: z.string(),
  qrCode: z.string(),
  healthStatus: TreeHealthStatusSchema,
  ageYears: z.number(),
  riskStatus: TreeRiskStatusSchema.optional(),
});

export type CanonicalTreeDto = z.infer<typeof TreeDtoSchema>;

/**
 * Query schema for listing trees
 */
export const ListTreesQuerySchema = z.object({
  q: z.string().optional(),
  riskStatus: TreeRiskStatusSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type ListTreesQuery = z.infer<typeof ListTreesQuerySchema>;
