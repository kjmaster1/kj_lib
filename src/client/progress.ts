// src/client/progress.ts
import {Logger, wait} from '../common';

// -----------------------------------------------------------------------------
// Constants & Configuration
// -----------------------------------------------------------------------------

// Grouping controls by functionality for cleaner disable logic
const CONTROL_GROUPS = {
  mouse: [1, 2, 106], // Look LR, Look UD, Vehicle Mouse
  move: [30, 31, 36, 21, 44], // Move LR, Move UD, Duck, Sprint, Cover
  car: [63, 64, 71, 72, 75], // Veh Left/Right, Veh Fwd/Back, Accel, Brake, Exit
  combat: [
    24, 25, 47, 58, 140, 141, 142, 143, 257, 263, 264 // Attack, Aim, Weapon Wheel, Melee, etc.
  ],
} as const;

type ControlGroupKey = keyof typeof CONTROL_GROUPS;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

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
    [K in ControlGroupKey]?: boolean;
  } & {
    combat?: boolean; // Ensure combat is explicitly typed if needed
  };
}

// -----------------------------------------------------------------------------
// Service Implementation
// -----------------------------------------------------------------------------

export class ProgressService {
  private active = false;
  private promiseResolver: ((result: boolean) => void) | null = null;
  private tickHandle: number | null = null;
  private createdProps: number[] = [];

  constructor() {
    RegisterNuiCallbackType('progressCancel');
    on('__cfx_nui:progressCancel', (_: any, cb: Function) => {
      cb(1);
      this.cancel();
    });

    RegisterNuiCallbackType('progressComplete');
    on('__cfx_nui:progressComplete', (_: any, cb: Function) => {
      cb(1);
      this.resolve(true);
    });
  }

  /**
   * Start a progress bar action.
   */
  public async start(options: ProgressOptions): Promise<boolean> {
    if (this.active) {
      this.cancel(); // Auto-cancel previous instead of rejecting? Or return false.
      Logger.warn('Progress: Overwriting active progress bar.');
    }

    this.active = true;
    const duration = options.duration || 3000;

    try {
      // 1. Setup Animation & Props (Parallel Loading)
      // We use a safe loader that throws if cancelled during load
      await this.setupEnvironment(options);

      // 2. Notify UI
      SendNuiMessage(JSON.stringify({
        action: 'progress',
        data: {
          label: options.label,
          duration: duration,
          position: options.position || 'bottom',
        },
      }));

      // 3. Start Game Loop
      this.startTick(options);

      // 4. Await Result
      return new Promise<boolean>((resolve) => {
        this.promiseResolver = resolve;
      });

    } catch (e) {
      // If loading failed or was cancelled during setup
      this.cleanup();
      return false;
    }
  }

  public cancel() {
    if (!this.active) return;
    SendNuiMessage(JSON.stringify({ action: 'progressCancel' }));
    this.resolve(false);
  }

  /**
   * Resolves the active promise and cleans up.
   */
  private resolve(success: boolean) {
    if (!this.active) return;

    this.active = false;
    this.cleanup();

    if (this.promiseResolver) {
      this.promiseResolver(success);
      this.promiseResolver = null;
    }
  }

  private cleanup() {
    if (this.tickHandle !== null) {
      clearTick(this.tickHandle);
      this.tickHandle = null;
    }

    // Clean props
    this.createdProps.forEach((entity) => {
      if (DoesEntityExist(entity)) DeleteEntity(entity);
    });
    this.createdProps = [];

    // Clean animation
    const ped = PlayerPedId();
    // Only clear tasks if we aren't in a vehicle (prevents kicking driver out)
    if (!IsPedInAnyVehicle(ped, false)) {
      ClearPedTasks(ped);
    } else {
      // If in vehicle, just stop the specific animation task (implementation varies by need)
      // Usually safer to do nothing or ClearPedSecondaryTask
      ClearPedSecondaryTask(ped);
    }
  }

  /**
   * Prepare environment (Anim/Props) with cancellation safety.
   */
  private async setupEnvironment(options: ProgressOptions) {
    const promises: Promise<void>[] = [];

    if (options.anim) {
      promises.push(this.playAnimation(options.anim, options.duration));
    }

    if (options.prop) {
      promises.push(this.createProps(options.prop));
    }

    // Wait for all loads. If this.active becomes false (cancelled) mid-await,
    // the logic after `await Promise.all` needs to handle it.
    await Promise.all(promises);

    if (!this.active) throw new Error('Cancelled');
  }

  private startTick(options: ProgressOptions) {
    this.tickHandle = setTick(() => {
      const ped = PlayerPedId();

      // 1. Vital Check
      if (!options.useWhileDead && IsPedDeadOrDying(ped, true)) {
        this.cancel();
        return;
      }

      // 2. Animation Integrity Check
      if (options.anim?.dict && !IsEntityPlayingAnim(ped, options.anim.dict, options.anim.clip, 3)) {
        // We give it a tiny buffer frame or checking IsEntityPlayingAnim can be flaky immediately after start
        // but for now, strict check:
        this.cancel();
        return;
      }

      // 3. Disable Controls (Configuration Driven)
      if (options.disable) {
        DisablePlayerFiring(PlayerId(), true);

        // Iterate over the keys in options.disable
        for (const group of Object.keys(options.disable) as ControlGroupKey[]) {
          if (options.disable[group] && CONTROL_GROUPS[group]) {
            for (const control of CONTROL_GROUPS[group]) {
              DisableControlAction(0, control, true);
            }
          }
        }
      }
    });
  }

  private async playAnimation(anim: ProgressAnim, duration: number) {
    const ped = PlayerPedId();

    if (anim.dict) {
      // Load with timeout protection
      await this.loadAnimDict(anim.dict);
      if (!this.active) return;

      TaskPlayAnim(
        ped,
        anim.dict,
        anim.clip,
        anim.blendIn ?? 3.0,
        anim.blendOut ?? 1.0,
        duration,
        anim.flag ?? 49,
        anim.playbackRate ?? 0,
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
    const coords = GetEntityCoords(ped, true);

    for (const p of propList) {
      if (!this.active) return;

      await this.loadModel(p.model);
      if (!this.active) return;

      const hash = typeof p.model === 'string' ? GetHashKey(p.model) : p.model;
      const obj = CreateObject(hash, coords[0], coords[1], coords[2], true, true, true);
      this.createdProps.push(obj);

      const boneIndex = GetPedBoneIndex(ped, p.bone || 60309);

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

  /**
   * Helper: Load Anim Dict with Timeout
   */
  private async loadAnimDict(dict: string, timeout = 3000): Promise<void> {
    if (HasAnimDictLoaded(dict)) return;
    RequestAnimDict(dict);

    const start = GetGameTimer();
    while (!HasAnimDictLoaded(dict)) {
      if (GetGameTimer() - start > timeout) throw new Error(`AnimDict ${dict} timeout`);
      if (!this.active) throw new Error('Cancelled');
      await wait(10);
    }
  }

  /**
   * Helper: Load Model with Timeout
   */
  private async loadModel(model: string | number, timeout = 3000): Promise<void> {
    const hash = typeof model === 'string' ? GetHashKey(model) : model;
    if (HasModelLoaded(hash)) return;
    RequestModel(hash);

    const start = GetGameTimer();
    while (!HasModelLoaded(hash)) {
      if (GetGameTimer() - start > timeout) throw new Error(`Model ${model} timeout`);
      if (!this.active) throw new Error('Cancelled');
      await wait(10);
    }
  }
}

export const Progress = new ProgressService();
