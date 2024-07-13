import {
  wrapItem,
  blockTypeItem,
  Dropdown,
  DropdownSubmenu,
  joinUpItem,
  liftItem,
  selectParentNodeItem,
  undoItem,
  redoItem,
  icons,
  MenuItem,
  MenuElement,
} from "prosemirror-menu";
import { Schema } from "prosemirror-model";
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  deleteColumn,
  deleteRow,
  deleteTable,
  mergeCells,
  splitCell,
  toggleHeaderCell,
  toggleHeaderColumn,
  toggleHeaderRow,
} from "prosemirror-tables";
import { createTable } from "../table/commands";
import {
  CREATE_TABLE_CMD_NAME,
  ADD_COLUMN_BEFORE_CMD_NAME,
  ADD_COLUMN_AFTER_CMD_NAME,
  DELETE_COLUMN_CMD_NAME,
  ADD_ROW_BEFORE_CMD_NAME,
  ADD_ROW_AFTER_CMD_NAME,
  DELETE_ROW_CMD_NAME,
  DELETE_TABLE_CMD_NAME,
  MERGE_CELLS_CMD_NAME,
  SPLIT_CELL_CMD_NAME,
  TOGGLE_HEADER_COLUMN_CMD_NAME,
  TOGGLE_HEADER_ROW_CMD_NAME,
  TOGGLE_HEADER_CELLS_CMD_NAME,
} from "../../constants";
import {
  markItem,
  insertImageItem,
  wrapListItem,
  getTableItem,
  canInsertNode,
} from "./helpers";
import { getExternalLinkItem, getFilepathLinkItem } from "../link/menu-item";

type MenuItemResult = {
  /// A menu item to toggle the [strong mark](#schema-basic.StrongMark).
  toggleStrong?: MenuItem;

  /// A menu item to toggle the [emphasis mark](#schema-basic.EmMark).
  toggleEm?: MenuItem;

  /// A menu item to toggle the [code font mark](#schema-basic.CodeMark).
  toggleCode?: MenuItem;

  /// A menu item to toggle the [link mark](#schema-basic.LinkMark).
  createLink?: MenuItem;

  createFileLink?: MenuItem;

  /// A menu item to insert an [image](#schema-basic.Image).
  insertImage?: MenuItem;

  /// A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).
  wrapBulletList?: MenuItem;

  /// A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).
  wrapOrderedList?: MenuItem;

  /// A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).
  wrapBlockQuote?: MenuItem;

  /// A menu item to set the current textblock to be a normal
  /// [paragraph](#schema-basic.Paragraph).
  makeParagraph?: MenuItem;

  /// A menu item to set the current textblock to be a
  /// [code block](#schema-basic.CodeBlock).
  makeCodeBlock?: MenuItem;

  /// Menu items to set the current textblock to be a
  /// [heading](#schema-basic.Heading) of level _N_.
  makeHead1?: MenuItem;
  makeHead2?: MenuItem;
  makeHead3?: MenuItem;
  makeHead4?: MenuItem;
  makeHead5?: MenuItem;
  makeHead6?: MenuItem;

  /// A menu item to insert a horizontal rule.
  insertHorizontalRule?: MenuItem;

  /// A dropdown containing the `insertImage` and
  /// `insertHorizontalRule` items.
  insertMenu: Dropdown;

  /// A dropdown containing the items for making the current
  /// textblock a paragraph, code block, or heading.
  typeMenu: Dropdown;

  /// Array of block-related menu items.
  blockMenu: MenuElement[][];

  tableMenu: Dropdown;

  /// Inline-markup related menu items.
  inlineMenu: MenuElement[][];

  linkMenu: Dropdown;

  /// An array of arrays of menu elements for use as the full menu
  /// for, for example the [menu
  /// bar](https://github.com/prosemirror/prosemirror-menu#user-content-menubar).
  fullMenu: MenuElement[][];
};

