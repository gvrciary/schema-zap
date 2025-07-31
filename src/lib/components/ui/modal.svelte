<script lang="ts">
	import { cn } from '$lib/utils';

	export let open: boolean = false;
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let closeOnOverlayClick: boolean = true;
	export let closeOnEscape: boolean = true;
	export let onClose: (() => void) | undefined = undefined;

	const sizes = {
		sm: 'w-full max-w-sm',
		md: 'w-full max-w-md',
		lg: 'w-full max-w-2xl max-h-[90vh] overflow-y-auto'
	};

	function handleOverlayClick(e: MouseEvent) {
		if (closeOnOverlayClick && e.target === e.currentTarget) {
			close();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (closeOnEscape && e.key === 'Escape') {
			close();
		}
	}

	function close() {
		onClose?.();
	}

	$: if (open && typeof window !== 'undefined') {
		document.body.style.overflow = 'hidden';
	} else if (typeof window !== 'undefined') {
		document.body.style.overflow = '';
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 md:px-0"
		on:click={handleOverlayClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class={cn('rounded-lg bg-white p-6 shadow-2xl dark:bg-[#111111]', sizes[size])}
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="document"
		>
			{#if $$slots.title}
				<div class="mb-4">
					<h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
						<slot name="title" />
					</h3>
				</div>
			{/if}

			<div class="space-y-4">
				<slot />
			</div>

			{#if $$slots.footer}
				<div class="mt-6 flex justify-end gap-3">
					<slot name="footer" />
				</div>
			{/if}
		</div>
	</div>
{/if}
