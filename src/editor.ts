import { DirectEditorProps, EditorView } from "prosemirror-view";
import { EditorState, EditorStateConfig } from "prosemirror-state";
import { ruzettPlugins } from "./plugins";
import { ruzettSchema } from "./schema";
import { DOMSerializer, Node as ProsemirrorNode, Schema } from "prosemirror-model";
import { ruzettTokens, MarkdownParser } from "./markdown/parser";
import {
  ruzettMarksSerializing,
  ruzettNodesSerializing,
  MarkdownSerializer,
} from "./markdown/serializer";
import { fixTables } from "prosemirror-tables";
import MarkdownIt from "markdown-it";
import { TabOpener, noopTabOpener } from "./types";
import "./editor.css";

const MARKDOWN_PARSER_PRESET = "commonmark";
const IS_HTML_ENABLED = true;
const MARKDOWN_PARSER_DEFAULT_OPTIONS = {
  html: IS_HTML_ENABLED,
};

const ADD_TO_HISTORY_TRANSACTION_META = "addToHistory";

/**
 * Configuration options for creating a NekrasovEditor instance.
 */
export interface EditorOptions {
  /** The DOM element to attach the editor to */
  target: HTMLElement;
  /** Initial markdown content */
  content?: string;
  /** Tab opener implementation for handling link clicks */
  tabOpener?: TabOpener;
  /** Whether to show the menu bar (default: true) */
  menuBar?: boolean;
  /** Whether the menu bar should float (default: true) */
  floatingMenu?: boolean;
  /** Custom schema (default: ruzettSchema) */
  schema?: Schema;
}

/**
 * NekrasovEditor - A modern ProseMirror-based text editor with Markdown support.
 *
 * Features:
 * - Markdown parsing and serialization
 * - Rich text editing with ProseMirror
 * - Table support
 * - Link handling (both web URLs and file paths)
 * - Extensible plugin system
 */
class NekrasovEditor {
  /** The ProseMirror EditorView instance */
  view: EditorView;
  /** Markdown parser for converting text to ProseMirror documents */
  mdParser: MarkdownParser;
  /** Markdown serializer for converting ProseMirror documents to text */
  mdSerializer: MarkdownSerializer;
  /** DOM serializer for HTML output */
  DOMSerializer: DOMSerializer;
  /** The schema used by this editor */
  schema: Schema;
  /** Tab opener for handling link clicks */
  tabOpener: TabOpener;

  /**
   * Creates a new NekrasovEditor instance.
   *
   * @param options - Configuration options for the editor
   *
   * @example
   * ```typescript
   * const editor = new NekrasovEditor({
   *   target: document.getElementById('editor'),
   *   content: '# Hello World\n\nThis is some **bold** text.',
   * });
   * ```
   */
  constructor(options: EditorOptions) {
    const {
      target,
      content = "",
      tabOpener = noopTabOpener,
      menuBar = true,
      floatingMenu = true,
      schema = ruzettSchema,
    } = options;

    this.schema = schema;
    this.tabOpener = tabOpener;

    // Create DOM serializer from schema
    this.DOMSerializer = DOMSerializer.fromSchema(this.schema);

    // Initialize markdown parser
    const markdownITParser = MarkdownIt(
      MARKDOWN_PARSER_PRESET,
      MARKDOWN_PARSER_DEFAULT_OPTIONS
    );
    this.mdParser = new MarkdownParser(
      this.schema,
      markdownITParser,
      ruzettTokens
    );

    // Initialize markdown serializer
    this.mdSerializer = new MarkdownSerializer(
      ruzettNodesSerializing,
      ruzettMarksSerializing,
      this.DOMSerializer
    );

    // Parse initial content
    const initialDoc = this.mdParser.parse(content) as ProsemirrorNode;

    // Build plugins
    const pluginOptions = {
      schema: this.schema,
      tabOpener: this.tabOpener,
      menuBar,
      floatingMenu,
    };
    const initialPlugins = ruzettPlugins(pluginOptions);

    // Create editor state
    const editorConfig: EditorStateConfig = {
      doc: initialDoc,
      plugins: initialPlugins,
    };
    let state = EditorState.create(editorConfig);

    // Fix tables if needed
    const fixTransaction = fixTables(state);
    if (fixTransaction) {
      const fixTransactionNoHistory = fixTransaction.setMeta(
        ADD_TO_HISTORY_TRANSACTION_META,
        false
      );
      state = state.apply(fixTransactionNoHistory);
    }

    // Create the editor view
    const editorViewProps: DirectEditorProps = {
      state: state,
    };
    this.view = new EditorView(target, editorViewProps);
  }

  /**
   * Gets the current content as Markdown.
   */
  getMarkdown(): string {
    const currentDoc = this.view.state.doc;
    return this.mdSerializer.serialize(currentDoc);
  }

  /**
   * Sets the editor content from Markdown.
   *
   * @param markdown - The markdown content to load
   */
  setContent(markdown: string): void {
    const doc = this.mdParser.parse(markdown) as ProsemirrorNode;
    const newState = EditorState.create({
      doc,
      plugins: this.view.state.plugins,
    });
    this.view.updateState(newState);
  }

  /**
   * Focuses the editor.
   */
  focus(): void {
    this.view.focus();
  }

  /**
   * Destroys the editor and cleans up resources.
   */
  destroy(): void {
    this.view.destroy();
  }

  /**
   * Gets the current ProseMirror state.
   */
  get state(): EditorState {
    return this.view.state;
  }
}

// Keep backward compatibility with the old class name
export { NekrasovEditor as RuzettEditor };
export default NekrasovEditor;
