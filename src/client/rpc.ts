// src/client/rpc.ts
import { Logger } from '../common/logger';
import { RPCRequest, RPCResponse } from '../common/rpc';

export class ClientRPC {
  // Stores pending requests: Ticket ID -> Resolve/Reject functions
  private static pending = new Map<string, { resolve: Function; reject: Function; timeout: CitizenTimer }>();

  static init() {
    // Listen for responses from Server
    onNet('kj_lib:rpc:response', (payload: RPCResponse) => {
      const { ticket, data, error } = payload;

      if (!this.pending.has(ticket)) return;

      const { resolve, reject, timeout } = this.pending.get(ticket)!;
      clearTimeout(timeout);
      this.pending.delete(ticket);

      if (error) reject(new Error(error));
      else resolve(data);
    });

    Logger.info('Client RPC System Initialized');
  }

  /**
   * Call a function on the server and await the result.
   * @param name The name of the registered server RPC
   * @param args Arguments to pass
   */
  static async call<T = any>(name: string, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const ticket = this.generateTicket();

      // Set a timeout so the promise doesn't hang forever if server crashes/lags
      const timeout = setTimeout(() => {
        if (this.pending.has(ticket)) {
          this.pending.delete(ticket);
          reject(new Error(`RPC Timeout: ${name}`));
        }
      }, 10000); // 10 second timeout

      this.pending.set(ticket, { resolve, reject, timeout });

      const payload: RPCRequest = { origin: name, ticket, args };
      emitNet('kj_lib:rpc:request', payload);
    });
  }

  private static generateTicket(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
