<script lang="ts">
  import { showSidebar } from '$lib/stores/ui';
  import InputEditor from '$lib/components/input-editor.svelte';
  import VisualEditor from '$lib/components/visual-editor.svelte';
  import { Code, Settings, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { cn } from '$lib/utils';

  let activeTab = $state('sql');

  function setActiveTab(tab: string): void {
    activeTab = tab;
  }

  function toggleSidebar(): void {
    showSidebar.set(!$showSidebar);
  }
</script>

{#if $showSidebar}
  <aside
    class="relative w-72 flex-shrink-0 border-r border-gray-200 bg-white sm:w-80 md:w-96 dark:border-gray-700 dark:bg-gray-900"
  >
    <Button
      onClick={toggleSidebar}
      class="absolute top-1/2 -right-3 z-50 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-all duration-200 hover:shadow-lg dark:border-gray-600 dark:bg-gray-800"
      title="Hide sidebar"
    >
      <ChevronLeft class="h-6 w-6 text-gray-600 dark:text-gray-300" />
    </Button>

    <div class="flex h-full flex-col">
      <div
        class="flex-shrink-0 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#111111]"
      >
        <nav class="flex">
          <Button
            onClick={() => setActiveTab('sql')}
            class={cn(
              'flex-1 cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150',
              activeTab === 'sql'
                ? 'border-white bg-white text-gray-600 dark:bg-[#111111] dark:text-white'
                : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-[#111] dark:hover:text-gray-300'
            )}
          >
            <div class="flex items-center justify-center gap-2">
              <Code class="h-4 w-4" />
              <span>SQL Editor</span>
            </div>
          </Button>
          <Button
            onClick={() => setActiveTab('visual')}
            class={cn(
              'flex-1 cursor-pointer border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150',
              activeTab === 'visual'
                ? 'border-white bg-white text-gray-600 dark:bg-[#111111] dark:text-white'
                : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-[#111] dark:hover:text-gray-300'
            )}
          >
            <div class="flex items-center justify-center gap-2">
              <Settings class="h-4 w-4" />
              <span>Visual Editor</span>
            </div>
          </Button>
        </nav>
      </div>

      <div class="h-full flex-1 overflow-hidden bg-white/90 p-4 dark:bg-[#111111]">
        {#if activeTab === 'sql'}
          <InputEditor />
        {:else if activeTab === 'visual'}
          <VisualEditor />
        {/if}
      </div>
    </div>
  </aside>
{:else}
  <div class="relative">
    <div class="h-full w-6 bg-gray-50 dark:bg-zinc-900"></div>
    <Button
      onClick={toggleSidebar}
      class="absolute top-1/2 -right-3 z-50 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-all duration-200 hover:shadow-lg dark:border-gray-600 dark:bg-gray-800"
      title="Show sidebar"
    >
      <ChevronRight class="h-6 w-6 text-gray-600 dark:text-gray-300" />
    </Button>
  </div>
{/if}
