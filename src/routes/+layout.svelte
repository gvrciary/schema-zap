<script lang="ts">
	import '$lib/styles/app.css';
	import { browser } from '$app/environment';
	import { darkMode } from '$lib/stores/ui';

	const { children } = $props();

	$effect(() => {
		if (browser) {
			document.documentElement.classList.toggle('dark', $darkMode);
		}
	});
</script>

{@render children()}
