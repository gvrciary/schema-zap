<script lang="ts">
	import '../app.css';
	import { darkMode } from '$lib/stores/ui';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		if (browser) {
			const stored = localStorage.getItem('darkMode');
			const isDark = stored === 'true';

			document.documentElement.classList.toggle('dark', isDark);
			darkMode.set(isDark);
		}
	});

	$effect(() => {
		if (browser) {
			document.documentElement.classList.toggle('dark', $darkMode);
		}
	});
</script>

{@render children()}
