// src/server/cron.ts
import {Logger} from '../common';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CronTask {
  id: string;
  expression: string;
  parsed: ParsedExpression;
  handler: () => void;
  stop: () => void;
}

interface ParsedExpression {
  minutes: Set<number> | 'all';
  hours: Set<number> | 'all';
  daysOfMonth: Set<number> | 'all';
  months: Set<number> | 'all';
  daysOfWeek: Set<number> | 'all';
}

// -----------------------------------------------------------------------------
// Implementation
// -----------------------------------------------------------------------------

export class CronManager {
  private static instance: CronManager;
  private jobs: Map<string, CronTask> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private active: boolean = false;

  private constructor() {
    this.startScheduler();
  }

  public static getInstance(): CronManager {
    if (!this.instance) {
      this.instance = new CronManager();
    }
    return this.instance;
  }

  public schedule(expression: string, handler: () => void): CronTask {
    const parsed = this.parse(expression);
    const id = `cron_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const task: CronTask = {
      id,
      expression,
      parsed,
      handler,
      stop: () => this.jobs.delete(id)
    };

    this.jobs.set(id, task);
    Logger.debug(`[Cron] Scheduled job '${expression}' (ID: ${id})`);

    return task;
  }

  /**
   * Stops the scheduler and clears the active timer.
   * Call this on resource stop to prevent memory leaks.
   */
  public stop() {
    this.active = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    Logger.info('[Cron] Scheduler stopped');
  }

  private startScheduler() {
    this.active = true;
    Logger.info('[Cron] Scheduler initialized');

    const alignToMinute = () => {
      if (!this.active) return;

      const now = new Date();
      const seconds = now.getSeconds();
      const msUntilNextMinute = (60 - seconds) * 1000 - now.getMilliseconds();

      // FIX: Assign to 'this.timer' AND use it in 'stop()' to satisfy TS6133
      this.timer = setTimeout(() => {
        this.processJobs();
        // Restart cycle
        alignToMinute();
      }, msUntilNextMinute + 100);
    };

    alignToMinute();
  }

  private processJobs() {
    const now = new Date();
    const current = {
      min: now.getMinutes(),
      hour: now.getHours(),
      dom: now.getDate(),
      month: now.getMonth() + 1,
      dow: now.getDay()
    };

    this.jobs.forEach((task) => {
      try {
        if (this.isTimeMatch(current, task.parsed)) {
          task.handler();
        }
      } catch (e) {
        Logger.error(`[Cron] Job ${task.id} failed:`, e);
      }
    });
  }

  private isTimeMatch(now: {
    min: number,
    hour: number,
    dom: number,
    month: number,
    dow: number
  }, p: ParsedExpression): boolean {
    if (p.minutes !== 'all' && !p.minutes.has(now.min)) return false;
    if (p.hours !== 'all' && !p.hours.has(now.hour)) return false;
    if (p.daysOfMonth !== 'all' && !p.daysOfMonth.has(now.dom)) return false;
    if (p.months !== 'all' && !p.months.has(now.month)) return false;
    if (p.daysOfWeek !== 'all' && !p.daysOfWeek.has(now.dow)) return false;
    return true;
  }

  // ---------------------------------------------------------------------------
  // Parsing Logic
  // ---------------------------------------------------------------------------

  private parse(expression: string): ParsedExpression {
    const parts = expression.trim().split(/\s+/);
    if (parts.length < 5) throw new Error(`Invalid cron expression: "${expression}". Expected 5 fields.`);

    return {
      minutes: this.parseField(parts[0], 0, 59),
      hours: this.parseField(parts[1], 0, 23),
      daysOfMonth: this.parseField(parts[2], 1, 31),
      months: this.parseField(parts[3], 1, 12),
      daysOfWeek: this.parseField(parts[4], 0, 6)
    };
  }

  private parseField(field: string, min: number, max: number): Set<number> | 'all' {
    if (field === '*') return 'all';

    const values = new Set<number>();
    const parts = field.split(',');

    for (const part of parts) {
      if (part.includes('/')) {
        const [range, stepStr] = part.split('/');
        const step = parseInt(stepStr, 10);
        let start = min;
        let end = max;

        if (range !== '*') {
          if (range.includes('-')) {
            [start, end] = range.split('-').map(Number);
          } else {
            start = parseInt(range, 10);
          }
        }

        for (let i = start; i <= end; i += step) {
          if (i >= min && i <= max) values.add(i);
        }
      } else if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          if (i >= min && i <= max) values.add(i);
        }
      } else {
        const val = parseInt(part, 10);
        if (!isNaN(val) && val >= min && val <= max) values.add(val);
      }
    }

    return values;
  }
}

export const Cron = {
  new: (expression: string, job: () => void) => CronManager.getInstance().schedule(expression, job),
  // Expose stop for resource cleanup
  destroy: () => CronManager.getInstance().stop()
};
