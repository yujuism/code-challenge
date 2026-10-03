import { z } from "zod";

export const RESOURCE_STATUSES = ["active", "archived"] as const;

const name = z.string().trim().min(1, "Name is required").max(200);
const description = z.string().trim().max(2000);
const status = z.enum(RESOURCE_STATUSES);

// Strict objects reject unknown fields, so a typo like `{ "stauts": ... }` is a 400
// instead of being silently ignored.
export const createResourceSchema = z.strictObject({
  name,
  description: description.default(""),
  status: status.default("active"),
});

export const updateResourceSchema = z
  .strictObject({ name, description, status })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Provide at least one field to update");

export const listResourcesQuerySchema = z.strictObject({
  status: status.optional(),
  q: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ResourceStatus = z.infer<typeof status>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ListResourcesQuery = z.infer<typeof listResourcesQuerySchema>;

export interface Resource {
  id: string;
  name: string;
  description: string;
  status: ResourceStatus;
  createdAt: string;
  updatedAt: string;
}
