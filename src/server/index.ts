import { ServerRPC } from './rpc';
import { Logger } from '../common/logger';

// Initialize Core Systems
ServerRPC.init();

Logger.info('kj_lib server loaded');

// --- TEST CODE (Remove later) ---
ServerRPC.register('kj_lib:ping', (source) => {
  const name = GetPlayerName(source.toString());
  return `Pong! Hello ${name}, from Server.`;
});
