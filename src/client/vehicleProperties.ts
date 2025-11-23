// src/client/vehicleProperties.ts


// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ColorRGB = [number, number, number];

export interface VehicleHealth {
  body: number;
  engine: number;
  tank: number;
  fuel: number;
  oil: number;
  dirt: number;
  tires: Record<number, { burst: boolean; completely: boolean }>;
  windows: number[]; // Indexes of broken windows
  doors: number[]; // Indexes of broken doors
}

export interface VehicleCosmetics {
  plate: { text: string; index: number };
  paint: {
    primary: { type: number; color: number | ColorRGB };
    secondary: { type: number; color: number | ColorRGB };
    pearlescent: number;
    wheel: number;
    interior: number;
    dashboard: number;
    xenon: number;
    tyreSmoke: ColorRGB;
  };
  neons: {
    enabled: boolean[]; // [Left, Right, Front, Back]
    color: ColorRGB;
  };
  extras: Record<number, boolean>; // ID -> Enabled
  livery: number;
  roofLivery: number;
  windowTint: number;
  wheelType: number;
  xenonEnabled: boolean;
}

export interface VehicleMods {
  // Standard Mods (0-49)
  spoilers?: number;
  frontBumper?: number;
  rearBumper?: number;
  sideSkirt?: number;
  exhaust?: number;
  frame?: number;
  grille?: number;
  hood?: number;
  fender?: number;
  rightFender?: number;
  roof?: number;
  engine?: number;
  brakes?: number;
  transmission?: number;
  horns?: number;
  suspension?: number;
  armor?: number;
  nitrous?: number;
  turbo?: boolean;
  subwoofer?: boolean;
  tyreSmoke?: boolean;
  hydraulics?: boolean;
  xenon?: boolean;
  frontWheels?: number;
  backWheels?: number;
  customTiresF?: boolean;
  customTiresR?: boolean;
  plateHolder?: number;
  vanityPlate?: number;
  trimA?: number;
  ornaments?: number;
  dashboard?: number;
  dial?: number;
  doorSpeaker?: number;
  seats?: number;
  steeringWheel?: number;
  shifterLeavers?: number;
  aPlate?: number;
  speakers?: number;
  trunk?: number;
  hydrolic?: number;
  engineBlock?: number;
  airFilter?: number;
  struts?: number;
  archCover?: number;
  aerials?: number;
  trimB?: number;
  tank?: number;
  windows?: number;
  doorR?: number;
  liveryMod?: number;
  lightbar?: number;

  // Special
  driftTyres?: boolean;
  bulletProofTyres?: boolean;
}

export interface VehicleData {
  model: number;
  health: VehicleHealth;
  cosmetics: VehicleCosmetics;
  mods: VehicleMods;
}

// -----------------------------------------------------------------------------
// Mapping Helpers
// -----------------------------------------------------------------------------

// Map friendly names to Mod ID indices
const MOD_MAP: Record<keyof VehicleMods, number | null> = {
  spoilers: 0, frontBumper: 1, rearBumper: 2, sideSkirt: 3, exhaust: 4, frame: 5, grille: 6, hood: 7,
  fender: 8, rightFender: 9, roof: 10, engine: 11, brakes: 12, transmission: 13, horns: 14,
  suspension: 15, armor: 16, nitrous: 17, turbo: 18, subwoofer: 19, tyreSmoke: 20, hydraulics: 21,
  xenon: 22, frontWheels: 23, backWheels: 24, plateHolder: 25, vanityPlate: 26, trimA: 27,
  ornaments: 28, dashboard: 29, dial: 30, doorSpeaker: 31, seats: 32, steeringWheel: 33,
  shifterLeavers: 34, aPlate: 35, speakers: 36, trunk: 37, hydrolic: 38, engineBlock: 39,
  airFilter: 40, struts: 41, archCover: 42, aerials: 43, trimB: 44, tank: 45, windows: 46,
  doorR: 47, liveryMod: 48, lightbar: 49,
  // Toggles / Specials handled separately
  customTiresF: null, customTiresR: null, driftTyres: null, bulletProofTyres: null
};

// -----------------------------------------------------------------------------
// Service Class
// -----------------------------------------------------------------------------

export class VehicleProperties {

