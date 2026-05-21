/**
 * Automatic Trigger Management
 *
 * This script ensures all required PostgreSQL triggers are present in the database.
 * It runs automatically on server startup and applies missing triggers without
 * requiring manual migrations.
 *
 * Usage:
 * - Called automatically by server on startup
 * - Can be run manually: bun run check-trigger.ts
 *
 * Triggers Managed:
 * 1. notify_new_whatsapp_message - Notifies when new messages arrive
 * 2. notify_queue_stats - Notifies when queue stats change (INSERT/UPDATE/DELETE)
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./prisma/generated/client";

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

/**
 * Check and apply notify_new_whatsapp_message trigger
 * Fires when new messages are inserted with status='pending'
 */
async function ensureNewMessageTrigger() {
  try {
    // Check if the function exists
    const functionCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'notify_new_whatsapp_message'
      ) as exists;
    `;

    // Check if the trigger exists
    const triggerCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_new_whatsapp_message'
      ) as exists;
    `;

    if (!functionCheck[0]?.exists || !triggerCheck[0]?.exists) {
      console.log("⚙️  Applying notify_new_whatsapp_message trigger...");

      // Create or replace the function
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION notify_new_whatsapp_message()
        RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.status = 'pending' THEN
            PERFORM pg_notify('new_whatsapp_message', NEW.id::text);
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Drop trigger if exists (to recreate)
      await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS trigger_notify_new_whatsapp_message ON whatsapp_message_queue;
      `);

      // Create the trigger
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER trigger_notify_new_whatsapp_message
        AFTER INSERT ON whatsapp_message_queue
        FOR EACH ROW
        EXECUTE FUNCTION notify_new_whatsapp_message();
      `);

      console.log("✅ notify_new_whatsapp_message trigger applied");
    } else {
      console.log("✅ notify_new_whatsapp_message trigger exists");
    }
  } catch (error) {
    console.error(
      "❌ Error applying notify_new_whatsapp_message trigger:",
      error,
    );
    throw error;
  }
}

/**
 * Check and apply notify_queue_stats triggers
 * Fires when queue stats change (INSERT/UPDATE/DELETE)
 */
async function ensureQueueStatsTriggers() {
  try {
    // Check if the function exists
    const functionCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'notify_queue_stats'
      ) as exists;
    `;

    // Check if all three triggers exist
    const insertTriggerCheck = await prisma.$queryRaw<
      Array<{ exists: boolean }>
    >`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_queue_stats_insert'
      ) as exists;
    `;

    const updateTriggerCheck = await prisma.$queryRaw<
      Array<{ exists: boolean }>
    >`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_queue_stats_update'
      ) as exists;
    `;

    const deleteTriggerCheck = await prisma.$queryRaw<
      Array<{ exists: boolean }>
    >`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_queue_stats_delete'
      ) as exists;
    `;

    const allTriggersExist =
      functionCheck[0]?.exists &&
      insertTriggerCheck[0]?.exists &&
      updateTriggerCheck[0]?.exists &&
      deleteTriggerCheck[0]?.exists;

    if (!allTriggersExist) {
      console.log("⚙️  Applying notify_queue_stats triggers...");

      // Create or replace the function
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION notify_queue_stats()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Send empty JSON payload (handler will query fresh stats)
          PERFORM pg_notify('queue_stats', '{}');
          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Drop all triggers if they exist (to recreate)
      await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS trigger_notify_queue_stats_insert ON whatsapp_message_queue;
      `);
      await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS trigger_notify_queue_stats_update ON whatsapp_message_queue;
      `);
      await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS trigger_notify_queue_stats_delete ON whatsapp_message_queue;
      `);

      // Create INSERT trigger
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER trigger_notify_queue_stats_insert
        AFTER INSERT ON whatsapp_message_queue
        FOR EACH ROW
        EXECUTE FUNCTION notify_queue_stats();
      `);

      // Create UPDATE trigger (only when status changes)
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER trigger_notify_queue_stats_update
        AFTER UPDATE OF status ON whatsapp_message_queue
        FOR EACH ROW
        WHEN (OLD.status IS DISTINCT FROM NEW.status)
        EXECUTE FUNCTION notify_queue_stats();
      `);

      // Create DELETE trigger
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER trigger_notify_queue_stats_delete
        AFTER DELETE ON whatsapp_message_queue
        FOR EACH ROW
        EXECUTE FUNCTION notify_queue_stats();
      `);

      console.log(
        "✅ notify_queue_stats triggers applied (INSERT/UPDATE/DELETE)",
      );
    } else {
      console.log(
        "✅ notify_queue_stats triggers exist (INSERT/UPDATE/DELETE)",
      );
    }
  } catch (error) {
    console.error("❌ Error applying notify_queue_stats triggers:", error);
    throw error;
  }
}

/**
 * Main function to check and apply all triggers
 */
async function checkAndApplyTriggers() {
  console.log("\n🔍 Checking PostgreSQL triggers...\n");

  try {
    // Ensure all triggers are present
    await ensureNewMessageTrigger();
    await ensureQueueStatsTriggers();

    console.log("\n✅ All triggers are configured!\n");
  } catch (error) {
    console.error("\n❌ Failed to configure triggers:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (import.meta.main) {
  checkAndApplyTriggers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

// Export for use in server startup
export { checkAndApplyTriggers };
