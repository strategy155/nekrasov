import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import { nekrasovSchema } from "../schema";
import {
  Mark,
  MarkType,
  Node,
  Attrs,
  Schema,
  NodeType,
  Fragment,
  DOMParser as ProsemirrorDOMParser,
} from "prosemirror-model";
import DOMPurify from "dompurify";

const HTML_BLOCK_TOKEN_TYPE = "html_block";
const HTML_MIME_TYPE = "text/html";

function maybeMerge(a: Node, b: Node): Node | undefined {
  if (a.isText && b.isText && Mark.sameSet(a.marks, b.marks))
    return (a as any).withText(a.text! + b.text!);
}

// Object used to track the context of a running parse.
class MarkdownParseState {
  stack: {
    type: NodeType;
    attrs: Attrs | null;
    content: Node[];
    marks: readonly Mark[];
  }[];
  // parsers needed for parsing HTML tokens and converting them to PM Nodes
  ProsemirrorDOMParser: ProsemirrorDOMParser;
  DOMParser: DOMParser;

  constructor(
    readonly schema: Schema,
    readonly tokenHandlers: {
      [token: string]: (
        stat: MarkdownParseState,
        token: Token,
        tokens: Token[],
        i: number
      ) => void;
    }
  ) {
    //  initialization of DOMParser
    this.DOMParser = new DOMParser();
    // initializing PM Domparser based on schema
    this.ProsemirrorDOMParser = ProsemirrorDOMParser.fromSchema(schema);

    this.stack = [
      { type: schema.topNodeType, attrs: null, content: [], marks: Mark.none },
    ];
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  push(elt: Node) {
    if (this.stack.length) this.top().content.push(elt);
  }

  // Adds the given text to the current position in the document,
  // using the current marks as styling.
  addText(text: string) {
    if (!text) return;
    const top = this.top(),
      nodes = top.content,
      last = nodes[nodes.length - 1];
    let node = this.schema.text(text, top.marks),
      merged;
    if (last && (merged = maybeMerge(last, node)))
      nodes[nodes.length - 1] = merged;
    else nodes.push(node);
  }

  // Adds the given mark to the set of active marks.
  openMark(mark: Mark) {
    const top = this.top();
    top.marks = mark.addToSet(top.marks);
  }

  // Removes the given mark from the set of active marks.
  closeMark(mark: MarkType) {
    const top = this.top();
    top.marks = mark.removeFromSet(top.marks);
  }

  /**
   * This function parser html block markdown it token, converts it to PM Node and adds it ontop of the stack
   * @param markdownHTMLBlock , a markdown it token, containing htmlblock
   */
  parseHTMLBlock(markdownHTMLBlock: Token) {
    // getting content of a token
    const HTMLContent = markdownHTMLBlock.content;

    // sanitizing, because we will parse that html, and we do not want to get scripty scripty
    const sanitizedHTMLContent = DOMPurify.sanitize(HTMLContent);

    // parsing a string, and constructing a simple DOM Document, based on html
    const HTMLDocument = this.DOMParser.parseFromString(
      sanitizedHTMLContent,
      HTML_MIME_TYPE
    );

    // parsing the resulting document, and getting a new DOC node
    const prosemirrorDocumentNode =
      this.ProsemirrorDOMParser.parse(HTMLDocument);

    // getting its content-fragment, and passing to a function, which adds fragment on top of the stack
    const HTMLFragment = prosemirrorDocumentNode.content;
    this.addFragment(HTMLFragment);
  }

  parseTokens(toks: Token[]) {
    for (let i = 0; i < toks.length; i++) {
      const tok = toks[i];
      // checking if it is an html block, and if it is, calling special parser, else
      // fall back to default handling strategy
      if (tok.type === HTML_BLOCK_TOKEN_TYPE) {
        this.parseHTMLBlock(tok);
      } else {
        const handler = this.tokenHandlers[tok.type];
        if (!handler)
          throw new Error(
            "Token type `" + tok.type + "` not supported by Markdown parser"
          );
        handler(this, tok, toks, i);
      }
    }
  }

  // Add a node at the current position.
  addNode(type: NodeType, attrs: Attrs | null, content?: readonly Node[]) {
    const top = this.top();
    const node = type.createAndFill(attrs, content, top ? top.marks : []);
    if (!node) return null;
    this.push(node);
    return node;
  }

  // Wrap subsequent content in a node of the given type.
  openNode(type: NodeType, attrs: Attrs | null) {
    this.stack.push({
      type: type,
      attrs: attrs,
      content: [],
      marks: Mark.none,
    });
  }

  // Close and return the node that is currently on top of the stack.
  closeNode() {
    const info = this.stack.pop()!;
    return this.addNode(info.type, info.attrs, info.content);
  }

  /**
   * This function takes a fragment (it is implied, that the fragment would be of a doc node probably, but I am not sure).
   * So the fragment is separated into nodes, and the nodes are added to the top of the stack, FIFO.
   * @param fragment: is a PM Fragment, which was previously extracted from somewhere
   */
  addFragment(fragment: Fragment) {
    // getting fragment child count and  then iterating through it and pushing every child to the top of the stack
    const fragmentSize = fragment.childCount;
    for (let childIndex = 0; childIndex < fragmentSize; childIndex++) {
      const fragmentChild = fragment.child(childIndex);
      this.push(fragmentChild);
    }
  }
}

function attrs(spec: ParseSpec, token: Token, tokens: Token[], i: number) {
  if (spec.getAttrs) return spec.getAttrs(token, tokens, i);
  // For backwards compatibility when `attrs` is a Function
  else if (spec.attrs instanceof Function) return spec.attrs(token);
  else return spec.attrs;
}

// Code content is represented as a single token with a `content`
// property in Markdown-it.
function noCloseToken(spec: ParseSpec, type: string) {
  return (
    spec.noCloseToken ||
    type == "code_inline" ||
    type == "code_block" ||
    type == "fence"
  );
}

function withoutTrailingNewline(str: string) {
  return str[str.length - 1] == "\n" ? str.slice(0, str.length - 1) : str;
}

function noOp() {}

function tokenHandlers(schema: Schema, tokens: { [token: string]: ParseSpec }) {
  const handlers: {
    [token: string]: (
      stat: MarkdownParseState,
      token: Token,
      tokens: Token[],
      i: number
    ) => void;
  } = Object.create(null);
  for (const type in tokens) {
    const spec = tokens[type];
    if (spec.block) {
      // @ts-ignore
      const nodeType = schema.nodeType(spec.block);
      if (noCloseToken(spec, type)) {
        handlers[type] = (state, tok, tokens, i) => {
          state.openNode(nodeType, attrs(spec, tok, tokens, i));
          state.addText(withoutTrailingNewline(tok.content));
          state.closeNode();
        };
      } else {
        handlers[type + "_open"] = (state, tok, tokens, i) =>
          state.openNode(nodeType, attrs(spec, tok, tokens, i));
        handlers[type + "_close"] = (state) => state.closeNode();
      }
    } else if (spec.node) {
      // @ts-ignore
      const nodeType = schema.nodeType(spec.node);
      handlers[type] = (state, tok, tokens, i) =>
        state.addNode(nodeType, attrs(spec, tok, tokens, i));
    } else if (spec.mark) {
      const markType = schema.marks[spec.mark];
      if (noCloseToken(spec, type)) {
        handlers[type] = (state, tok, tokens, i) => {
          state.openMark(markType.create(attrs(spec, tok, tokens, i)));
          state.addText(withoutTrailingNewline(tok.content));
          state.closeMark(markType);
        };
      } else {
        handlers[type + "_open"] = (state, tok, tokens, i) =>
          state.openMark(markType.create(attrs(spec, tok, tokens, i)));
        handlers[type + "_close"] = (state) => state.closeMark(markType);
      }
    } else if (spec.ignore) {
      if (noCloseToken(spec, type)) {
        handlers[type] = noOp;
      } else {
        handlers[type + "_open"] = noOp;
        handlers[type + "_close"] = noOp;
      }
    } else {
      throw new RangeError("Unrecognized parsing spec " + JSON.stringify(spec));
    }
  }

  handlers.text = (state, tok) => state.addText(tok.content);
  handlers.inline = (state, tok) => state.parseTokens(tok.children!);
  handlers.softbreak = handlers.softbreak || ((state) => state.addText(" "));

  return handlers;
}

/// Object type used to specify how Markdown tokens should be parsed.
export interface ParseSpec {
  /// This token maps to a single node, whose type can be looked up
  /// in the schema under the given name. Exactly one of `node`,
  /// `block`, or `mark` must be set.
  node?: string;