  static get(vehicle: number): VehicleData | null {
    if (!DoesEntityExist(vehicle)) return null;

    // --- Colors ---
    const [colorPri, colorSec] = GetVehicleColours(vehicle);
    const [pearl, wheelCol] = GetVehicleExtraColours(vehicle);

    let primary: number | ColorRGB = colorPri;
    let secondary: number | ColorRGB = colorSec;

    if (GetIsVehiclePrimaryColourCustom(vehicle)) primary = GetVehicleCustomPrimaryColour(vehicle) as ColorRGB;
    if (GetIsVehicleSecondaryColourCustom(vehicle)) secondary = GetVehicleCustomSecondaryColour(vehicle) as ColorRGB;

    // --- Neons ---
    const neons = {
      enabled: [0, 1, 2, 3].map(i => IsVehicleNeonLightEnabled(vehicle, i)),
      color: GetVehicleNeonLightsColour(vehicle) as ColorRGB
    };

    // --- Extras ---
    const extras: Record<number, boolean> = {};
    for (let i = 0; i <= 20; i++) {
      if (DoesExtraExist(vehicle, i)) {
        extras[i] = IsVehicleExtraTurnedOn(vehicle, i);
      }
    }

    // --- Health ---
    const tires: Record<number, { burst: boolean; completely: boolean }> = {};
    for (let i = 0; i < 7; i++) {
      if (IsVehicleTyreBurst(vehicle, i, false)) {
        tires[i] = {burst: true, completely: IsVehicleTyreBurst(vehicle, i, true)};
      }
    }

    // --- Mods ---
    const mods: any = {};
    for (const [key, index] of Object.entries(MOD_MAP)) {
      if (index === null) continue;
      if (index >= 17 && index <= 22) {
        mods[key] = IsToggleModOn(vehicle, index);
      } else {
        mods[key] = GetVehicleMod(vehicle, index);
      }
    }

    mods.customTiresF = GetVehicleModVariation(vehicle, 23);
    mods.customTiresR = GetVehicleModVariation(vehicle, 24);
    mods.bulletProofTyres = !GetVehicleTyresCanBurst(vehicle);

    if (GetGameBuildNumber() >= 2372) {
      mods.driftTyres = GetDriftTyresEnabled(vehicle);
    }

    // --- Construction ---
    return {
      model: GetEntityModel(vehicle),
      health: {
        body: Math.round(GetVehicleBodyHealth(vehicle)),
        engine: Math.round(GetVehicleEngineHealth(vehicle)),
        tank: Math.round(GetVehiclePetrolTankHealth(vehicle)),
        fuel: Math.round(GetVehicleFuelLevel(vehicle)),
        oil: Math.round(GetVehicleOilLevel(vehicle)),
        dirt: Math.round(GetVehicleDirtLevel(vehicle)),
        tires,
        windows: [0, 1, 2, 3, 4, 5, 6, 7].filter(i => !IsVehicleWindowIntact(vehicle, i)),
        doors: [0, 1, 2, 3, 4, 5].filter(i => IsVehicleDoorDamaged(vehicle, i))
      },
      cosmetics: {
        plate: {
          text: GetVehicleNumberPlateText(vehicle).trim(),
          index: GetVehicleNumberPlateTextIndex(vehicle)
        },
        paint: {
          primary: {type: GetVehicleModColor_1(vehicle)[0], color: primary},
          secondary: {type: GetVehicleModColor_2(vehicle)[0], color: secondary},
          pearlescent: pearl,
          wheel: wheelCol,
          interior: GetVehicleInteriorColor(vehicle),
          dashboard: GetVehicleDashboardColour(vehicle),
          xenon: GetVehicleXenonLightsColor(vehicle),
          tyreSmoke: GetVehicleTyreSmokeColor(vehicle) as ColorRGB
        },
        neons,
        extras,
        livery: GetVehicleLivery(vehicle),
        roofLivery: GetVehicleRoofLivery(vehicle),
        windowTint: GetVehicleWindowTint(vehicle),
        wheelType: GetVehicleWheelType(vehicle),
        xenonEnabled: IsToggleModOn(vehicle, 22)
      },
      mods
    };
  }

