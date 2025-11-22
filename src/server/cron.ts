import { Logger } from '../common/logger';

interface CronJob {
  id: number;
  expression: string;
  nextScheduledTime: number;
  job: () => void;
  isActive: boolean;
}

interface ParsedExpression {
  minute: number[] | 'all';
  hour: number[] | 'all';
  dayOfMonth: number[] | 'all';
  month: number[] | 'all';
  dayOfWeek: number[] | 'all';
}

export class Cron {
  private static jobs: CronJob[] = [];
  private static tick: number | null = null;

  /**
   * Initialize the Cron ticker
   */
  static init() {
    if (this.tick) return;

    // Check every minute (60000ms)
    // We use a slight offset to ensure we don't skip a minute due to lag
    this.tick = setInterval(() => {
      this.processJobs();
    }, 2000) as unknown as number;

    Logger.info('Cron system initialized');
  }

  /**
   * Register a new Cron Job
   * @param expression Cron expression (e.g., '5 0 * * *')
   * @param job Callback function
   */
  static new(expression: string, job: () => void): CronJob {
    const parsed = this.parseExpression(expression);

    const task: CronJob = {
      id: this.jobs.length + 1,
      expression,
      nextScheduledTime: this.getNextTime(parsed),
      job,
      isActive: true
    };

    this.jobs.push(task);
    return task;
  }

  private static processJobs() {
    const now = Math.floor(Date.now() / 1000);

    this.jobs.forEach(task => {
      if (!task.isActive) return;

      // If current time is past or equal to scheduled time
      if (now >= task.nextScheduledTime) {
        // Run the job
        try {
          task.job();
        } catch (err) {
          Logger.error(`Cron Job ${task.id} failed: ${err}`);
        }

        // Recalculate next run
        const parsed = this.parseExpression(task.expression);
        task.nextScheduledTime = this.getNextTime(parsed);
      }
    });
  }

  /**
   * Simple Cron Parser (Matches ox_lib functionality)
   * Supports: *, numbers, ranges (1-5), lists (1,3,5), steps (* / 5)
   */
  private static parseExpression(expression: string): ParsedExpression {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 5) throw new Error('Invalid cron expression');

    return {
      minute: this.parsePart(parts[0], 0, 59),
      hour: this.parsePart(parts[1], 0, 23),
      dayOfMonth: this.parsePart(parts[2], 1, 31),
      month: this.parsePart(parts[3], 1, 12),
      dayOfWeek: this.parsePart(parts[4], 0, 6) // 0 = Sunday
    };
  }

  private static parsePart(part: string, min: number, max: number): number[] | 'all' {
    if (part === '*') return 'all';

    const values: Set<number> = new Set();

    if (part.includes(',')) {
      part.split(',').forEach(p => {
        const res = this.parsePart(p, min, max);
        if (Array.isArray(res)) res.forEach(r => values.add(r));
      });
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) values.add(i);
    } else if (part.includes('/')) {
      const [base, step] = part.split('/');
      const start = base === '*' ? min : Number(base);
      for (let i = start; i <= max; i += Number(step)) values.add(i);
    } else {
      values.add(Number(part));
    }

    const result = Array.from(values).filter(v => v >= min && v <= max).sort((a, b) => a - b);
    return result;
  }

  private static getNextTime(parsed: ParsedExpression): number {
    const date = new Date();
    // Add 1 minute to start looking from "next" minute, prevent double execution
    date.setSeconds(0, 0);
    date.setMinutes(date.getMinutes() + 1);

    // Safety break to prevent infinite loops
    let safety = 0;
    while (safety < 100000) {
      if (this.matchTime(date, parsed)) {
        return Math.floor(date.getTime() / 1000);
      }
      date.setMinutes(date.getMinutes() + 1);
      safety++;
    }
    return Math.floor(Date.now() / 1000) + 60; // Fallback
  }

  private static matchTime(date: Date, parsed: ParsedExpression): boolean {
    const min = date.getMinutes();
    const hour = date.getHours();
    const dom = date.getDate();
    const month = date.getMonth() + 1;
    const dow = date.getDay();

    if (Array.isArray(parsed.minute) && !parsed.minute.includes(min)) return false;
    if (Array.isArray(parsed.hour) && !parsed.hour.includes(hour)) return false;
    if (Array.isArray(parsed.dayOfMonth) && !parsed.dayOfMonth.includes(dom)) return false;
    if (Array.isArray(parsed.month) && !parsed.month.includes(month)) return false;
    if (Array.isArray(parsed.dayOfWeek) && !parsed.dayOfWeek.includes(dow)) return false;

    return true;
  }
}
