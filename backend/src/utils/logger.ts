export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgGray: '\x1b[100m',
  // Brand colors (using closest ANSI equivalents)
  brandGreen: '\x1b[32m',  // #006A4E -> green
  brandYellow: '\x1b[33m', // #FFD403 -> yellow
  brandDarkGray: '\x1b[90m', // #1E1E1E -> gray
  brandLightGray: '\x1b[37m' // #F6F6F6 -> white
};

class Logger {
  private logLevel: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return `${colors.bgRed}${colors.white}${colors.bright}`;
      case LogLevel.WARN:
        return `${colors.bgYellow}${colors.white}${colors.bright}`;
      case LogLevel.INFO:
        return `${colors.bgBlue}${colors.white}${colors.bright}`;
      case LogLevel.DEBUG:
        return `${colors.bgGray}${colors.white}${colors.bright}`;
      default:
        return colors.white;
    }
  }

  private formatTimestamp(): string {
    const now = new Date();
    const timestamp = now.toISOString();
    const timeOnly = now.toTimeString().split(' ')[0];
    return `${colors.dim}${colors.gray}[${timestamp}]${colors.reset}`;
  }

  private formatMeta(meta: any): string {
    if (!meta) return '';
    
    try {
      const jsonStr = JSON.stringify(meta, null, 2);
      return `\n${colors.cyan}${colors.dim}└─ Meta:${colors.reset}\n${colors.gray}${jsonStr}${colors.reset}`;
    } catch (error) {
      return `\n${colors.cyan}${colors.dim}└─ Meta:${colors.reset} ${colors.red}[Circular or invalid JSON]${colors.reset}`;
    }
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = this.formatTimestamp();
    const levelColor = this.getLevelColor(level);
    const levelStr = `${levelColor} ${level} ${colors.reset}`;
    const metaStr = this.formatMeta(meta);
    
    return `${timestamp} ${levelStr} ${colors.white}${message}${colors.reset}${metaStr}`;
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Utility methods for common patterns
  success(message: string, meta?: any): void {
    this.info(`${colors.green}✓${colors.reset} ${message}`, meta);
  }

  failure(message: string, meta?: any): void {
    this.error(`${colors.red}✗${colors.reset} ${message}`, meta);
  }

  warning(message: string, meta?: any): void {
    this.warn(`${colors.yellow}⚠${colors.reset} ${message}`, meta);
  }

  // Method for logging API requests/responses
  apiRequest(method: string, url: string, meta?: any): void {
    this.info(`${colors.cyan}→${colors.reset} ${method} ${url}`, meta);
  }

  apiResponse(method: string, url: string, statusCode: number, meta?: any): void {
    const statusColor = statusCode >= 400 ? colors.red : statusCode >= 300 ? colors.yellow : colors.green;
    this.info(`${statusColor}←${colors.reset} ${method} ${url} ${statusColor}${statusCode}${colors.reset}`, meta);
  }

  // Method for logging database operations
  dbOperation(operation: string, table: string, meta?: any): void {
    this.debug(`${colors.magenta}🗄${colors.reset} ${operation} on ${colors.cyan}${table}${colors.reset}`, meta);
  }

  // Method for logging Hedera operations
  hederaOperation(operation: string, meta?: any): void {
    this.info(`${colors.blue}⚡${colors.reset} Hedera: ${operation}`, meta);
  }

  // Method for logging with a custom emoji/icon
  custom(icon: string, message: string, level: LogLevel = LogLevel.INFO, meta?: any): void {
    const method = level.toLowerCase() as keyof Logger;
    if (typeof this[method] === 'function') {
      (this[method] as Function)(`${icon} ${message}`, meta);
    }
  }
}

// Export singleton instance
export const logger = new Logger(
  LogLevel.INFO
  // process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);
