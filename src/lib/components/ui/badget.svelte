<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    title: string;
  }

  let { title = '' }: Props = $props();
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
