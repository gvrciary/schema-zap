<script lang="ts">
  import { Check, Copy } from 'lucide-svelte';
  import Button from './button.svelte';

  export let text: string = '';
  export let variant: 'default' | 'ghost' | 'icon' = 'icon';
  export let size: 'sm' | 'md' | 'lg' = 'sm';
  export let title: string = 'Copy to clipboard';
  export let disabled: boolean = false;

  let isCopied = false;

  async function copyToClipboard() {
    if (!text.trim() || disabled) return;

    try {
      await navigator.clipboard.writeText(text);
      isCopied = true;
      setTimeout(() => {
        isCopied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }
</script>

<Button {variant} {size} {title} {disabled} onClick={copyToClipboard} {...$$restProps}>
  {#if isCopied}
    <Check class="h-4 w-4 animate-pulse" />
  {:else}
    <Copy class="h-4 w-4" />
  {/if}
</Button>
