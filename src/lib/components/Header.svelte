<script lang="ts">
	import { Maximize2, Minimize2, Download, Sun, Moon } from 'lucide-svelte';
	import { schema, canvasState } from '$lib/stores/app';
	import { showSidebar, lastParseTime, darkMode } from '$lib/stores/ui';
	import { toPng } from 'html-to-image';

	function getGridPattern(): Partial<CSSStyleDeclaration> {
		const gridSize = 40;
		const scaledGridSize = gridSize * $canvasState.zoom;
		const offsetX = $canvasState.panX % scaledGridSize;
		const offsetY = $canvasState.panY % scaledGridSize;

		const dotSize = Math.max(1, Math.min(3, $canvasState.zoom * 1.5));
		const gridColor = $darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

		return {
			backgroundImage: `radial-gradient(circle, ${gridColor} ${dotSize}px, transparent ${dotSize}px)`,
			backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
			backgroundPosition: `${offsetX}px ${offsetY}px`
		};
	}

	async function exportSchema() {
		const canvas = document.querySelector('.canvas-container') as unknown as HTMLElement;

		if (!canvas) return;

		await document.fonts.ready;

		const background = getGridPattern();

		const date = new Date();

		try {
			const dataUrl = await toPng(canvas as HTMLElement, {
				skipFonts: true,
				style: background,
				filter: (node) => {
					return !node.classList?.contains('info');
				}
			});
			const link = document.createElement('a');
			const pad = (n: number) => n.toString().padStart(2, '0');
			const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
			link.download = `diagram-${formattedDate}.png`;
			link.href = dataUrl;
			link.click();
		} catch (error) {
			console.error('Error al generar la imagen:', error);
		}
	}

	function toggleSidebar() {
		showSidebar.set(!$showSidebar);
	}

	function toggleDarkMode() {
		darkMode.toggle();
	}
</script>

<header
	class="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 py-3 shadow-sm sm:px-6 sm:py-4 dark:border-gray-700 dark:bg-[#111111]"
>
	<div class="flex items-center gap-2 sm:gap-3">
		<h1 class="text-lg font-bold sm:text-2xl">DB Diagram</h1>
	</div>

	<div class="flex items-center gap-1 sm:gap-2">
		{#if $lastParseTime}
			<div class="hidden text-xs text-gray-500 sm:block dark:text-gray-400">
				Updated: {$lastParseTime.toLocaleTimeString()}
			</div>
		{/if}

		<div class="flex items-center gap-1">
			<button
				type="button"
				class="cursor-pointer rounded-lg p-1.5 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 sm:p-2 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
				on:click={toggleDarkMode}
				title={$darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				{#if $darkMode}
					<Sun class="h-4 w-4" />
				{:else}
					<Moon class="h-4 w-4" />
				{/if}
			</button>

			<button
				type="button"
				class="cursor-pointer rounded-lg p-1.5 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
				on:click={exportSchema}
				title="Export to PNG"
				disabled={$schema.tables.length === 0}
			>
				<Download class="h-4 w-4" />
			</button>

			<button
				type="button"
				class="cursor-pointer rounded-lg p-1.5 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 sm:p-2 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
				on:click={toggleSidebar}
				title={$showSidebar ? 'Hide sidebar' : 'Show sidebar'}
			>
				{#if $showSidebar}
					<Minimize2 class="h-4 w-4" />
				{:else}
					<Maximize2 class="h-4 w-4" />
				{/if}
			</button>
		</div>
	</div>
</header>