/// Given a schema, look for default mark and node types in it and
/// return an object with relevant menu items relating to those marks.
export function buildMenuItems(schema: Schema): MenuItemResult {
  // adding table menu items here, with appropriate names
  const tableMenu = [
    getTableItem(CREATE_TABLE_CMD_NAME, createTable),
    getTableItem(ADD_COLUMN_BEFORE_CMD_NAME, addColumnBefore),
    getTableItem(ADD_COLUMN_AFTER_CMD_NAME, addColumnAfter),
    getTableItem(DELETE_COLUMN_CMD_NAME, deleteColumn),
    getTableItem(ADD_ROW_BEFORE_CMD_NAME, addRowBefore),
    getTableItem(ADD_ROW_AFTER_CMD_NAME, addRowAfter),
    getTableItem(DELETE_ROW_CMD_NAME, deleteRow),
    getTableItem(DELETE_TABLE_CMD_NAME, deleteTable),
    getTableItem(MERGE_CELLS_CMD_NAME, mergeCells),
    getTableItem(SPLIT_CELL_CMD_NAME, splitCell),
    getTableItem(TOGGLE_HEADER_COLUMN_CMD_NAME, toggleHeaderColumn),
    getTableItem(TOGGLE_HEADER_ROW_CMD_NAME, toggleHeaderRow),
    getTableItem(TOGGLE_HEADER_CELLS_CMD_NAME, toggleHeaderCell),
  ];

  const builtMenu: MenuItemResult = {};
  builtMenu.toggleStrong = markItem(schema.marks.strong, {
    title: "Toggle strong style",
    icon: icons.strong,
  });
  builtMenu.toggleEm = markItem(schema.marks.em, {
    title: "Toggle emphasis",
    icon: icons.em,
  });
  builtMenu.toggleCode = markItem(schema.marks.code, {
    title: "Toggle code font",
    icon: icons.code,
  });

  // created item for URL toggling and for FileProtocol handling
  builtMenu.createLink = getExternalLinkItem(schema.nodes.link);
  //console.log("created link")
  builtMenu.createFileLink = getFilepathLinkItem(schema.nodes.link);

  builtMenu.insertImage = insertImageItem(schema.nodes.image);
  builtMenu.wrapBulletList = wrapListItem(schema.nodes.bullet_list, {
    title: "Wrap in bullet list",
    icon: icons.bulletList,
  });
  builtMenu.wrapOrderedList = wrapListItem(schema.nodes.ordered_list, {
    title: "Wrap in ordered list",
    icon: icons.orderedList,
  });
  builtMenu.wrapBlockQuote = wrapItem(schema.nodes.blockquote, {
    title: "Wrap in block quote",
    icon: icons.blockquote,
  });
  builtMenu.makeParagraph = blockTypeItem(schema.nodes.paragraph, {
    title: "Change to paragraph",
    label: "Plain",
  });
  builtMenu.makeCodeBlock = blockTypeItem(schema.nodes.code_block, {
    title: "Change to code block",
    label: "Code",
  });
  for (let i = 1; i <= 10; i++)
    (builtMenu as any)["makeHead" + i] = blockTypeItem(schema.nodes.heading, {
      title: "Change to heading " + i,
      label: "Level " + i,
      attrs: { level: i },
    });
  const hr = schema.nodes.horizontal_rule;
  builtMenu.insertHorizontalRule = new MenuItem({
    title: "Insert horizontal rule",
    label: "Horizontal rule",
    enable(state) {
      return canInsertNode(state, hr);
    },
    run(state, dispatch) {
      dispatch(state.tr.replaceSelectionWith(hr.create()));
    },
  });

  const cut = <T>(arr: T[]) => arr.filter((x) => x) as NonNullable<T>[];

  // added link menu with different linkage options
  builtMenu.linkMenu = new Dropdown(
    [builtMenu.createLink, builtMenu.createFileLink],
    { label: "Link" }
  );

  builtMenu.insertMenu = new Dropdown(
    cut([builtMenu.insertImage, builtMenu.insertHorizontalRule]),
    { label: "Insert" }
  );
  builtMenu.typeMenu = new Dropdown(
    cut([
      builtMenu.makeParagraph,
      builtMenu.makeCodeBlock,
      builtMenu.makeHead1 &&
        new DropdownSubmenu(
          cut([
            builtMenu.makeHead1,
            builtMenu.makeHead2,
            builtMenu.makeHead3,
            builtMenu.makeHead4,
            builtMenu.makeHead5,
            builtMenu.makeHead6,
          ]),
          { label: "Heading" }
        ),
    ]),
    { label: "Type..." }
  );

  builtMenu.inlineMenu = [
    cut([builtMenu.toggleStrong, builtMenu.toggleEm, builtMenu.toggleCode]),
  ];
  builtMenu.blockMenu = [
    cut([
      builtMenu.wrapBulletList,
      builtMenu.wrapOrderedList,
      builtMenu.wrapBlockQuote,
      joinUpItem,
      liftItem,
      selectParentNodeItem,
    ]),
  ];

  // constructed dropdown with table menu items and created a full menu
  builtMenu.tableMenu = new Dropdown(tableMenu, { label: "Table" });
  builtMenu.fullMenu = builtMenu.inlineMenu.concat(
    [
      [
        builtMenu.insertMenu,
        builtMenu.typeMenu,
        builtMenu.linkMenu,
        builtMenu.tableMenu,
      ],
    ],
    [[undoItem, redoItem]],
    builtMenu.blockMenu
  );

  return builtMenu;
}
