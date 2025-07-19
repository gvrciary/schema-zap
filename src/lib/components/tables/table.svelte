<script lang="ts">
	import type { Table, Column } from '$lib/types';
	import {
		Table as TableIcon,
		KeyRound,
		Link,
		Hash,
		Type,
		Calendar,
		FileText,
		Binary,
		Database,
		Image,
		Mail,
		Globe,
		CheckSquare,
		DollarSign,
		Clock,
		MapPin,
		Palette,
		Shield,
		Zap,
		Package,
		Tag,
		AtSign
	} from 'lucide-svelte';
	import { canvasState } from '$lib/stores/app';
	import { showBadgets } from '$lib/stores/ui';
	import { cn } from '$lib/utils';

	interface Props {
		table: Table;
	}

	const { table }: Props = $props();

	let box: HTMLDivElement;

	const isSelected = $derived($canvasState.selectedTable === table.name);
	const isDragging = $derived($canvasState.draggedTable === table.name);

	function getColumnTypeIcon(column: Column) {
		const type = column.type.toLowerCase();
		const name = column.name.toLowerCase();

		if (column.primaryKey) return KeyRound;
		if (column.foreignKey) return Link;

		if (type.includes('bool') || type.includes('bit')) return CheckSquare;

		if (type.includes('json') || type.includes('jsonb')) return Package;

		if (
			type.includes('blob') ||
			type.includes('binary') ||
			type.includes('varbinary') ||
			type.includes('bytea')
		)
			return Binary;

		if (type.includes('uuid') || type.includes('guid')) return Shield;

		if (type.includes('serial') || type.includes('autoincrement')) return Zap;
		if (type.includes('decimal') || type.includes('numeric') || type.includes('money'))
			return DollarSign;
		if (type.includes('float') || type.includes('double') || type.includes('real')) return Hash;
		if (
			type.includes('int') ||
			type.includes('number') ||
			type.includes('bigint') ||
			type.includes('smallint') ||
			type.includes('tinyint')
		)
			return Hash;

		if (type.includes('timestamp') || type.includes('datetime')) return Clock;
		if (type.includes('date')) return Calendar;
		if (type.includes('time')) return Clock;

		if (name.includes('email') || name.includes('mail')) return Mail;
		if (name.includes('url') || name.includes('website') || name.includes('link')) return Globe;
		if (name.includes('color') || name.includes('colour')) return Palette;
		if (name.includes('address') || name.includes('location') || name.includes('geo'))
			return MapPin;
		if (name.includes('tag') || name.includes('label') || name.includes('category')) return Tag;
		if (name.includes('username') || name.includes('user_name')) return AtSign;
		if (
			name.includes('image') ||
			name.includes('photo') ||
			name.includes('picture') ||
			name.includes('avatar')
		)
			return Image;

		if (
			type.includes('text') ||
			type.includes('clob') ||
			type.includes('longtext') ||
			type.includes('mediumtext')
		)
			return FileText;
		if (
			type.includes('varchar') ||
			type.includes('char') ||
			type.includes('nvarchar') ||
			type.includes('nchar')
		)
			return FileText;

		if (type.includes('enum') || type.includes('set')) return Database;

		return Type;
	}

	function formatColumnType(type: string): string {
		if (type.length > 20) {
			return type.substring(0, 17) + '...';
		}
		return type;
	}

	function getColumnBadges(column: Column): string[] {
		const badges: string[] = [];

		if (column.primaryKey) badges.push('PK');
		if (column.foreignKey) badges.push('FK');
		if (column.unique && !column.primaryKey) badges.push('UQ');
		if (column.autoIncrement) badges.push('AI');
		if (!column.nullable) badges.push('NN');

		return badges;
	}
</script>

