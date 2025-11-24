// src/common/logger.ts

/**
 * Standard log levels ordered by severity.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerOptions {
  prefix?: string;
  minLevel?: LogLevel;
  useJson?: boolean; // If true, objects are JSON stringified
}

export class Logger {
  private static readonly COLORS = {
    DEBUG: '^5', // Light Blue
    INFO: '^2',  // Green
    WARN: '^3',  // Yellow
    ERROR: '^1', // Red
    RESET: '^7', // White
  };

  // Default global instance for quick access
  public static readonly default = new Logger({prefix: 'kj_lib'});

  private readonly prefix: string;
  private readonly minLevel: LogLevel;
  private readonly useJson: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || 'Resource';
    this.useJson = options.useJson ?? true;

    // Determine default level: Check Convar if not explicitly set
    if (options.minLevel !== undefined) {
      this.minLevel = options.minLevel;
    } else {
      const isDebug = GetConvar('kj_lib_debug', 'false') === 'true';
      this.minLevel = isDebug ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  /**
   * Factory method to create a named sub-logger.
   * Useful for separating modules: Logger.for('Database'), Logger.for('Auth')
   */
  public for(context: string): Logger {
    return new Logger({
      prefix: `${this.prefix}:${context}`,
      minLevel: this.minLevel,
      useJson: this.useJson
    });
  }

  public debug(...args: any[]): void {
    this.log(LogLevel.DEBUG, ...args);
  }

  public info(...args: any[]): void {
    this.log(LogLevel.INFO, ...args);
  }

  public warn(...args: any[]): void {
    this.log(LogLevel.WARN, ...args);
  }

  public error(...args: any[]): void {
    this.log(LogLevel.ERROR, ...args);
  }

  /**
   * Central log handler
   */
  private log(level: LogLevel, ...args: any[]): void {
    if (level < this.minLevel) return;

    const levelName = LogLevel[level];
    const color = Logger.COLORS[levelName as keyof typeof Logger.COLORS];

    // Format message args
    const formattedArgs = args.map(arg => {
      if (arg instanceof Error) return `${arg.message}\n${arg.stack}`;
      if (typeof arg === 'object' && arg !== null) {
        return this.useJson
          ? JSON.stringify(arg, null, 2) // Pretty print objects
          : arg;
      }
      return arg;
    });

    console.log(`${color}[${this.prefix}] [${levelName}]${Logger.COLORS.RESET}`, ...formattedArgs);
  }

  // ---------------------------------------------------------------------------
  // Static Backwards Compatibility
  // Mirrors the old static API but proxies to the default instance
  // ---------------------------------------------------------------------------

  static debug(...args: any[]) {
    this.default.debug(...args);
  }

  static info(...args: any[]) {
    this.default.info(...args);
  }

  static warn(...args: any[]) {
    this.default.warn(...args);
  }

  static error(...args: any[]) {
    this.default.error(...args);
  }
}
