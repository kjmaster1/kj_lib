import {Streaming} from "./streaming";
import {wait} from "../common/utils";
import {Cache} from "./cache";

export interface ProgressPropProps {
  model: string;
  bone?: number;
  pos: number[]; // [x, y, z]
  rot: number[]; // [x, y, z]
}

export interface ProgressAnimProps {
  dict?: string;
  clip: string;
  flag?: number;
  blendIn?: number;
  blendOut?: number;
  duration?: number;
  playbackRate?: number;
  lockX?: boolean;
  lockY?: boolean;
  lockZ?: boolean;
  scenario?: string;
  playEnter?: boolean;
}

export interface ProgressProps {
  label?: string;
  duration: number;
  position?: 'middle' | 'bottom';
  useWhileDead?: boolean;
  allowRagdoll?: boolean;
  allowCuffed?: boolean;
  allowFalling?: boolean;
  allowSwimming?: boolean;
  canCancel?: boolean;
  anim?: ProgressAnimProps;
  prop?: ProgressPropProps | ProgressPropProps[];
  disable?: {
    move?: boolean;
    sprint?: boolean;
    car?: boolean;
    combat?: boolean;
    mouse?: boolean;
  };
}

export class Progress {
  private static active = false;
  private static cancelled = false;

  static init() {
    RegisterNuiCallbackType('progressCancel');
    on('__cfx_nui:progressCancel', (_: any, cb: Function) => {
      cb(1);
      this.cancel();
    });

    RegisterNuiCallbackType('progressComplete');
    on('__cfx_nui:progressComplete', (_: any, cb: Function) => {
      cb(1);
      this.active = false;
    });
  }

  private static async loadAnimDict(dict: string) {
    await Streaming.loadAnim(dict);
  }

  private static async loadModel(model: string | number) {
    await Streaming.loadModel(model);
    return model;
  }

  static async start(data: ProgressProps, type: 'bar' | 'circle' = 'bar'): Promise<boolean> {
    if (this.active) return false;
    this.active = true;
    this.cancelled = false;

    // UI
    SendNuiMessage(JSON.stringify({
      action: type === 'bar' ? 'progress' : 'circleProgress',
      data: {
        label: data.label,
        duration: data.duration,
        position: data.position
      }
    }));

    // Animation
    if (data.anim) {
      if (data.anim.dict) {
        await this.loadAnimDict(data.anim.dict);
        TaskPlayAnim(
          PlayerPedId(),
          data.anim.dict,
          data.anim.clip,
          data.anim.blendIn || 3.0,
          data.anim.blendOut || 1.0,
          data.duration,
          data.anim.flag || 49,
          data.anim.playbackRate || 0,
          !!data.anim.lockX,
          !!data.anim.lockY,
          !!data.anim.lockZ
        );
      } else if (data.anim.scenario) {
        TaskStartScenarioInPlace(PlayerPedId(), data.anim.scenario, 0, data.anim.playEnter !== false);
      }
    }

    // Props
    const createdProps: number[] = [];
    if (data.prop) {
      const props = Array.isArray(data.prop) ? data.prop : [data.prop];
      const ped = PlayerPedId();
      const coords = GetEntityCoords(ped, true);

      for (const p of props) {
        await this.loadModel(p.model);
        const hash = typeof p.model === 'string' ? GetHashKey(p.model) : p.model;

        const obj = CreateObject(hash, coords[0], coords[1], coords[2], true, true, true);
        AttachEntityToEntity(
          obj, ped, GetPedBoneIndex(ped, p.bone || 60309),
          p.pos[0], p.pos[1], p.pos[2],
          p.rot[0], p.rot[1], p.rot[2],
          true, true, false, true, 1, true
        );
        createdProps.push(obj);
        SetModelAsNoLongerNeeded(hash);
      }
    }

    // Control Loop
    const startTime = GetGameTimer();
    const tick = setTick(() => {
      if (!this.active) {
        clearTick(tick);
        return;
      }

      DisablePlayerFiring(Cache.playerId, true);

      // Disable controls logic here (abbreviated)
      if (data.disable?.move) {
        DisableControlAction(0, 30, true); // Move LR
        DisableControlAction(0, 31, true); // Move UD
        DisableControlAction(0, 36, true); // Duck
        DisableControlAction(0, 21, true); // Sprint
      }
      if (data.disable?.mouse) {
        DisableControlAction(0, 1, true);
        DisableControlAction(0, 2, true);
        DisableControlAction(0, 106, true); // Vehicle Mouse Control
      }

      if (data.disable?.car) {
        DisableControlAction(0, 63, true); // Veh Move LR
        DisableControlAction(0, 64, true); // Veh Move UD
        DisableControlAction(0, 71, true); // Accelerate
        DisableControlAction(0, 72, true); // Brake
        DisableControlAction(0, 75, true); // Exit Vehicle
      }

      if (data.disable?.combat) {
        DisableControlAction(0, 24, true); // Attack
        DisableControlAction(0, 25, true); // Aim
        DisableControlAction(0, 47, true); // Weapon
        DisableControlAction(0, 58, true); // Weapon
        DisableControlAction(0, 140, true); // Melee Attack Light
        DisableControlAction(0, 141, true); // Melee Attack Heavy
        DisableControlAction(0, 142, true); // Melee Attack Alternate
        DisableControlAction(0, 143, true); // Melee Block
        DisableControlAction(0, 263, true); // Melee Attack 1
        DisableControlAction(0, 264, true); // Melee Attack 2
        DisableControlAction(0, 257, true); // Attack 2
      }

      if (IsPedDeadOrDying(PlayerPedId(), true) && !data.useWhileDead) {
        this.cancel();
      }

    });

    // Wait for completion or cancellation
    while (this.active && !this.cancelled) {
      await wait(100)
      if (GetGameTimer() - startTime > data.duration) {
        this.active = false;
      }
    }

    // Cleanup
    clearTick(tick);
    if (data.anim) {
      ClearPedTasks(PlayerPedId());
    }
    for (const prop of createdProps) {
      DeleteEntity(prop);
    }

    return !this.cancelled;
  }

  static cancel() {
    if (this.active) {
      this.cancelled = true;
      this.active = false;
      SendNuiMessage(JSON.stringify({ action: 'progressCancel' }));
    }
  }
}
