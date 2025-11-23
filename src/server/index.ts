// src/server/index.ts
import {ServerRPC} from './rpc';
import {Debug} from './debug';
import {Logger} from "../common";

// -----------------------------------------------------------------------------
// 1. Public API Exports (Barrel Pattern)
// Allows: import { ACL, Command } from '@kj_lib/server';
// -----------------------------------------------------------------------------

export * from './acl';
export * from './command';
export * from './cron';
export * from './rpc';
export * from './zoneCreator';

// -----------------------------------------------------------------------------
// 2. Initialization Logic
// -----------------------------------------------------------------------------

const IS_DEBUG = GetConvarInt('kj_lib:debug', 0) === 1;

async function initialize() {
  try {
    // Initialize Core Systems
    ServerRPC.init();

    // Note: Other systems like Cron and ACL are stateless or auto-initializing,
    // but if they required setup, it would go here.

    Logger.info('Core systems initialized');

    // Conditionally load developer tools
    if (IS_DEBUG) {
      Logger.warn('Debug Mode Enabled: Registering test RPCs...');
      Debug.init();
    }

  } catch (error) {
    Logger.error('CRITICAL: Failed to initialize kj_lib server:', error);
  }
}

// Start the library
void initialize();
