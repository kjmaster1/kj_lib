// src/client/cache.ts
import {Logger} from '../common';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export class Cache {
  // Singleton instance
  private static instance: Cache;

  // Private backing fields
  private _ped: number = 0;
  private _playerId: number = 0;
  private _serverId: number = 0;
  private _vehicle: number | null = null;
  private _seat: number | null = null;
  private _coords: Vector3 = {x: 0, y: 0, z: 0};

  // Public Read-Only Accessors
  public get ped() {
    return this._ped;
  }

  public get playerId() {
    return this._playerId;
  }

  public get serverId() {
    return this._serverId;
  }

  public get vehicle() {
    return this._vehicle;
  }

  public get seat() {
    return this._seat;
  }

  public get coords() {
    return this._coords;
  }

  private constructor() {
    this.initializeData();
    this.startLoops();
    this.registerEvents();
    Logger.info('Cache system initialized');
  }

  public static init() {
    if (!this.instance) {
      this.instance = new Cache();
    }
    return this.instance;
  }

  // Accessor for the singleton if needed elsewhere without re-init
  public static get() {
    if (!this.instance) throw new Error('Cache not initialized');
    return this.instance;
  }

  private initializeData() {
    this._playerId = PlayerId();
    this._serverId = GetPlayerServerId(this._playerId);
    this._ped = PlayerPedId();
    this.updateSpatialData(); // Get initial coords
  }

  private startLoops() {
    // 200ms Polling Loop
    setInterval(() => {
      // Ped ID can change (e.g. skin menu, restoring appearance)
      const newPed = PlayerPedId();
      if (this._ped !== newPed) {
        this._ped = newPed;
      }

      this.updateSpatialData();
      this.updateVehicleState();
    }, 200);
  }

  private updateSpatialData() {
    const [x, y, z] = GetEntityCoords(this._ped, false);
    // Update object reference to keep it clean, or mutate if performance is absolute critical
    // Here we create new object to ensure immutability safety if passed by reference elsewhere
    this._coords = {x, y, z};
  }

  private updateVehicleState() {
    // Check if ped is actually in a vehicle
    const vehicle = GetVehiclePedIsIn(this._ped, false);

    if (vehicle !== 0) {
      this._vehicle = vehicle;
      this.resolveSeat(vehicle);
    } else {
      this._vehicle = null;
      this._seat = null;
    }
  }

  private resolveSeat(vehicle: number) {
    // If we already know the seat and it hasn't changed, skip logic
    if (this._seat !== null && GetPedInVehicleSeat(vehicle, this._seat) === this._ped) {
      return;
    }

    const model = GetEntityModel(vehicle);
    const seatCount = GetVehicleModelNumberOfSeats(model);

    // Driver is -1. Passengers are 0 -> seatCount - 2
    for (let i = -1; i < seatCount - 1; i++) {
      if (GetPedInVehicleSeat(vehicle, i) === this._ped) {
        this._seat = i;
        return;
      }
    }

    // Fallback if not found in standard seats (e.g. bus standing, trunk)
    this._seat = null;
  }

  private registerEvents() {
    // We primarily use the polling loop for vehicle state to handle seat shuffling
    // and sync issues, but we can use events for immediate response if needed.
    // However, relying on polling for vehicle/seat ensures we catch 'silent' changes.

    on('gameEventTriggered', (name: string, args: any[]) => {
      if (name === 'CEventNetworkPlayerEnteredVehicle') {
        const [targetPed, vehicleId] = args;
        if (targetPed === this._ped) {
          this._vehicle = vehicleId;
          this.resolveSeat(vehicleId);
        }
      }
    });
  }
}
