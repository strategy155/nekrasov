/**
 * Nekrasov Editor - Main Editor Module
 *
 * This module provides the main NekrasovEditor class that wraps ProseMirror
 * with Markdown parsing/serialization support.
 */

import { DirectEditorProps, EditorView } from "prosemirror-view";
import { EditorState, EditorStateConfig } from "prosemirror-state";
import { nekrasovPlugins } from "./plugins";
import { nekrasovSchema } from "./schema";
import { DOMSerializer, Node as ProsemirrorNode, Schema } from "prosemirror-model";
import { nekrasovTokens, MarkdownParser } from "./markdown/parser";
import {
  nekrasovMarksSerializing,
  nekrasovNodesSerializing,
  MarkdownSerializer,
} from "./markdown/serializer";
import { fixTables } from "prosemirror-tables";
import MarkdownIt from "markdown-it";
import { TabOpener, noopTabOpener } from "./types";
import { EDITOR_DEFAULTS, MARKDOWN_CONFIG, TRANSACTION_META } from "./constants";
import "./editor.css";

/**
 * Configuration options for creating a NekrasovEditor instance.
 *
 * Only the target element is required. All other options have sensible defaults.
 */
export interface EditorOptions {
  /** The DOM element to attach the editor to (required) */
  target: HTMLElement;

  /** Initial markdown content (default: empty string) */
  content?: string;

  /** Tab opener implementation for handling link clicks (default: opens in new window) */
  tabOpener?: TabOpener;
}

/**
 * NekrasovEditor - A modern ProseMirror-based text editor with Markdown support.
 *
 * @example
 * ```typescript
 * const editor = new NekrasovEditor({
 *   target: document.getElementById('editor')!,
 *   content: '# Hello World',
 * });
 *
 * // Get content as markdown
 * const markdown = editor.getMarkdown();
 *
 * // Cleanup when done
 * editor.destroy();
 * ```
 */
class NekrasovEditor {
  /** The ProseMirror EditorView instance */
  readonly view: EditorView;

  /** Markdown parser for converting text to ProseMirror documents */
  private readonly markdownParser: MarkdownParser;

  /** Markdown serializer for converting ProseMirror documents to text */
  private readonly markdownSerializer: MarkdownSerializer;

  /** DOM serializer for HTML output */
  private readonly domSerializer: DOMSerializer;

  /** The schema used by this editor */
  readonly schema: Schema;

  /**
   * Creates a new NekrasovEditor instance.
   *
   * @param options - Configuration options for the editor
   * @throws {Error} If target element is null or undefined
   */
  constructor(options: EditorOptions) {
    if (!options.target) {
      throw new Error("NekrasovEditor: target element is required");
    }

    const {
      target,
      content = EDITOR_DEFAULTS.EMPTY_CONTENT,
      tabOpener = noopTabOpener,
    } = options;

    this.schema = nekrasovSchema;

    // Create DOM serializer from schema
    this.domSerializer = DOMSerializer.fromSchema(this.schema);

    // Initialize markdown parser with configuration from constants
    const markdownItInstance = MarkdownIt(MARKDOWN_CONFIG.PRESET, {
      html: MARKDOWN_CONFIG.HTML_ENABLED,
    });

    this.markdownParser = new MarkdownParser(
      this.schema,
      markdownItInstance,
      nekrasovTokens
    );

    // Initialize markdown serializer
    this.markdownSerializer = new MarkdownSerializer(
      nekrasovNodesSerializing,
      nekrasovMarksSerializing,
      this.domSerializer
    );

    // Parse initial content - the parser.parse() returns Node | null
    const parsedDocument = this.markdownParser.parse(content);
    const initialDocument = parsedDocument ?? this.schema.topNodeType.createAndFill()!;

    // Build plugins with default configuration
    const plugins = nekrasovPlugins({
      schema: this.schema,
      tabOpener: tabOpener,
      isMenuBarEnabled: EDITOR_DEFAULTS.SHOW_MENU_BAR,
      isFloatingMenuEnabled: EDITOR_DEFAULTS.FLOATING_MENU,
    });

    // Create editor state
    const editorConfig: EditorStateConfig = {
      doc: initialDocument,
      plugins: plugins,
    };
    let state = EditorState.create(editorConfig);

    // Fix tables if needed (handles table normalization)
    const tableFixTransaction = fixTables(state);
    if (tableFixTransaction) {
      const transactionWithoutHistory = tableFixTransaction.setMeta(
        TRANSACTION_META.ADD_TO_HISTORY,
        false
      );
      state = state.apply(transactionWithoutHistory);
    }

    // Create the editor view
    const viewProps: DirectEditorProps = { state };
    this.view = new EditorView(target, viewProps);
  }

  /**
   * Gets the current document content as Markdown.
   *
   * @returns The document serialized as a Markdown string
   */
  getMarkdown(): string {
    return this.markdownSerializer.serialize(this.view.state.doc);
  }

  /**
   * Replaces the editor content with new Markdown.
   *
   * @param markdown - The markdown content to load
   */
  setContent(markdown: string): void {
    const parsedDocument = this.markdownParser.parse(markdown);
    const document = parsedDocument ?? this.schema.topNodeType.createAndFill()!;

    const newState = EditorState.create({
      doc: document,
      plugins: this.view.state.plugins,
    });

    this.view.updateState(newState);
  }

  /**
   * Focuses the editor, placing the cursor at the end.
   */
  focus(): void {
    this.view.focus();
  }

  /**
   * Destroys the editor and cleans up all resources.
   * Call this when removing the editor from the page.
   */
  destroy(): void {
    this.view.destroy();
  }

  /**
   * Gets the current ProseMirror editor state.
   * Useful for advanced operations like custom transactions.
   */
  get state(): EditorState {
    return this.view.state;
  }
}

export default NekrasovEditor;
