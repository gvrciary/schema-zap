<script lang="ts">
  import { cn } from '$lib/utils';

  export let title: string;
</script>

<span
  class={cn(
    'rounded border px-1.5 py-0.5 font-mono text-xs',
    'border-gray-300 bg-gray-100 text-gray-800',
    'dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300'
  )}
>
  {title}
</span>
