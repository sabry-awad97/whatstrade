/**
 * WhatsApp Hooks
 * React Query hooks for WhatsApp operations using Tauri IPC
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  getWhatsAppStatus,
  connectWhatsApp,
  disconnectWhatsApp,
  requestPairCode,
  sendWhatsAppMessage,
  logoutWhatsApp,
  type PairCodeRequest,
  type SendMessageRequest,
  type WhatsAppEvent,
  whatsappEventSchema,
} from "@/api/whatsapp";
import { createLogger } from "@/lib/logger";

const logger = createLogger("WhatsAppHooks");

// ============================================================================
// Constants
// ============================================================================

/**
 * Polling interval for WhatsApp status in milliseconds
 */
export const WHATSAPP_STATUS_REFETCH_INTERVAL = 5000;

// ============================================================================
// Query Keys
// ============================================================================

export const whatsappKeys = {
  all: ["whatsapp"] as const,
  status: () => [...whatsappKeys.all, "status"] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook to fetch WhatsApp connection status
 *
 * @example
 * ```tsx
 * const { data: status, isLoading } = useWhatsAppStatus();
 *
 * return (
 *   <div>
 *     Status: {status?.connected ? 'Connected' : 'Disconnected'}
 *     {status?.logged_in && <p>Phone: {status.phone_number}</p>}
 *   </div>
 * );
 * ```
 *
 * @returns TanStack Query result with WhatsApp status
 */
export function useWhatsAppStatus() {
  return useQuery({
    queryKey: whatsappKeys.status(),
    queryFn: () => {
      logger.info("Query: fetching WhatsApp status");
      return getWhatsAppStatus();
    },
    refetchInterval: WHATSAPP_STATUS_REFETCH_INTERVAL,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook to connect to WhatsApp
 *
 * @example
 * ```tsx
 * const connect = useConnectWhatsApp();
 *
 * const handleConnect = () => {
 *   connect.mutate(undefined, {
 *     onSuccess: () => toast.success('Connected to WhatsApp'),
 *     onError: (error) => toast.error(error.message),
 *   });
 * };
 * ```
 *
 * @returns TanStack Mutation for connecting to WhatsApp
 */
export function useConnectWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      logger.info("Mutation: connecting to WhatsApp");
      return connectWhatsApp();
    },
    onSuccess: () => {
      logger.info("Connected to WhatsApp successfully");
      // Invalidate status to refetch
      queryClient.invalidateQueries({ queryKey: whatsappKeys.status() });
    },
    onError: (error) => {
      logger.error("Failed to connect to WhatsApp", error);
    },
  });
}

/**
 * Hook to disconnect from WhatsApp
 *
 * @example
 * ```tsx
 * const disconnect = useDisconnectWhatsApp();
 *
 * const handleDisconnect = () => {
 *   disconnect.mutate(undefined, {
 *     onSuccess: () => toast.success('Disconnected from WhatsApp'),
 *     onError: (error) => toast.error(error.message),
 *   });
 * };
 * ```
 *
 * @returns TanStack Mutation for disconnecting from WhatsApp
 */
export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      logger.info("Mutation: disconnecting from WhatsApp");
      return disconnectWhatsApp();
    },
    onSuccess: () => {
      logger.info("Disconnected from WhatsApp successfully");
      // Invalidate status to refetch
      queryClient.invalidateQueries({ queryKey: whatsappKeys.status() });
    },
    onError: (error) => {
      logger.error("Failed to disconnect from WhatsApp", error);
    },
  });
}

/**
 * Hook to request a pairing code for phone number authentication
 *
 * @example
 * ```tsx
 * const requestCode = useRequestPairCode();
 *
 * const handleRequestCode = (phoneNumber: string) => {
 *   requestCode.mutate({ phone_number: phoneNumber }, {
 *     onSuccess: (data) => {
 *       toast.success(`Pairing code: ${data.code}`);
 *     },
 *     onError: (error) => toast.error(error.message),
 *   });
 * };
 * ```
 *
 * @returns TanStack Mutation for requesting pair code
 */
export function useRequestPairCode() {
  return useMutation({
    mutationFn: (data: PairCodeRequest) => {
      logger.info("Mutation: requesting pair code", {
        phoneNumber: data.phone_number,
      });
      return requestPairCode(data);
    },
    onSuccess: (data) => {
      logger.info("Pair code received successfully", { code: data.code });
    },
    onError: (error) => {
      logger.error("Failed to request pair code", error);
    },
  });
}

