/**
 * PostgreSQL NOTIFY/LISTEN Service
 * Shared event emitter for real-time database notifications
 *
 * Architecture:
 * - Singleton pattern for shared connection across all SSE streams
 * - EventEmitter-based API for subscribing to NOTIFY channels
 * - Auto-reconnection on connection loss
 * - Graceful shutdown handling
 *
 * Usage:
 * ```typescript
 * import { pgNotifier } from '@workspace/db/pg-notifier';
 *
 * // Subscribe to channel
 * pgNotifier.on('whatsapp_status', (data) => {
 *   console.log('Status update:', data);
 * });
 *
 * // Unsubscribe
 * pgNotifier.off('whatsapp_status', handler);
 * ```
 */
import { Client } from "pg";
import { EventEmitter } from "events";

export type NotifyChannel =
  | "whatsapp_status"
  | "whatsapp_qr"
  | "queue_stats"
  | "new_whatsapp_message";

export interface NotifyPayload {
  [key: string]: any;
}

class PgNotifier extends EventEmitter {
  private client: Client | null = null;
  private isConnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Store bound handler references for proper cleanup
  private _onNotification: ((msg: any) => void) | null = null;
  private _onError: ((err: Error) => void) | null = null;
  private _onEnd: (() => void) | null = null;

  async connect(): Promise<void> {
    if (this.client || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    try {
      this.client = new Client({
        connectionString: databaseUrl,
      });

      await this.client.connect();
      console.log("[PG Notifier] Connected to PostgreSQL");

      // Listen to all channels
      await this.client.query("LISTEN whatsapp_status");
      await this.client.query("LISTEN whatsapp_qr");
      await this.client.query("LISTEN queue_stats");
      await this.client.query("LISTEN new_whatsapp_message");

      console.log("[PG Notifier] Listening on all channels");

      // Handle notifications - store bound reference
      this._onNotification = (msg) => {
        try {
          const payload = msg.payload ? JSON.parse(msg.payload) : {};
          this.emit(msg.channel as NotifyChannel, payload);
        } catch (error) {
          console.error("[PG Notifier] Failed to parse notification:", error);
        }
      };
      this.client.on("notification", this._onNotification);

      // Handle connection errors - store bound reference
      this._onError = (err) => {
        console.error("[PG Notifier] Connection error:", err);
        this.handleDisconnect();
      };
      this.client.on("error", this._onError);

      // Handle connection end - store bound reference
      this._onEnd = () => {
        console.log("[PG Notifier] Connection ended");
        this.handleDisconnect();
      };
      this.client.on("end", this._onEnd);

      // Clear any pending reconnect timeout on successful connection
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      this.isConnecting = false;
    } catch (error) {
      console.error("[PG Notifier] Failed to connect:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleDisconnect(): void {
    if (this.client) {
      // Remove only our specific listeners, not all listeners
      if (this._onNotification) {
        this.client.off("notification", this._onNotification);
        this._onNotification = null;
      }
      if (this._onError) {
        this.client.off("error", this._onError);
        this._onError = null;
      }
      if (this._onEnd) {
        this.client.off("end", this._onEnd);
        this._onEnd = null;
      }

      this.client = null;
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    console.log("[PG Notifier] Reconnecting in 5 seconds...");
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect().catch(console.error);
    }, 5000);
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      try {
        await this.client.query("UNLISTEN *");
        await this.client.end();
        console.log("[PG Notifier] Disconnected");
      } catch (error) {
        console.error("[PG Notifier] Error during disconnect:", error);
      }
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

// Singleton instance
export const pgNotifier = new PgNotifier();

// Lazy initializer - call this during application startup
export async function initPgNotifier(): Promise<void> {
  await pgNotifier.connect();
}

// Graceful shutdown with reentrancy guard
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    console.log(
      `[PG Notifier] Shutdown already in progress, ignoring ${signal}`,
    );
    return;
  }

  console.log(`[PG Notifier] Received ${signal}, shutting down gracefully...`);
  isShuttingDown = true;

  try {
    await pgNotifier.disconnect();
    console.log("[PG Notifier] Disconnected successfully");
    process.exit(0);
  } catch (error) {
    console.error("[PG Notifier] Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
