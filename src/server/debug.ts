// src/server/debug.ts
import {ServerRPC} from './rpc';
import {Logger} from '../common';

export class Debug {
  static init() {
    // --- TEST: RPC Ping ---
    ServerRPC.register('kj_lib:ping', (source) => {
      const name = GetPlayerName(source.toString());
      Logger.debug(`Received ping from ${name} (${source})`);
      return `Pong! Hello ${name}, from Server.`;
    });
  }
}
