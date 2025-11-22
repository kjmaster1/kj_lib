// src/server/rpc.ts
import { Logger } from '../common/logger';
import { RPCRequest, RPCResponse } from '../common/rpc';

export class ServerRPC {
  // Registry of all available callbacks
  private static registry = new Map<string, (source: number, ...args: any[]) => Promise<any> | any>();

  static init() {
    // Listen for incoming requests from Clients
    onNet('kj_lib:rpc:request', async (payload: RPCRequest) => {
      const src = source;
      const { origin, ticket, args } = payload;

      const handler = this.registry.get(origin);

      if (!handler) {
        Logger.error(`Client ${src} requested unknown RPC: ${origin}`);
        return;
      }

      try {
        // Execute the registered function
        const result = await handler(src, ...args);

        // Send response back to specific client
        const response: RPCResponse = { ticket, data: result };
        emitNet('kj_lib:rpc:response', src, response);
      } catch (err: any) {
        Logger.error(`RPC Error in ${origin}: ${err.message}`);
        emitNet('kj_lib:rpc:response', src, { ticket, error: err.message });
      }
    });

    Logger.info('Server RPC System Initialized');
  }

  /**
   * Register a function that clients can call.
   * @param name The name of the event (e.g., 'kj_lib:getItemCount')
   * @param handler The function to run. Can be async.
   */
  static register<TArgs extends any[], TResp>(
    name: string,
    handler: (source: number, ...args: TArgs) => Promise<TResp> | TResp
  ) {
    this.registry.set(name, handler);
    Logger.debug(`Registered RPC: ${name}`);
  }
}
