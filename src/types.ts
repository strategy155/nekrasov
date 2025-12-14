/**
 * Interface for opening new tabs/windows in the host application.
 * This abstraction allows the editor to work in different environments
 * (Electron, web browser, etc.) by providing platform-specific implementations.
 */
export interface TabOpener {
  /**
   * Opens a new tab with the specified parameters.
   * @param path - Local file path (for file:// links)
   * @param url - Web URL (for http:// or https:// links)
   * @param name - Optional display name for the tab
   * @param ext - Optional file extension
   */
  addTabWithParams(
    path: string | null,
    url: string | null,
    name?: string,
    ext?: string
  ): void;
}

/**
 * Interface for parsed path information.
 */
export interface ParsedPath {
  name: string;
  ext: string;
  dir: string;
  base: string;
}

/**
 * Interface for user/environment information.
 */
export interface UserInfo {
  osType: "win32" | "darwin" | "linux";
}

/**
 * Interface for platform-specific APIs.
 * Implementations can be provided for Electron, web, or other environments.
 */
export interface PlatformAPI {
  /**
   * Get user/environment information
   */
  getUserInfo(): Promise<UserInfo>;

  /**
   * Parse a file path into its components
   */
  parsePath(path: string): ParsedPath;

  /**
   * Open a file picker dialog and return the selected path
   */
  getFilepath(): Promise<string>;
}

/**
 * Interface for content opener used in rendered link previews.
 */
export interface ContentOpener {
  /**
   * Get content element for the given parameters
   */
  getContent(params: { path?: string; url?: string }): HTMLElement;
}

/**
 * Default no-op TabOpener for environments where tab opening is not supported.
 */
export const noopTabOpener: TabOpener = {
  addTabWithParams(path, url, name, ext) {
    // In web browsers, simply open the URL in a new window
    if (url) {
      window.open(url, "_blank");
    } else if (path) {
      console.warn("File path opening not supported in this environment:", path);
    }
  },
};

/**
 * Default PlatformAPI for web environments.
 */
export const webPlatformAPI: PlatformAPI = {
  async getUserInfo() {
    // Detect OS from user agent
    const ua = navigator.userAgent.toLowerCase();
    let osType: UserInfo["osType"] = "linux";
    if (ua.includes("win")) osType = "win32";
    else if (ua.includes("mac")) osType = "darwin";
    return { osType };
  },

  parsePath(path: string) {
    const parts = path.split("/");
    const base = parts.pop() || "";
    const extMatch = base.match(/\.([^.]+)$/);
    return {
      name: extMatch ? base.slice(0, -extMatch[0].length) : base,
      ext: extMatch ? extMatch[1] : "",
      dir: parts.join("/"),
      base,
    };
  },

  async getFilepath() {
    // In web environment, we can use the File System Access API if available
    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker();
        return handle.name;
      } catch (e) {
        throw new Error("File picker cancelled or not supported");
      }
    }
    throw new Error("File picker not available in this environment");
  },
};

/**
 * Default ContentOpener for web environments.
 */
export class WebContentOpener implements ContentOpener {
  constructor(private container: HTMLElement) {}

  getContent(params: { path?: string; url?: string }): HTMLElement {
    const el = document.createElement("div");
    el.className = "link-preview";

    if (params.url) {
      // For web URLs, create an iframe preview
      const iframe = document.createElement("iframe");
      iframe.src = params.url;
      iframe.style.width = "100%";
      iframe.style.height = "200px";
      iframe.style.border = "1px solid #ccc";
      el.appendChild(iframe);
    } else if (params.path) {
      // For file paths, show a placeholder
      el.textContent = `File: ${params.path}`;
    }

    return el;
  }
}

// Global platform API instance - can be overridden by host application
let platformAPI: PlatformAPI = webPlatformAPI;

/**
 * Set the platform API implementation.
 * Call this early in your application to provide Electron or other platform-specific APIs.
 */
export function setPlatformAPI(api: PlatformAPI): void {
  platformAPI = api;
}

/**
 * Get the current platform API.
 */
export function getPlatformAPI(): PlatformAPI {
  return platformAPI;
}
