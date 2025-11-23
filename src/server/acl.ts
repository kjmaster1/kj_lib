// src/server/acl.ts
import {Logger} from '../common';

export type AceState = 'allow' | 'deny';
export type AceTarget = number | string; // Source ID (number) or Principal string

export class ACL {
  /**
   * Formats a target into a valid ACL principal string.
   * Handles numbers as player IDs and sanitizes strings.
   */
  private static resolvePrincipal(target: AceTarget): string {
    if (typeof target === 'number') {
      return `player.${target}`;
    }
    return target.trim();
  }

  /**
   * Add an ace permission to a principal.
   * @param target The target (Source ID, 'group.admin', 'identifier.steam:xxx')
   * @param ace The permission node (e.g., 'command.noclip')
   * @param state 'allow' or 'deny'
   */
  static addAce(target: AceTarget, ace: string, state: AceState = 'allow'): void {
    const principal = this.resolvePrincipal(target);
    ExecuteCommand(`add_ace ${principal} ${ace} ${state}`);

    Logger.debug(`[ACL] Added Ace: ${principal} -> ${ace} [${state}]`);
  }

  /**
   * Remove an ace permission from a principal.
   */
  static removeAce(target: AceTarget, ace: string, state: AceState = 'allow'): void {
    const principal = this.resolvePrincipal(target);
    ExecuteCommand(`remove_ace ${principal} ${ace} ${state}`);

    Logger.debug(`[ACL] Removed Ace: ${principal} -> ${ace} [${state}]`);
  }

  /**
   * Assign a child principal to a parent principal (Inheritance).
   * Example: Assigning a player to a group.
   * @param child The inheriting principal (e.g., Source ID)
   * @param parent The parent principal (e.g., 'group.admin')
   */
  static addPrincipal(child: AceTarget, parent: string): void {
    const childPrincipal = this.resolvePrincipal(child);
    ExecuteCommand(`add_principal ${childPrincipal} ${parent}`);

    Logger.debug(`[ACL] Add Principal: ${childPrincipal} inherits ${parent}`);
  }

  /**
   * Remove a principal inheritance.
   */
  static removePrincipal(child: AceTarget, parent: string): void {
    const childPrincipal = this.resolvePrincipal(child);
    ExecuteCommand(`remove_principal ${childPrincipal} ${parent}`);

    Logger.debug(`[ACL] Remove Principal: ${childPrincipal} removed from ${parent}`);
  }

  /**
   * Helper: Add a player to a specific group.
   */
  static addPlayerToGroup(source: number, group: string): void {
    // Ensure 'group.' prefix exists to avoid common mistakes
    const groupName = group.startsWith('group.') ? group : `group.${group}`;
    this.addPrincipal(source, groupName);
  }

  /**
   * Helper: Remove a player from a specific group.
   */
  static removePlayerFromGroup(source: number, group: string): void {
    const groupName = group.startsWith('group.') ? group : `group.${group}`;
    this.removePrincipal(source, groupName);
  }

  /**
   * Check if a player source has a specific Ace permission.
   * NOTE: This native only works for active player sources.
   */
  static hasPermission(source: number, ace: string): boolean {
    return IsPlayerAceAllowed(source.toString(), ace);
  }

  /**
   * Check if a player is a member of a specific group.
   * Note: This checks if they inherit the group principal.
   */
  static isPlayerInGroup(source: number, group: string): boolean {
    const groupName = group.startsWith('group.') ? group : `group.${group}`;
    return IsPlayerAceAllowed(source.toString(), groupName);
  }
}
