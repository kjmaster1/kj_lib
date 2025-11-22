import { Logger } from '../common/logger';

type ArgType = 'string' | 'number' | 'playerId' | 'any';

interface CommandArg {
  name: string;
  type: ArgType;
  help?: string;
  optional?: boolean;
}

interface CommandOptions {
  name: string;
  description: string;
  params?: CommandArg[];
  restricted?: string | string[]; // ACE permission (e.g., 'group.admin')
  handler: (source: number, args: any[], raw: string) => void;
}

export class Command {
  static register(options: CommandOptions) {
    const { name, params, restricted, handler } = options;

    RegisterCommand(name, (source: number, args: string[], raw: string) => {
      // 1. Permission Check
      if (restricted) {
        if (IsPlayerAceAllowed(source.toString(), 'command') === false) {
          // In reality, you'd check specific ACEs here.
          // Simple example:
          const required = Array.isArray(restricted) ? restricted : [restricted];
          const hasPerm = required.some(perm => IsPlayerAceAllowed(source.toString(), perm));

          if (!hasPerm) {
            emitNet('chat:addMessage', source, { args: ['^1System', 'Access denied.'] });
            return;
          }
        }
      }

      // 2. Argument Parsing & Validation
      const processedArgs: any[] = [];

      if (params) {
        for (let i = 0; i < params.length; i++) {
          const param = params[i];
          const input = args[i];

          // Missing required argument
          if (input === undefined) {
            if (param.optional) {
              processedArgs.push(undefined);
              continue;
            }
            emitNet('chat:addMessage', source, { args: ['^1System', `Missing argument: ${param.name} (${param.type})`] });
            return;
          }

          // Type Validation
          let val: any = input;

          if (param.type === 'number') {
            val = Number(input);
            if (isNaN(val)) {
              emitNet('chat:addMessage', source, { args: ['^1System', `Invalid number for argument: ${param.name}`] });
              return;
            }
          } else if (param.type === 'playerId') {
            val = Number(input);
            if (isNaN(val) || GetPlayerName(val.toString()) === null) {
              emitNet('chat:addMessage', source, { args: ['^1System', `Invalid player ID for argument: ${param.name}`] });
              return;
            }
          }

          processedArgs.push(val);
        }
      }

      // 3. Execution
      try {
        handler(source, processedArgs, raw);
      } catch (e) {
        Logger.error(`Command error '${name}': ${e}`);
      }

    }, !!restricted); // 'restricted' bool sets standard FiveM command restriction

    // Register Chat Suggestion
    if (params) {
      const suggestions = params.map(p => ({ name: p.name, help: `${p.help || ''} [${p.type}]` }));
      emitNet('chat:addSuggestion', -1, `/${name}`, options.description, suggestions);
    }
  }
}
