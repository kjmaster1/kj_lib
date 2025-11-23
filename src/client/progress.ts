// src/client/progress.ts
import {Streaming} from './streaming';
import {Cache} from './cache';
import {Logger} from '../common';

// Types
export interface ProgressProp {
  model: string | number;
  bone?: number;
  coords: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

export interface ProgressAnim {
  dict?: string;
  clip: string;
  flag?: number; // default 49
  blendIn?: number;
  blendOut?: number;
  playbackRate?: number;
  lockX?: boolean;
  lockY?: boolean;
  lockZ?: boolean;
  scenario?: string;
  playEnter?: boolean;
}

export interface ProgressOptions {
  label?: string;
  duration: number;
  position?: 'middle' | 'bottom';
  useWhileDead?: boolean;
  canCancel?: boolean;
  anim?: ProgressAnim;
  prop?: ProgressProp | ProgressProp[];
  disable?: {
    move?: boolean;
    car?: boolean;
    combat?: boolean;
    mouse?: boolean;
  };
}

export class ProgressService {
  private active: boolean = false;
  private promiseResolver: ((result: boolean) => void) | null = null;

  private tickHandle: number | null = null;
  private createdProps: number[] = [];

  constructor() {
    this.registerNuiCallbacks();
  }

  private registerNuiCallbacks() {
    RegisterNuiCallbackType('progressCancel');
    on('__cfx_nui:progressCancel', (_: any, cb: Function) => {
      cb(1);
      this.cancel();
    });

    RegisterNuiCallbackType('progressComplete');
    on('__cfx_nui:progressComplete', (_: any, cb: Function) => {
      cb(1);
      this.finish(true);
    });
  }

  /**
   * Start a progress action.
   * Returns a promise that resolves to `true` if completed, `false` if cancelled.
   */
  public async start(options: ProgressOptions): Promise<boolean> {
    if (this.active) {
      Logger.warn('Attempted to start progress while another is active');
      return false;
    }

    this.active = true;
    const duration = options.duration || 3000;

    // 1. Setup Animation
    if (options.anim) {
      await this.playAnimation(options.anim, duration);
    }

    // 2. Setup Props
    if (options.prop) {
      await this.createProps(options.prop);
    }

    // 3. Start NUI
    SendNuiMessage(JSON.stringify({
      action: 'progress',
      data: {
        label: options.label,
        duration: duration,
        position: options.position || 'bottom'
      }
    }));

    // 4. Start Control Loop
    this.startTick(options);

    // 5. Return Promise
    return new Promise<boolean>((resolve) => {
      this.promiseResolver = resolve;
    });
  }

  /**
   * Cancel the current progress immediately.
   */
  public cancel() {
    if (!this.active) return;

    // Notify UI to stop
    SendNuiMessage(JSON.stringify({action: 'progressCancel'}));
    this.finish(false);
  }

  /**
   * Internal cleanup and resolution
   */
  private finish(success: boolean) {
    if (!this.active) return;

    this.active = false;
    this.cleanup();

    if (this.promiseResolver) {
      this.promiseResolver(success);
      this.promiseResolver = null;
    }
  }

  private cleanup() {
    // Stop Tick
    if (this.tickHandle !== null) {
      clearTick(this.tickHandle);
      this.tickHandle = null;
    }

    // Remove Props
    for (const prop of this.createdProps) {
      if (DoesEntityExist(prop)) DeleteEntity(prop);
    }
    this.createdProps = [];

    // Clear Animation
    const ped = Cache.get().ped; // Use cached ped for cleanup
    ClearPedTasks(ped);
  }