<div
	id="table-{table.name.toLowerCase()}"
	class={cn(
		'table-node max-w-96 min-w-[290px] rounded-lg border shadow-lg select-none',
		'border-white/30 bg-white/90 dark:border-gray-600 dark:bg-black/90',
		isDragging && 'dragging',
		isSelected && 'selected'
	)}
	style="transform: {isDragging
		? 'translate3d(0, 0, 0) rotate(1deg) scale(1.05)'
		: 'translate3d(0, 0, 0)'};
		   box-shadow: {isDragging
		? '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
		: isSelected
			? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
			: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'};
		   border-color: {isSelected ? '#6b7280' : 'rgba(255, 255, 255, 0.3)'};
		   ring: {isSelected ? '2px solid #6b7280' : 'none'};
		   z-index: {isDragging ? '1000' : isSelected ? '10' : '1'};
		   will-change: transform;
		   contain: layout style paint;
		   backface-visibility: hidden;
		   transform-style: preserve-3d;"
	bind:this={box}
>
	<div
		class={cn(
			'flex items-center justify-between rounded-t-lg border-b px-4 py-3',
			'border-gray-600/5 bg-white/90 dark:border-gray-600/50 dark:bg-black/90'
		)}
	>
		<div class="flex items-center gap-2">
			<TableIcon class={cn('h-4 w-4', 'text-gray-600 dark:text-gray-400')} />
			<h3
				class={cn(
					'max-w-40 min-w-40 overflow-hidden font-semibold overflow-ellipsis whitespace-nowrap',
					'text-gray-900 dark:text-gray-100'
				)}
				title={table.name}
			>
				{table.name}
			</h3>
		</div>
		<div class={cn('ml-2 flex-shrink-0 text-xs', 'text-gray-500 dark:text-gray-400')}>
			({table.columns.length})
		</div>
	</div>

	<div
		class={cn(
			'table-columns max-h-[60vh] overflow-y-auto border-t',
			'border-gray-600/5 dark:border-gray-600/50'
		)}
	>
		{#each table.columns as column, index (index)}
			{@const IconComponent = getColumnTypeIcon(column)}
			<div
				class={cn(
					'px-4 py-2 transition-colors duration-150',
					'bg-white/50 hover:bg-white/70 dark:bg-black/90 dark:hover:bg-zinc-900',
					index > 0 && 'border-t border-gray-600/5 dark:border-gray-600/50'
				)}
				title="Column: {column.name} ({column.type}){column.nullable
					? ''
					: ' - NOT NULL'}{column.defaultValue ? ` - Default: ${column.defaultValue}` : ''}"
			>
				<div class="flex items-center justify-between">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<IconComponent class={cn('h-3 w-3', 'text-gray-600 dark:text-gray-400')} />
							<span
								class={cn(
									'max-w-40 min-w-40 overflow-hidden text-sm text-ellipsis whitespace-nowrap',
									'text-gray-900 dark:text-gray-100',
									column.primaryKey && 'font-semibold'
								)}
							>
								{column.name}
							</span>
						</div>
						<div
							class={cn(
								'flex items-center gap-2 font-mono text-xs',
								'text-gray-600 dark:text-gray-400'
							)}
						>
							<span class="truncate">
								{formatColumnType(column.type)}
							</span>
							{#if column.foreignKey}
								<span
									class={cn(
										'flex flex-shrink-0 items-center gap-1',
										'text-gray-600 dark:text-gray-400'
									)}
								>
									<Link class="h-2.5 w-2.5" />
									→ {column.foreignKey.table}.{column.foreignKey.column}
								</span>
							{/if}
						</div>
					</div>

					{#if $showBadgets && getColumnBadges(column).length > 0}
						<div class="ml-2 flex flex-shrink-0 flex-wrap gap-1">
							{#each getColumnBadges(column) as badge, index (index)}
								<span
									class={cn(
										'rounded border px-1.5 py-0.5 text-xs font-medium',
										'border-gray-300 bg-gray-100 text-gray-800',
										'dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300'
									)}
								>
									{badge}
								</span>
							{/each}
						</div>
					{/if}
				</div>

				{#if column.defaultValue}
					<div class="mt-1 pl-5">
						<span class={cn('text-xs', 'text-gray-500 dark:text-gray-400')}>
							Default: <span class="font-mono">{column.defaultValue}</span>
						</span>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.table-node {
		position: relative;
		isolation: isolate;
		transform-origin: center center;
		transition: none;
	}

	.table-node:not(.dragging) {
		transition:
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.dragging {
		cursor: grabbing !important;
		pointer-events: none;
	}

	.selected {
		isolation: isolate;
	}

	:global(.table-columns::-webkit-scrollbar) {
		width: 4px;
	}

	:global(.table-columns::-webkit-scrollbar-track) {
		background: #f1f5f9;
	}

	:global(.table-columns::-webkit-scrollbar-thumb) {
		background: #cbd5e1;
		border-radius: 2px;
	}

	:global(.table-columns::-webkit-scrollbar-thumb:hover) {
		background: #94a3b8;
	}
</style>
