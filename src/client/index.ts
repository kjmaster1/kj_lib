// src/client/index.ts
import {Logger} from '../common';
import {Cache} from './cache';
import {ClientRPC} from './rpc';
import {Interface} from './interface';
import {ZoneCreator} from './zoneCreator';
import {Debug} from './debug';
import {Progress} from "./progress";

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

const IS_DEBUG = GetConvar('kj_lib_debug', 'false') === 'true';

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
    console.log('Debug: ', IS_DEBUG);
    if (IS_DEBUG) {
      console.log('Is Debug...')
      Logger.warn('Debug Mode Enabled: Registering test commands...');
      Debug.init();
    }

    RegisterCommand('ui-r', () => {
      Logger.debug('Executing UI Hard Reset...');

      // 1. Close all "manageable" UI elements via the Interface API
      Interface.hideContext();
      Interface.hideMenu();
      Interface.hideRadial();
      Interface.hideTextUI();
      Interface.cancelSkillCheck();

      Progress.cancel();

      // 2. Force NUI Focus OFF (This fixes the "stuck mouse" issue)
      SetNuiFocus(false, false);
      SetNuiFocusKeepInput(false);

      // 3. Release any control blockers that might be active
      EnableAllControlActions(0);

      Logger.info('UI state reset and focus returned to game.');
    }, false);

  } catch (error) {
    Logger.error('CRITICAL: Failed to initialize kj_lib client:', error);
  }
}

// Start the library
void initialize();
