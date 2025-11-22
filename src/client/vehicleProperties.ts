export interface VehicleProps {
  model?: number;
  plate?: string;
  plateIndex?: number
  bodyHealth?: number
  engineHealth?: number
  tankHealth?: number
  fuelLevel?: number
  oilLevel?: number
  dirtLevel?: number
  paintType1?: number
  paintType2?: number
  color1?: number | number[]
  color2?: number | number[]
  pearlescentColor?: number
  interiorColor?: number
  dashboardColor?: number
  wheelColor?: number
  wheelWidth?: number
  wheelSize?: number
  wheels?: number
  windowTint?: number
  xenonColor?: number
  neonEnabled?: boolean[]
  neonColor?: number[]
  extras?: Record<number | string, 0 | 1>;
  tyreSmokeColor?: number | number[]
  modSpoilers?: number
  modFrontBumper?: number
  modRearBumper?: number
  modSideSkirt?: number
  modExhaust?: number
  modFrame?: number
  modGrille?: number
  modHood?: number
  modFender?: number
  modRightFender?: number
  modRoof?: number
  modEngine?: number
  modBrakes?: number
  modTransmission?: number
  modHorns?: number
  modSuspension?: number
  modArmor?: number
  modNitrous?: number
  modTurbo?: boolean
  modSubwoofer?: boolean
  modSmokeEnabled?: boolean
  modHydraulics?: boolean
  modXenon?: boolean
  modFrontWheels?: number
  modBackWheels?: number
  modCustomTiresF?: boolean
  modCustomTiresR?: boolean
  modPlateHolder?: number
  modVanityPlate?: number
  modTrimA?: number
  modOrnaments?: number
  modDashboard?: number
  modDial?: number
  modDoorSpeaker?: number
  modSeats?: number
  modSteeringWheel?: number
  modShifterLeavers?: number
  modAPlate?: number
  modSpeakers?: number
  modTrunk?: number
  modHydrolic?: number
  modEngineBlock?: number
  modAirFilter?: number
  modStruts?: number
  modArchCover?: number
  modAerials?: number
  modTrimB?: number
  modTank?: number
  modWindows?: number
  modDoorR?: number
  modLivery?: number
  modRoofLivery?: number
  modLightbar?: number
  livery?: number
  windows?: number[]
  doors?: number[]
  tyres?: Record<number | string, 1 | 2>;
  bulletProofTyres?: boolean
  driftTyres?: boolean
}

export class VehicleProperties {
  /**
   * Get all properties of a vehicle (mods, colors, health, etc.)
   */
  static get(vehicle: number): VehicleProps {
    if (!DoesEntityExist(vehicle)) return {};

    const [colorPrimary, colorSecondary] = GetVehicleColours(vehicle);
    const [pearlescentColor, wheelColor] = GetVehicleExtraColours(vehicle);
    const [paintType1] = GetVehicleModColor_1(vehicle);
    const [paintType2] = GetVehicleModColor_2(vehicle);

    // Custom primary/secondary colors (RGB)
    let color1: number | number[] = colorPrimary;
    let color2: number | number[] = colorSecondary;
    if (GetIsVehiclePrimaryColourCustom(vehicle)) {
      color1 = GetVehicleCustomPrimaryColour(vehicle);
    }
    if (GetIsVehicleSecondaryColourCustom(vehicle)) {
      color2 = GetVehicleCustomSecondaryColour(vehicle);
    }

    // Extras
    const extras: Record<number | string, 0 | 1> = {};
    for (let i = 1; i <= 15; i++) {
      if (DoesExtraExist(vehicle, i)) {
        extras[i] = IsVehicleExtraTurnedOn(vehicle, i) ? 0 : 1;
      }
    }

    // Neons
    const neonEnabled: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      neonEnabled[i] = IsVehicleNeonLightEnabled(vehicle, i);
    }

    // Damage (Windows, Doors, Tyres)
    const windows: number[] = [];
    for (let i = 0; i < 8; i++) {
      if (!IsVehicleWindowIntact(vehicle, i)) windows.push(i);
    }

    const doors: number[] = [];
    for (let i = 0; i < 6; i++) {
      if (IsVehicleDoorDamaged(vehicle, i)) doors.push(i);
    }

    const tyres: Record<number | string, 1 | 2> = {};
    for (let i = 0; i < 8; i++) {
      if (IsVehicleTyreBurst(vehicle, i, false)) {
        tyres[i] = IsVehicleTyreBurst(vehicle, i, true) ? 2 : 1;
      }
    }

    const modCustomTiresF = GetVehicleModVariation(vehicle, 23);
    const modCustomTiresR = GetVehicleModVariation(vehicle, 24);

