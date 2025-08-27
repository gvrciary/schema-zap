<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'default' | 'ghost' | 'icon' | 'table';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    title?: string;
    type?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
    children: Snippet;
    [key: string]: any;
  }

  let {
    variant = 'default',
    size = 'md',
    disabled = false,
    title = '',
    type = 'button',
    onClick = undefined,
    children,
    ...restProps
  }: Props = $props();

  const variantClasses = {
    default:
      'bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600',
    ghost:
      'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
    icon: 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
    table:
      'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const baseClasses = {
    default:
      'cursor-pointer rounded-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center',
    ghost:
      'cursor-pointer rounded-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center justify-center',
    icon: 'cursor-pointer rounded-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center',
    table:
      'cursor-pointer rounded transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center'
  };

</script>

<button
  class={cn(baseClasses[variant], variantClasses[variant], sizeClasses[size])}
  {type}
  {title}
  {disabled}
  onclick={onClick}
  {...restProps}
>
  {@render children()}
</button>
