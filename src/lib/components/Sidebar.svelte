<script lang="ts">
	import { showSidebar } from '$lib/stores/ui';
	import SQLQueryInput from './SQLQueryInput.svelte';
	import SQLSchemaEditor from './SQLSchemaEditor.svelte';
	import { Code, Settings } from 'lucide-svelte';

	let activeTab = $state('sql');

	function setActiveTab(tab: string) {
		activeTab = tab;
	}
</script>

{#if $showSidebar}
	<aside
		class="w-96 flex-shrink-0 overflow-hidden border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
	>
		<div class="flex h-full flex-col">
			<div
				class="flex-shrink-0 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#111111]"
			>
				<nav class="flex">
					<button
						type="button"
						class="flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer {activeTab ===
						'sql'
							? 'border-white bg-white text-gray-600 dark:bg-[#111111] dark:text-white'
							: 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-[#111] dark:hover:text-gray-300'}"
						onclick={() => setActiveTab('sql')}
					>
						<div class="flex items-center justify-center gap-2">
							<Code class="h-4 w-4" />
							<span>SQL Editor</span>
						</div>
					</button>
					<button
						type="button"
						class="flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer {activeTab ===
						'visual'
							? 'border-white bg-white text-gray-600 dark:bg-[#111111] dark:text-white'
							: 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-[#111] dark:hover:text-gray-300'}"
						onclick={() => setActiveTab('visual')}
					>
						<div class="flex items-center justify-center gap-2">
							<Settings class="h-4 w-4" />
							<span>Visual Editor</span>
						</div>
					</button>
				</nav>
			</div>

			<div class="flex-1 overflow-hidden">
				{#if activeTab === 'sql'}
					<div class="h-full p-4 bg-white/90 dark:bg-[#111111]">
						<SQLQueryInput />
					</div>
				{:else if activeTab === 'visual'}
					<div class="h-full p-4 bg-white/90 dark:bg-[#111111]">
						<SQLSchemaEditor />
					</div>
				{/if}
			</div>
		</div>
	</aside>
{/if}
