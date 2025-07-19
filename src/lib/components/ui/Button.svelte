<script lang="ts">
	import { cn } from '$lib/utils';

	export let variant: 'default' | 'ghost' | 'icon' = 'default';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled: boolean = false;
	export let title: string = '';
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let onClick: (() => void) | undefined = undefined;

	const variants = {
		default:
			'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600',
		ghost:
			'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
		icon: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
	};

	const sizes = {
		sm: 'p-1.5 sm:p-2',
		md: 'p-2',
		lg: 'p-3'
	};

	const baseClasses =
		'cursor-pointer rounded-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center';

	$: classes = cn(baseClasses, variants[variant], sizes[size]);
</script>

<button {type} {title} {disabled} class={classes} on:click={onClick} on:click {...$$restProps}>
	<slot />
</button>
