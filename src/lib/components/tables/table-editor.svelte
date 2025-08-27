<script lang="ts">
  import type { Table, Column } from '$lib/types';
  import Button from '$lib/components/ui/button.svelte';
  import {
    ChevronDown,
    ChevronRight,
    Database,
    Pencil,
    Plus,
    Trash2,
    GripVertical
  } from 'lucide-svelte';
  import { cn } from '$lib/utils';
  import { getColumnBadges } from '$lib/utils/canvas';
  import Badget from '$lib/components/ui/badget.svelte';
  import MenuBar from '$lib/components/ui/menu-bar.svelte';

  interface Props {
    table: Table;
    tableIndex: number;
    isExpanded?: boolean;
    isDragging?: boolean;
    isDropTarget?: boolean;
    draggedColumnIndex?: number;
    dropColumnIndex?: number;
    onToggleExpansion: (tableName: string) => void;
    onEditTable: (tableName: string) => void;
    onAddColumn: (tableName: string) => void;
    onRemoveTable: (tableName: string) => void;
    onEditColumn: (tableName: string, column: Column) => void;
    onRemoveColumn: (tableName: string, columnName: string) => void;
    onTableDragStart: (e: DragEvent, index: number) => void;
    onTableDragOver: (e: DragEvent, index: number) => void;
    onTableDrop: (e: DragEvent, index: number) => void;
    onColumnDragStart: (e: DragEvent, tableName: string, index: number) => void;
    onColumnDragOver: (e: DragEvent, tableName: string, index: number) => void;
    onColumnDrop: (e: DragEvent, tableName: string, index: number) => void;
    onDragEnd: () => void;
  }

  let {
    table,
    tableIndex,
    isExpanded = false,
    isDragging = false,
    isDropTarget = false,
    draggedColumnIndex = -1,
    dropColumnIndex = -1,
    onToggleExpansion,
    onEditTable,
    onAddColumn,
    onRemoveTable,
    onEditColumn,
    onRemoveColumn,
    onTableDragStart,
    onTableDragOver,
    onTableDrop,
    onColumnDragStart,
    onColumnDragOver,
    onColumnDrop,
    onDragEnd
  }: Props = $props();
</script>

<div
  class={cn(
    'overflow-hidden rounded-lg border bg-white',
    'border-gray-200 dark:border-gray-700 dark:bg-zinc-900',
    isDragging && 'opacity-50',
    isDropTarget && 'border-gray-400 bg-gray-50 dark:border-gray-500 dark:bg-gray-800/50'
  )}
  ondragover={(e) => onTableDragOver(e, tableIndex)}
  ondrop={(e) => onTableDrop(e, tableIndex)}
  role="application"
