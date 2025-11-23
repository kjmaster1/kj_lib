// src/server/rpc.ts
import {Logger, PendingRequest, RpcOptions, RpcPacket, RpcRequestManager} from '../common';

interface ServerPendingRequest extends PendingRequest {
  targetSource: number;
}

export class ServerRPC {
  // We explicitly type the manager to handle ServerPendingRequest
  private static requests = new RpcRequestManager<ServerPendingRequest>();
  private static handlers = new Map<string, (source: number, ...args: any[]) => any>();
  private static initialized = false;

  public static init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Incoming Requests (Client -> Server)
    onNet('kj_lib:rpc:request', async (payload: RpcPacket) => {
      const src = source;
      const {id, method, args} = payload;
      const handler = this.handlers.get(method);

      if (!handler) {
        Logger.error(`[RPC] Client ${src} requested unknown method: ${method}`);
        emitNet('kj_lib:rpc:response', src, {id, error: `Method '${method}' not found`});
        return;
      }

      try {
        const result = await handler(src, ...(args || []));
        emitNet('kj_lib:rpc:response', src, {id, data: result});
      } catch (e: any) {
        Logger.error(`[RPC] Error in method '${method}' for client ${src}: ${e.message}`);
        emitNet('kj_lib:rpc:response', src, {id, error: e.message || 'Internal error'});
      }
    });

    // 2. Incoming Responses (Client -> Server)
    // Delegated to the shared manager
    onNet('kj_lib:rpc:response', (payload: RpcPacket) => {
      this.requests.handleResponse(payload);
    });

    // 3. Cleanup on Player Drop
    on('playerDropped', (reason: string) => {
      const src = source;
      // Iterate using the manager's exposed entries to find requests for this player
      for (const [id, req] of this.requests.entries()) {
        if (req.targetSource === src) {
          this.requests.reject(id, `Target player ${src} dropped: ${reason}`);
        }
      }
    });

    Logger.info('Server RPC initialized');
  }

  public static register(method: string, handler: (source: number, ...args: any[]) => any) {
    this.handlers.set(method, handler);
  }

  public static async call<T = any>(target: number, method: string, args: any | any[] = [], options: RpcOptions = {}): Promise<T> {
    const id = this.generateId();
    const timeoutMs = options.timeout ?? 10000;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.requests.reject(id, `RPC Timeout: ${method} for client ${target}`);
      }, timeoutMs);

      // We store the targetSource so we can cancel if they drop
      this.requests.add(id, {resolve, reject, timer, targetSource: target});

      const payload: RpcPacket = {
        id,
        method,
        args: Array.isArray(args) ? args : [args]
      };

      emitNet('kj_lib:rpc:request', target, payload);
    });
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}
