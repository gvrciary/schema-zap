<script lang="ts">
	import { RotateCcw, ZoomIn, ZoomOut, Tag } from 'lucide-svelte';
	import { canvasState } from '$lib/stores/app';
	import { showBadgets } from '$lib/stores/ui';
	import Button from '$lib/components/ui/button.svelte';
	import { cn } from '$lib/utils';

	function resetCanvas(): void {
		canvasState.set({
			zoom: 1,
			panX: 0,
			panY: 0,
			selectedTable: undefined,
			draggedTable: undefined
		});
	}

	function zoomIn(): void {
		const newZoom = Math.min($canvasState.zoom * 1.2, 3);
		canvasState.set({ ...$canvasState, zoom: newZoom });
	}

	function zoomOut(): void {
		const newZoom = Math.max($canvasState.zoom / 1.2, 0.1);
		canvasState.set({ ...$canvasState, zoom: newZoom });
	}

	function toggleBadgets(): void {
		showBadgets.set(!$showBadgets);
	}

	const zoomPercentage = $derived(Math.round($canvasState.zoom * 100));
</script>

<div
	class="absolute bottom-4 left-1/2 z-[1000] -translate-x-1/2 transform rounded-lg border border-white/30 bg-white/10 p-1 shadow-xl backdrop-blur-md sm:p-2 dark:border-white/20 dark:bg-black/10"
>
	<div class="flex items-center gap-0.5 sm:gap-1">
		<Button variant="icon" size="md" onClick={resetCanvas} title="Reset view">
			<RotateCcw class="h-4 w-4 sm:h-5 sm:w-5" />
		</Button>

		<div class="mx-1 h-6 w-px bg-gray-200 sm:mx-2 dark:bg-gray-600"></div>

		<Button
			variant="icon"
			size="md"
			onClick={zoomOut}
			title="Zoom out"
			disabled={$canvasState.zoom <= 0.1}
		>
			<ZoomOut class="h-4 w-4 sm:h-5 sm:w-5" />
		</Button>

		<div
			class="flex h-8 min-w-12 items-center justify-center rounded-md bg-gray-50 px-2 text-xs font-medium text-gray-700 sm:h-10 sm:min-w-14 sm:px-3 sm:text-sm dark:bg-gray-700 dark:text-gray-300"
		>
			{zoomPercentage}%
		</div>

		<Button
			variant="icon"
			size="md"
			onClick={zoomIn}
			title="Zoom in"
			disabled={$canvasState.zoom >= 3}
		>
			<ZoomIn class="h-4 w-4 sm:h-5 sm:w-5" />
		</Button>

		<div class="mx-1 h-6 w-px bg-gray-200 sm:mx-2 dark:bg-gray-600"></div>

		<Button
			onClick={toggleBadgets}
			title={$showBadgets ? 'Hide badges' : 'Show badges'}
			class={cn(
				'flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150 sm:h-10 sm:w-10',
				$showBadgets
					? 'bg-gray-600 text-white dark:bg-gray-400 dark:text-black'
					: 'border-none bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
			)}
		>
			<Tag class="h-4 w-4 sm:h-5 sm:w-5" />
		</Button>
	</div>
</div>