/**
 * Hook to send a WhatsApp message
 *
 * @example
 * ```tsx
 * const sendMessage = useSendWhatsAppMessage();
 *
 * const handleSend = (recipientJid: string, text: string) => {
 *   sendMessage.mutate({ recipient_jid: recipientJid, text }, {
 *     onSuccess: (data) => {
 *       toast.success(`Message sent: ${data.message_id}`);
 *     },
 *     onError: (error) => toast.error(error.message),
 *   });
 * };
 * ```
 *
 * @returns TanStack Mutation for sending WhatsApp message
 */
export function useSendWhatsAppMessage() {
  return useMutation({
    mutationFn: (data: SendMessageRequest) => {
      logger.info("Mutation: sending WhatsApp message", {
        recipientJid: data.recipient_jid,
      });
      return sendWhatsAppMessage(data);
    },
    onSuccess: (data) => {
      logger.info("Message sent successfully", { messageId: data.message_id });
    },
    onError: (error) => {
      logger.error("Failed to send message", error);
    },
  });
}

/**
 * Hook to logout from WhatsApp
 *
 * @example
 * ```tsx
 * const logout = useLogoutWhatsApp();
 *
 * const handleLogout = () => {
 *   logout.mutate(undefined, {
 *     onSuccess: () => toast.success('Logged out from WhatsApp'),
 *     onError: (error) => toast.error(error.message),
 *   });
 * };
 * ```
 *
 * @returns TanStack Mutation for logging out from WhatsApp
 */
export function useLogoutWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      logger.info("Mutation: logging out from WhatsApp");
      return logoutWhatsApp();
    },
    onSuccess: () => {
      logger.info("Logged out from WhatsApp successfully");
      // Invalidate status to refetch
      queryClient.invalidateQueries({ queryKey: whatsappKeys.status() });
    },
    onError: (error) => {
      logger.error("Failed to logout from WhatsApp", error);
    },
  });
}

// ============================================================================
// Event Listener Hooks
// ============================================================================

/**
 * Hook to listen to WhatsApp events
 *
 * @example
 * ```tsx
 * const { events, lastEvent } = useWhatsAppEvents();
 *
 * useEffect(() => {
 *   if (lastEvent?.type === 'qr_code') {
 *     setQrCode(lastEvent.code);
 *   }
 * }, [lastEvent]);
 *
 * return (
 *   <div>
 *     <h3>Recent Events:</h3>
 *     {events.map((event, i) => (
 *       <div key={i}>{event.type}</div>
 *     ))}
 *   </div>
 * );
 * ```
 *
 * @param maxEvents Maximum number of events to keep in history (default: 50)
 * @returns Object with events array and last event
 */
export function useWhatsAppEvents(maxEvents = 50) {
  const [events, setEvents] = useState<WhatsAppEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<WhatsAppEvent | null>(null);

  useEffect(() => {
    const unlistenPromises: Promise<UnlistenFn>[] = [];

    // Listen to all WhatsApp event types
    const eventTypes = [
      "whatsapp:state",
      "whatsapp:qr",
      "whatsapp:pair-code",
      "whatsapp:pair-success",
      "whatsapp:pair-error",
      "whatsapp:message",
      "whatsapp:receipt",
      "whatsapp:presence",
      "whatsapp:chat-state",
      "whatsapp:groups-synced",
      "whatsapp:error",
    ];

    eventTypes.forEach((eventType) => {
      const unlistenPromise = listen<unknown>(eventType, (event) => {
        try {
          const parsedEvent = whatsappEventSchema.parse(event.payload);
          logger.info(`WhatsApp event received: ${eventType}`, parsedEvent);

          setLastEvent(parsedEvent);
          setEvents((prev) => {
            const newEvents = [parsedEvent, ...prev];
            return newEvents.slice(0, maxEvents);
          });
        } catch (error) {
          logger.error(`Failed to parse WhatsApp event: ${eventType}`, error);
        }
      });

      unlistenPromises.push(unlistenPromise);
    });

    // Cleanup listeners on unmount
    return () => {
      Promise.all(unlistenPromises).then((unlistenFns) => {
        unlistenFns.forEach((unlisten) => unlisten());
      });
    };
  }, [maxEvents]);

  return { events, lastEvent };
}

