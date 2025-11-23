// src/client/index.ts
import {Logger} from '../common';
import {Cache} from './cache';
import {ClientRPC} from './rpc';
import {Interface} from './interface';
import {ZoneCreator} from './zoneCreator';
import {Debug} from './debug';

// -----------------------------------------------------------------------------
// 1. Public API Exports (Barrel Pattern)
// -----------------------------------------------------------------------------

export * from './cache';
export * from './dui';
export * from './game';
export * from './interface';
export * from './keybind';
export * from './point';
export * from './polyzone';
export * from './progress';
export * from './raycast';
export * from './rpc';
export * from './scaleform';
export * from './streaming';
export * from './vehicleProperties';
export * from './zone';
export * from './zoneCreator';

// -----------------------------------------------------------------------------
// 2. Initialization Logic
// -----------------------------------------------------------------------------

const IS_DEBUG = GetConvarInt('kj_lib:debug', 0) === 1;

async function initialize() {
  try {
    // Initialize Core Singletons
    // Note: Progress is auto-initialized via its instance export
    Cache.init();
    ClientRPC.init();
    Interface.init();
    ZoneCreator.init();

    Logger.info('Core systems initialized');

    // Conditionally load developer tools
    if (IS_DEBUG) {
      Logger.warn('Debug Mode Enabled: Registering test commands...');
      Debug.init();
    }

  } catch (error) {
    Logger.error('CRITICAL: Failed to initialize kj_lib client:', error);
  }
}

// Start the library
void initialize();
