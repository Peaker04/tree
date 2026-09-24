import { z } from 'zod';
import { ProofProfileSchema } from './proof-profile';

export const OperationalTaskTypeCatalogItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  proofProfile: ProofProfileSchema,
});
export type OperationalTaskTypeCatalogItem = z.infer<typeof OperationalTaskTypeCatalogItemSchema>;

export const OperationalTaskTypeCatalogResponseSchema = z.object({
  data: z.array(OperationalTaskTypeCatalogItemSchema),
});
export type OperationalTaskTypeCatalogResponse = z.infer<typeof OperationalTaskTypeCatalogResponseSchema>;

export const AssignableStaffCatalogItemSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().email(),
});
export type AssignableStaffCatalogItem = z.infer<typeof AssignableStaffCatalogItemSchema>;

export const AssignableStaffCatalogResponseSchema = z.object({
  data: z.array(AssignableStaffCatalogItemSchema),
});
export type AssignableStaffCatalogResponse = z.infer<typeof AssignableStaffCatalogResponseSchema>;
