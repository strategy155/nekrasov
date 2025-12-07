import { Plugin, PluginSpec } from "prosemirror-state";
import { EditorProps, EditorView, DOMEventMap } from "prosemirror-view";
import { TabOpener, getPlatformAPI } from "../types";
import {
  FILE_PROTOCOL_IDENTIFIER,
  URL_OPENER_PLUGIN_KEY as LINK_PLUGIN_KEY,
} from "../constants";
import { getLinkView } from "./node-view";

/**
 * Handles click events on anchor elements within the editor.
 * Opens links in new tabs when Ctrl+click is used.
 *
 * @param view - The ProseMirror editor view
 * @param event - The click event
 */
function openNewTab(view: EditorView, event: DOMEventMap["click"]): boolean {
  const eventTargetNode = event.target;

  // Check if the target is a link element
  if (eventTargetNode instanceof HTMLAnchorElement) {
    // Only handle Ctrl+click
    if (event.ctrlKey || event.metaKey) {
      console.log("Link clicked, href:", eventTargetNode.href);

      // Get the click plugin from the current state to access the tabOpener
      const currentState = view.state;
      const openerPlugin = LINK_PLUGIN_KEY.get(currentState);
      const tabOpener = openerPlugin?.spec.tabOpener as TabOpener | undefined;

      if (!tabOpener) {
        console.warn("No tab opener available");
        return false;
      }

      try {
        const urlifiedHREF = new URL(eventTargetNode.href);

        // Handle file:// protocol links
        if (urlifiedHREF.protocol === FILE_PROTOCOL_IDENTIFIER) {
          let rawPath = urlifiedHREF.pathname;
          const platformAPI = getPlatformAPI();

          // Get user info to handle OS-specific path formatting
          platformAPI.getUserInfo().then(
            (userInfo) => {
              // Fix slash-starting paths for Windows
              if (rawPath[0] === "/" && userInfo.osType === "win32") {
                rawPath = rawPath.substring(1);
              }

              const escapedRawPath = decodeURI(rawPath);
              const parsedPath = platformAPI.parsePath(escapedRawPath);

              tabOpener.addTabWithParams(
                escapedRawPath,
                null,
                parsedPath.name + parsedPath.ext,
                parsedPath.ext
              );
            },
            (err: Error) => {
              console.error("Failed to get user info:", err);
            }
          );
        } else {
          // Handle web URLs
          tabOpener.addTabWithParams(null, urlifiedHREF.toString());
        }
      } catch (e) {
        console.error("Failed to parse URL:", e);
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      return true;
    }
  }

  return false;
}

/**
 * Plugin state interface for the link click handler.
 */
interface LinkPluginState {}

/**
 * Creates a ProseMirror plugin for handling link clicks.
 *
 * @param tabOpener - The tab opener implementation for opening links
 * @returns A ProseMirror plugin
 */
export function getClickLinkPlugin(tabOpener: TabOpener): Plugin {
  const linkDOMHandlers: EditorProps["handleDOMEvents"] = {
    click: openNewTab,
  };

  const linkEditorNodeViews: EditorProps["nodeViews"] = {
    link: getLinkView,
  };

  const linkPluginEditorProps: EditorProps = {
    handleDOMEvents: linkDOMHandlers,
    nodeViews: linkEditorNodeViews,
  };

  const linkPluginConf: PluginSpec<LinkPluginState> = {
    props: linkPluginEditorProps,
    tabOpener: tabOpener,
    key: LINK_PLUGIN_KEY,
  };

  return new Plugin(linkPluginConf);
}

export { getClickLinkPlugin as getRuzettLinkPlugin };
