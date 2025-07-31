<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import Button from '$lib/components/ui/button.svelte';
	import { Sun, Moon } from 'lucide-svelte';
</script>

<Button
	variant="icon"
	size="sm"
	onClick={toggleMode}
	title={mode.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{#if mode.current === 'dark'}
		<Sun class="h-4 w-4" />
	{:else}
		<Moon class="h-4 w-4" />
	{/if}
</Button>
