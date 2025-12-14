/**
 * Nekrasov Editor - Plugin Configuration Module
 *
 * Creates and configures the ProseMirror plugins used by the editor.
 */

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
  /** The schema to generate key bindings and menu items for */
  schema: Schema;

  /** Tab opener for handling link clicks */
  tabOpener: TabOpener;

  /** Can be used to adjust the key bindings created */
  mapKeys?: { [key: string]: string | false };

  /** Whether the menu bar is enabled (default: true) */
  isMenuBarEnabled?: boolean;

  /** Whether the history plugin is enabled (default: true) */
  isHistoryEnabled?: boolean;

  /** Whether the menu bar should float (default: true) */
  isFloatingMenuEnabled?: boolean;

  /** Can be used to override the menu content */
  menuContent?: MenuItem[][];
}

/**
 * Creates an array of plugins pre-configured for the given schema.
 *
 * Included plugins:
 * - Input rules for smart quotes and markdown conventions
 * - Keymap for editing commands
 * - Base ProseMirror keymap
 * - Undo/redo history
 * - Drop cursor
 * - Gap cursor
 * - Menu bar with formatting options
 * - Table editing
 * - Link click handling
 *
 * @param options - Configuration options for the plugins
 * @returns Array of ProseMirror plugins
 */
export function nekrasovPlugins(options: PluginOptions): Plugin[] {
  const plugins: Plugin[] = [
    buildInputRules(options.schema),
    keymap(buildKeymap(options.schema, options.mapKeys)),
    keymap(baseKeymap),
    dropCursor(),
    gapCursor(),
    getClickLinkPlugin(options.tabOpener),
    columnResizing(),
    tableEditing(),
  ];

  if (options.isMenuBarEnabled !== false) {
    plugins.push(
      menuBar({
        floating: options.isFloatingMenuEnabled !== false,
        content: options.menuContent || buildMenuItems(options.schema).fullMenu,
      })
    );
  }

  if (options.isHistoryEnabled !== false) {
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
