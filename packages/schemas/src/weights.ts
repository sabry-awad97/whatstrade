/**
 * Matching weight configuration schemas
 * Controls how different factors are weighted in the matching algorithm
 */
import { z } from "zod";

// Weight constraints (all weights must be between 0 and 1)
export const updateWeightsBodyMedicationMin = 0;
export const updateWeightsBodyMedicationMax = 1;
export const updateWeightsBodyQuantityMin = 0;
export const updateWeightsBodyQuantityMax = 1;
export const updateWeightsBodyDosageMin = 0;
export const updateWeightsBodyDosageMax = 1;
export const updateWeightsBodyPriceMin = 0;
export const updateWeightsBodyPriceMax = 1;
export const updateWeightsBodyRecencyMin = 0;
export const updateWeightsBodyRecencyMax = 1;

/**
 * @summary Base weight configuration schema
 * Defines the structure for matching algorithm weights
 */
const WeightConfigBase = z.object({
  medication: z.number(),
  quantity: z.number(),
  dosage: z.number(),
  price: z.number(),
  recency: z.number(),
});

/**
 * @summary Get current matching weights response
 */
export const GetWeightsResponse = WeightConfigBase.extend({
  id: z.number(),
  updatedAt: z.coerce.date(),
});

/**
 * @summary Update matching weights request body
 * All weights must be between 0 and 1
 */
export const UpdateWeightsBody = z.object({
  medication: z
    .number()
    .min(updateWeightsBodyMedicationMin)
    .max(updateWeightsBodyMedicationMax),
  quantity: z
    .number()
    .min(updateWeightsBodyQuantityMin)
    .max(updateWeightsBodyQuantityMax),
  dosage: z
    .number()
    .min(updateWeightsBodyDosageMin)
    .max(updateWeightsBodyDosageMax),
  price: z
    .number()
    .min(updateWeightsBodyPriceMin)
    .max(updateWeightsBodyPriceMax),
  recency: z
    .number()
    .min(updateWeightsBodyRecencyMin)
    .max(updateWeightsBodyRecencyMax),
});

/**
 * @summary Update matching weights response
 */
export const UpdateWeightsResponse = GetWeightsResponse;

// Type exports
export type GetWeightsResponse = z.infer<typeof GetWeightsResponse>;
export type UpdateWeightsBody = z.infer<typeof UpdateWeightsBody>;
export type UpdateWeightsResponse = z.infer<typeof UpdateWeightsResponse>;
