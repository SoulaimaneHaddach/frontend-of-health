// src/shared/utils/logger.ts
import ENV from '../../config/env';

const isLoggingEnabled = (__DEV__ || !!ENV.ENABLE_LOGGING);

export const logger = {
  debug: (...args: any[]) => {
    if (isLoggingEnabled) console.log(...args);
  },
  info: (...args: any[]) => {
    if (isLoggingEnabled) console.info(...args);
  },
  warn: (...args: any[]) => {
    if (isLoggingEnabled) console.warn(...args);
  },
  error: (...args: any[]) => {
    // Always log errors to console; production should forward to errorLoggingService
    console.error(...args);
  },
};

export default logger;
