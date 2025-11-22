// src/client/cache.ts
import { Logger } from '../common/logger';

export class Cache {
  static ped: number = 0;
  static playerId: number = 0;
  static serverId: number = 0;
  static vehicle: number | false = false;
  static seat: number | false = false;
  static coords: number[] = [0, 0, 0];

  static init() {
    Cache.playerId = PlayerId();
    Cache.serverId = GetPlayerServerId(Cache.playerId);
    Cache.ped = PlayerPedId();

    // Update slow changing data loop
    setInterval(() => {
      Cache.ped = PlayerPedId();
      Cache.serverId = GetPlayerServerId(Cache.playerId);

      // Only update coords if we aren't using a specialized zone system that does it faster
      const coords = GetEntityCoords(Cache.ped, false);
      Cache.coords = [coords[0], coords[1], coords[2]];
    }, 200);

    // Listen for vehicle entry/exit
    on('gameEventTriggered', (name: string, args: any[]) => {
      if (name === 'CEventNetworkPlayerEnteredVehicle') {
        const [_, pedId] = args;
        if (pedId === Cache.ped) {
          Cache.vehicle = GetVehiclePedIsIn(Cache.ped, false);
          Cache.updateSeat();
        }
      } else if (name === 'CEventNetworkPlayerLeaveVehicle') {
        const [_, pedId] = args;
        if (pedId === Cache.ped) {
          Cache.vehicle = false;
          Cache.seat = false;
        }
      }
    });

    Logger.info('Cache initialized');
  }

  private static updateSeat() {
    if (!Cache.vehicle) return;
    // Native logic to check max seats and loop to find current seat
    // For brevity: -1 is driver, 0 is passenger, etc.
    for (let i = -1; i < 6; i++) {
      if (GetPedInVehicleSeat(Cache.vehicle, i) === Cache.ped) {
        Cache.seat = i;
        break;
      }
    }
  }
}
