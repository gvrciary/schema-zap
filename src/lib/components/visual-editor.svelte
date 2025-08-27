<script lang="ts">
  import { sqlInput, selectedDialect, schema } from '$lib/stores/app';
  import { type Table, type Column } from '$lib/types';
  import { handleParseSQL } from '$lib/handlers/sqlHandler';
  import { Plus, Trash2, Database, MessageCircleXIcon } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import TableEditor from '$lib/components/tables/table-editor.svelte';
  import NewTableModal from '$lib/components/modals/new-table-modal.svelte';
  import EditTableModal from '$lib/components/modals/edit-table-modal.svelte';
  import ColumnModal from '$lib/components/modals/column-modal.svelte';
  import { toast } from 'svelte-sonner';
  import { generateSQLFromSchema } from '$lib/utils/sql-generator';
  import { extractTypeAndLength } from '$lib/utils/column-helpers';
  import { canHaveLength, requiresLength } from '$lib/utils/validators';
  import { 
    createDragState, 
    resetDragState,
    handleTableDragStart,
    handleTableDragOver,
    handleTableDrop,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDrop,
  } from '$lib/utils/drag-drop';
  import type { DragState } from '$lib/types';

  let visualTables: Table[] = $state([]);
  let expandedTables: Set<string> = $state(new Set());
  let selectedTable: string | null = $state(null);
  const dragState: DragState = $state(createDragState());
  let showNewTableForm = $state(false);

  let editTableForm = $state({
    originalName: '',
    name: '',
    isVisible: false
  });

  let columnForm = $state({
    isEdit: false,
    originalName: '',
    tableName: '',
    name: '',
    type: '',
    nullable: true,
    primaryKey: false,
    foreignKey: undefined as { table: string; column: string } | undefined,
    defaultValue: '',
    autoIncrement: false,
    unique: false,
    length: undefined as number | undefined
  });
  let showColumnForm = $state(false);

  $effect(() => {
    if ($schema.tables.length > 0 && visualTables.length === 0) {
      updateSQLAndSchema(false, false, false);

      visualTables = [...$schema.tables];
      const newExpanded = new Set<string>();
      for (const table of visualTables) {
        if (table.columns.length > 0) {
          newExpanded.add(table.name);
        }
      }
      expandedTables = newExpanded;
    }
  });

  $effect(() => {
    if (columnForm.primaryKey) {
      columnForm.nullable = false;
      columnForm.unique = false;
    } else {
      columnForm.autoIncrement = false;
    }
  });

  $effect(() => {
    if (columnForm.type && !canHaveLength(columnForm.type, $selectedDialect)) {
      columnForm.length = undefined;
    }
  });


  function updateSQLAndSchema(
    resetZoom: boolean = false,
    resetPositions: boolean = false,
    updateSqlFromSchema: boolean = true
  ): boolean {
    if (updateSqlFromSchema) {
      const newSQL = generateSQLFromSchema(visualTables, $selectedDialect);
      sqlInput.set(newSQL);
    }

    const result = handleParseSQL(resetZoom, resetPositions);

    return result.success;
  }

  function addTable(tableName: string): void {
    if (!tableName.trim()) return;

    const newTable: Table = {
      name: tableName.trim(),
      columns: [],
      position: { x: 0, y: visualTables.length * 200 }
    };

    newTable.columns.push({
      name: 'id',
      type: 'INT',
      nullable: false,
      primaryKey: true,
      foreignKey: undefined,
      defaultValue: undefined,
      autoIncrement: true,
      unique: true,
      length: undefined
    });

    visualTables = [...visualTables, newTable];
    expandedTables = new Set([...expandedTables, newTable.name]);
    showNewTableForm = false;
    updateSQLAndSchema(true, false);
    toast.success('Success!', {
      description: `The table "${newTable.name}" has been created successfully.`
    });
  }

  function editTable(tableName: string): void {
    editTableForm = {
      originalName: tableName,
      name: tableName,
      isVisible: true
    };
  }

  function saveTableChanges(): void {
    if (!editTableForm.name.trim() || editTableForm.name === editTableForm.originalName) {
      editTableForm.isVisible = false;
      return;
    }

    const tableIndex = visualTables.findIndex((t) => t.name === editTableForm.originalName);
    if (tableIndex === -1) return;

    visualTables[tableIndex].name = editTableForm.name.trim();

    for (const table of visualTables) {
      for (const column of table.columns) {
        if (column.foreignKey?.table === editTableForm.originalName) {
          column.foreignKey.table = editTableForm.name.trim();
        }
      }
    }

    visualTables = [...visualTables];
    editTableForm.isVisible = false;
    updateSQLAndSchema();
    toast.success('Success!', {
      description: `The table "${editTableForm.originalName}" has been renamed to "${editTableForm.name}".`
    });
  }

  function removeTable(tableName: string): void {
    visualTables = visualTables.filter((t) => t.name !== tableName);
    const newExpanded = new Set(expandedTables);
    newExpanded.delete(tableName);
    expandedTables = newExpanded;

    if (selectedTable === tableName) {
      selectedTable = null;
    }

    for (const table of visualTables) {
      for (const column of table.columns) {
        if (column.foreignKey?.table === tableName) {
          column.foreignKey = undefined;
        }
      }
    }
    visualTables = [...visualTables];
    updateSQLAndSchema();
    toast.success('Success!', {
      description: `The table "${tableName}" has been removed successfully.`
    });
  }

  function initNewColumnForm(tableName: string): void {
    columnForm = {
      isEdit: false,
      originalName: '',
      tableName,
      name: '',
      type: '',
      nullable: true,
      primaryKey: false,
      foreignKey: undefined,
      defaultValue: '',
      autoIncrement: false,
      unique: false,
      length: undefined
    };
    showColumnForm = true;
  }



  function initEditColumnForm(tableName: string, column: Column): void {
    const { baseType, length } = extractTypeAndLength(column.type);

    columnForm = {
      isEdit: true,
      originalName: column.name,
      tableName,
      name: column.name,
      type: baseType,
      nullable: column.nullable,
      primaryKey: column.primaryKey,
      foreignKey: column.foreignKey ? { ...column.foreignKey } : undefined,
      defaultValue: column.defaultValue || '',
      autoIncrement: column.autoIncrement || false,
      unique: column.unique || false,
      length: length || column.length
    };
    showColumnForm = true;
  }

  function saveColumn(): void {
    if (!columnForm.name.trim() || !columnForm.type) return;

    if (requiresLength(columnForm.type, $selectedDialect) && (!columnForm.length || columnForm.length <= 0)) return;

    const tableIndex = visualTables.findIndex((t) => t.name === columnForm.tableName);
    if (tableIndex === -1) return;

    const newColumn: Column = {
      name: columnForm.name.trim(),
      type: columnForm.type,
      nullable: columnForm.nullable,
      primaryKey: columnForm.primaryKey,
      foreignKey: columnForm.foreignKey,
      defaultValue: columnForm.defaultValue || undefined,
      autoIncrement: columnForm.autoIncrement,
      unique: columnForm.unique,
      length: columnForm.length
    };

    if (columnForm.isEdit) {
      const columnIndex = visualTables[tableIndex].columns.findIndex(
        (c) => c.name === columnForm.originalName
      );
      if (columnIndex !== -1) {
        visualTables[tableIndex].columns[columnIndex] = newColumn;

        if (columnForm.originalName !== columnForm.name) {
          for (const table of visualTables) {
            for (const column of table.columns) {
              if (
                column.foreignKey?.table === columnForm.tableName &&
                column.foreignKey?.column === columnForm.originalName
              ) {
                column.foreignKey.column = columnForm.name.trim();
              }
            }
          }
        }
      }
    } else {
      visualTables[tableIndex].columns.push(newColumn);
    }

    visualTables = [...visualTables];
    showColumnForm = false;
    updateSQLAndSchema();
    toast.success('Success!', {
      description: `The column "${columnForm.name}" has been ${columnForm.isEdit ? 'updated' : 'added'} successfully.`
    });
  }

  function removeColumn(tableName: string, columnName: string): void {
    const tableIndex = visualTables.findIndex((t) => t.name === tableName);
    if (tableIndex === -1) return;

    visualTables[tableIndex].columns = visualTables[tableIndex].columns.filter(
      (c) => c.name !== columnName
    );

    for (const table of visualTables) {
      for (const column of table.columns) {
        if (column.foreignKey?.table === tableName && column.foreignKey?.column === columnName) {
          column.foreignKey = undefined;
        }
      }
    }

    visualTables = [...visualTables];
    updateSQLAndSchema();
    toast.success('Success!', {
      description: `The column "${columnName}" has been removed successfully from table "${tableName}".`
    });
  }

  function toggleTableExpansion(tableName: string): void {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    expandedTables = newExpanded;
  }



  function clearAll(): void {
    visualTables = [];
    expandedTables = new Set();
    selectedTable = null;
    updateSQLAndSchema();
  }

  function onTableDragStart(event: DragEvent, tableIndex: number): void {
    handleTableDragStart(event, tableIndex, visualTables, dragState);
  }

  function onTableDragOver(event: DragEvent, targetIndex: number): void {
    handleTableDragOver(event, targetIndex, dragState);
  }

  function onTableDrop(event: DragEvent, targetIndex: number): void {
    handleTableDrop(event, targetIndex, visualTables, dragState, (newTables) => {
      visualTables = newTables;
      updateSQLAndSchema();
    });
  }

  function onColumnDragStart(event: DragEvent, tableName: string, columnIndex: number): void {
    handleColumnDragStart(event, tableName, columnIndex, visualTables, dragState);
  }

  function onColumnDragOver(event: DragEvent, tableName: string, targetIndex: number): void {
    handleColumnDragOver(event, tableName, targetIndex, dragState);
  }

  function onColumnDrop(event: DragEvent, tableName: string, targetIndex: number): void {
    handleColumnDrop(event, tableName, targetIndex, visualTables, dragState, (newTables) => {
      visualTables = newTables;
      updateSQLAndSchema();
    });
  }

  function onDragEnd(): void {
    resetDragState(dragState);
  }

  function updateColumnForm(updates: Partial<typeof columnForm>): void {
    Object.assign(columnForm, updates);
  }

  function updateEditTableName(name: string): void {
    editTableForm.name = name;
  }
