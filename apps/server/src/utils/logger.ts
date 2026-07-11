import { env } from "../config/env";

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = (env.LOG_LEVEL?.toLowerCase() as LogLevel) || "info";
const currentPriority = LOG_LEVELS[currentLevel] !== undefined ? LOG_LEVELS[currentLevel] : 1;

export const logger = {
  debug: (message: string, ...optionalParams: any[]) => {
    if (currentPriority <= LOG_LEVELS.debug) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...optionalParams);
    }
  },
  log: (message: string, ...optionalParams: any[]) => {
    if (currentPriority <= LOG_LEVELS.info) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...optionalParams);
    }
  },
  warn: (message: string, ...optionalParams: any[]) => {
    if (currentPriority <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...optionalParams);
    }
  },
  error: (message: string, ...optionalParams: any[]) => {
    if (currentPriority <= LOG_LEVELS.error) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...optionalParams);
    }
  },
};
