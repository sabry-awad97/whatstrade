-- CreateEnum
CREATE TYPE "confidence_band" AS ENUM ('auto', 'suggest', 'review', 'none');

-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('pending', 'confirmed', 'rejected', 'auto_confirmed');

-- CreateEnum
CREATE TYPE "offer_status" AS ENUM ('active', 'matched', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('active', 'fulfilled', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "review_type" AS ENUM ('offer', 'request', 'match');

-- CreateEnum
CREATE TYPE "message_queue_status" AS ENUM ('pending', 'processing', 'completed', 'failed', 'dead_letter');

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "operator_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "jid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_monitored" BOOLEAN NOT NULL DEFAULT false,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "score" DECIMAL(5,4) NOT NULL,
    "confidence_band" "confidence_band" NOT NULL,
    "status" "match_status" NOT NULL DEFAULT 'pending',
    "operator_note" TEXT,
    "medication_name" TEXT NOT NULL,
    "offer_quantity" INTEGER NOT NULL,
    "request_quantity" INTEGER NOT NULL,
    "offer_price" DECIMAL(10,2),
    "max_price" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "medication_name" TEXT NOT NULL,
    "dosage" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2),
    "group_name" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "status" "offer_status" NOT NULL DEFAULT 'active',
    "raw_text" TEXT,
    "whatsapp_message_id" TEXT,
    "whatsapp_group_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "medication_name" TEXT NOT NULL,
    "dosage" TEXT,
    "quantity" INTEGER NOT NULL,
    "max_price" DECIMAL(10,2),
    "group_name" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "status" "request_status" NOT NULL DEFAULT 'active',
    "raw_text" TEXT,
    "whatsapp_message_id" TEXT,
    "whatsapp_group_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_items" (
    "id" TEXT NOT NULL,
    "type" "review_type" NOT NULL,
    "medication_name" TEXT NOT NULL,
    "dosage" TEXT,
    "quantity" INTEGER,
    "raw_text" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "status" "review_status" NOT NULL DEFAULT 'pending',
    "parsed_data" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matching_weights" (
    "id" TEXT NOT NULL,
    "medication" DECIMAL(5,4) NOT NULL DEFAULT 0.40,
    "quantity" DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    "dosage" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "price" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "recency" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "matching_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_message_queue" (
    "id" TEXT NOT NULL,
    "whatsapp_message_id" TEXT NOT NULL,
    "whatsapp_group_id" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "sender_name" TEXT,
    "raw_text" TEXT NOT NULL,
    "received_at" TIMESTAMPTZ NOT NULL,
    "status" "message_queue_status" NOT NULL DEFAULT 'pending',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "last_error" TEXT,
    "last_error_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "extracted_data" JSONB,
    "created_offer_id" TEXT,
    "created_request_id" TEXT,

    CONSTRAINT "whatsapp_message_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "session_data" JSONB NOT NULL,
    "is_connected" BOOLEAN NOT NULL DEFAULT false,
    "last_connected" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_operator_id_idx" ON "audit_log"("operator_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "groups_jid_key" ON "groups"("jid");

-- CreateIndex
CREATE INDEX "idx_offer_whatsapp_message" ON "offers"("whatsapp_message_id");

-- CreateIndex
CREATE INDEX "idx_request_whatsapp_message" ON "requests"("whatsapp_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_message_queue_whatsapp_message_id_key" ON "whatsapp_message_queue"("whatsapp_message_id");

-- CreateIndex
CREATE INDEX "idx_queue_status_created" ON "whatsapp_message_queue"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_queue_group" ON "whatsapp_message_queue"("whatsapp_group_id");

-- CreateIndex
CREATE INDEX "idx_queue_retry" ON "whatsapp_message_queue"("retry_count");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_phone_number_key" ON "whatsapp_sessions"("phone_number");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_whatsapp_message_id_fkey" FOREIGN KEY ("whatsapp_message_id") REFERENCES "whatsapp_message_queue"("whatsapp_message_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_whatsapp_message_id_fkey" FOREIGN KEY ("whatsapp_message_id") REFERENCES "whatsapp_message_queue"("whatsapp_message_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_message_queue" ADD CONSTRAINT "whatsapp_message_queue_created_offer_id_fkey" FOREIGN KEY ("created_offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_message_queue" ADD CONSTRAINT "whatsapp_message_queue_created_request_id_fkey" FOREIGN KEY ("created_request_id") REFERENCES "requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- WhatsApp Message Queue NOTIFY Trigger
-- ============================================================================
-- This trigger sends a PostgreSQL NOTIFY event when a new message is inserted
-- with 'pending' status. The Bun server listens to this notification for
-- real-time processing via the whatsapp-listener service.
--
-- Architecture:
-- 1. Go service inserts message → whatsapp_message_queue (status='pending')
-- 2. PostgreSQL trigger fires → NOTIFY 'new_whatsapp_message' with message ID
-- 3. Bun server LISTEN receives notification
-- 4. Message processor handles the message asynchronously
-- ============================================================================

-- Create the notification function
CREATE OR REPLACE FUNCTION notify_new_whatsapp_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for pending messages (new messages ready for processing)
  IF NEW.status = 'pending' THEN
    -- Send notification with message ID as payload
    -- The listener will use this ID to fetch and process the message
    PERFORM pg_notify('new_whatsapp_message', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on INSERT
-- Fires after each row is inserted into whatsapp_message_queue
DROP TRIGGER IF EXISTS trigger_notify_new_whatsapp_message ON whatsapp_message_queue;

CREATE TRIGGER trigger_notify_new_whatsapp_message
AFTER INSERT ON whatsapp_message_queue
FOR EACH ROW
EXECUTE FUNCTION notify_new_whatsapp_message();

-- Add documentation comment
COMMENT ON FUNCTION notify_new_whatsapp_message() IS 
'Sends PostgreSQL NOTIFY event when a new WhatsApp message is queued with pending status.
The Bun server listens to the "new_whatsapp_message" channel for real-time processing.
Payload contains the message ID (UUID) for fetching and processing.';

COMMENT ON TRIGGER trigger_notify_new_whatsapp_message ON whatsapp_message_queue IS
'Triggers NOTIFY event for real-time message processing by the Bun server listener service.';