  static set(vehicle: number, data: VehicleData, options: { autoRepair?: boolean } = {}): void {
    if (!DoesEntityExist(vehicle)) return;

    SetVehicleModKit(vehicle, 0);

    // --- Cosmetics ---
    const c = data.cosmetics;

    if (c.plate) {
      SetVehicleNumberPlateText(vehicle, c.plate.text);
      SetVehicleNumberPlateTextIndex(vehicle, c.plate.index);
    }

    // Colors Logic
    // We must check both primary and secondary to safely call SetVehicleColours
    // If RGB is used, we use specific natives.
    const pPaint = c.paint.primary;
    const sPaint = c.paint.secondary;

    if (typeof pPaint.color === 'number' && typeof sPaint.color === 'number') {
      SetVehicleColours(vehicle, pPaint.color, sPaint.color);
    } else {
      // Mixed or full RGB
      if (Array.isArray(pPaint.color)) {
        SetVehicleCustomPrimaryColour(vehicle, pPaint.color[0], pPaint.color[1], pPaint.color[2]);
      } else if (typeof pPaint.color === 'number') {
        ClearVehicleCustomPrimaryColour(vehicle);
        SetVehicleColours(vehicle, pPaint.color, typeof sPaint.color === 'number' ? sPaint.color : 0);
      }

      if (Array.isArray(sPaint.color)) {
        SetVehicleCustomSecondaryColour(vehicle, sPaint.color[0], sPaint.color[1], sPaint.color[2]);
      } else if (typeof sPaint.color === 'number') {
        ClearVehicleCustomSecondaryColour(vehicle);
        // Re-apply primary if it was an index, to prevent overwrite
        const pIndex = typeof pPaint.color === 'number' ? pPaint.color : 0;
        SetVehicleColours(vehicle, pIndex, sPaint.color);
      }
    }

    SetVehicleModColor_1(vehicle, pPaint.type, 0, c.paint.pearlescent);
    SetVehicleModColor_2(vehicle, sPaint.type, 0);
    SetVehicleExtraColours(vehicle, c.paint.pearlescent, c.paint.wheel);

    if (c.paint.tyreSmoke) SetVehicleTyreSmokeColor(vehicle, ...c.paint.tyreSmoke);
    SetVehicleXenonLightsColor(vehicle, c.paint.xenon);
    SetVehicleInteriorColor(vehicle, c.paint.interior);
    SetVehicleDashboardColour(vehicle, c.paint.dashboard);
    SetVehicleWindowTint(vehicle, c.windowTint);
    SetVehicleWheelType(vehicle, c.wheelType);

    // Neons
    c.neons.enabled.forEach((state, i) => SetVehicleNeonLightEnabled(vehicle, i, state));
    SetVehicleNeonLightsColour(vehicle, ...c.neons.color);

    // Extras (Native: 0 = ON, 1 = OFF)
    for (const [id, enabled] of Object.entries(c.extras)) {
      SetVehicleExtra(vehicle, Number(id), !enabled);
    }

    // Livery
    SetVehicleLivery(vehicle, c.livery);
    SetVehicleRoofLivery(vehicle, c.roofLivery);

    // --- Mods ---
    const m = data.mods;
    for (const [key, index] of Object.entries(MOD_MAP)) {
      const value = m[key as keyof VehicleMods];
      if (index === null || value === undefined) continue;

      if (typeof value === 'boolean') {
        ToggleVehicleMod(vehicle, index, value);
      } else {
        // Check for custom tires variation
        let variation = false;
        if (index === 23) variation = !!m.customTiresF;
        if (index === 24) variation = !!m.customTiresR;
        SetVehicleMod(vehicle, index, value, variation);
      }
    }

    if (m.bulletProofTyres !== undefined) SetVehicleTyresCanBurst(vehicle, !m.bulletProofTyres);
    if (GetGameBuildNumber() >= 2372 && m.driftTyres !== undefined) SetDriftTyresEnabled(vehicle, m.driftTyres);

    // --- Health ---
    const h = data.health;
    if (options.autoRepair) {
      SetVehicleFixed(vehicle);
      SetVehicleDeformationFixed(vehicle);
      SetVehicleUndriveable(vehicle, false);
    }

    SetVehicleBodyHealth(vehicle, h.body + 0.0);
    SetVehicleEngineHealth(vehicle, h.engine + 0.0);
    SetVehiclePetrolTankHealth(vehicle, h.tank + 0.0);
    SetVehicleFuelLevel(vehicle, h.fuel + 0.0);
    SetVehicleOilLevel(vehicle, h.oil + 0.0);
    SetVehicleDirtLevel(vehicle, h.dirt + 0.0);

    // Apply Damage
    h.windows.forEach(w => RemoveVehicleWindow(vehicle, w));
    h.doors.forEach(d => SetVehicleDoorBroken(vehicle, d, true));
    for (const [id, state] of Object.entries(h.tires)) {
      if (state.completely) SetVehicleTyreBurst(vehicle, Number(id), true, 1000.0);
      else if (state.burst) SetVehicleTyreBurst(vehicle, Number(id), false, 1000.0);
    }
  }
}
