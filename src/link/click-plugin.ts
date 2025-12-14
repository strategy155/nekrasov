/**
 * Nekrasov Editor - Link Click Plugin
 *
 * Handles link click events within the editor, opening links in new tabs
 * when the user Ctrl+clicks or Cmd+clicks on them.
 */

import { Plugin, PluginSpec } from "prosemirror-state";
import { EditorProps, EditorView, DOMEventMap } from "prosemirror-view";
import { TabOpener, getPlatformAPI } from "../types";
import { PROTOCOLS, LINK_OPENER_PLUGIN_KEY } from "../constants";
import { getLinkView } from "./node-view";

/**
 * Checks if an element is an HTML anchor element.
 */
function isAnchorElement(element: EventTarget | null): element is HTMLAnchorElement {
  return element instanceof HTMLAnchorElement;
}

/**
 * Checks if a click event should trigger link opening.
 * Links open on Ctrl+click (Windows/Linux) or Cmd+click (Mac).
 */
function isLinkOpenTrigger(event: MouseEvent): boolean {
  return event.ctrlKey || event.metaKey;
}

/**
 * Handles the opening of file:// protocol links.
 *
 * @param href - The full URL of the file link
 * @param tabOpener - The tab opener to use for opening the link
 */
async function handleFileProtocolLink(href: URL, tabOpener: TabOpener): Promise<void> {
  const platformAPI = getPlatformAPI();
  const userInfo = await platformAPI.getUserInfo();

  let filePath = href.pathname;

  // Windows paths from URLs start with / which needs to be removed
  const isWindowsPath = filePath.startsWith("/") && userInfo.osType === "win32";
  if (isWindowsPath) {
    filePath = filePath.substring(1);
  }

  const decodedPath = decodeURI(filePath);
  const parsedPath = platformAPI.parsePath(decodedPath);

  tabOpener.addTabWithParams(
    decodedPath,
    null,
    parsedPath.name + parsedPath.ext,
    parsedPath.ext
  );
}

/**
 * Handles the opening of web protocol links (http/https).
 *
 * @param href - The full URL of the web link
 * @param tabOpener - The tab opener to use for opening the link
 */
function handleWebProtocolLink(href: URL, tabOpener: TabOpener): void {
  tabOpener.addTabWithParams(null, href.toString());
}

/**
 * Click event handler for links within the editor.
 *
 * Opens links in new tabs when the user Ctrl+clicks (or Cmd+clicks on Mac).
 * Handles both file:// and http(s):// protocols.
 *
 * @param view - The ProseMirror editor view
 * @param clickEvent - The mouse click event
 * @returns true if the event was handled, false otherwise
 */
function handleLinkClick(view: EditorView, clickEvent: DOMEventMap["click"]): boolean {
  const clickedElement = clickEvent.target;

  if (!isAnchorElement(clickedElement)) {
    return false;
  }

  if (!isLinkOpenTrigger(clickEvent)) {
    return false;
  }

  // Get the tab opener from the plugin configuration
  const pluginState = LINK_OPENER_PLUGIN_KEY.get(view.state);
  const tabOpener = pluginState?.spec.tabOpener as TabOpener | undefined;

  if (tabOpener === undefined) {
    console.warn("Nekrasov: No tab opener configured for link handling");
    return false;
  }

  // Parse and handle the URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(clickedElement.href);
  } catch {
    console.warn("Nekrasov: Invalid URL in link:", clickedElement.href);
    return false;
  }

  // Route to appropriate handler based on protocol
  if (parsedUrl.protocol === PROTOCOLS.FILE) {
    handleFileProtocolLink(parsedUrl, tabOpener).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Nekrasov: Failed to open file link:", errorMessage);
    });
  } else {
    handleWebProtocolLink(parsedUrl, tabOpener);
  }

  clickEvent.preventDefault();
  clickEvent.stopImmediatePropagation();
  return true;
}

/**
 * Plugin state interface for the link click handler.
 */
interface LinkClickPluginState {}

/**
 * Creates a ProseMirror plugin for handling link clicks.
 *
 * @param tabOpener - The tab opener implementation for opening links
 * @returns A ProseMirror plugin configured for link click handling
 */
export function getClickLinkPlugin(tabOpener: TabOpener): Plugin {
  const domEventHandlers: EditorProps["handleDOMEvents"] = {
    click: handleLinkClick,
  };

  const nodeViews: EditorProps["nodeViews"] = {
    link: getLinkView,
  };

  const editorProps: EditorProps = {
    handleDOMEvents: domEventHandlers,
    nodeViews: nodeViews,
  };

  const pluginSpec: PluginSpec<LinkClickPluginState> = {
    props: editorProps,
    tabOpener: tabOpener,
    key: LINK_OPENER_PLUGIN_KEY,
  };

  return new Plugin(pluginSpec);
}

export { getClickLinkPlugin as getNekrasovLinkPlugin };
