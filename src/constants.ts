import { PluginKey } from "prosemirror-state";
import { Attrs } from "prosemirror-model";

// Link-related constants
export const FILE_PROTOCOL_IDENTIFIER = "file:";
export const LINK_CSS_SELECTOR = "a[href]";

// Link node attributes specification
export const LINK_ATTRS: { [name: string]: { default?: any } } = {
  href: {},
  title: { default: null },
  name: { default: null },
  isRendered: { default: false },
};

// Plugin key for link opener functionality
export const URL_OPENER_PLUGIN_KEY = new PluginKey("linkOpener");

// Table command names
export const CREATE_TABLE_CMD_NAME = "Create table";
export const ADD_COLUMN_BEFORE_CMD_NAME = "Add column before";
export const ADD_COLUMN_AFTER_CMD_NAME = "Add column after";
export const DELETE_COLUMN_CMD_NAME = "Delete column";
export const ADD_ROW_BEFORE_CMD_NAME = "Add row before";
export const ADD_ROW_AFTER_CMD_NAME = "Add row after";
export const DELETE_ROW_CMD_NAME = "Delete row";
export const DELETE_TABLE_CMD_NAME = "Delete table";
export const MERGE_CELLS_CMD_NAME = "Merge cells";
export const SPLIT_CELL_CMD_NAME = "Split cell";
export const TOGGLE_HEADER_COLUMN_CMD_NAME = "Toggle header column";
export const TOGGLE_HEADER_ROW_CMD_NAME = "Toggle header row";
export const TOGGLE_HEADER_CELLS_CMD_NAME = "Toggle header cells";
