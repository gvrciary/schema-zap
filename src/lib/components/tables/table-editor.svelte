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
	import Badget from '../ui/badget.svelte';

	export let table: Table;
	export let tableIndex: number;
	export let isExpanded: boolean = false;
	export let isDragging: boolean = false;
	export let isDropTarget: boolean = false;
	export let draggedColumnIndex: number = -1;
	export let dropColumnIndex: number = -1;

	export let onToggleExpansion: (tableName: string) => void;
	export let onEditTable: (tableName: string) => void;
	export let onAddColumn: (tableName: string) => void;
	export let onRemoveTable: (tableName: string) => void;
	export let onEditColumn: (tableName: string, column: Column) => void;
	export let onRemoveColumn: (tableName: string, columnName: string) => void;

	export let onTableDragStart: (e: DragEvent, index: number) => void;
	export let onTableDragOver: (e: DragEvent, index: number) => void;
	export let onTableDrop: (e: DragEvent, index: number) => void;
	export let onColumnDragStart: (e: DragEvent, tableName: string, index: number) => void;
	export let onColumnDragOver: (e: DragEvent, tableName: string, index: number) => void;
	export let onColumnDrop: (e: DragEvent, tableName: string, index: number) => void;
	export let onDragEnd: () => void;
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
					'drag-handle cursor-move rounded p-1 transition-colors duration-150',
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
				<span class={cn('text-xs', 'text-gray-500 dark:text-gray-400')}>({table.columns.length})</span>
			</Button>
		</div>

		<div class="flex items-center gap-1">
			<Button variant="table" size="sm" onClick={() => onEditTable(table.name)} title="Edit table">
				<Pencil class="h-3 w-3" />
			</Button>
			<Button variant="table" size="sm" onClick={() => onAddColumn(table.name)} title="Add column">
				<Plus class="h-3 w-3" />
			</Button>
			<Button
				variant="table"
				size="sm"
				onClick={() => onRemoveTable(table.name)}
				title="Remove table"
			>
				<Trash2 class="h-3 w-3" />
			</Button>
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
							dropColumnIndex === columnIndex && 'border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-800/30'
						)}
						ondragover={(e) => onColumnDragOver(e, table.name, columnIndex)}
						ondrop={(e) => onColumnDrop(e, table.name, columnIndex)}
						role="application"
					>
						<div class="flex flex-1 items-center gap-2">
							<div
								class={cn(
									'drag-handle cursor-move rounded p-1 transition-colors duration-150',
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
								<div class="ml-2 flex-shrink-0 flex-wrap gap-1 hidden md:flex">
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
	.drag-handle {
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	.drag-handle:hover {
		opacity: 1;
	}

	[draggable='true'] {
		cursor: move;
	}

	[draggable='true']:active {
		cursor: grabbing;
	}
</style>
