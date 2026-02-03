/**
 * Conditional development logging utilities
 * Logs only execute in development mode
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log general information (only in dev)
   */
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (only in dev)
   */
  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always logged, even in production)
   * Use this for critical errors that should be tracked
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  /**
   * Log debug information (only in dev)
   */
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug(...args);
    }
  },
};
