// src/client/rpc.ts
import {Logger, RpcOptions, RpcPacket, RpcRequestManager} from '../common';

export class ClientRPC {
  private static requests = new RpcRequestManager();
  private static handlers = new Map<string, (...args: any[]) => any>();
  private static initialized = false;

  public static init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Incoming Requests (Server -> Client)
    onNet('kj_lib:rpc:request', async (payload: RpcPacket) => {
      const {id, method, args} = payload;
      const handler = this.handlers.get(method);

      if (!handler) {
        Logger.error(`[RPC] Server requested unknown method: ${method}`);
        emitNet('kj_lib:rpc:response', {id, error: `Method '${method}' not found`});
        return;
      }

      try {
        const result = await handler(...(args || []));
        emitNet('kj_lib:rpc:response', {id, data: result});
      } catch (e: any) {
        Logger.error(`[RPC] Error in method '${method}': ${e.message}`);
        emitNet('kj_lib:rpc:response', {id, error: e.message || 'Internal execution error'});
      }
    });

    // 2. Incoming Responses (Server -> Client)
    // Delegated to the shared manager
    onNet('kj_lib:rpc:response', (payload: RpcPacket) => {
      this.requests.handleResponse(payload);
    });

    Logger.info('Client RPC initialized');
  }

  public static register(method: string, handler: (...args: any[]) => any) {
    this.handlers.set(method, handler);
  }

  public static async call<T = any>(method: string, args: any | any[] = [], options: RpcOptions = {}): Promise<T> {
    const id = this.generateId();
    const timeoutMs = options.timeout ?? 10000;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.requests.reject(id, `RPC Timeout: ${method} after ${timeoutMs}ms`);
      }, timeoutMs);

      this.requests.add(id, {resolve, reject, timer});

      const payload: RpcPacket = {
        id,
        method,
        args: Array.isArray(args) ? args : [args]
      };

      emitNet('kj_lib:rpc:request', payload);
    });
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
