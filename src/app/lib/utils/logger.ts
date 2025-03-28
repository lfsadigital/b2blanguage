/**
 * Conditional logger that only outputs logs in development or when debug mode is enabled
 */
export const logger = {
  log: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_LOGS === 'true') {
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    // Always log errors
    console.error(message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_LOGS === 'true') {
      console.warn(message, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_LOGS === 'true') {
      console.info(message, ...args);
    }
  }
}; 