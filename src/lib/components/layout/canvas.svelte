<script lang="ts">
	import type { Table, CanvasState } from '$lib/types';
	import { canvasState, schema } from '$lib/stores/app';
	import { darkMode, initializeRelations } from '$lib/stores/ui';
	import Relationships from '$lib/components/sql/relationships.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { cssObjectToString, getBackground } from '$lib/utils/background';
	import Tables from '$lib/components/tables/table.svelte';
	import { cn } from '$lib/utils';

	let canvasElement: HTMLDivElement;
	let isDragging = $state(false);
	let isTableDragging = $state(false);
	let dragStart = { x: 0, y: 0 };
	let draggedTable = $state<string | null>(null);
	let dragOffset = { x: 0, y: 0 };

	let lastTouchDistance = $state(0);
	let touchStartZoom = $state(1);
	let touchCenter = $state({ x: 0, y: 0 });
	let isTouchPinching = $state(false);

	onMount(() => {
		initializeRelations.set(true);

		if (canvasElement) {
			canvasElement.addEventListener('touchstart', handleTouchStart, { passive: false });
			canvasElement.addEventListener('touchmove', handleTouchMove, { passive: false });
			canvasElement.addEventListener('touchend', handleTouchEnd, { passive: false });
		}
	});

	onDestroy(() => {
		if (canvasElement) {
			canvasElement.removeEventListener('touchstart', handleTouchStart);
			canvasElement.removeEventListener('touchmove', handleTouchMove);
			canvasElement.removeEventListener('touchend', handleTouchEnd);
		}
	});

	function handleTableMove(tableName: string, newPosition: { x: number; y: number }): void {
		const tableIndex = $schema.tables.findIndex((t) => t.name === tableName);
		if (tableIndex >= 0) {
			$schema.tables[tableIndex].position = newPosition;
			schema.set({ ...$schema });
		}
	}

	function handleCanvasUpdate(updates: Partial<CanvasState>): void {
		canvasState.set({ ...$canvasState, ...updates });
	}

	function handleTableSelect(tableName: string | undefined): void {
		canvasState.update((state) => {
			return { ...state, selectedTable: tableName };
		});
	}

	function screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
		const rect = canvasElement.getBoundingClientRect();
		const canvasX = (screenX - rect.left - $canvasState.panX) / $canvasState.zoom;
		const canvasY = (screenY - rect.top - $canvasState.panY) / $canvasState.zoom;
		return { x: canvasX, y: canvasY };
	}

	function canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
		const screenX = canvasX * $canvasState.zoom + $canvasState.panX;
		const screenY = canvasY * $canvasState.zoom + $canvasState.panY;
		return { x: screenX, y: screenY };
	}

	function handleWheel(event: WheelEvent): void {
		event.preventDefault();

		const rect = canvasElement.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(0.1, Math.min(3, $canvasState.zoom * zoomFactor));

		const newPanX = mouseX - (mouseX - $canvasState.panX) * (newZoom / $canvasState.zoom);
		const newPanY = mouseY - (mouseY - $canvasState.panY) * (newZoom / $canvasState.zoom);

		handleCanvasUpdate({
			zoom: newZoom,
			panX: newPanX,
			panY: newPanY
		});
	}

	function handleMouseDown(event: MouseEvent): void {
		if (event.button !== 0) return;

		const target = event.target as HTMLElement;
		const tableElement = target.closest('[data-table-name]');

		if (tableElement) {
			const tableName = tableElement.getAttribute('data-table-name')!;
			const table = $schema.tables.find((t) => t.name === tableName);
			if (!table) return;

			isTableDragging = true;
			draggedTable = tableName;

			const mouseCanvas = screenToCanvas(event.clientX, event.clientY);

			dragOffset = {
				x: mouseCanvas.x - table.position.x,
				y: mouseCanvas.y - table.position.y
			};

			handleTableSelect(tableName);
			handleCanvasUpdate({ draggedTable: tableName });
		} else {
			isDragging = true;
			dragStart = { x: event.clientX, y: event.clientY };
			handleTableSelect(undefined);
		}
	}

	function handleMouseMove(event: MouseEvent): void {
		if (isTableDragging && draggedTable) {
			const mouseCanvas = screenToCanvas(event.clientX, event.clientY);
			const newPosition = {
				x: mouseCanvas.x - dragOffset.x,
				y: mouseCanvas.y - dragOffset.y
			};

			handleTableMove(draggedTable, newPosition);
		} else if (isDragging) {
			const deltaX = event.clientX - dragStart.x;
			const deltaY = event.clientY - dragStart.y;

			handleCanvasUpdate({
				panX: $canvasState.panX + deltaX,
				panY: $canvasState.panY + deltaY
			});

			dragStart = { x: event.clientX, y: event.clientY };
		}
	}

	function handleMouseUp(): void {
		isDragging = false;
		isTableDragging = false;
		draggedTable = null;
		handleCanvasUpdate({ draggedTable: undefined });
	}

	function handleTouchStart(event: TouchEvent): void {
		const target = event.target as HTMLElement;
		if (!canvasElement?.contains(target)) return;

		if (event.touches.length === 1) {
			const touch = event.touches[0];
			const tableElement = target.closest('[data-table-name]');

			if (tableElement) {
				event.preventDefault();
				const tableName = tableElement.getAttribute('data-table-name')!;
				const table = $schema.tables.find((t) => t.name === tableName);
				if (!table) return;

				isTableDragging = true;
				draggedTable = tableName;

				const mouseCanvas = screenToCanvas(touch.clientX, touch.clientY);
				dragOffset = {
					x: mouseCanvas.x - table.position.x,
					y: mouseCanvas.y - table.position.y
				};

				handleTableSelect(tableName);
				handleCanvasUpdate({ draggedTable: tableName });
			} else {
				event.preventDefault();
				isDragging = true;
				dragStart = { x: touch.clientX, y: touch.clientY };
				handleTableSelect(undefined);
			}
		} else if (event.touches.length === 2) {
			event.preventDefault();
			isTouchPinching = true;
			isDragging = false;
			isTableDragging = false;

			lastTouchDistance = getTouchDistance(event.touches);
			touchStartZoom = $canvasState.zoom;
			touchCenter = getTouchCenter(event.touches);

			const rect = canvasElement.getBoundingClientRect();
			touchCenter.x -= rect.left;
			touchCenter.y -= rect.top;
		}
	}

	function handleTouchMove(event: TouchEvent): void {
		if (!isDragging && !isTableDragging && !isTouchPinching) return;

		event.preventDefault();

		if (event.touches.length === 1 && !isTouchPinching) {
			const touch = event.touches[0];

			if (isTableDragging && draggedTable) {
				const mouseCanvas = screenToCanvas(touch.clientX, touch.clientY);
				const newPosition = {
					x: mouseCanvas.x - dragOffset.x,
					y: mouseCanvas.y - dragOffset.y
				};
				handleTableMove(draggedTable, newPosition);
			} else if (isDragging) {
				const deltaX = touch.clientX - dragStart.x;
				const deltaY = touch.clientY - dragStart.y;

				handleCanvasUpdate({
					panX: $canvasState.panX + deltaX,
					panY: $canvasState.panY + deltaY
				});

				dragStart = { x: touch.clientX, y: touch.clientY };
			}
		} else if (event.touches.length === 2 && isTouchPinching) {
			const currentDistance = getTouchDistance(event.touches);
			const currentCenter = getTouchCenter(event.touches);

			const rect = canvasElement.getBoundingClientRect();
			currentCenter.x -= rect.left;
			currentCenter.y -= rect.top;

			if (lastTouchDistance > 0) {
				const scaleFactor = currentDistance / lastTouchDistance;
				const newZoom = Math.max(0.1, Math.min(3, touchStartZoom * scaleFactor));

				const newPanX =
					touchCenter.x - (touchCenter.x - $canvasState.panX) * (newZoom / $canvasState.zoom);
				const newPanY =
					touchCenter.y - (touchCenter.y - $canvasState.panY) * (newZoom / $canvasState.zoom);

				handleCanvasUpdate({
					zoom: newZoom,
					panX: newPanX,
					panY: newPanY
				});
			}
		}
	}

	function handleTouchEnd(event: TouchEvent): void {
		if (!isDragging && !isTableDragging && !isTouchPinching) return;

		event.preventDefault();

		if (event.touches.length === 0) {
			isDragging = false;
			isTableDragging = false;
			isTouchPinching = false;
			draggedTable = null;
			lastTouchDistance = 0;
			handleCanvasUpdate({ draggedTable: undefined });
		} else if (event.touches.length === 1 && isTouchPinching) {
			isTouchPinching = false;
			const touch = event.touches[0];
			isDragging = true;
			dragStart = { x: touch.clientX, y: touch.clientY };
		}
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.ctrlKey || event.metaKey) {
			switch (event.key) {
				case '0':
					event.preventDefault();
					handleCanvasUpdate({
						zoom: 1,
						panX: 0,
						panY: 0
					});
					break;
				case '=':
				case '+': {
					event.preventDefault();
					const newZoomIn = Math.min(3, $canvasState.zoom * 1.2);
					handleCanvasUpdate({ zoom: newZoomIn });
					break;
				}
				case '-': {
					event.preventDefault();
					const newZoomOut = Math.max(0.1, $canvasState.zoom * 0.8);
					handleCanvasUpdate({ zoom: newZoomOut });
					break;
				}
			}
		}
	}

	function getTableTransform(table: Table): string {
		const screenPos = canvasToScreen(table.position.x, table.position.y);
		return `translate(${screenPos.x}px, ${screenPos.y}px) scale(${$canvasState.zoom})`;
	}

	function getSchemaSummary(): {
		tableCount: number;
		columnCount: number;
		relationshipCount: number;
	} {
		const tableCount = $schema.tables.length;
		const columnCount = $schema.tables.reduce((sum, table) => sum + table.columns.length, 0);
		const relationshipCount = $schema.relationships.length;

		return { tableCount, columnCount, relationshipCount };
	}

	function getTouchDistance(touches: TouchList): number {
		if (touches.length < 2) return 0;
		const touch1 = touches[0];
		const touch2 = touches[1];
		return Math.sqrt(
			Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
		);
	}

	function getTouchCenter(touches: TouchList): { x: number; y: number } {
		if (touches.length === 1) {
			return { x: touches[0].clientX, y: touches[0].clientY };
		}
		const touch1 = touches[0];
		const touch2 = touches[1];
		return {
			x: (touch1.clientX + touch2.clientX) / 2,
			y: (touch1.clientY + touch2.clientY) / 2
		};
	}

	const background = $derived(cssObjectToString(getBackground($canvasState, $darkMode)));
	const summary = $derived(getSchemaSummary());