>
  <div class={cn('flex items-center justify-between px-3 py-2', 'bg-gray-50 dark:bg-zinc-900')}>
    <div class="flex flex-1 items-center gap-2">
      <div
        class={cn(
          'opacity-60 transition-opacity duration-200 ease-in-out hover:opacity-100',
          'hover:bg-gray-200 dark:hover:bg-gray-600'
        )}
        title="Drag to reorder"
        draggable="true"
        ondragstart={(e) => onTableDragStart(e, tableIndex)}
        ondragend={onDragEnd}
        role="application"
      >
        <GripVertical class={cn('h-3 w-3', 'text-gray-600 dark:text-gray-400')} />
      </div>

      <Button
        onClick={() => onToggleExpansion(table.name)}
        class="flex flex-1 items-center gap-2 text-left"
      >
        {#if isExpanded}
          <ChevronDown class={cn('h-4 w-4', 'text-gray-600 dark:text-gray-400')} />
        {:else}
          <ChevronRight class={cn('h-4 w-4', 'text-gray-600 dark:text-gray-400')} />
        {/if}
        <Database class={cn('h-4 w-4', 'text-gray-600 dark:text-gray-400')} />
        <span class={cn('max-w-[100px] truncate font-medium', 'text-gray-900 dark:text-gray-100')}>
          {table.name}
        </span>
        <span class={cn('text-xs', 'text-gray-500 dark:text-gray-400')}
          >({table.columns.length})</span
        >
      </Button>
    </div>
    <div class="flex items-center">
      {#if table.columns.length < 2 || !isExpanded}
        <Button
          variant="icon"
          size="sm"
          onClick={() => onEditTable(table.name)}
          title="Edit table"
        >
          <Pencil class="h-3 w-3" />
        </Button>
        <Button
          variant="icon"
          size="sm"
          onClick={() => onAddColumn(table.name)}
          title="Add column"
        >
          <Plus class="h-3 w-3" />
        </Button>
        <Button
          variant="icon"
          size="sm"
          onClick={() => onRemoveTable(table.name)}
          title="Remove table"
        >
          <Trash2 class="h-3 w-3" />
        </Button>
      {:else}
        <MenuBar
          options={[
            { label: 'Edit Table', icon: Pencil, onClick: () => onEditTable(table.name) },
            { label: 'Add Column', icon: Plus, onClick: () => onAddColumn(table.name) },
            {
              label: 'Remove Table',
              icon: Trash2,
              onClick: () => onRemoveTable(table.name),
              iconClass: 'text-red-500'
            }
          ]}
        />
      {/if}
    </div>
  </div>

  {#if isExpanded}
    <div class="space-y-2 p-3">
      {#if table.columns.length === 0}
        <p class={cn('text-sm italic', 'text-gray-500 dark:text-gray-400')}>No columns defined</p>
      {:else}
        {#each table.columns as column, columnIndex (column.name)}
          <div
            class={cn(
              'flex items-center justify-between rounded border p-2',
              'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-zinc-900',
              draggedColumnIndex === columnIndex && 'opacity-50',
              dropColumnIndex === columnIndex &&
                'border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-800/30'
            )}
            ondragover={(e) => onColumnDragOver(e, table.name, columnIndex)}
            ondrop={(e) => onColumnDrop(e, table.name, columnIndex)}
            role="application"
          >
            <div class="flex flex-1 items-center gap-2">
              <div
                class={cn(
                  'opacity-60 transition-opacity duration-200 ease-in-out hover:opacity-100 cursor-move rounded p-1',
                  'hover:bg-gray-200 dark:hover:bg-gray-500'
                )}
                title="Drag to reorder"
                draggable="true"
                ondragstart={(e) => onColumnDragStart(e, table.name, columnIndex)}
                ondragend={onDragEnd}
                role="application"
              >
                <GripVertical class={cn('h-3 w-3', 'text-gray-600 dark:text-gray-400')} />
              </div>

              <div class="flex flex-col">
                <span class={cn('font-mono text-sm', 'text-gray-900 dark:text-gray-100')}>
                  {column.name}
                </span>
                <span class={cn('font-mono text-xs', 'text-gray-500 dark:text-gray-400')}>
                  {column.type}
                </span>
              </div>

              {#if getColumnBadges(column).length > 0}
                <div class="ml-2 hidden flex-shrink-0 flex-wrap gap-1 md:flex">
                  {#each getColumnBadges(column) as badge, index (index)}
                    <Badget title={badge} />
                  {/each}
                </div>
              {/if}
            </div>

            <div class="flex items-center gap-1">
              <Button
                variant="table"
                size="sm"
                onClick={() => onEditColumn(table.name, column)}
                title="Edit column"
              >
                <Pencil class="h-3 w-3" />
              </Button>
              <Button
                variant="table"
                size="sm"
                onClick={() => onRemoveColumn(table.name, column.name)}
                title="Remove column"
              >
                <Trash2 class="h-3 w-3" />
              </Button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  [draggable='true'] {
    cursor: move;
  }

  [draggable='true']:active {
    cursor: grabbing;
  }
</style>
