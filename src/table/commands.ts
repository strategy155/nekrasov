import { EditorState, Transaction } from "prosemirror-state";
import { isInTable } from "prosemirror-tables";
import { getTableBySize } from "./table";

function createTable(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  if (isInTable(state)) return false;
  if (dispatch) {
    const currentSelection = state.selection;
    const currentAnchorIndex = currentSelection.$anchor.pos;
    const currentHeadIndex = currentSelection.$head.pos;
    const currentDoc = state.doc;
    const tableType = state.schema.nodes.table;

    const initialTransaction = state.tr;
    const simpleTable = getTableBySize(state, 4, 4, true);
    const tableInserted = initialTransaction.replaceSelectionWith(simpleTable);
    dispatch(tableInserted);
  }
  return true;
}

export { createTable };
