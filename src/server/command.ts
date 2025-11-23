// src/server/command.ts
import {Logger} from '../common';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ArgType = 'string' | 'number' | 'player' | 'any';

export interface CommandArg {
  name: string;
  type: ArgType;
  help?: string;
  optional?: boolean;
}

export interface CommandOptions {
  name: string;
  description: string;
  params?: CommandArg[];
  /**
   * Required ACE permission(s).
   * If provided, the user must have at least ONE of these permissions.
   */
  restricted?: string | string[];
  handler: (source: number, args: any[], raw: string) => void;
}

// -----------------------------------------------------------------------------
// Implementation
// -----------------------------------------------------------------------------

export class Command {
  /**
   * register a new command.
   */
  static register(options: CommandOptions) {
    const {name, params, restricted, handler} = options;

    // We pass `false` to RegisterCommand's restricted arg to handle permissions manually.
    // This allows custom error messages and custom ACE nodes logic.
    RegisterCommand(name, (source: number, args: string[], raw: string) => {
      const isConsole = source === 0;

      // 1. Permission Check
      if (restricted && !isConsole) {
        const required = Array.isArray(restricted) ? restricted : [restricted];
        // Console (source 0) always has permission, so we only check actual players
        const hasPerm = required.some(perm => IsPlayerAceAllowed(source.toString(), perm));

        if (!hasPerm) {
          this.reply(source, '^1System', 'Access denied.');
          return;
        }
      }

      // 2. Argument Validation
      const processedArgs: any[] = [];

      if (params) {
        for (let i = 0; i < params.length; i++) {
          const param = params[i];
          const input = args[i];

          // Check missing required arg
          if (input === undefined || input === '') {
            if (param.optional) {
              processedArgs.push(undefined);
              continue;
            }
            this.reply(source, '^1System', `Missing argument: ^3${param.name}^1 (${param.type})`);
            return;
          }

          // Parse & Validate
          const parsed = this.parseArg(input, param.type);

          if (parsed === null) {
            this.reply(source, '^1System', `Invalid ^3${param.name}^1. Expected ^5${param.type}^1.`);
            return;
          }

          processedArgs.push(parsed);
        }
      }

      // 3. Execution
      try {
        handler(source, processedArgs, raw);
      } catch (e) {
        Logger.error(`Command '${name}' failed:`, e);
        this.reply(source, '^1System', 'An internal error occurred while executing the command.');
      }

    }, false);

    // 4. Suggestions (Client-side)
    if (params) {
      const suggestions = params.map(p => ({
        name: p.name,
        help: `${p.help || ''} [${p.type}]${p.optional ? ' (Opt)' : ''}`
      }));

      // Note: chat:addSuggestion is global.
      // Ideally, this should be restricted if the command is restricted,
      // but FiveM doesn't support per-client suggestions easily without custom chat resources.
      emitNet('chat:addSuggestion', -1, `/${name}`, options.description, suggestions);
    }

    Logger.debug(`[Command] Registered /${name}`);
  }

  /**
   * Safe reply helper that handles Console vs Player.
   */
  private static reply(source: number, title: string, message: string) {
    if (source === 0) {
      // Strip color codes for console readability
      const cleanMsg = message.replace(/\^[0-9]/g, '');
      console.log(`[${title.replace(/\^[0-9]/g, '')}] ${cleanMsg}`);
    } else {
      emitNet('chat:addMessage', source, {args: [title, message]});
    }
  }

  /**
   * Validates and converts raw string input into typed values.
   */
  private static parseArg(input: string, type: ArgType): any {
    switch (type) {
      case 'number': {
        const val = Number(input);
        return isNaN(val) ? null : val;
      }
      case 'player': {
        const val = Number(input);
        // Basic check: Is it a number and is a player connected?
        if (isNaN(val)) return null;
        if (val === 0) return null; // Cannot target console
        if (GetPlayerName(input) === null) return null;
        return val;
      }
      case 'string':
        return input;
      case 'any':
        return input;
      default:
        return input;
    }
  }
}