</script>

<svelte:window
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	on:keydown={handleKeyDown}
	on:touchstart={handleTouchStart}
	on:touchmove={handleTouchMove}
	on:touchend={handleTouchEnd}
/>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={canvasElement}
	class={cn(
		'canvas-container relative h-full w-full overflow-hidden bg-gray-50 dark:bg-[#111111]/50',
		isDragging ? 'cursor-grabbing' : 'cursor-grab'
	)}
	onwheel={handleWheel}
	onmousedown={handleMouseDown}
	role="application"
	aria-label="Database schema canvas"
	style={background}
>
	{#each $schema.tables as table, index (index)}
		<div
			data-table-name={table.name}
			class={cn(
				'absolute top-0 left-0 origin-top-left',
				$canvasState.draggedTable === table.name
					? 'z-[1000] cursor-grabbing'
					: $canvasState.selectedTable === table.name
						? 'z-[100] cursor-grab'
						: 'z-10 cursor-grab',
				$canvasState.draggedTable === table.name && 'dragging',
				$canvasState.selectedTable === table.name && 'selected'
			)}
			style="
				transform: {getTableTransform(table)};
			"
		>
			<Tables {table} />
		</div>
	{/each}

	<div class="info pointer-events-none absolute top-2.5 right-2.5 z-[1000]">
		<div
			class="rounded bg-white/50 px-2 py-1 text-xs text-gray-500 shadow-xl backdrop-blur-md dark:bg-gray-800/50 dark:text-gray-400"
		>
			{#if summary.tableCount > 0}
				{summary.tableCount} tables • {summary.columnCount} columns • {summary.relationshipCount} relations
			{:else}
				No tables available
			{/if}
		</div>
	</div>

	<Relationships />
</div>

<style>
	.canvas-container {
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		touch-action: none;
		-webkit-touch-callout: none;
		-webkit-tap-highlight-color: transparent;
	}

	.canvas-container:focus {
		outline: none;
	}

	.dragging {
		filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
	}

	.selected {
		filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.5));
	}
</style>
