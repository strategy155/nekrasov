/**
 * Application-wide constants for the Nekrasov Editor.
 *
 * This module centralizes all magic strings, configuration values,
 * and constant definitions used throughout the editor.
 */

import { PluginKey } from "prosemirror-state";

// =============================================================================
// CSS Selector Utilities
// =============================================================================

/**
 * Creates a CSS attribute selector for a given element and attribute.
 * Provides a modular way to construct selectors consistently.
 *
 * @example
 * createAttributeSelector('a', 'href') // returns 'a[href]'
 * createAttributeSelector('img', 'src') // returns 'img[src]'
 */
export const createAttributeSelector = (element: string, attribute: string): string =>
  `${element}[${attribute}]`;

// =============================================================================
// Protocol Constants
// =============================================================================

/**
 * URL protocol identifiers used for link type detection.
 */
export const PROTOCOLS = {
  /** Local file system protocol */
  FILE: "file:",
  /** Secure HTTP protocol */
  HTTPS: "https:",
  /** Standard HTTP protocol */
  HTTP: "http:",
} as const;

// Legacy export for backwards compatibility
export const FILE_PROTOCOL_IDENTIFIER = PROTOCOLS.FILE;

// =============================================================================
// Link Constants
// =============================================================================

/**
 * CSS selector for anchor elements with href attribute.
 * Used for identifying clickable links in the document.
 */
export const LINK_CSS_SELECTOR = createAttributeSelector("a", "href");

/**
 * Link node attribute definitions for the ProseMirror schema.
 * Defines the structure and defaults for link node attributes.
 */
export const LINK_ATTRS = {
  /** The URL/path the link points to (required) */
  href: {},
  /** Optional tooltip title for the link */
  title: { default: null },
  /** Optional display name for the link */
  name: { default: null },
  /** Whether the link should render as an embedded preview */
  isRendered: { default: false },
} as const;

/**
 * ProseMirror plugin key for the link opener functionality.
 * Used to access the link plugin state and configuration.
 */
export const LINK_OPENER_PLUGIN_KEY = new PluginKey("linkOpener");

// Legacy export for backwards compatibility
export const URL_OPENER_PLUGIN_KEY = LINK_OPENER_PLUGIN_KEY;

// =============================================================================
// Table Command Names
// =============================================================================

/**
 * Command labels for table operations.
 * These are displayed in menus and tooltips.
 */
export const TABLE_COMMANDS = {
  CREATE: "Create table",
  ADD_COLUMN_BEFORE: "Add column before",
  ADD_COLUMN_AFTER: "Add column after",
  DELETE_COLUMN: "Delete column",
  ADD_ROW_BEFORE: "Add row before",
  ADD_ROW_AFTER: "Add row after",
  DELETE_ROW: "Delete row",
  DELETE_TABLE: "Delete table",
  MERGE_CELLS: "Merge cells",
  SPLIT_CELL: "Split cell",
  TOGGLE_HEADER_COLUMN: "Toggle header column",
  TOGGLE_HEADER_ROW: "Toggle header row",
  TOGGLE_HEADER_CELLS: "Toggle header cells",
} as const;

// Legacy exports for backwards compatibility
export const CREATE_TABLE_CMD_NAME = TABLE_COMMANDS.CREATE;
export const ADD_COLUMN_BEFORE_CMD_NAME = TABLE_COMMANDS.ADD_COLUMN_BEFORE;
export const ADD_COLUMN_AFTER_CMD_NAME = TABLE_COMMANDS.ADD_COLUMN_AFTER;
export const DELETE_COLUMN_CMD_NAME = TABLE_COMMANDS.DELETE_COLUMN;
export const ADD_ROW_BEFORE_CMD_NAME = TABLE_COMMANDS.ADD_ROW_BEFORE;
export const ADD_ROW_AFTER_CMD_NAME = TABLE_COMMANDS.ADD_ROW_AFTER;
export const DELETE_ROW_CMD_NAME = TABLE_COMMANDS.DELETE_ROW;
export const DELETE_TABLE_CMD_NAME = TABLE_COMMANDS.DELETE_TABLE;
export const MERGE_CELLS_CMD_NAME = TABLE_COMMANDS.MERGE_CELLS;
export const SPLIT_CELL_CMD_NAME = TABLE_COMMANDS.SPLIT_CELL;
export const TOGGLE_HEADER_COLUMN_CMD_NAME = TABLE_COMMANDS.TOGGLE_HEADER_COLUMN;
export const TOGGLE_HEADER_ROW_CMD_NAME = TABLE_COMMANDS.TOGGLE_HEADER_ROW;
export const TOGGLE_HEADER_CELLS_CMD_NAME = TABLE_COMMANDS.TOGGLE_HEADER_CELLS;

// =============================================================================
// Editor Configuration Defaults
// =============================================================================

/**
 * Default configuration values for the editor.
 */
export const EDITOR_DEFAULTS = {
  /** Whether to show the menu bar */
  SHOW_MENU_BAR: true,
  /** Whether the menu should float */
  FLOATING_MENU: true,
  /** Initial empty content */
  EMPTY_CONTENT: "",
} as const;

/**
 * Markdown parser configuration.
 */
export const MARKDOWN_CONFIG = {
  /** Parser preset mode */
  PRESET: "commonmark",
  /** Whether to allow HTML in markdown */
  HTML_ENABLED: true,
} as const;

/**
 * ProseMirror transaction metadata keys.
 */
export const TRANSACTION_META = {
  /** Key to control whether a transaction is added to history */
  ADD_TO_HISTORY: "addToHistory",
} as const;