/**
 * Hook to listen to a specific WhatsApp event type
 *
 * @example
 * ```tsx
 * const qrCode = useWhatsAppEvent('qr_code');
 *
 * return qrCode ? (
 *   <QRCodeDisplay code={qrCode.code} />
 * ) : (
 *   <p>Waiting for QR code...</p>
 * );
 * ```
 *
 * @param eventType The specific event type to listen for
 * @returns The last event of the specified type, or null
 */

// Map event types to backend event names
// Backend uses shortened names for some events
const eventNameMap: Record<string, string> = {
  state_changed: "whatsapp:state",
  qr_code: "whatsapp:qr",
  pair_code: "whatsapp:pair-code",
  pair_success: "whatsapp:pair-success",
  pair_error: "whatsapp:pair-error",
  message: "whatsapp:message",
  receipt: "whatsapp:receipt",
  presence: "whatsapp:presence",
  chat_state: "whatsapp:chat-state",
  groups_synced: "whatsapp:groups-synced",
  error: "whatsapp:error",
};

export function useWhatsAppEvent<T extends WhatsAppEvent["type"]>(
  eventType: T,
): Extract<WhatsAppEvent, { type: T }> | null {
  const [event, setEvent] = useState<Extract<
    WhatsAppEvent,
    { type: T }
  > | null>(null);

  useEffect(() => {
    const eventName =
      eventNameMap[eventType] || `whatsapp:${eventType.replace(/_/g, "-")}`;
    let unlistenFn: UnlistenFn | null = null;

    listen<unknown>(eventName, (event) => {
      try {
        const parsedEvent = whatsappEventSchema.parse(event.payload);
        if (parsedEvent.type === eventType) {
          logger.info(`WhatsApp event received: ${eventName}`, parsedEvent);
          setEvent(parsedEvent as Extract<WhatsAppEvent, { type: T }>);
        }
      } catch (error) {
        logger.error(`Failed to parse WhatsApp event: ${eventName}`, error);
      }
    }).then((unlisten) => {
      unlistenFn = unlisten;
    });

    // Cleanup listener on unmount
    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [eventType]);

  return event;
}

/**
 * Hook to listen for QR code events
 *
 * @example
 * ```tsx
 * const qrCode = useWhatsAppQrCode();
 *
 * return qrCode ? (
 *   <div>
 *     <QRCodeDisplay code={qrCode.code} />
 *     <p>Expires in {qrCode.timeout_secs} seconds</p>
 *   </div>
 * ) : null;
 * ```
 *
 * @returns The last QR code event, or null
 */
export function useWhatsAppQrCode() {
  return useWhatsAppEvent("qr_code");
}

/**
 * Hook to listen for pair code events
 *
 * @example
 * ```tsx
 * const pairCode = useWhatsAppPairCode();
 *
 * return pairCode ? (
 *   <div>
 *     <h2>Pairing Code: {pairCode.code}</h2>
 *     <p>Enter this code in WhatsApp</p>
 *   </div>
 * ) : null;
 * ```
 *
 * @returns The last pair code event, or null
 */
export function useWhatsAppPairCode() {
  return useWhatsAppEvent("pair_code");
}

/**
 * Hook to listen for incoming messages
 *
 * @example
 * ```tsx
 * const { messages } = useWhatsAppMessages();
 *
 * return (
 *   <div>
 *     {messages.map((msg) => (
 *       <div key={msg.id}>
 *         <strong>{msg.sender}:</strong> {msg.text}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 *
 * @param maxMessages Maximum number of messages to keep in history (default: 100)
 * @returns Object with messages array and last message
 */
export function useWhatsAppMessages(maxMessages = 100) {
  const [messages, setMessages] = useState<
    Extract<WhatsAppEvent, { type: "message" }>[]
  >([]);
  const [lastMessage, setLastMessage] = useState<Extract<
    WhatsAppEvent,
    { type: "message" }
  > | null>(null);

  useEffect(() => {
    let unlistenFn: UnlistenFn | null = null;

    listen<unknown>("whatsapp:message", (event) => {
      try {
        const parsedEvent = whatsappEventSchema.parse(event.payload);
        if (parsedEvent.type === "message") {
          logger.info("WhatsApp message received", parsedEvent);

          setLastMessage(parsedEvent);
          setMessages((prev) => {
            const newMessages = [parsedEvent, ...prev];
            return newMessages.slice(0, maxMessages);
          });
        }
      } catch (error) {
        logger.error("Failed to parse WhatsApp message event", error);
      }
    }).then((unlisten) => {
      unlistenFn = unlisten;
    });

    // Cleanup listener on unmount
    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [maxMessages]);

  return { messages, lastMessage };
}
