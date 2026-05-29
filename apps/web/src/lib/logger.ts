/**
 * Professional Logging Utility
 *
 * Provides structured logging with levels, timestamps, and context.
 * Designed to replace raw console.log calls for better debugging and observability.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const icon = this.getLevelIcon(level);
    return `${icon} [${timestamp}] [${this.context}] ${message}`;
  }

  private getLevelIcon(level: LogLevel): string {
    switch (level) {
      case "debug":
        return "🐛";
      case "info":
        return "ℹ️";
      case "warn":
        return "⚠️";
      case "error":
        return "🚨";
    }
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const formattedMessage = this.formatMessage(level, message);
    const style = this.getConsoleStyle(level);

    if (data !== undefined) {
      console[level](`%c${formattedMessage}`, style, data);
    } else {
      console[level](`%c${formattedMessage}`, style);
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case "debug":
        return "color: #8b9bb4; font-weight: bold;";
      case "info":
        return "color: #3b82f6; font-weight: bold;";
      case "warn":
        return "color: #eab308; font-weight: bold;";
      case "error":
        return "color: #ef4444; font-weight: bold;";
    }
  }

  debug(message: string, data?: unknown) {
    this.log("debug", message, data);
  }

  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }

  error(message: string, error?: unknown) {
    this.log("error", message, error);
  }
}

/**
 * Create a named logger instance
 * @param context The module or component name
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Default logger instance for general use
 * For module-specific logging, use createLogger() instead
 */
export const logger = createLogger("App");
