-- Add PostgreSQL NOTIFY triggers for real-time WhatsApp events
-- This migration adds triggers that fire NOTIFY events when queue stats change

-- Trigger function for queue stats updates
-- Fires on INSERT, UPDATE (status changes), and DELETE
CREATE OR REPLACE FUNCTION notify_queue_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Send empty JSON payload (handler will query fresh stats)
  PERFORM pg_notify('queue_stats', '{}');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT: new message added to queue
CREATE TRIGGER trigger_notify_queue_stats_insert
AFTER INSERT ON whatsapp_message_queue
FOR EACH ROW
EXECUTE FUNCTION notify_queue_stats();

-- Trigger on UPDATE: message status changed
CREATE TRIGGER trigger_notify_queue_stats_update
AFTER UPDATE OF status ON whatsapp_message_queue
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_queue_stats();

-- Trigger on DELETE: message removed from queue
CREATE TRIGGER trigger_notify_queue_stats_delete
AFTER DELETE ON whatsapp_message_queue
FOR EACH ROW
EXECUTE FUNCTION notify_queue_stats();

-- Note: whatsapp_status and whatsapp_qr channels are triggered by Go service
-- See: services/whatsapp/internal/adapter/whatsapp/event_handler.go
