import { Attrs } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";
import { InputRule } from "prosemirror-inputrules";

// now flags are not existing for link search
const LINK_REGEXP_FLAGS = "";

// this regexp is easy and tries to conform the commonmark std
// https://spec.commonmark.org/0.30/#links
// eslint-disable-next-line no-useless-escape
const LINK_REGEXP = new RegExp(
  /\[(?<link_label>[^\[\]\(\)]+)\]\((?<link_target>[^\[\]\(\)]+)\)/,
  LINK_REGEXP_FLAGS
);

/**
 * This function is handling input rule for link entering, which is formatted like markdown simple link
 * We take two named groups, if they exist, and create a Mark in the text, replacing the control sequence
 * It is now done moreorless strictly.
 * @param state current state of the editor
 * @param match the matched sequence of regexp all
 * @param start offset of a starting postition of a sequence
 * @param end offset of the end position of a sequence
 * @returns transaction, which describes the changes to create a link intext
 */
function handleLinkRule(
  state: EditorState,
  match: RegExpMatchArray,
  start: number,
  end: number
): Transaction {
  // adding starting point for a transaction
  const linkTransaction = state.tr;

  // default value for link attributes
  let linkAttrs: Attrs | null = null;

  // checking if the groups exist, and if they do, construct the link
  if (match.groups) {
    // named groups are described in the LINK_REGEXP variable
    // here the link attributes are constructed
    const linkTitle: string = match.groups.link_label;
    const linkHref: string = match.groups.link_target;
    linkAttrs = {
      href: linkHref,
      title: linkTitle,
    };

    // replacing the control sequence with a title of a link
    const replacedWithLabel = linkTransaction.insertText(linkTitle, start, end);

    // calculating value of a new end offset, because it obviously changed to a lesser value
    // because of the replacement
    const newEnd = start + linkTitle.length;

    // constructing the mark
    const linkMark = state.schema.marks.link.create(linkAttrs);

    // adding mark to the editor state with a transaction things
    const addedLink = replacedWithLabel.addMark(start, newEnd, linkMark);
    return addedLink;
  } else {
    throw new TypeError(
      "Match groups in regexp wasn't returned, that is strange"
    );
  }
}

/**
 * This function constructs link rule and returns it, maybe will be persihed
 * @returns
 */
export function linkRule(): InputRule {
  // creating new input rule with a link regexp and a specific handler
  const linkRule: InputRule = new InputRule(LINK_REGEXP, handleLinkRule);
  return linkRule;
}
