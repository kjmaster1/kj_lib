export class Logger {
  private static readonly PREFIX = '[kj_lib]';

  static info(...args: any[]): void {
    console.log(`^4${this.PREFIX} [INFO]^7`, ...args);
  }

  static warn(...args: any[]): void {
    console.log(`^3${this.PREFIX} [WARN]^7`, ...args);
  }

  static error(...args: any[]): void {
    console.log(`^1${this.PREFIX} [ERROR]^7`, ...args);
  }

  static debug(...args: any[]): void {
    if (GetConvarInt('kj_lib:debug', 0) === 1) {
      console.log(`^5${this.PREFIX} [DEBUG]^7`, ...args);
    }
  }
}
