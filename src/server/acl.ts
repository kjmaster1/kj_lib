export class ACL {
  /**
   * Add an ace permission to a principal
   * @param principal The target (e.g., 'group.admin' or player handle)
   * @param ace The permission node (e.g., 'command.noclip')
   * @param allow Whether to allow or deny
   */
  static addAce(principal: string | number, ace: string, allow: boolean = true) {
    const target = typeof principal === 'number' ? `player.${principal}` : principal;
    ExecuteCommand(`add_ace ${target} ${ace} ${allow ? 'allow' : 'deny'}`);
  }

  /**
   * Remove an ace permission
   */
  static removeAce(principal: string | number, ace: string, allow: boolean = true) {
    const target = typeof principal === 'number' ? `player.${principal}` : principal;
    ExecuteCommand(`remove_ace ${target} ${ace} ${allow ? 'allow' : 'deny'}`);
  }

  /**
   * Add a principal inheritance
   * @param child The inheriting principal
   * @param parent The parent principal
   */
  static addPrincipal(child: string | number, parent: string) {
    const target = typeof child === 'number' ? `player.${child}` : child;
    ExecuteCommand(`add_principal ${target} ${parent}`);
  }

  static removePrincipal(child: string | number, parent: string) {
    const target = typeof child === 'number' ? `player.${child}` : child;
    ExecuteCommand(`remove_principal ${target} ${parent}`);
  }

  /**
   * Check if a source has a specific Ace permission
   */
  static isAllowed(source: number | string, object: string): boolean {
    return IsPlayerAceAllowed(source.toString(), object);
  }
}
