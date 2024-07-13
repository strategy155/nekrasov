import { MenuItemSpec, MenuItem } from "prosemirror-menu";
import { NodeType } from "prosemirror-model";
import { EditorState, NodeSelection } from "prosemirror-state";
import { canInsertNode } from "../menu/helpers";
import {
  openPrompt,
  TextField,
  Field,
  PromptProps,
  CheckboxField,
  ExternalLinkField,
  FilepathField,
} from "../prompt";

export function insertImageItem(nodeType: NodeType) {
  return new MenuItem({
    title: "Insert image",
    label: "Image",
    enable(state) {
      return canInsertNode(state, nodeType);
    },
    run(state, _, view) {
      const { from, to } = state.selection;
      let attrs = null;
      if (
        state.selection instanceof NodeSelection &&
        state.selection.node.type == nodeType
      )
        attrs = state.selection.node.attrs;
      openPrompt({
        title: "Insert image",
        fields: {
          src: new TextField({
            label: "Location",
            required: true,
            value: attrs && attrs.src,
          }),
          title: new TextField({ label: "Title", value: attrs && attrs.title }),
          alt: new TextField({
            label: "Description",
            value: attrs ? attrs.alt : state.doc.textBetween(from, to, " "),
          }),
        },
        callback(attrs) {
          view.dispatch(
            view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs)!)
          );
          view.focus();
        },
      });
    },
  });
}

/**
 * This interface is describing the prompt , which is used to construct customary
 * mark, where fields are collecting values, which will be later passed to the mark
 * construction routine
 */
interface NodePromptProps {
  promptTitle: string;
  fields: FieldsProps;
}

/**
 * This interface is describing the toglle-like menu item for custom node type
 */
interface MenuItemProps {
  itemType: NodeType;
  itemTitle: string; // title is the name of the button whcich is visible
  itemLabel: string; // label is the hovering value
  itemPrompt: NodePromptProps;
}

/**
 * This interface is a simmple mapper for fields, with is mapped with the attrs
 * attribute, see Attrs description in Prosemirror
 */
interface FieldsProps {
  [fieldName: string]: Field;
}