    return {
      model: GetEntityModel(vehicle),
      plate: GetVehicleNumberPlateText(vehicle).trim(),
      plateIndex: GetVehicleNumberPlateTextIndex(vehicle),
      bodyHealth: Math.round(GetVehicleBodyHealth(vehicle)),
      engineHealth: Math.round(GetVehicleEngineHealth(vehicle)),
      tankHealth: Math.round(GetVehiclePetrolTankHealth(vehicle)),
      fuelLevel: Math.round(GetVehicleFuelLevel(vehicle)),
      oilLevel: Math.round(GetVehicleOilLevel(vehicle)),
      dirtLevel: Math.round(GetVehicleDirtLevel(vehicle)),
      paintType1,
      paintType2,
      color1,
      color2,
      pearlescentColor,
      wheelColor,
      interiorColor: GetVehicleInteriorColor(vehicle),
      dashboardColor: GetVehicleDashboardColour(vehicle),
      wheelWidth: GetVehicleWheelWidth(vehicle),
      wheelSize: GetVehicleWheelSize(vehicle),
      wheels: GetVehicleWheelType(vehicle),
      windowTint: GetVehicleWindowTint(vehicle),
      xenonColor: GetVehicleXenonLightsColor(vehicle),
      neonEnabled,
      neonColor: GetVehicleNeonLightsColour(vehicle),
      extras,
      tyreSmokeColor: GetVehicleTyreSmokeColor(vehicle),
      modSpoilers: GetVehicleMod(vehicle, 0),
      modFrontBumper: GetVehicleMod(vehicle, 1),
      modRearBumper: GetVehicleMod(vehicle, 2),
      modSideSkirt: GetVehicleMod(vehicle, 3),
      modExhaust: GetVehicleMod(vehicle, 4),
      modFrame: GetVehicleMod(vehicle, 5),
      modGrille: GetVehicleMod(vehicle, 6),
      modHood: GetVehicleMod(vehicle, 7),
      modFender: GetVehicleMod(vehicle, 8),
      modRightFender: GetVehicleMod(vehicle, 9),
      modRoof: GetVehicleMod(vehicle, 10),
      modEngine: GetVehicleMod(vehicle, 11),
      modBrakes: GetVehicleMod(vehicle, 12),
      modTransmission: GetVehicleMod(vehicle, 13),
      modHorns: GetVehicleMod(vehicle, 14),
      modSuspension: GetVehicleMod(vehicle, 15),
      modArmor: GetVehicleMod(vehicle, 16),
      modNitrous: GetVehicleMod(vehicle, 17),
      modTurbo: IsToggleModOn(vehicle, 18),
      modSubwoofer: IsToggleModOn(vehicle, 19),
      modSmokeEnabled: IsToggleModOn(vehicle, 20),
      modHydraulics: IsToggleModOn(vehicle, 21),
      modXenon: IsToggleModOn(vehicle, 22),
      modFrontWheels: GetVehicleMod(vehicle, 23),
      modBackWheels: GetVehicleMod(vehicle, 24),
      modCustomTiresF,
      modCustomTiresR,
      modPlateHolder: GetVehicleMod(vehicle, 25),
      modVanityPlate: GetVehicleMod(vehicle, 26),
      modTrimA: GetVehicleMod(vehicle, 27),
      modOrnaments: GetVehicleMod(vehicle, 28),
      modDashboard: GetVehicleMod(vehicle, 29),
      modDial: GetVehicleMod(vehicle, 30),
      modDoorSpeaker: GetVehicleMod(vehicle, 31),
      modSeats: GetVehicleMod(vehicle, 32),
      modSteeringWheel: GetVehicleMod(vehicle, 33),
      modShifterLeavers: GetVehicleMod(vehicle, 34),
      modAPlate: GetVehicleMod(vehicle, 35),
      modSpeakers: GetVehicleMod(vehicle, 36),
      modTrunk: GetVehicleMod(vehicle, 37),
      modHydrolic: GetVehicleMod(vehicle, 38),
      modEngineBlock: GetVehicleMod(vehicle, 39),
      modAirFilter: GetVehicleMod(vehicle, 40),
      modStruts: GetVehicleMod(vehicle, 41),
      modArchCover: GetVehicleMod(vehicle, 42),
      modAerials: GetVehicleMod(vehicle, 43),
      modTrimB: GetVehicleMod(vehicle, 44),
      modTank: GetVehicleMod(vehicle, 45),
      modWindows: GetVehicleMod(vehicle, 46),
      modDoorR: GetVehicleMod(vehicle, 47),
      modLivery: GetVehicleMod(vehicle, 48),
      modRoofLivery: GetVehicleRoofLivery(vehicle),
      modLightbar: GetVehicleMod(vehicle, 49),
      livery: GetVehicleLivery(vehicle),
      windows,
      doors,
      tyres,
      bulletProofTyres: GetVehicleTyresCanBurst(vehicle) === false,
      driftTyres: GetGameBuildNumber() >= 2372 ? GetDriftTyresEnabled(vehicle) : false,
    };
  }

  /**
   * Apply properties to a vehicle
   */
  static set(vehicle: number, props: VehicleProps, fixVehicle: boolean = false): void {
    if (!DoesEntityExist(vehicle)) return;

    SetVehicleModKit(vehicle, 0);

    if (props.plate) SetVehicleNumberPlateText(vehicle, props.plate);
    if (props.plateIndex !== undefined) SetVehicleNumberPlateTextIndex(vehicle, props.plateIndex);
    if (props.bodyHealth !== undefined) SetVehicleBodyHealth(vehicle, props.bodyHealth + 0.0);
    if (props.engineHealth !== undefined) SetVehicleEngineHealth(vehicle, props.engineHealth + 0.0);
    if (props.fuelLevel !== undefined) SetVehicleFuelLevel(vehicle, props.fuelLevel + 0.0);
    if (props.dirtLevel !== undefined) SetVehicleDirtLevel(vehicle, props.dirtLevel + 0.0);

    // Colors
    if (props.color1 !== undefined) {
      if (typeof props.color1 === 'number') {
        ClearVehicleCustomPrimaryColour(vehicle);
        SetVehicleColours(vehicle, props.color1, props.color2 as number || 0);
      } else {
        SetVehicleCustomPrimaryColour(vehicle, props.color1[0], props.color1[1], props.color1[2]);
      }
    }
    if (props.color2 !== undefined) {
      if (typeof props.color2 === 'number') {
        ClearVehicleCustomSecondaryColour(vehicle);
        SetVehicleColours(vehicle, (props.color1 as number) || 0, props.color2);
      } else {
        SetVehicleCustomSecondaryColour(vehicle, props.color2[0], props.color2[1], props.color2[2]);
      }
    }

    if (props.paintType1 !== undefined) SetVehicleModColor_1(vehicle, props.paintType1, 0, props.pearlescentColor || 0);
    if (props.paintType2 !== undefined) SetVehicleModColor_2(vehicle, props.paintType2, 0);
    if (props.pearlescentColor !== undefined || props.wheelColor !== undefined) {
      const [curPearl, curWheel] = GetVehicleExtraColours(vehicle);
      SetVehicleExtraColours(vehicle, props.pearlescentColor ?? curPearl, props.wheelColor ?? curWheel);
    }

    // Mods
    const setMod = (id: number, val?: number) => { if (val !== undefined) SetVehicleMod(vehicle, id, val, false); };
    const setToggle = (id: number, val?: boolean) => { if (val !== undefined) ToggleVehicleMod(vehicle, id, val); };

    setMod(0, props.modSpoilers);
    setMod(1, props.modFrontBumper);
    setMod(2, props.modRearBumper);
    setMod(3, props.modSideSkirt);
    setMod(4, props.modExhaust);
    setMod(5, props.modFrame);
    setMod(6, props.modGrille);
    setMod(7, props.modHood);
    setMod(8, props.modFender);
    setMod(9, props.modRightFender);
    setMod(10, props.modRoof);
    setMod(11, props.modEngine);
    setMod(12, props.modBrakes);
    setMod(13, props.modTransmission);
    setMod(14, props.modHorns);
    setMod(15, props.modSuspension);
    setMod(16, props.modArmor);
    setMod(17, props.modNitrous);
    setToggle(18, props.modTurbo);
    setToggle(19, props.modSubwoofer);
    setToggle(20, props.modSmokeEnabled);
    setToggle(21, props.modHydraulics);
    setToggle(22, props.modXenon);

    if (props.oilLevel !== undefined) SetVehicleOilLevel(vehicle, props.oilLevel + 0.0);
    if (props.xenonColor !== undefined) SetVehicleXenonLightsColor(vehicle, props.xenonColor);
    if (props.windowTint !== undefined) SetVehicleWindowTint(vehicle, props.windowTint);

    // Extras
    if (props.extras) {
      for (const [id, state] of Object.entries(props.extras)) {
        SetVehicleExtra(vehicle, Number(id), state === 1); // 1 is disable in native, but usually 0/1 logic depends on lib
      }
    }

    if (props.modFrontWheels !== undefined) {
      SetVehicleMod(vehicle, 23, props.modFrontWheels, props.modCustomTiresF || false);
    }
    if (props.modBackWheels !== undefined) {
      SetVehicleMod(vehicle, 24, props.modBackWheels, props.modCustomTiresR || false);
    }

    if (GetGameBuildNumber() >= 2372 && props.driftTyres !== undefined) {
      SetDriftTyresEnabled(vehicle, props.driftTyres);
    }

    // Neons
    if (props.neonEnabled) {
      props.neonEnabled.forEach((enabled, index) => SetVehicleNeonLightEnabled(vehicle, index, enabled));
    }
    if (props.neonColor) SetVehicleNeonLightsColour(vehicle, props.neonColor[0], props.neonColor[1], props.neonColor[2]);

    if (fixVehicle) SetVehicleFixed(vehicle);
  }
}
