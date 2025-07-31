<script lang="ts">
	import '$lib/styles/global.css';
	import { ModeWatcher } from 'mode-watcher';

	const { children } = $props();
</script>

<ModeWatcher />
{@render children()}
