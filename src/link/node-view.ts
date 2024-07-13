import { Node as ProsemirrorNode } from "prosemirror-model";
import { NodeView, NodeViewConstructor } from "prosemirror-view";
import { FILE_PROTOCOL_IDENTIFIER } from "../../constants";
import { contentOpener } from "../../renderer.js";

/**
 * This function is constructing the nodeview for link nodes
 * @param node a prosemirror node
 * @returns
 */
export const getLinkView: NodeViewConstructor = (node) => {
  return new LinkView(node);
};

/**
 * This nodeview is a linkview for rendered links,
 *  which are links which have a rendered preview inside the editor
 */
class LinkView implements NodeView {
  dom: HTMLElement;
  contentDOM?: HTMLAnchorElement;

  /**
   * The constructor creates a view depending on the attribute rendering requirements
   * @param node , a PM like node
   */
  constructor(node: ProsemirrorNode) {
    // If the node should be rendered, it should spawn a small box, in which there will be a
    // content operatable
    if (node.attrs.isRendered) {
      // creating the box for content
      this.dom = document.createElement("div");

      // creating the trace for link, with the href and the name, corresponding to the text content of node
      const linkPlaceholder = document.createElement("a");
      linkPlaceholder.setAttribute("href", node.attrs.href);
      linkPlaceholder.innerText = node.textContent;

      // initializing the opener
      const currentOpener = new contentOpener(this.dom);

      // making the href url to escape many different pitfalls
      const urlifiedHref = new URL(node.attrs.href);

      // setting the params accordingly to the href type: file vs web
      let contentParams;
      if (urlifiedHref.protocol === FILE_PROTOCOL_IDENTIFIER) {
        contentParams = {
          path: urlifiedHref.pathname,
        };
      } else {
        contentParams = {
          url: node.attrs.href,
        };
      }

      // getting the coresponding content of a file
      const contentElement = currentOpener.getContent(contentParams);

      // forming the resulting dom
      this.dom.appendChild(linkPlaceholder);
      this.dom.appendChild(contentElement);
    } else {
      // creating the default link representation of a view
      this.dom = this.contentDOM = document.createElement("a");
      this.dom.setAttribute("href", node.attrs.href);
    }
  }
}
