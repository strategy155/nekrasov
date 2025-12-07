/**
 * Nekrasov - A modern, pluggable ProseMirror-based text editor
 *
 * @packageDocumentation
 */

// Main editor class
export { default as NekrasovEditor, RuzettEditor, EditorOptions } from "./editor";

// Schema
export { ruzettSchema, RUZETT_SCHEMA_CONFIG, tableRelatedNodeTypes } from "./schema";

// Plugins
export { ruzettPlugins, PluginOptions, buildMenuItems, buildKeymap, buildInputRules } from "./plugins";

// Markdown parsing and serialization
export { MarkdownParser, ruzettTokens } from "./markdown/parser";
export { MarkdownSerializer, ruzettNodesSerializing, ruzettMarksSerializing } from "./markdown/serializer";

// Types and interfaces for extensibility
export {
  TabOpener,
  PlatformAPI,
  ContentOpener,
  ParsedPath,
  UserInfo,
  noopTabOpener,
  webPlatformAPI,
  WebContentOpener,
  setPlatformAPI,
  getPlatformAPI,
} from "./types";

// Prompt/Dialog system
export {
  openPrompt,
  PromptProps,
  Field,
  TextField,
  ExternalLinkField,
  CheckboxField,
  FilepathField,
  SelectField,
} from "./prompt";

// Constants
export {
  FILE_PROTOCOL_IDENTIFIER,
  LINK_CSS_SELECTOR,
  LINK_ATTRS,
  URL_OPENER_PLUGIN_KEY,
  CREATE_TABLE_CMD_NAME,
  ADD_COLUMN_BEFORE_CMD_NAME,
  ADD_COLUMN_AFTER_CMD_NAME,
  DELETE_COLUMN_CMD_NAME,
  ADD_ROW_BEFORE_CMD_NAME,
  ADD_ROW_AFTER_CMD_NAME,
  DELETE_ROW_CMD_NAME,
  DELETE_TABLE_CMD_NAME,
  MERGE_CELLS_CMD_NAME,
  SPLIT_CELL_CMD_NAME,
  TOGGLE_HEADER_COLUMN_CMD_NAME,
  TOGGLE_HEADER_ROW_CMD_NAME,
  TOGGLE_HEADER_CELLS_CMD_NAME,
} from "./constants";

// Link-related exports
export { LINK_SPEC } from "./link/node-spec";
export { getClickLinkPlugin, getRuzettLinkPlugin } from "./link/click-plugin";
export { getLinkView } from "./link/node-view";
export { getExternalLinkItem, getFilepathLinkItem } from "./link/menu-item";

// Table-related exports
export { createTable } from "./table/commands";
export { getTableBySize } from "./table/table";

// CSS imports (will be bundled by rollup)
import "./editor.css";
import "./table/table.css";
