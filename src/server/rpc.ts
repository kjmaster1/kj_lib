import { Logger } from '../common/logger';
import { RPCRequest, RPCResponse } from '../common/rpc';

export class ServerRPC {
  private static registry = new Map<string, (source: number, ...args: any[]) => Promise<any> | any>();
  private static pending = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();

  static init() {
    // Handle Requests (Client -> Server)
    onNet('kj_lib:rpc:request', async (payload: RPCRequest) => {
      const src = source;
      const { origin, ticket, args } = payload;
      const handler = this.registry.get(origin);

      if (!handler) {
        Logger.error(`Client ${src} requested unknown RPC: ${origin}`);
        return;
      }

      try {
        const result = await handler(src, ...args);
        const response: RPCResponse = { ticket, data: result };
        emitNet('kj_lib:rpc:response', src, response);
      } catch (err: any) {
        Logger.error(`RPC Error in ${origin}: ${err.message}`);
        emitNet('kj_lib:rpc:response', src, { ticket, error: err.message });
      }
    });

    // Handle Responses (Server -> Client -> Server)
    onNet('kj_lib:rpc:response', (payload: RPCResponse) => {
      const { ticket, data, error } = payload;
      if (!this.pending.has(ticket)) return;

      const { resolve, reject, timeout } = this.pending.get(ticket)!;
      clearTimeout(timeout);
      this.pending.delete(ticket);

      if (error) reject(new Error(error));
      else resolve(data);
    });

    Logger.info('Server RPC System Initialized');
  }

  static register<TArgs extends any[], TResp>(
    name: string,
    handler: (source: number, ...args: TArgs) => Promise<TResp> | TResp
  ) {
    this.registry.set(name, handler as (source: number, ...args: any[]) => Promise<any> | any);
    Logger.debug(`Registered Server RPC: ${name}`);
  }

  /**
   * Call a registered function on a specific client and await the result.
   */
  static async call<T = any>(source: number, name: string, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const ticket = Math.random().toString(36).substring(2) + Date.now().toString(36);

      const timeout = setTimeout(() => {
        if (this.pending.has(ticket)) {
          this.pending.delete(ticket);
          reject(new Error(`RPC Timeout: ${name} for client ${source}`));
        }
      }, 10000);

      this.pending.set(ticket, { resolve, reject, timeout });

      const payload: RPCRequest = { origin: name, ticket, args };
      emitNet('kj_lib:rpc:request', source, payload);
    });
  }
}
