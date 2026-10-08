import { env } from '../config/env';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const resolverNivel = (valor: string): LogLevel =>
  (valor in LOG_LEVELS ? valor : 'info') as LogLevel;

class Logger {
  private readonly level: number;

  constructor() {
    this.level = LOG_LEVELS[resolverNivel(env.LOG_LEVEL)];
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    if (LOG_LEVELS[level] > this.level) return;

    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
    const salida = data !== undefined ? [`${prefix} ${message}`, data] : [`${prefix} ${message}`];

    if (level === 'error') console.error(...salida);
    else if (level === 'warn') console.warn(...salida);
    else console.log(...salida);
  }

  error(message: string, data?: unknown) { this.log('error', message, data); }
  warn(message: string, data?: unknown) { this.log('warn', message, data); }
  info(message: string, data?: unknown) { this.log('info', message, data); }
  debug(message: string, data?: unknown) { this.log('debug', message, data); }
}

export const logger = new Logger();