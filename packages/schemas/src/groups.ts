/**
 * WhatsApp group management schemas
 */
import { z } from "zod";
import { JidParams, UuidSchema } from "./common";

/**
 * @summary Base group response schema
 * Shared structure for all group-related responses
 */
const GroupResponseBase = z.object({
  id: UuidSchema,
  jid: z.string(),
  name: z.string(),
  isMonitored: z.boolean(),
  memberCount: z.number(),
  lastMessageAt: z.coerce.date().nullish(),
  createdAt: z.coerce.date(),
});

/**
 * @summary Single group item in list response
 */
export const ListGroupsResponseItem = GroupResponseBase;

/**
 * @summary List of all WhatsApp groups
 */
export const ListGroupsResponse = z.array(ListGroupsResponseItem);

/**
 * @summary Single monitored group item
 */
export const ListMonitoredGroupsResponseItem = GroupResponseBase;

/**
 * @summary List of monitored groups
 */
export const ListMonitoredGroupsResponse = z.array(
  ListMonitoredGroupsResponseItem,
);

/**
 * @summary Enable monitoring parameters
 */
export const EnableGroupMonitoringParams = JidParams;

/**
 * @summary Enable monitoring response
 */
export const EnableGroupMonitoringResponse = GroupResponseBase;

/**
 * @summary Disable monitoring parameters
 */
export const DisableGroupMonitoringParams = JidParams;

/**
 * @summary Disable monitoring response
 */
export const DisableGroupMonitoringResponse = GroupResponseBase;

// Type exports
export type ListGroupsResponseItem = z.infer<typeof ListGroupsResponseItem>;
export type ListGroupsResponse = z.infer<typeof ListGroupsResponse>;
export type ListMonitoredGroupsResponseItem = z.infer<
  typeof ListMonitoredGroupsResponseItem
>;
export type ListMonitoredGroupsResponse = z.infer<
  typeof ListMonitoredGroupsResponse
>;
export type EnableGroupMonitoringParams = z.infer<
  typeof EnableGroupMonitoringParams
>;
export type EnableGroupMonitoringResponse = z.infer<
  typeof EnableGroupMonitoringResponse
>;
export type DisableGroupMonitoringParams = z.infer<
  typeof DisableGroupMonitoringParams
>;
export type DisableGroupMonitoringResponse = z.infer<
  typeof DisableGroupMonitoringResponse
>;
