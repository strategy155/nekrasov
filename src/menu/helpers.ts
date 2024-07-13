import { Attrs, MarkType, NodeType } from "prosemirror-model";
import {
  Field,
  FilepathField,
  PromptProps,
  TextField,
  openPrompt,
} from "../prompt";
import { MenuItem, MenuItemSpec } from "prosemirror-menu";
import { EditorState, NodeSelection, Command } from "prosemirror-state";
import { toggleMark } from "prosemirror-commands";
import { wrapInList } from "prosemirror-schema-list";

/**
 * This function is getting label of a button and its function and returns a MEnu item wrapping around it
 * @param label , a string containing name of the button
 * @param cmd, a command like function which is applying some changes to the editor. it returns false if it is disabled,
 * thus it will not be shown
 * @returns
 */
export function getTableItem(
  label: string,
  cmd: (state: EditorState) => boolean
) {
  // We create an item spec which is containing name of a function, selection for showing or hiding
  // of the functions and a run function which  applies the transaction
  const itemSpec: MenuItemSpec = { label: label, select: cmd, run: cmd };
  return new MenuItem(itemSpec);
}

/**
 * This interface is describing the prompt , which is used to construct customary
 * mark, where fields are collecting values, which will be later passed to the mark
 * construction routine
 */
interface MarkPromptProps {
  promptTitle: string;
  fields: FieldsProps;
}

/**
 * This interface is describing the toglle-like menu item for custom marktype
 */
interface ToggleableMarkItemProps {
  markType: MarkType;
  itemTitle: string; // title is the name of the button whcich is visible
  itemLabel: string; // label is the hovering value
  markPrompt: MarkPromptProps;
}

/**
 * This interface is a simmple mapper for fields, with is mapped with the attrs
 * attribute, see Attrs description in Prosemirror
 */
interface FieldsProps {
  [fieldName: string]: Field;
}

/**
 * This function constructs a toggle-like button for custom marktype
 * @param props , all needed props for creating button
 * @returns MenuItem, a ready-to-inject menu item
 */
export function getToggleableMarkItem(props: ToggleableMarkItemProps) {
  // setting name of an item and label (tooltip)
  const itemTitle = props.itemTitle;
  const itemLabel = props.itemLabel;

  /**
   * This function is checking if the mark is active on the selected text, if it is,
   * than it returns true
   * @param state, PM state
   * @returns
   */
  const checkIsMarkActive: MenuItemSpec["active"] = function active(state) {
    return markActive(state, props.markType);
  };

  /**
   * This fuction is checking if it is eligible to turn on the mark on the respective selection
   * @param state, PM state
   * @returns true if you can
   */
  const checkIsMarkEnabled: MenuItemSpec["enable"] = function enable(state) {
    return !state.selection.empty;
  };

  /**
   * This function spawns a prompt for creating new mark, and constructs it,
   * applying the mark to the selection. If the mark is already active for selection,
   * it will remove it.
   * @param state  PM state current
   * @param dispatch  a custom dispatcher function
   * @param view is a current PM editor view
   * @returns
   */
  const handleItemButton: MenuItemSpec["run"] = function (
    state,
    dispatch,
    view
  ) {
    // checking if the mark is active currently , if it is then
    // turning it off and ending the creation
    if (markActive(state, props.markType)) {
      // toggling mark off
      const untoggleMark = toggleMark(props.markType);
      untoggleMark(state, dispatch);
      return true;
    }

    // constructing a prompt title
    const promptTitle = props.markPrompt.promptTitle;

    // getting prompt field
    const promptFields: PromptProps["fields"] = props.markPrompt.fields;

    /**
     * This function is used to construct new mark by the prompt routine. After constructing it using
     * the attrs parameter
     * it returns the focus to the view
     * @param attrs parameter is used in construction of Mark, it defines mark's
     * attributes
     */
    const dispatchPromptCallback: PromptProps["callback"] = function (
      attrs: Attrs
    ) {
      //console.log(attrs)
      const toggleURLMarkWithAttrs = toggleMark(props.markType, attrs);
      toggleURLMarkWithAttrs(view.state, view.dispatch);
      view.focus();
    };

    // final construction of a prompt, with a callback, title
    const markPromptProps: PromptProps = {
      title: promptTitle,
      fields: promptFields,
      callback: dispatchPromptCallback,
    };

    // calling the prompt with these parameters
    openPrompt(markPromptProps);
  };

  // generating the spec for the menu item
  const menuItemSpec: MenuItemSpec = {
    title: itemTitle,
    label: itemLabel,
    active: checkIsMarkActive,
    enable: checkIsMarkEnabled,
    run: handleItemButton,
  };

  const menuItem = new MenuItem(menuItemSpec);
  return menuItem;
}

// Helpers to create specific types of items

export function canInsertNode(state: EditorState, nodeType: NodeType) {
  const selectionStartPos = state.selection.$from;
  for (
    let insertionDepth = selectionStartPos.depth;
    insertionDepth >= 0;
    insertionDepth--
  ) {
    const ancestorIndex = selectionStartPos.index(insertionDepth);
    const ancestorNode = selectionStartPos.node(insertionDepth);
    const isAncestorReplacable = ancestorNode.canReplaceWith(
      ancestorIndex,
      ancestorIndex,
      nodeType
    );
    if (isAncestorReplacable) return true;
  }
  return false;
}

export function insertImageItem(nodeType: NodeType) {
  return new MenuItem({
    title: "Insert image",
    label: "Image",
    enable(state) {
      return canInsertNode(state, nodeType);
    },
    run(state, _, view) {
      let { from, to } = state.selection,
        attrs = null;
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

export function cmdItem(cmd: Command, options: Partial<MenuItemSpec>) {
  const passedOptions: MenuItemSpec = {
    label: options.title as string | undefined,
    run: cmd,
  };
  for (const prop in options)
    (passedOptions as any)[prop] = (options as any)[prop];
  if (!options.enable && !options.select)
    passedOptions[options.enable ? "enable" : "select"] = (state) => cmd(state);

  return new MenuItem(passedOptions);
}

export function markActive(state: EditorState, type: MarkType) {
  const { from, $from, to, empty } = state.selection;
  if (empty) return !!type.isInSet(state.storedMarks || $from.marks());
  else return state.doc.rangeHasMark(from, to, type);
}

export function markItem(markType: MarkType, options: Partial<MenuItemSpec>) {
  const passedOptions: Partial<MenuItemSpec> = {
    active(state) {
      return markActive(state, markType);
    },
  };
  for (const prop in options)
    (passedOptions as any)[prop] = (options as any)[prop];
  return cmdItem(toggleMark(markType), passedOptions);
}

export function wrapListItem(
  nodeType: NodeType,
  options: Partial<MenuItemSpec>
) {
  return cmdItem(wrapInList(nodeType, (options as any).attrs), options);
}
