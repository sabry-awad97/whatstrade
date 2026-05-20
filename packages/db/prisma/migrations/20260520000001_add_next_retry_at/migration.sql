-- Add nextRetryAt field for durable retry scheduling
ALTER TABLE "whatsapp_message_queue" ADD COLUMN "next_retry_at" TIMESTAMPTZ;

-- Add index for efficient retry queries
CREATE INDEX "idx_queue_retry_schedule" ON "whatsapp_message_queue"("status", "next_retry_at");

-- Add comment explaining the field
COMMENT ON COLUMN "whatsapp_message_queue"."next_retry_at" IS 'Scheduled time for next retry attempt (durable retry mechanism)';
