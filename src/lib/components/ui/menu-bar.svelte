<script lang="ts">
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import { Settings } from 'lucide-svelte';

	interface MenuOption {
		label: string;
		icon?: any;
		iconClass?: string;
		disabled?: boolean;
		onClick?: () => void;
	}

	interface Props {
		options: MenuOption[];
		disabled?: boolean;
		id?: string;
		className?: string;
		panelClass?: string;
		optionClass?: string;
		maxHeight?: string;
	}

	let {
		options,
		disabled = false,
		id = '',
		className = '',
		panelClass = '',
		optionClass = '',
		maxHeight = 'max-h-64',
	}: Props = $props();

	let isOpen = $state(false);
	let triggerElement = $state<HTMLButtonElement>();

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (
			triggerElement &&
			!triggerElement.contains(target) &&
			!target.closest('[data-menu-panel]')
		) {
			isOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function toggle() {
		if (disabled) return;
		isOpen = !isOpen;
	}
</script>

<div class="relative {className}">
	<button
		bind:this={triggerElement}
		{id}
		type="button"
		class={cn(
			'flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-sm text-gray-900 transition-all duration-200 hover:border-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300 dark:hover:border-gray-500',
			disabled && 'cursor-not-allowed opacity-50'
		)}
		{disabled}
		onclick={toggle}
		aria-haspopup="true"
		aria-expanded={isOpen}
		aria-label="Menu"
	>
		<Settings class="h-4 w-4" />
	</button>

	{#if isOpen}
		<div
			data-menu-panel
			class={cn(
				'absolute top-full right-0 z-50 mt-1 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]',
				maxHeight,
				panelClass
			)}
		>
			<div role="menu" aria-label="Menu options">
				{#each options as option (option.label)}
					<button
						type="button"
						class={cn(
							'flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm text-gray-900 transition-colors duration-150 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-700',
							option.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent',
							optionClass
						)}
						onclick={() => {
							if (!option.disabled) {
								option.onClick?.();
								isOpen = false;
							}
						}}
						disabled={option.disabled}
						role="menuitem"
					>
						{#if option.icon}
							{@const IconComponent = option.icon}
							<IconComponent class="h-4 w-4 flex-shrink-0 {option.iconClass || ''}" />
						{/if}
						<span class="truncate font-medium">{option.label}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
