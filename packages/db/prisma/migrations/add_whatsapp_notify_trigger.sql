-- Migration: Add PostgreSQL NOTIFY trigger for WhatsApp message queue
-- This trigger sends a notification when a new message is inserted with 'pending' status
-- The Bun server listens to this notification for real-time processing

-- Create the notification function
CREATE OR REPLACE FUNCTION notify_new_whatsapp_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for pending messages
  IF NEW.status = 'pending' THEN
    -- Send notification with message ID as payload
    PERFORM pg_notify('new_whatsapp_message', NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_notify_new_whatsapp_message ON whatsapp_message_queue;

CREATE TRIGGER trigger_notify_new_whatsapp_message
AFTER INSERT ON whatsapp_message_queue
FOR EACH ROW
EXECUTE FUNCTION notify_new_whatsapp_message();

-- Add comment for documentation
COMMENT ON FUNCTION notify_new_whatsapp_message() IS 
'Sends PostgreSQL NOTIFY event when a new WhatsApp message is queued. 
The Bun server listens to the "new_whatsapp_message" channel for real-time processing.';
