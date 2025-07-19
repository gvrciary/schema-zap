<script lang="ts">
	import { Maximize2, Minimize2, Download, Sun, Moon } from 'lucide-svelte';
	import { schema, canvasState } from '$lib/stores/app';
	import { showSidebar, lastParseTime, darkMode } from '$lib/stores/ui';
	import { toPng } from 'html-to-image';
	import { getBackground } from '$lib/utils/background';
	import { Button } from '$lib/components/ui/index';
	import { cn } from '$lib/utils';

	async function exportSchema(): Promise<void> {
		const canvas = document.querySelector('.canvas-container') as unknown as HTMLElement;

		if (!canvas) return;

		await document.fonts.ready;

		const background = getBackground($canvasState, $darkMode);

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
			const pad = (n: number): string => n.toString().padStart(2, '0');
			const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
			link.download = `diagram-${formattedDate}.png`;
			link.href = dataUrl;
			link.click();
		} catch (error) {
			console.error('Error generating image:', error);
		}
	}

	function toggleSidebar(): void {
		showSidebar.set(!$showSidebar);
	}

	function toggleDarkMode(): void {
		darkMode.toggle();
	}
</script>

<header
	class={cn(
		'flex flex-shrink-0 items-center justify-between border-b px-3 py-3 shadow-sm sm:px-6 sm:py-4',
		'border-gray-200 bg-white dark:border-gray-700 dark:bg-[#111111]'
	)}
>
	<div class="flex items-center gap-2 sm:gap-3">
		<h1 class="text-lg font-bold text-gray-900 sm:text-2xl dark:text-gray-300">SchemaZap</h1>
	</div>

	<div class="flex items-center gap-1 sm:gap-2">
		{#if $lastParseTime}
			<div class={cn('hidden text-xs sm:block', 'text-gray-500 dark:text-gray-400')}>
				Updated: {$lastParseTime.toLocaleTimeString()}
			</div>
		{/if}

		<div class="flex items-center gap-1">
			<Button
				variant="icon"
				size="sm"
				onClick={toggleDarkMode}
				title={$darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				{#if $darkMode}
					<Sun class="h-4 w-4" />
				{:else}
					<Moon class="h-4 w-4" />
				{/if}
			</Button>

			<Button
				variant="icon"
				size="sm"
				onClick={exportSchema}
				title="Export to PNG"
				disabled={$schema.tables.length === 0}
			>
				<Download class="h-4 w-4" />
			</Button>

			<Button
				variant="icon"
				size="sm"
				onClick={toggleSidebar}
				title={$showSidebar ? 'Hide sidebar' : 'Show sidebar'}
			>
				{#if $showSidebar}
					<Minimize2 class="h-4 w-4" />
				{:else}
					<Maximize2 class="h-4 w-4" />
				{/if}
			</Button>
		</div>
	</div>
</header>
