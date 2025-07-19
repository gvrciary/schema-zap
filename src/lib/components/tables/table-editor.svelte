<script lang="ts">
	import type { Table, Column } from '$lib/types';
	import { Button } from '$lib/components/ui/index';
	import {
		ChevronDown,
		ChevronRight,
		Database,
		Pencil,
		Plus,
		Trash2,
		GripVertical
	} from 'lucide-svelte';

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
	class="overflow-hidden rounded-lg border border-gray-200 bg-white {isDragging
		? 'opacity-50'
		: ''} {isDropTarget
		? 'border-gray-400 bg-gray-50 dark:border-gray-500 dark:bg-gray-800/50'
		: ''} dark:border-gray-700 dark:bg-black"
	ondragover={(e) => onTableDragOver(e, tableIndex)}
	ondrop={(e) => onTableDrop(e, tableIndex)}
	role="application"
>
	<div class="flex items-center justify-between bg-gray-50 px-3 py-2 dark:bg-zinc-900">
		<div class="flex flex-1 items-center gap-2">
			<div
				class="drag-handle cursor-move rounded p-1 transition-colors duration-150 hover:bg-gray-200 dark:hover:bg-gray-600"
				title="Drag to reorder"
				draggable="true"
				ondragstart={(e) => onTableDragStart(e, tableIndex)}
				ondragend={onDragEnd}
				role="application"
			>
				<GripVertical class="h-3 w-3 text-gray-600 dark:text-gray-400" />
			</div>

			<Button
				onClick={() => onToggleExpansion(table.name)}
				class="flex flex-1 items-center gap-2 text-left"
			>
				{#if isExpanded}
					<ChevronDown class="h-4 w-4 text-gray-600 dark:text-gray-400" />
				{:else}
					<ChevronRight class="h-4 w-4 text-gray-600 dark:text-gray-400" />
				{/if}
				<Database class="h-4 w-4 text-gray-600 dark:text-gray-400" />
				<span class="max-w-[100px] truncate font-medium text-gray-900 dark:text-gray-100">
					{table.name}
				</span>
				<span class="text-xs text-gray-500 dark:text-gray-400">({table.columns.length})</span>
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
				<p class="text-sm text-gray-500 italic dark:text-gray-400">No columns defined</p>
			{:else}
				{#each table.columns as column, columnIndex (column.name)}
					<div
						class="flex items-center justify-between rounded border border-gray-300 bg-gray-50 p-2 {draggedColumnIndex ===
						columnIndex
							? 'opacity-50'
							: ''} {dropColumnIndex === columnIndex
							? 'border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-800/30'
							: ''} dark:border-gray-700 dark:bg-zinc-900"
						ondragover={(e) => onColumnDragOver(e, table.name, columnIndex)}
						ondrop={(e) => onColumnDrop(e, table.name, columnIndex)}
						role="application"
					>
						<div class="flex flex-1 items-center gap-2">
							<div
								class="drag-handle cursor-move rounded p-1 transition-colors duration-150 hover:bg-gray-200 dark:hover:bg-gray-500"
								title="Drag to reorder"
								draggable="true"
								ondragstart={(e) => onColumnDragStart(e, table.name, columnIndex)}
								ondragend={onDragEnd}
								role="application"
							>
								<GripVertical class="h-3 w-3 text-gray-600 dark:text-gray-400" />
							</div>

							<div class="flex flex-col">
								<span class="font-mono text-sm text-gray-900 dark:text-gray-100">
									{column.name}
								</span>
								<span class="font-mono text-xs text-gray-500 dark:text-gray-400">
									{column.type}
								</span>
							</div>

							{#if column.primaryKey}
								<span
									class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
									title="Primary Key"
								>
									PK
								</span>
							{/if}
							{#if column.foreignKey}
								<span
									class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
									title="Foreign Key → {column.foreignKey.table}.{column.foreignKey.column}"
								>
									FK
								</span>
							{/if}
							{#if column.autoIncrement}
								<span
									class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
									title="Auto Increment"
								>
									AI
								</span>
							{/if}
							{#if !column.nullable}
								<span
									class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
									title="Not Null"
								>
									NN
								</span>
							{/if}
							{#if column.unique}
								<span
									class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
									title="Unique"
								>
									UQ
								</span>
							{/if}
							{#if column.defaultValue}
								<span
									class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
									title="Default: {column.defaultValue}"
								>
									DF
								</span>
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
