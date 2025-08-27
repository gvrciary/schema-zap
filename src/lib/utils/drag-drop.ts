import type { Table } from '$lib/types';

export interface DragState {
  isDragging: boolean;
  dragType: 'table' | 'column' | '';
  dragIndex: number;
  dragTableName: string;
  dragColumnName: string;
  dropIndex: number;
  dropTableName: string;
}

export function createDragState(): DragState {
  return {
    isDragging: false,
    dragType: '',
    dragIndex: -1,
    dragTableName: '',
    dragColumnName: '',
    dropIndex: -1,
    dropTableName: ''
  };
}

export function resetDragState(dragState: DragState): void {
  dragState.isDragging = false;
  dragState.dragType = '';
  dragState.dragIndex = -1;
  dragState.dragTableName = '';
  dragState.dragColumnName = '';
  dragState.dropIndex = -1;
  dragState.dropTableName = '';
}

export function handleTableDragStart(
  event: DragEvent, 
  tableIndex: number, 
  visualTables: Table[], 
  dragState: DragState
): void {
  if (!event.dataTransfer) return;

  dragState.isDragging = true;
  dragState.dragType = 'table';
  dragState.dragIndex = tableIndex;
  dragState.dragTableName = visualTables[tableIndex].name;

  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', '');
}

export function handleTableDragOver(event: DragEvent, targetIndex: number, dragState: DragState): void {
  if (dragState.dragType !== 'table') return;

  event.preventDefault();
  event.dataTransfer!.dropEffect = 'move';
  dragState.dropIndex = targetIndex;
}

export function handleTableDrop(
  event: DragEvent, 
  targetIndex: number, 
  visualTables: Table[], 
  dragState: DragState,
  updateCallback: (newTables: Table[]) => void
): void {
  if (dragState.dragType !== 'table') return;

  event.preventDefault();

  const sourceIndex = dragState.dragIndex;
  if (sourceIndex === targetIndex) {
    resetDragState(dragState);
    return;
  }

  const newTables = [...visualTables];
  const [draggedTable] = newTables.splice(sourceIndex, 1);
  newTables.splice(targetIndex, 0, draggedTable);

  updateCallback(newTables);
  resetDragState(dragState);
}

export function handleColumnDragStart(
  event: DragEvent, 
  tableName: string, 
  columnIndex: number, 
  visualTables: Table[], 
  dragState: DragState
): void {
  if (!event.dataTransfer) return;

  const table = visualTables.find((t) => t.name === tableName);
  if (!table) return;

  dragState.isDragging = true;
  dragState.dragType = 'column';
  dragState.dragIndex = columnIndex;
  dragState.dragTableName = tableName;
  dragState.dragColumnName = table.columns[columnIndex].name;

  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', '');
}

export function handleColumnDragOver(
  event: DragEvent, 
  tableName: string, 
  targetIndex: number, 
  dragState: DragState
): void {
  if (dragState.dragType !== 'column' || dragState.dragTableName !== tableName) return;

  event.preventDefault();
  event.dataTransfer!.dropEffect = 'move';
  dragState.dropIndex = targetIndex;
  dragState.dropTableName = tableName;
}

export function handleColumnDrop(
  event: DragEvent, 
  tableName: string, 
  targetIndex: number, 
  visualTables: Table[], 
  dragState: DragState,
  updateCallback: (newTables: Table[]) => void
): void {
  if (dragState.dragType !== 'column' || dragState.dragTableName !== tableName) return;

  event.preventDefault();

  const sourceIndex = dragState.dragIndex;
  if (sourceIndex === targetIndex) {
    resetDragState(dragState);
    return;
  }

  const tableIndex = visualTables.findIndex((t) => t.name === tableName);
  if (tableIndex === -1) {
    resetDragState(dragState);
    return;
  }

  const newTables = visualTables.map((table, idx) => {
    if (idx === tableIndex) {
      const newColumns = [...table.columns];
      const [draggedColumn] = newColumns.splice(sourceIndex, 1);
      newColumns.splice(targetIndex, 0, draggedColumn);
      return { ...table, columns: newColumns };
    }
    return table;
  });

  updateCallback(newTables);
  resetDragState(dragState);
}
