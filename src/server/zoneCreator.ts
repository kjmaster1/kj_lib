// src/server/zoneCreator.ts
import {Logger} from '../common';
import {ACL} from './acl';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ZoneData {
  name: string;
  type: 'poly' | 'box' | 'sphere';
  points: { x: number; y: number; z: number }[];
  minZ: number;
  maxZ: number;
  createdAt?: number;
  createdBy?: string;
}

// -----------------------------------------------------------------------------
// Zone Persistence Service
// -----------------------------------------------------------------------------

class ZoneStorage {
  private static readonly FILE_NAME = 'created_zones.json';
  private static readonly PERMISSION = 'command.zone'; // Requires 'add_ace group.admin command.zone allow'

  static init() {
    onNet('kj_lib:server:saveZone', this.handleSaveRequest.bind(this));
  }

  private static handleSaveRequest(data: any) {
    const src = source;

    // 1. Security Check
    if (!ACL.hasPermission(src, this.PERMISSION)) {
      Logger.warn(`Player ${src} attempted to save a zone without permission.`);
      emitNet('chat:addMessage', src, {args: ['^1System', 'Access denied. Missing ' + this.PERMISSION]});
      return;
    }

    // 2. Input Validation
    if (!this.isValidZoneData(data)) {
      Logger.error(`Player ${src} sent invalid zone data.`);
      emitNet('chat:addMessage', src, {args: ['^1System', 'Invalid zone data format.']});
      return;
    }

    // 3. Save Logic
    const success = this.saveToFile(data, GetPlayerName(src.toString()));

    // 4. Feedback
    if (success) {
      Logger.info(`Zone ^2${data.name}^7 saved by ${GetPlayerName(src.toString())} (ID: ${src})`);
      emitNet('chat:addMessage', src, {args: ['^2Success', `Zone "${data.name}" saved to ${this.FILE_NAME}.`]});
    } else {
      emitNet('chat:addMessage', src, {args: ['^1Error', 'Failed to write to file. Check server console.']});
    }
  }

  private static saveToFile(newZone: ZoneData, author: string): boolean {
    const resourceName = GetCurrentResourceName();
    const rawContent = LoadResourceFile(resourceName, this.FILE_NAME);

    let zones: ZoneData[] = [];

    if (rawContent) {
      try {
        zones = JSON.parse(rawContent);
      } catch (e) {
        Logger.error(`CRITICAL: Failed to parse ${this.FILE_NAME}. Save aborted to prevent data loss.`);
        return false;
      }
    }

    // Enrich data
    newZone.createdAt = Date.now();
    newZone.createdBy = author;

    zones.push(newZone);

    const saveSuccess = SaveResourceFile(resourceName, this.FILE_NAME, JSON.stringify(zones, null, 2), -1);
    return !!saveSuccess;
  }

  private static isValidZoneData(data: any): data is ZoneData {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.name !== 'string' || data.name.length < 1) return false;
    if (!Array.isArray(data.points) || data.points.length < 3) return false;
    if (typeof data.minZ !== 'number' || typeof data.maxZ !== 'number') return false;
    return true;
  }
}

// Initialize
ZoneStorage.init();
