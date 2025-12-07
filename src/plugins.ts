import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";
import { Plugin } from "prosemirror-state";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { menuBar, MenuItem } from "prosemirror-menu";
import { Schema } from "prosemirror-model";

import { buildMenuItems } from "./menu/builder";
import { buildKeymap } from "./keymap";
import { buildInputRules } from "./inputrules";
import { getClickLinkPlugin } from "./link/click-plugin";
import { columnResizing, tableEditing } from "prosemirror-tables";
import { TabOpener } from "./types";

export { buildMenuItems, buildKeymap, buildInputRules };

/**
 * Plugin options for configuring the editor.
 */
export interface PluginOptions {
  /** The schema to generate key bindings and menu items for. */
  schema: Schema;

  /** Tab opener for handling link clicks */
  tabOpener: TabOpener;

  /** Can be used to adjust the key bindings created. */
  mapKeys?: { [key: string]: string | false };

  /** Set to false to disable the menu bar. */
  menuBar?: boolean;

  /** Set to false to disable the history plugin. */
  history?: boolean;

  /** Set to false to make the menu bar non-floating. */
  floatingMenu?: boolean;

  /** Can be used to override the menu content. */
  menuContent?: MenuItem[][];
}

/**
 * Creates an array of plugins pre-configured for the given schema.
 * The resulting array will include the following plugins:
 *
 *  - Input rules for smart quotes and creating the block types in the
 *    schema using markdown conventions (say `"> "` to create a blockquote)
 *
 *  - A keymap that defines keys to create and manipulate the nodes in the schema
 *
 *  - A keymap binding the default keys provided by the prosemirror-commands module
 *
 *  - The undo history plugin
 *
 *  - The drop cursor plugin
 *
 *  - The gap cursor plugin
 *
 *  - A menu bar with formatting options
 *
 *  - Table editing plugins
 *
 * @param options - Configuration options for the plugins
 * @returns Array of ProseMirror plugins
 */
export function ruzettPlugins(options: PluginOptions): Plugin[] {
  const plugins: Plugin[] = [
    buildInputRules(options.schema),
    keymap(buildKeymap(options.schema, options.mapKeys)),
    keymap(baseKeymap),
    dropCursor(),
    gapCursor(),
    getClickLinkPlugin(options.tabOpener),
    // Table plugins
    columnResizing(),
    tableEditing(),
  ];

  if (options.menuBar !== false) {
    plugins.push(
      menuBar({
        floating: options.floatingMenu !== false,
        content: options.menuContent || buildMenuItems(options.schema).fullMenu,
      })
    );
  }

  if (options.history !== false) {
    plugins.push(history());
  }

  // Add a plugin that sets up CSS classes for styling
  plugins.push(
    new Plugin({
      props: {
        attributes: { class: "ProseMirror-nekrasov-style" },
      },
    })
  );

  return plugins;
}
