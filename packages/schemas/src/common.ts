/**
 * Common schemas and utilities shared across the API
 */
import { z } from "zod";

/**
 * UUID identifier schema
 */
export const UuidSchema = z.string().uuid();

/**
 * Standard pagination query parameters
 */
export const PaginationQueryParams = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

/**
 * Pagination with optional search
 */
export const SearchablePaginationQueryParams = PaginationQueryParams.extend({
  search: z.coerce.string().optional(),
});

/**
 * Common ID parameter for route params (UUID)
 */
export const IdParams = z.object({
  id: UuidSchema,
});

/**
 * Common JID (WhatsApp identifier) parameter
 */
export const JidParams = z.object({
  jid: z.coerce.string(),
});

/**
 * Optional note field for operator actions
 */
export const OptionalNoteBody = z.object({
  note: z.string().optional(),
});

// Type exports
export type UuidSchema = z.infer<typeof UuidSchema>;
export type PaginationQueryParams = z.infer<typeof PaginationQueryParams>;
export type SearchablePaginationQueryParams = z.infer<
  typeof SearchablePaginationQueryParams
>;
export type IdParams = z.infer<typeof IdParams>;
export type JidParams = z.infer<typeof JidParams>;
export type OptionalNoteBody = z.infer<typeof OptionalNoteBody>;
