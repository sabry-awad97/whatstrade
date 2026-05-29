import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("GroupsApi");

// ============================================================================
// Schemas
// ============================================================================

export const groupResponseSchema = z.object({
  id: z.string(),
  jid: z.string(),
  name: z.string(),
  is_monitored: z.boolean(),
  member_count: z.number(),
  last_message_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type GroupResponse = z.infer<typeof groupResponseSchema>;

// ============================================================================
// Request Types
// ============================================================================

export type EnableGroupMonitoringParams = {
  data: {
    jid: string;
  };
};

export type DisableGroupMonitoringParams = {
  data: {
    jid: string;
  };
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * List all WhatsApp groups
 */
export async function listGroups(): Promise<GroupResponse[]> {
  logger.info("Listing all groups");
  return invokeCommand("list_groups", z.array(groupResponseSchema));
}

/**
 * List monitored WhatsApp groups only
 */
export async function listMonitoredGroups(): Promise<GroupResponse[]> {
  logger.info("Listing monitored groups");
  return invokeCommand("list_monitored_groups", z.array(groupResponseSchema));
}

/**
 * Enable monitoring for a WhatsApp group
 */
export async function enableGroupMonitoring(
  jid: string,
): Promise<GroupResponse> {
  logger.info("Enabling group monitoring");
  return invokeCommand("enable_group_monitoring", groupResponseSchema, {
    params: {
      data: { jid },
    },
  });
}

/**
 * Disable monitoring for a WhatsApp group
 */
export async function disableGroupMonitoring(
  jid: string,
): Promise<GroupResponse> {
  logger.info("Disabling group monitoring");
  return invokeCommand("disable_group_monitoring", groupResponseSchema, {
    params: {
      data: { jid },
    },
  });
}
