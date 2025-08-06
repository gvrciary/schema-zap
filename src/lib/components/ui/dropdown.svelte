<script lang="ts">
  import { cn } from '$lib/utils';
  import { onMount } from 'svelte';

  interface DropdownOption {
    value: string;
    label: string;
    icon?: any;
    iconClass?: string;
    disabled?: boolean;
  }

  interface Props {
    options: DropdownOption[];
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
    dropdownClass?: string;
    optionClass?: string;
    maxHeight?: string;
    onselect?: (detail: { value: string; option: DropdownOption }) => void;
    onopen?: () => void;
    onclose?: () => void;
  }

  let {
    options,
    value = $bindable(''),
    placeholder = 'Select an option',
    disabled = false,
    id = '',
    className = '',
    dropdownClass = '',
    optionClass = '',
    maxHeight = 'max-h-64',
    onselect,
    onopen,
    onclose
  }: Props = $props();

  let isOpen = $state(false);
  let triggerElement = $state<HTMLButtonElement>();

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (
      triggerElement &&
      !triggerElement.contains(target) &&
      !target.closest('[data-dropdown-content]')
    ) {
      if (isOpen) {
        isOpen = false;
        onclose?.();
      }
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
    if (isOpen) {
      onopen?.();
    } else {
      onclose?.();
    }
  }

  function handleSelect(option: DropdownOption) {
    if (option.disabled) return;
    value = option.value;
    isOpen = false;
    onselect?.({ value: option.value, option });
    onclose?.();
  }

  function handleTriggerKeyDown(event: KeyboardEvent) {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        toggle();
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          isOpen = false;
          onclose?.();
        }
        break;
      case 'ArrowDown':
        if (!isOpen) {
          event.preventDefault();
          isOpen = true;
          onopen?.();
        }
        break;
      case 'ArrowUp':
        if (isOpen) {
          event.preventDefault();
          isOpen = false;
          onclose?.();
        }
        break;
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent, option: DropdownOption) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleSelect(option);
        break;
      case 'Escape':
        event.preventDefault();
        isOpen = false;
        onclose?.();
        triggerElement?.focus();
        break;
    }
  }

  const selectedOption = $derived(options.find((opt) => opt.value === value));
  const displayText = $derived(selectedOption?.label || placeholder);
</script>

<div class="relative {className}">
  <button
    bind:this={triggerElement}
    {id}
    type="button"
    class={cn(
      'flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 hover:border-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/50 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-300 dark:hover:border-gray-500',
      disabled && 'cursor-not-allowed opacity-50 hover:border-gray-200 dark:hover:border-gray-700'
    )}
    {disabled}
    onclick={toggle}
    onkeydown={handleTriggerKeyDown}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label="Select option"
  >
    <div class="flex min-w-0 flex-1 items-center gap-3">
      {#if selectedOption?.icon}
        {@const IconComponent = selectedOption.icon}
        <IconComponent class="h-4 w-4 flex-shrink-0 {selectedOption.iconClass || ''}" />
      {/if}
      <span class="truncate text-left font-medium">
        {displayText}
      </span>
    </div>

    <svg
      class="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 {isOpen
        ? 'rotate-180'
        : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {#if isOpen}
    <div
      data-dropdown-content
      class={cn(
        'absolute top-full right-0 left-0 z-50 mt-1 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-[#111111]',
        maxHeight,
        dropdownClass
      )}
    >
      <div role="listbox" aria-label="Options">
        {#each options as option (option.value)}
          <button
            type="button"
            class={cn(
              'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm text-gray-900 transition-colors duration-150 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-700',
              option.value === value &&
                'bg-gray-50 text-gray-900 dark:bg-gray-700/50 dark:text-gray-300',
              option.disabled &&
                'cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent',
              optionClass
            )}
            disabled={option.disabled}
            onclick={() => handleSelect(option)}
            onkeydown={(e) => handleOptionKeyDown(e, option)}
            role="option"
            aria-selected={option.value === value}
          >
            <div class="flex min-w-0 flex-1 items-center gap-3">
              {#if option.icon}
                {@const IconComponent = option.icon}
                <IconComponent class="h-4 w-4 flex-shrink-0 {option.iconClass || ''}" />
              {/if}
              <span class="truncate font-medium">
                {option.label}
              </span>
            </div>
            {#if option.value === value}
              <div class="h-2 w-2 flex-shrink-0 rounded-full bg-gray-500"></div>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
