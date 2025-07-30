<script lang="ts">
	import { Database } from 'lucide-svelte';
	import { schema } from '$lib/stores/app';
	import { isLoading } from '$lib/stores/ui';
	import { Header, Sidebar, Toolbar, Canvas } from '$lib/components/layout';
</script>

<div class="flex h-screen flex-col bg-gray-50 dark:bg-zinc-900">
	<Header />

	<main class="flex flex-1 overflow-hidden">
		<Sidebar />

		<section
			class="relative flex-1 overflow-hidden bg-gray-50 dark:bg-zinc-900 {$isLoading
				? 'pointer-events-none'
				: ''}"
		>
			{#if $isLoading}
				<div
					class="absolute top-0 right-0 bottom-0 left-0 z-50 flex flex-col items-center justify-center bg-white/75"
				>
					<div
						class="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500"
					></div>
					<span class="text-sm text-gray-600">Parsing SQL...</span>
				</div>
			{/if}

			{#if $schema.tables.length > 0}
				<Canvas />
				<Toolbar />
			{:else}
				<div class="flex h-full flex-col items-center justify-center p-8">
					<Database class="mb-4 h-16 w-16  text-gray-300 dark:text-gray-600" />
					<h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
						No Schema Loaded
					</h3>
					<p class="mb-4 max-w-md text-center text-gray-600 dark:text-gray-400">
						Enter SQL DDL statements in the sidebar to generate a visual database schema.
					</p>
				</div>
			{/if}
		</section>
	</main>
</div>
