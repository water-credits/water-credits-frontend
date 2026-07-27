export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export type LogLevelString = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';

export interface LogContext {
  userId?: string;
  walletAddress?: string;
  route?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevelString;
  message: string;
  context?: LogContext;
  error?: Error | unknown;
}