export function getFilepathLinkItem(linkItemType: NodeType): MenuItem {
  const FilepathPromptTitle = "Create a file link";

  // constructing href textfield
  const filepathLabel = "Link target";
  const filepathFieldOptions: FilepathField["options"] = {
    label: filepathLabel,
    required: true,
  };

  const isRenderedFieldLabel = "Should it be rendered?";
  const isRenderedFieldOptions: CheckboxField["options"] = {
    label: isRenderedFieldLabel,
    required: true,
  };

  const filepathField = new FilepathField(filepathFieldOptions);
  const isRenderedField = new CheckboxField(isRenderedFieldOptions);

  const FilepathLinkFields: PromptProps["fields"] = {
    href: filepathField,
    isRendered: isRenderedField,
  };

  const linkPromptProps: NodePromptProps = {
    promptTitle: FilepathPromptTitle,
    fields: FilepathLinkFields,
  };

  // setting name of an item and label (tooltip)
  const linkItemTitle = "Add or remove  File link";
  const linkItemLabel = "File link";

  const linkMenuItemProps: MenuItemProps = {
    itemPrompt: linkPromptProps,
    itemLabel: linkItemLabel,
    itemTitle: linkItemTitle,
    itemType: linkItemType,
  };

  /**
   * This fuction is checking if it is eligible to turn on the url node representer on the respective selection.
   * It first checks the selection for being a selection of one paragaraph node, containing a single element,
   * which has no spaces in it.
   * @param state, current editor state
   * @returns true if you can
   */
  const checkIsLinkCreatable: MenuItemSpec["enable"] = (state: EditorState) => {
    // getting the contetn of a selection and converting it to fragment
    const selectionContent = state.selection.content();
    const selectionFragment = selectionContent.content;

    // checking that amount of childs is equal to 1, and then selecting that child
    if (selectionFragment.childCount === 1) {
      const singleNode = selectionFragment.child(0);

      // checking that the only selection child is paragraph node
      const paragraphType = state.schema.nodes.paragraph;
      if (singleNode.type === paragraphType) {
        // checking that the node content has no spaces in it
        const linkContent = singleNode.textContent;
        if (!linkContent.includes(" ")) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * This function spawns a prompt for creating new link node, and constructs it,
   * constructing the node and replacing the selection
   * @param state  PM state current
   * @param dispatch  a custom dispatcher function
   * @param view is a current PM editor view
   * @returns
   */
  const handleLinkButton: MenuItemSpec["run"] = (state, dispatch, view) => {
    // constructing a prompt title
    const promptTitle = linkPromptProps.promptTitle;

    // getting prompt field
    const promptFields: PromptProps["fields"] =
      linkMenuItemProps.itemPrompt.fields;

    /**
     * This function is used to construct new link by the prompt routine. After constructing it using
     * the attrs parameter. Also it places the selections content text inside the node. All the checkups
     * are done by the initial enabling routine
     * it returns the focus to the view
     * @param attrs parameter is used in construction of node, it defines node's
     * attributes
     */
    const dispatchLinkPrompt: PromptProps["callback"] = (attrs) => {
      // first of all we get the slice of the selection
      const selectionSlice = state.selection.content();

      // then we extract the fragment's first child text, which is always a paragraph,
      // because it is the enablement checkup already
      const selectionContent = selectionSlice.content;
      const selectionNode = selectionContent.child(0);
      const selectionText = selectionNode.textContent;
      console.log(attrs);
      // now we create a node  with attributes and selected text
      const promptBasedLink = linkItemType.create(
        attrs,
        state.schema.text(selectionText)
      );

      // creating an empty transaction, and replacing transaction for created link
      const baseTransaction = state.tr;
      const insertedNode =
        baseTransaction.replaceSelectionWith(promptBasedLink);

      // dispatching the transaction and focusing editor anew
      view.dispatch(insertedNode);
      view.focus();
    };

    // final construction of a prompt, with a callback, title
    const nodePromptProps: PromptProps = {
      title: promptTitle,
      fields: promptFields,
      callback: dispatchLinkPrompt,
    };

    // calling the prompt with these parameters
    openPrompt(nodePromptProps);
  };

  // generating the spec for the menu item
  const menuItemSpec: MenuItemSpec = {
    title: linkItemTitle,
    label: linkItemLabel,
    enable: checkIsLinkCreatable,
    run: handleLinkButton,
  };

  const linkItem = new MenuItem(menuItemSpec);

  return linkItem;
}

export function getExternalLinkItem(linkItemType: NodeType): MenuItem {
  const URLPromptTitle = "Create a link";

  // constructing href textfield
  const hrefLabel = "Link target";
  const hrefFieldOptions: TextField["options"] = {
    label: hrefLabel,
    required: true,
  };

  const isRenderedFieldLabel = "Should it be rendered?";
  const isRenderedFieldOptions: CheckboxField["options"] = {
    label: isRenderedFieldLabel,
    required: true,
  };

  const hrefField = new ExternalLinkField(hrefFieldOptions);
  const isRenderedField = new CheckboxField(isRenderedFieldOptions);

  const URLFields: PromptProps["fields"] = {
    href: hrefField,
    isRendered: isRenderedField,
  };

  const linkPromptProps: NodePromptProps = {
    promptTitle: URLPromptTitle,
    fields: URLFields,
  };

  // setting name of an item and label (tooltip)
  const linkItemTitle = "Add or remove  URL link";
  const linkItemLabel = "URL link";

  const linkMenuItemProps: MenuItemProps = {
    itemPrompt: linkPromptProps,
    itemLabel: linkItemLabel,
    itemTitle: linkItemTitle,
    itemType: linkItemType,
  };

  /**
   * This fuction is checking if it is eligible to turn on the url node representer on the respective selection.
   * It first checks the selection for being a selection of one paragaraph node, containing a single element,
   * which has no spaces in it.
   * @param state, current editor state
   * @returns true if you can
   */
  const checkIsLinkCreatable: MenuItemSpec["enable"] = (state: EditorState) => {
    // getting the contetn of a selection and converting it to fragment
    const selectionContent = state.selection.content();
    const selectionFragment = selectionContent.content;

    // checking that amount of childs is equal to 1, and then selecting that child
    if (selectionFragment.childCount === 1) {
      const singleNode = selectionFragment.child(0);

      // checking that the only selection child is paragraph node
      const paragraphType = state.schema.nodes.paragraph;
      if (singleNode.type === paragraphType) {
        // checking that the node content has no spaces in it
        const linkContent = singleNode.textContent;
        if (!linkContent.includes(" ")) {
          return true;
        }
      }
    }
    return false;
  };

  /**
   * This function spawns a prompt for creating new link node, and constructs it,
   * constructing the node and replacing the selection
   * @param state  PM state current
   * @param dispatch  a custom dispatcher function
   * @param view is a current PM editor view
   * @returns
   */
  const handleLinkButton: MenuItemSpec["run"] = (state, dispatch, view) => {
    // constructing a prompt title
    const promptTitle = linkPromptProps.promptTitle;

    // getting prompt field
    const promptFields: PromptProps["fields"] =
      linkMenuItemProps.itemPrompt.fields;

    /**
     * This function is used to construct new link by the prompt routine. After constructing it using
     * the attrs parameter. Also it places the selections content text inside the node. All the checkups
     * are done by the initial enabling routine
     * it returns the focus to the view
     * @param attrs parameter is used in construction of node, it defines node's
     * attributes
     */
    const dispatchLinkPrompt: PromptProps["callback"] = (attrs) => {
      // first of all we get the slice of the selection
      const selectionSlice = state.selection.content();

      // then we extract the fragment's first child text, which is always a paragraph,
      // because it is the enablement checkup already
      const selectionContent = selectionSlice.content;
      const selectionNode = selectionContent.child(0);
      const selectionText = selectionNode.textContent;

      // now we create a node  with attributes and selected text
      const promptBasedLink = linkItemType.create(
        attrs,
        state.schema.text(selectionText)
      );

      // creating an empty transaction, and replacing transaction for created link
      const baseTransaction = state.tr;
      const insertedNode =
        baseTransaction.replaceSelectionWith(promptBasedLink);

      // dispatching the transaction and focusing editor anew
      view.dispatch(insertedNode);
      view.focus();
    };

    // final construction of a prompt, with a callback, title
    const nodePromptProps: PromptProps = {
      title: promptTitle,
      fields: promptFields,
      callback: dispatchLinkPrompt,
    };

    // calling the prompt with these parameters
    openPrompt(nodePromptProps);
  };

  // generating the spec for the menu item
  const menuItemSpec: MenuItemSpec = {
    title: linkItemTitle,
    label: linkItemLabel,
    enable: checkIsLinkCreatable,
    run: handleLinkButton,
  };

  const linkItem = new MenuItem(menuItemSpec);

  return linkItem;
}
