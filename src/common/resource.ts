// src/common/resource.ts

declare var window: {
  GetParentResourceName?: () => string;
} | undefined;

export enum EnvironmentType {
  Game = 'game',
  CEF = 'cef', // In-game NUI
  Browser = 'browser', // External/Dev Browser
}

export enum ResourceContext {
  Server = 'server',
  Client = 'client',
  UI = 'ui',
}

class ResourceEnvironment {
  public readonly type: EnvironmentType;
  public readonly context: ResourceContext;
  public readonly name: string;

  // Convenience Booleans
  public readonly isServer: boolean;
  public readonly isClient: boolean;
  public readonly isUI: boolean;
  public readonly isDevBrowser: boolean;

  constructor() {
    // 1. Detect Context & Type
    const globalWindow = (typeof window !== 'undefined' ? window : null) as any;

    if (globalWindow) {
      // We are in a Web Environment (NUI or Browser)
      this.context = ResourceContext.UI;
      this.isUI = true;
      this.isServer = false;
      this.isClient = false;

      if (typeof globalWindow.GetParentResourceName !== 'undefined') {
        this.type = EnvironmentType.CEF;
        this.name = globalWindow.GetParentResourceName();
        this.isDevBrowser = false;
      } else {
        this.type = EnvironmentType.Browser;
        this.name = 'nui-frame-app'; // Fallback for React DevTools
        this.isDevBrowser = true;
      }
    } else {
      // We are in the Game Environment (Node.js/V8 or Lua)
      this.type = EnvironmentType.Game;
      this.isUI = false;
      this.isDevBrowser = false;

      // IsDuplicityVersion is a FiveM native: True = Server, False = Client
      // We assume this native exists in the game environment.
      const isServer = typeof IsDuplicityVersion === 'function' && IsDuplicityVersion();

      if (isServer) {
        this.context = ResourceContext.Server;
        this.isServer = true;
        this.isClient = false;
      } else {
        this.context = ResourceContext.Client;
        this.isServer = false;
        this.isClient = true;
      }

      this.name = GetCurrentResourceName();
    }
  }
}

// Export a singleton instance to maintain ease of use
export const Resource = new ResourceEnvironment();
