// src/common/rpc.ts

/**
 * Standard wrapper for the RPC payload to ensure type safety across the net.
 */
export interface RpcPacket {
  id: string;
  method: string;
  args?: any[];
  data?: any;
  error?: string;
}

export interface RpcOptions {
  timeout?: number;
}

/**
 * Generic definition for a pending request
 */
export interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason: Error) => void;
  timer: any; // NodeJS.Timeout or number
}

/**
 * Shared manager to handle the state of pending RPC calls.
 * Eliminates duplicated response logic in Client and Server.
 */
export class RpcRequestManager<T extends PendingRequest = PendingRequest> {
  private pending = new Map<string, T>();

  public add(id: string, req: T) {
    this.pending.set(id, req);
  }

  /**
   * Process an incoming response packet.
   */
  public handleResponse(payload: RpcPacket) {
    const {id, data, error} = payload;
    const req = this.pending.get(id);

    if (!req) return; // Timed out or unknown ID

    clearTimeout(req.timer);
    this.pending.delete(id);

    if (error) req.reject(new Error(error));
    else req.resolve(data);
  }

  /**
   * Manually cancel a specific request (e.g. on timeout).
   */
  public reject(id: string, reason: string) {
    const req = this.pending.get(id);
    if (req) {
      clearTimeout(req.timer);
      this.pending.delete(id);
      req.reject(new Error(reason));
    }
  }

  public has(id: string): boolean {
    return this.pending.has(id);
  }

  /**
   * Expose entries for advanced filtering (like player drops on server).
   */
  public* entries() {
    for (const entry of this.pending.entries()) {
      yield entry;
    }
  }
}
