import { Plugin, PluginSpec } from "prosemirror-state";
import { EditorProps, EditorView, DOMEventMap } from "prosemirror-view";
import { tabBar } from "../../renderer";
import {
  FILE_PROTOCOL_IDENTIFIER,
  URL_OPENER_PLUGIN_KEY as LINK_PLUGIN_KEY,
} from "../../constants";
import { getLinkView } from "./node-view";

// #TODO: this probably shoudl be rewritten to fully inside PM logic, because this seems nongood
/**
 * This sync function is handling dom event click, checking that it clicked the anchor element,
 * and then checks that it was done with a ctrl key, and then opens new tab!
 * @param view , provides current editor view
 * @param event , provides event which was triggered
 */
function openNewTab(view: EditorView, event: DOMEventMap["click"]) {
  // getting a target
  const eventTargetNode = event.target;

  console.log(event);

  // checking the instance of the target is a link element
  if (eventTargetNode instanceof HTMLAnchorElement) {
    // if the ctrl key is pressed, we deal with it
    if (event.ctrlKey) {
      // logging information
      console.log("link is pressed, its href is: ", eventTargetNode.href);

      // getting the view state
      const currentState = view.state;

      // getting the click plugin from the current state to access the tabbar from spec
      const openerPlugin = LINK_PLUGIN_KEY.get(currentState);

      // getting the tabopener from the spec if everything is defined
      const tabOpener = openerPlugin?.spec.tabOpener as tabBar;

      // now we urlify the anchor element contents
      const urlfiedHREF = new URL(eventTargetNode.href);

      // if the url leads to file -- open like a file
      if (urlfiedHREF.protocol === FILE_PROTOCOL_IDENTIFIER) {
        // getting the path and parsing it by providing the call to the electron main
        let rawPath = urlfiedHREF.pathname as string;

        // getting information as a promis about the system to make grand slash substitution
        const userInfoPromise = window.electronAPI.getUserInfo();

        // building a promise, which depends if the user info is gotten. if no, throw error.
        userInfoPromise.then(
          (userInfo) => {
            // fixing slash starting paths for windows
            if (rawPath[0] == "/" && userInfo.osType == "win32") {
              rawPath = rawPath.substring(1);
            }

            const escapedRawPath = decodeURI(rawPath);

            // getting information about the opened file
            const parsedPath = window.electronAPI.parsePath(escapedRawPath);

            // openinng with needed info
            tabOpener.addTabWithParams(
              escapedRawPath,
              null,
              parsedPath.name + parsedPath.ext,
              parsedPath.ext
            );
          },
          (err: Error) => {
            throw err;
          }
        );
      } else {
        console.log(urlfiedHREF);
        // if the anchor leads to web, the opening is much easier
        tabOpener.addTabWithParams(null, urlfiedHREF.toString());
      }

      // we should not forget preventing the default
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}

/**
 * This function creates a plugin for opening links, which gets a tabopener to open new tabs for links
 * @param tabOpener, a tabBar instance which allows opening tabs
 * @returns plugin, which can be used in PM editor
 */
function getRuzettLinkPlugin(tabOpener: tabBar): Plugin {
  // handling the click events with a dedicated handler, using the handleDOMEvents type
  const linkDOMHandlers: EditorProps["handleDOMEvents"] = {
    click: openNewTab,
  };

  // adding the link node view
  const linkEditorNodeViews: EditorProps["nodeViews"] = {
    link: getLinkView,
  };

  // adding this handler  to the new editor props, which will be passed to the plugin
  const linkPluginEditorProps: EditorProps = {
    handleDOMEvents: linkDOMHandlers,
    nodeViews: linkEditorNodeViews,
  };

  /**
   * An interface for the click plugin state, now empty
   */
  interface LinkPluginState {}

  // created conf for the plugin spec, providing a tabOpener as an essential functionality
  const linkPluginConf: PluginSpec<LinkPluginState> = {
    props: linkPluginEditorProps,
    tabOpener: tabOpener,
    key: LINK_PLUGIN_KEY,
  };

  // finally initializing the plugin
  const linkPlugin = new Plugin(linkPluginConf);

  //console.log(URLOpenerPlugin)
  return linkPlugin;
}

export { getRuzettLinkPlugin as getClickLinkPlugin };
