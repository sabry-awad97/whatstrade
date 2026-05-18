/**
 * Check if NOTIFY trigger exists in database
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

async function checkTrigger() {
  try {
    // Check if the function exists
    const functionCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'notify_new_whatsapp_message'
      ) as exists;
    `;

    console.log("Function exists:", functionCheck[0]?.exists);

    // Check if the trigger exists
    const triggerCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_new_whatsapp_message'
      ) as exists;
    `;

    console.log("Trigger exists:", triggerCheck[0]?.exists);

    if (!functionCheck[0]?.exists || !triggerCheck[0]?.exists) {
      console.log("\n⚠️  NOTIFY trigger not found. Applying it now...\n");

      // Apply the trigger
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

      await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS trigger_notify_new_whatsapp_message ON whatsapp_message_queue;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER trigger_notify_new_whatsapp_message
        AFTER INSERT ON whatsapp_message_queue
        FOR EACH ROW
        EXECUTE FUNCTION notify_new_whatsapp_message();
      `);

      console.log("✅ NOTIFY trigger applied successfully!");
    } else {
      console.log("✅ NOTIFY trigger is already configured!");
    }
  } catch (error) {
    console.error("Error:", error);
    throw error; // Re-throw to propagate to caller
  } finally {
    await prisma.$disconnect();
  }
}

checkTrigger()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
