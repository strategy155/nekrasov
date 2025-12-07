import { Node as ProsemirrorNode } from "prosemirror-model";
import { NodeView, NodeViewConstructor } from "prosemirror-view";
import { FILE_PROTOCOL_IDENTIFIER } from "../constants";

/**
 * Factory function for creating link node views.
 *
 * @param node - The ProseMirror node
 * @returns A new LinkView instance
 */
export const getLinkView: NodeViewConstructor = (node) => {
  return new LinkView(node);
};

/**
 * NodeView implementation for link nodes.
 * Handles both regular links and "rendered" links that show a preview.
 */
class LinkView implements NodeView {
  dom: HTMLElement;
  contentDOM?: HTMLAnchorElement;

  /**
   * Creates a link node view.
   *
   * @param node - The ProseMirror link node
   */
  constructor(node: ProsemirrorNode) {
    // For rendered links, show a preview box
    if (node.attrs.isRendered) {
      this.dom = document.createElement("div");
      this.dom.className = "link-preview-container";

      // Create the link placeholder
      const linkPlaceholder = document.createElement("a");
      linkPlaceholder.setAttribute("href", node.attrs.href);
      linkPlaceholder.innerText = node.textContent;
      linkPlaceholder.className = "link-preview-anchor";

      // Create preview content
      const previewElement = this.createPreview(node.attrs.href);

      this.dom.appendChild(linkPlaceholder);
      this.dom.appendChild(previewElement);
    } else {
      // Regular link rendering
      this.dom = this.contentDOM = document.createElement("a");
      this.dom.setAttribute("href", node.attrs.href);
      if (node.attrs.title) {
        this.dom.setAttribute("title", node.attrs.title);
      }
    }
  }

  /**
   * Creates a preview element for the given href.
   *
   * @param href - The link URL
   * @returns An HTML element containing the preview
   */
  private createPreview(href: string): HTMLElement {
    const previewContainer = document.createElement("div");
    previewContainer.className = "link-preview-content";

    try {
      const url = new URL(href);

      if (url.protocol === FILE_PROTOCOL_IDENTIFIER) {
        // File preview placeholder
        const filePath = decodeURI(url.pathname);
        previewContainer.innerHTML = `
          <div class="file-preview">
            <span class="file-icon">📄</span>
            <span class="file-path">${filePath}</span>
          </div>
        `;
      } else {
        // Web URL preview - show iframe for web content
        const iframe = document.createElement("iframe");
        iframe.src = href;
        iframe.className = "link-preview-iframe";
        iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
        iframe.setAttribute("loading", "lazy");
        previewContainer.appendChild(iframe);
      }
    } catch (e) {
      previewContainer.textContent = `Invalid URL: ${href}`;
    }

    return previewContainer;
  }
}