  private startTick(options: ProgressOptions) {
    this.tickHandle = setTick(() => {
      const ped = PlayerPedId(); // Get fresh ped id for controls

      // 1. Check Vital State
      if (!options.useWhileDead && IsPedDeadOrDying(ped, true)) {
        this.cancel();
        return;
      }

      // 2. Check Animation Integrity
      // If an animation dictionary was specified, ensure the ped is still playing it.
      // This prevents players from ragdolling/falling/driving while "progressing".
      if (options.anim?.dict && !IsEntityPlayingAnim(ped, options.anim.dict, options.anim.clip, 3)) {
        this.cancel();
        return;
      }

      // 3. Disable Controls
      if (options.disable) {
        this.disableControls(options.disable);
      }
    });
  }

  private disableControls(disable: NonNullable<ProgressOptions['disable']>) {
    // Disable firing globally during progress
    DisablePlayerFiring(Cache.get().playerId, true);

    if (disable.mouse) {
      DisableControlAction(0, 1, true); // Look LR
      DisableControlAction(0, 2, true); // Look UD
      DisableControlAction(0, 106, true); // Vehicle Mouse Control
    }

    if (disable.move) {
      DisableControlAction(0, 30, true); // Move LR
      DisableControlAction(0, 31, true); // Move UD
      DisableControlAction(0, 36, true); // Duck
      DisableControlAction(0, 21, true); // Sprint
      DisableControlAction(0, 44, true); // Cover
    }

    if (disable.car) {
      DisableControlAction(0, 63, true); // Veh Move LR
      DisableControlAction(0, 64, true); // Veh Move UD
      DisableControlAction(0, 71, true); // Accelerate
      DisableControlAction(0, 72, true); // Brake
      DisableControlAction(0, 75, true); // Exit Vehicle
    }

    if (disable.combat) {
      DisableControlAction(0, 24, true); // Attack
      DisableControlAction(0, 25, true); // Aim
      DisableControlAction(0, 47, true); // Weapon
      DisableControlAction(0, 58, true); // Weapon
      DisableControlAction(0, 140, true); // Melee Light
      DisableControlAction(0, 141, true); // Melee Heavy
      DisableControlAction(0, 142, true); // Melee Alt
      DisableControlAction(0, 143, true); // Melee Block
      DisableControlAction(0, 257, true); // Attack 2
      DisableControlAction(0, 263, true); // Melee 1
      DisableControlAction(0, 264, true); // Melee 2
    }
  }

  private async playAnimation(anim: ProgressAnim, duration: number) {
    const ped = PlayerPedId();

    if (anim.dict) {
      await Streaming.loadAnim(anim.dict);
      if (!this.active) return; // Check if cancelled during load

      TaskPlayAnim(
        ped,
        anim.dict,
        anim.clip,
        anim.blendIn || 3.0,
        anim.blendOut || 1.0,
        duration,
        anim.flag || 49,
        anim.playbackRate || 0,
        !!anim.lockX,
        !!anim.lockY,
        !!anim.lockZ
      );
    } else if (anim.scenario) {
      TaskStartScenarioInPlace(ped, anim.scenario, 0, anim.playEnter !== false);
    }
  }

  private async createProps(props: ProgressProp | ProgressProp[]) {
    const propList = Array.isArray(props) ? props : [props];
    const ped = PlayerPedId();

    for (const p of propList) {
      if (!this.active) return; // Abort if cancelled during load

      await Streaming.loadModel(p.model);

      // Double check active after async await
      if (!this.active) return;

      const hash = typeof p.model === 'string' ? GetHashKey(p.model) : p.model;
      const coords = GetEntityCoords(ped, true);

      const obj = CreateObject(hash, coords[0], coords[1], coords[2], true, true, true);
      this.createdProps.push(obj);

      const boneIndex = GetPedBoneIndex(ped, p.bone || 60309); // Default to Hand

      AttachEntityToEntity(
        obj,
        ped,
        boneIndex,
        p.coords.x, p.coords.y, p.coords.z,
        p.rotation.x, p.rotation.y, p.rotation.z,
        true, true, false, true, 1, true
      );

      SetModelAsNoLongerNeeded(hash);
    }
  }
}

// Export as singleton
export const Progress = new ProgressService();