</script>

<div class="flex h-full flex-col">
  <div
    class="mb-4 flex flex-shrink-0 items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-600"
  >
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Schema Editor</span>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="icon" size="sm" onClick={() => (showNewTableForm = true)} title="Add table">
        <Plus class="h-4 w-4" />
      </Button>
      <Button
        variant="icon"
        size="sm"
        onClick={clearAll}
        title="Clear all"
        disabled={visualTables.length === 0 && !$sqlInput.trim()}
      >
        <Trash2 class="h-4 w-4" />
      </Button>
    </div>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto">
    {#if visualTables.length === 0}
      <div class="py-8 text-center text-gray-500 dark:text-gray-400">
        {#if $sqlInput.trim()}
          <MessageCircleXIcon class="mx-auto mb-2 h-8 w-8 text-gray-600 dark:text-gray-400" />
          <p class="mb-4 text-sm">Error in your SQL code</p>
        {:else}
          <Database class="mx-auto mb-2 h-8 w-8 text-gray-600 dark:text-gray-400" />
          <p class="mb-4 text-sm">No tables defined</p>
        {/if}
        <Button
          variant="default"
          size="sm"
          onClick={() => (showNewTableForm = true)}
          class="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white transition-colors duration-150 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Create first table
        </Button>
      </div>
    {:else}
      <div class="space-y-3">
        {#each visualTables as table, tableIndex (table.name)}
          <TableEditor
            {table}
            {tableIndex}
            isExpanded={expandedTables.has(table.name)}
            isDragging={dragState.isDragging &&
              dragState.dragType === 'table' &&
              dragState.dragIndex === tableIndex}
            isDropTarget={dragState.isDragging &&
              dragState.dragType === 'table' &&
              dragState.dropIndex === tableIndex}
            draggedColumnIndex={dragState.isDragging &&
            dragState.dragType === 'column' &&
            dragState.dragTableName === table.name
              ? dragState.dragIndex
              : -1}
            dropColumnIndex={dragState.isDragging &&
            dragState.dragType === 'column' &&
            dragState.dropTableName === table.name
              ? dragState.dropIndex
              : -1}
            onToggleExpansion={toggleTableExpansion}
            onEditTable={editTable}
            onAddColumn={initNewColumnForm}
            onRemoveTable={removeTable}
            onEditColumn={initEditColumnForm}
            onRemoveColumn={removeColumn}
            onTableDragStart={onTableDragStart}
            onTableDragOver={onTableDragOver}
            onTableDrop={onTableDrop}
            onColumnDragStart={onColumnDragStart}
            onColumnDragOver={onColumnDragOver}
            onColumnDrop={onColumnDrop}
            onDragEnd={onDragEnd}
          />
        {/each}
      </div>
    {/if}
  </div>
</div>

<NewTableModal
  open={showNewTableForm}
  {visualTables}
  onClose={() => (showNewTableForm = false)}
  onAddTable={addTable}
/>

<EditTableModal
  {editTableForm}
  {visualTables}
  onClose={() => (editTableForm.isVisible = false)}
  onSaveChanges={saveTableChanges}
  onUpdateName={updateEditTableName}
/>

<ColumnModal
  open={showColumnForm}
  {columnForm}
  {visualTables}
  onClose={() => (showColumnForm = false)}
  onSaveColumn={saveColumn}
  onUpdateColumnForm={updateColumnForm}
/>
