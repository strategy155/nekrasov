import {
  Attrs,
  DOMOutputSpec,
  NodeSpec,
  ParseRule,
  Node as ProsemirrorNode,
} from "prosemirror-model";
import { LINK_ATTRS, LINK_CSS_SELECTOR } from "../constants";

const LINK_GROUP = "inline";

/**
 * This function parses HTMLAnchorElement  and gets rendered link corresponding node attributes ,
 * packing them into a special structure supported by PM.
 * @param dom a piece of DOM which is used to get the attributes, should be the attribute to parse
 * @returns linkAttrs, an object with link parameters
 */
function parseLinkAttrs(dom: HTMLElement | string): false | Attrs {
  // checking that dom is an html anchor element
  const linkAnchorElement = dom as HTMLAnchorElement;

  // getting anchor attributes which is used by PM internal link node
  const linkRawHref = linkAnchorElement.getAttribute("href");
  const linkTitle = linkAnchorElement.getAttribute("title");
  const linkIsRendered = linkAnchorElement.dataset.isRendered;

  // converting link to URL
  const linkHref = new URL(linkRawHref as string);

  // getting text as a link name
  const linkName = linkAnchorElement.innerText;

  // forming resulting attrs , and returning them
  const linkAttrs: Attrs = {
    href: linkHref,
    title: linkTitle,
    name: linkName,
    isRendered: linkIsRendered,
  };

  return linkAttrs;
}

interface LinkProps {
  href: URL;
  title: string;
  "data-is-rendered": string | undefined;
}

/**
 * This function converts link node internal representation to an html anchor element with according data attribute set
 * and returns it
 * @param node, a Node type of prosemirror with needed attributes, rperesenting link
 * @returns anchorElement, an HTML Anchor element created from the internal representation
 */
function linkToDOM(node: ProsemirrorNode) {
  const linkAttrs: LinkProps = {
    href: node.attrs.href,
    title: node.attrs.title,
    "data-is-rendered": undefined,
  };

  // set isrendered attribute to empty string to indicate it is rendered
  if (node.attrs.isRendered) linkAttrs["data-is-rendered"] = "";

  const linkOutputSpec: DOMOutputSpec = ["a", linkAttrs, 0];

  return linkOutputSpec;
}

// forming parse rule, which is telling how the anchor element should be parsed
const LINK_ANCHOR_PARSE_RULE: ParseRule = {
  tag: LINK_CSS_SELECTOR,
  getAttrs: parseLinkAttrs,
};

// combining all the parse rules
const LINK_PARSE_RULES: ParseRule[] = [LINK_ANCHOR_PARSE_RULE];

// formed the final link spec
const LINK_SPEC: NodeSpec = {
  // inline group, because it is text-like node
  inline: true,

  // content is text one or zero elements of text
  content: "text?",

  // it is draggable
  draggable: true,

  attrs: LINK_ATTRS,
  group: LINK_GROUP,
  parseDOM: LINK_PARSE_RULES,
  toDOM: linkToDOM,
};

export { LINK_SPEC };