  /// This token (unless `noCloseToken` is true) comes in `_open`
  /// and `_close` variants (which are appended to the base token
  /// name provides a the object property), and wraps a block of
  /// content. The block should be wrapped in a node of the type
  /// named to by the property's value. If the token does not have
  /// `_open` or `_close`, use the `noCloseToken` option.
  block?: string;

  /// This token (again, unless `noCloseToken` is true) also comes
  /// in `_open` and `_close` variants, but should add a mark
  /// (named by the value) to its content, rather than wrapping it
  /// in a node.
  mark?: string;

  /// Attributes for the node or mark. When `getAttrs` is provided,
  /// it takes precedence.
  attrs?: Attrs | null;

  /// A function used to compute the attributes for the node or mark
  /// that takes a [markdown-it
  /// token](https://markdown-it.github.io/markdown-it/#Token) and
  /// returns an attribute object.
  getAttrs?: (
    token: Token,
    tokenStream: Token[],
    index: number
  ) => Attrs | null;

  /// Indicates that the [markdown-it
  /// token](https://markdown-it.github.io/markdown-it/#Token) has
  /// no `_open` or `_close` for the nodes. This defaults to `true`
  /// for `code_inline`, `code_block` and `fence`.
  noCloseToken?: boolean;

  /// When true, ignore content for the matched token.
  ignore?: boolean;
}

/// A configuration of a Markdown parser. Such a parser uses
/// [markdown-it](https://github.com/markdown-it/markdown-it) to
/// tokenize a file, and then runs the custom rules it is given over
/// the tokens to create a ProseMirror document tree.
export class MarkdownParser {
  /// @internal
  tokenHandlers: {
    [token: string]: (
      stat: MarkdownParseState,
      token: Token,
      tokens: Token[],
      i: number
    ) => void;
  };

