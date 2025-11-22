// src/common/rpc.ts
export interface RPCRequest {
  origin: string; // The event name
  ticket: string; // Unique ID for this specific request
  args: any[];
}

export interface RPCResponse {
  ticket: string;
  data?: any;
  error?: string;
}
