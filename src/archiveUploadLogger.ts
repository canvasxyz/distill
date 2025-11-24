const LOG_PREFIX = "[archive-upload]";

export const archiveLog = (...args: unknown[]) => console.info(LOG_PREFIX, ...args);
export const archiveWarn = (...args: unknown[]) => console.warn(LOG_PREFIX, ...args);
export const archiveError = (...args: unknown[]) => console.error(LOG_PREFIX, ...args);
