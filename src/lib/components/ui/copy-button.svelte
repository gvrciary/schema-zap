<script lang="ts">
  import { Check, Copy } from 'lucide-svelte';
  import Button from './button.svelte';
  import { toast } from 'svelte-sonner';

  interface Props {
    text: string;
    variant?: 'default' | 'ghost' | 'icon';
    size?: 'sm' | 'md' | 'lg';
    title?: string;
    disabled?: boolean;
    [key: string]: any;
  }

  let {
    text = '',
    variant = 'icon',
    size = 'sm',
    title = 'Copy to clipboard',
    disabled = false,
    ...restProps
  }: Props = $props();

  let isCopied = $state(false);

  async function copyToClipboard() {
    if (!text.trim() || disabled) return;

    toast.promise(navigator.clipboard.writeText(text), {
      loading: 'Copying to clipboard...',
      success: () => {
        isCopied = true;
        setTimeout(() => {
          isCopied = false;
        }, 2000);
        return 'Copied to clipboard!';
      },
      error: 'Failed to copy to clipboard.'
    });
  }
</script>

<Button {variant} {size} {title} {disabled} onClick={copyToClipboard} {...restProps}>
  {#if isCopied}
    <Check class="h-4 w-4 animate-pulse" />
  {:else}
    <Copy class="h-4 w-4" />
  {/if}
</Button>
