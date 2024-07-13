import { EditorState } from "prosemirror-state";

function getTableBySize(
  state: EditorState,
  rowsCount: number,
  colsCount: number,
  hasHeader: boolean
) {
  const rowType = state.schema.nodes.table_row;
  const cellType = state.schema.nodes.table_cell;
  const headerType = state.schema.nodes.table_header;
  const tableType = state.schema.nodes.table;

  const spaceParagraph = state.schema.nodes.paragraph.createChecked(
    {},
    state.schema.text(" ")
  );
  const emptyCell = cellType.createChecked({}, spaceParagraph);
  const emptyCells = Array(colsCount);
  emptyCells.fill(emptyCell);
  const emptyHeader = headerType.createChecked({}, spaceParagraph);
  const emptyHeaders = Array(colsCount);
  emptyHeaders.fill(emptyHeader);

  const headerRow = rowType.createChecked({}, emptyHeaders);
  const simpleRow = rowType.createChecked({}, emptyCells);
  const simpleRows = Array(rowsCount);
  simpleRows.fill(simpleRow);
  const combinedRows = [headerRow, ...simpleRows];
  const simpleTable = tableType.createChecked({}, combinedRows);
  return simpleTable;
}

export { getTableBySize };
