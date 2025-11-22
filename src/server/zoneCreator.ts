import {Logger} from "../common/logger";

interface ZoneData {
  name: string;
  type: 'poly' | 'box' | 'sphere';
  points: { x: number; y: number; z: number }[];
  minZ: number;
  maxZ: number;
}

onNet('kj_lib:server:saveZone', (data: ZoneData) => {
  const source = global.source;

  // TODO: Add Permission Check Here (e.g., IsPlayerAceAllowed)

  try {
    const fileName = 'created_zones.json';
    const resourceName = GetCurrentResourceName();
    const existingContent = LoadResourceFile(resourceName, fileName);

    let zones: ZoneData[] = [];

    if (existingContent) {
      try {
        zones = JSON.parse(existingContent);
      } catch (e) {
        Logger.error('Failed to parse existing zones file. Backing up and creating new one.');
      }
    }

    zones.push(data);

    const saveSuccess = SaveResourceFile(resourceName, fileName, JSON.stringify(zones, null, 2), -1);

    if (saveSuccess) {
      Logger.info(`Zone ^2${data.name}^7 saved to ${fileName} by player ${source}`);
    } else {
      Logger.error(`Failed to save zone ${data.name}`);
    }

  } catch (err) {
    Logger.error(`Error saving zone: ${err}`);
  }
});
