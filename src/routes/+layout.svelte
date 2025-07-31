<script lang="ts">
	import '$lib/styles/global.css';
	import { ModeWatcher, mode } from 'mode-watcher';
	import { Toaster } from 'svelte-sonner';

	const { children } = $props();
</script>

<ModeWatcher />
{@render children()}
<Toaster
	theme={mode.current === 'dark' ? 'dark' : 'light'}
	position="bottom-right"
	class="toaster"
	toastOptions={{
		unstyled: true,
		classes: {
			toast: `
        flex gap-2 p-4 rounded-xl text-sm border border-gray-300 dark:border-zinc-700
        shadow-md backdrop-blur-md
        bg-gray-100 bg-opacity-70 dark:bg-zinc-900 dark:bg-opacity-70
        text-gray-900 dark:text-zinc-100
      `,
			description: 'text-gray-700 dark:text-zinc-300'
		}
	}}
/>
