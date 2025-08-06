<script lang="ts">
  import { cn } from '$lib/utils';

  export let variant: 'default' | 'ghost' | 'icon' | 'table' = 'default';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled: boolean = false;
  export let title: string = '';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let onClick: (() => void) | undefined = undefined;

  const variants = {
    default:
      'bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600',
    ghost:
      'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
    icon: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
    table:
      'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200'
  };

  const sizes = {
    default: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    },
    icon: {
      sm: 'p-1.5 sm:p-2',
      md: 'p-2',
      lg: 'p-3'
    },
    table: {
      sm: 'p-1',
      md: 'p-1.5',
      lg: 'p-2'
    }
  };

  const baseClasses = {
    default:
      'cursor-pointer rounded-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center',
    icon: 'cursor-pointer rounded-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center',
    table:
      'cursor-pointer rounded transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center'
  };

  $: currentSizes =
    variant === 'icon' ? sizes.icon : variant === 'table' ? sizes.table : sizes.default;
  $: currentBaseClasses =
    variant === 'icon'
      ? baseClasses.icon
      : variant === 'table'
        ? baseClasses.table
        : baseClasses.default;
  $: classes = cn(currentBaseClasses, variants[variant], currentSizes[size]);
</script>

<button {type} {title} {disabled} class={classes} on:click={onClick} on:click {...$$restProps}>
  <slot />
</button>
