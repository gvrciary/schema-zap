<script lang="ts">
	import { Check, X, Trash2 } from 'lucide-svelte';
	import { Button } from './index';

	export let variant: 'default' | 'ghost' | 'icon' = 'icon';
	export let size: 'sm' | 'md' | 'lg' = 'sm';
	export let title: string = 'Delete';
	export let disabled: boolean = false;
	export let onConfirm: (() => void) | undefined = undefined;

	let showConfirmation = false;

	function handleDelete() {
		if (disabled) return;
		showConfirmation = true;
	}

	function handleConfirm() {
		showConfirmation = false;
		onConfirm?.();
	}

	function handleCancel() {
		showConfirmation = false;
	}
</script>

{#if showConfirmation}
	<div class="flex items-center gap-1">
		<Button
			variant="icon"
			size="sm"
			title="Confirm delete"
			onClick={handleConfirm}
		>
			<Check class="h-4 w-4" />
		</Button>
		<Button
			variant="icon"
			size="sm"
			title="Cancel"
			onClick={handleCancel}
		>
			<X class="h-4 w-4" />
		</Button>
	</div>
{:else}
	<Button
		{variant}
		{size}
		{title}
		{disabled}
		onClick={handleDelete}
		{...$$restProps}
	>
		<Trash2 class="h-4 w-4" />
	</Button>
{/if}
