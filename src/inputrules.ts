import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
  emDash,
  ellipsis,
  InputRule,
} from "prosemirror-inputrules";
import { NodeType, Schema } from "prosemirror-model";
import { linkRule } from "./link/input-rule";
import { InputRulesConf } from "./utils";

/// Given a blockquote node type, returns an input rule that turns `"> "`
/// at the start of a textblock into a blockquote.
export function blockQuoteRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType);
}

/// Given a list node type, returns an input rule that turns a number
/// followed by a dot at the start of a textblock into an ordered list.
export function orderedListRule(nodeType: NodeType) {
  return wrappingInputRule(
    /^(\d+)\.\s$/,
    nodeType,
    (match) => ({ order: +match[1] }),
    (match, node) => node.childCount + node.attrs.order == +match[1]
  );
}

/// Given a list node type, returns an input rule that turns a bullet
/// (dash, plush, or asterisk) at the start of a textblock into a
/// bullet list.
export function bulletListRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

/// Given a code block node type, returns an input rule that turns a
/// textblock starting with three backticks into a code block.
export function codeBlockRule(nodeType: NodeType) {
  return textblockTypeInputRule(/^```$/, nodeType);
}

/// Given a node type and a maximum level, creates an input rule that
/// turns up to that number of `#` characters followed by a space at
/// the start of a textblock into a heading whose level corresponds to
/// the number of `#` signs.
export function headingRule(nodeType: NodeType, maxLevel: number) {
  return textblockTypeInputRule(
    new RegExp("^(#{1," + maxLevel + "})\\s$"),
    nodeType,
    (match) => ({ level: match[1].length })
  );
}
/// A set of input rules for creating the basic block quotes, lists,
/// code blocks, and heading.
export function buildInputRules(schema: Schema) {
  const editorRules: InputRule[] = smartQuotes.concat(ellipsis, emDash);

  // adding linkRules to the mix
  // editorRules.push(linkRule())
  editorRules.push(blockQuoteRule(schema.nodes.blockquote));
  editorRules.push(orderedListRule(schema.nodes.ordered_list));
  editorRules.push(bulletListRule(schema.nodes.bullet_list));
  editorRules.push(codeBlockRule(schema.nodes.code_block));
  editorRules.push(headingRule(schema.nodes.heading, 6));

  const inputRulesConf: InputRulesConf = { rules: editorRules };
  return inputRules(inputRulesConf);
}
