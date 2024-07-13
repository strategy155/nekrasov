import { DirectEditorProps, EditorView } from "prosemirror-view";
import { EditorState, EditorStateConfig } from "prosemirror-state";
import { ruzettPlugins } from "./plugins";
import { ruzettSchema } from "./schema";
import { DOMSerializer, Node as ProsemirrorNode } from "prosemirror-model";
import { ruzettTokens, MarkdownParser } from "./markdown/parser";
import {
  ruzettMarksSerializing,
  ruzettNodesSerializing,
  MarkdownSerializer,
} from "./markdown/serializer";
import { fixTables } from "prosemirror-tables";
import MarkdownIt from "markdown-it";
import "./editor.css";
import { tabBar } from "../renderer";

const MARKDOWN_PARSER_PRESET = "commonmark";
const IS_HTML_ENABLED = true;
const MARKDOWN_PARSER_DEFAULT_OPTIONS: MarkdownIt["options"] = {
  html: IS_HTML_ENABLED,
};

const ADD_TO_HISTORY_TRANSACTION_META = "addToHistory";

/**
 * This is a Prosemirror based ruzett app editor. It has many different features, but I'll list only basics
 * Basic markdown serializing and parsing, and some html support.
 */
class RuzettEditor {
  /** This property is containing currentPM editor view of an editor*/
  view: EditorView;
  /** This property contains parser of textual markdown to PM document */
  mdParser: MarkdownParser;
  /** This property is a serializer which takes PM Document and creates a textual representation with mixed
   * HTML and MD
   */
  mdSerializer: MarkdownSerializer;

  /** This is a DOM serializer, which is used by the markdown serializer to create an html blocks */
  DOMSerializer: DOMSerializer;

  /** Providing a binding for the tabbar of an app */
  tabOpener: tabBar;

  /**
   *
   * @param target  it is an html element, to which the editor will be connected
   * @param content this is a string representation of a content, if it is existent
   */
  constructor(
    public readonly target: HTMLElement,
    content: string,
    tabOpener: tabBar
  ) {
    // creating a serializer from the schema
    // #TODO: probably should be revised
    this.DOMSerializer = DOMSerializer.fromSchema(ruzettSchema);

    // getting a tab opener for easifying linkage of the pages with editors in the internal linsk
    this.tabOpener = tabOpener;

    // initializing markdown parser and markdown serializer based on the settings of an editor
    const markdownITParser = MarkdownIt(
      MARKDOWN_PARSER_PRESET,
      MARKDOWN_PARSER_DEFAULT_OPTIONS
    );
    this.mdParser = new MarkdownParser(
      ruzettSchema,
      markdownITParser,
      ruzettTokens
    );
    this.mdSerializer = new MarkdownSerializer(
      ruzettNodesSerializing,
      ruzettMarksSerializing,
      this.DOMSerializer
    );

    // creating initial document by parsing its content, ensuring it contains node
    const initialDoc = this.mdParser.parse(content) as ProsemirrorNode;

    // initializing plugins for the editor
    const pluginOptions = {
      schema: ruzettSchema,
      tabOpener: this.tabOpener,
    };
    const initialPlugins = ruzettPlugins(pluginOptions);

    // creating an editor state
    const editorConfig: EditorStateConfig = {
      doc: initialDoc,
      plugins: initialPlugins,
    };
    let state = EditorState.create(editorConfig);

    // creating a fix transaction for tables if needed (a heads up for the creator of the pm tables)
    const fixTransaction = fixTables(state);
    if (fixTransaction) {
      const fixTransactionNoHistory = fixTransaction.setMeta(
        ADD_TO_HISTORY_TRANSACTION_META,
        false
      );
      state = state.apply(fixTransactionNoHistory);
    }

    // finally creating the view of an editor by a configuration
    const editorViewProps: DirectEditorProps = {
      state: state,
    };
    this.view = new EditorView(target, editorViewProps);
  }

  /** This method returns markdown representation of an editor right now right here */
  get getMarkdown() {
    const currentDoc = this.view.state.doc;
    return this.mdSerializer.serialize(currentDoc);
  }

  focus() {
    this.view.focus();
  }
  destroy() {
    this.view.destroy();
  }
}

export default RuzettEditor;
