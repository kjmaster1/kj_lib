import { Logger } from '../common/logger';
import { RPCRequest, RPCResponse } from '../common/rpc';

export class ClientRPC {
  private static pending = new Map<string, { resolve: Function; reject: Function; timeout: CitizenTimer }>();
  private static registry = new Map<string, (...args: any[]) => Promise<any> | any>();

  static init() {
    // Handle Responses (Client -> Server -> Client)
    onNet('kj_lib:rpc:response', (payload: RPCResponse) => {
      const { ticket, data, error } = payload;
      if (!this.pending.has(ticket)) return;

      const { resolve, reject, timeout } = this.pending.get(ticket)!;
      clearTimeout(timeout);
      this.pending.delete(ticket);

      if (error) reject(new Error(error));
      else resolve(data);
    });

    // Handle Requests (Server -> Client)
    onNet('kj_lib:rpc:request', async (payload: RPCRequest) => {
      const { origin, ticket, args } = payload;
      const handler = this.registry.get(origin);

      if (!handler) {
        Logger.error(`Server requested unknown RPC: ${origin}`);
        return;
      }

      try {
        const result = await handler(...args);
        const response: RPCResponse = { ticket, data: result };
        emitNet('kj_lib:rpc:response', response);
      } catch (err: any) {
        Logger.error(`RPC Error in ${origin}: ${err.message}`);
        emitNet('kj_lib:rpc:response', { ticket, error: err.message });
      }
    });

    Logger.info('Client RPC System Initialized');
  }

  static async call<T = any>(name: string, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const ticket = this.generateTicket();
      const timeout = setTimeout(() => {
        if (this.pending.has(ticket)) {
          this.pending.delete(ticket);
          reject(new Error(`RPC Timeout: ${name}`));
        }
      }, 10000);

      this.pending.set(ticket, { resolve, reject, timeout });
      const payload: RPCRequest = { origin: name, ticket, args };
      emitNet('kj_lib:rpc:request', payload);
    });
  }

  static register<TArgs extends any[], TResp>(
    name: string,
    handler: (...args: TArgs) => Promise<TResp> | TResp
  ) {
    this.registry.set(name, handler);
    Logger.debug(`Registered Client RPC: ${name}`);
  }

  private static generateTicket(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