  /// Create a parser with the given configuration. You can configure
  /// the markdown-it parser to parse the dialect you want, and provide
  /// a description of the ProseMirror entities those tokens map to in
  /// the `tokens` object, which maps token names to descriptions of
  /// what to do with them. Such a description is an object, and may
  /// have the following properties:
  constructor(
    /// The parser's document schema.
    readonly schema: Schema,
    /// This parser's markdown-it tokenizer.
    readonly tokenizer: MarkdownIt,
    /// The value of the `tokens` object used to construct this
    /// parser. Can be useful to copy and modify to base other parsers
    /// on.
    readonly tokens: { [name: string]: ParseSpec }
  ) {
    this.tokenHandlers = tokenHandlers(schema, tokens);
  }

  /// Parse a string as [CommonMark](http://commonmark.org/) markup,
  /// and create a ProseMirror document as prescribed by this parser's
  /// rules.
  ///
  /// The second argument, when given, is passed through to the
  /// [Markdown
  /// parser](https://markdown-it.github.io/markdown-it/#MarkdownIt.parse).
  parse(text: string, markdownEnv: Object = {}) {
    let state = new MarkdownParseState(this.schema, this.tokenHandlers),
      doc;
    state.parseTokens(this.tokenizer.parse(text, markdownEnv));
    do {
      doc = state.closeNode();
    } while (state.stack.length);
    return doc || this.schema.topNodeType.createAndFill();
  }
}

function listIsTight(tokens: readonly Token[], i: number) {
  while (++i < tokens.length)
    if (tokens[i].type != "list_item_open") return tokens[i].hidden;
  return false;
}

/**
 * This function gets a link token of makrdown it format, gets a needed info from it and returns an Attrs object
 * which is basically a corresponding PM node/mark attributes
 * @param token , a Token of markdown it parser
 * @returns Attrs, an object with node/mark attributes, in that case link mark
 */
function getLinkAttrs(token: Token): Attrs {
  // getting those token attributes with a dedicated method
  const linkHref = token.attrGet("href");
  const linkTitle = token.attrGet("title");

  // creating an attrs object
  const linkAttrs: Attrs = {
    href: linkHref,
    title: linkTitle,
  };
  return linkAttrs;
}

const nekrasovTokens: MarkdownParser["tokens"] = {
  blockquote: { block: "blockquote" },
  paragraph: { block: "paragraph" },
  list_item: { block: "list_item" },
  bullet_list: {
    block: "bullet_list",
    getAttrs: (_, tokens, i) => ({ tight: listIsTight(tokens, i) }),
  },
  ordered_list: {
    block: "ordered_list",
    getAttrs: (tok, tokens, i) => ({
      order: +tok.attrGet("start")! || 1,
      tight: listIsTight(tokens, i),
    }),
  },
  heading: {
    block: "heading",
    getAttrs: (tok) => ({ level: +tok.tag.slice(1) }),
  },
  code_block: { block: "code_block", noCloseToken: true },
  fence: {
    block: "code_block",
    getAttrs: (tok) => ({ params: tok.info || "" }),
    noCloseToken: true,
  },
  hr: { node: "horizontal_rule" },
  image: {
    node: "image",
    getAttrs: (tok) => ({
      src: tok.attrGet("src"),
      title: tok.attrGet("title") || null,
      alt: (tok.children![0] && tok.children![0].content) || null,
    }),
  },
  hardbreak: { node: "hard_break" },

  em: { mark: "em" },
  strong: { mark: "strong" },

  // link mark is represented by `link` mark from scheme, and the corresponding getter for its attributes
  link: { mark: "link", getAttrs: getLinkAttrs },
  code_inline: { mark: "code", noCloseToken: true },
};

export { nekrasovTokens };
