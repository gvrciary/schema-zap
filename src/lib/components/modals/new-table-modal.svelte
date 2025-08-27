<script lang="ts">
  import Modal from '$lib/components/ui/modal.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { isValidTableName } from '$lib/utils/validators';
  import type { Table } from '$lib/types';

  interface Props {
    open: boolean;
    visualTables: Table[];
    onClose: () => void;
    onAddTable: (tableName: string) => void;
  }

  let { open, visualTables, onClose, onAddTable }: Props = $props();
  let newTableName = $state('');

  function handleAddTable(): void {
    if (!newTableName.trim()) return;
    onAddTable(newTableName.trim());
    newTableName = '';
  }

  function handleClose(): void {
    newTableName = '';
    onClose();
  }
</script>

<Modal {open} size="md" {onClose}>
  {#snippet title()}
    <span>New Table</span>
  {/snippet}

  <div>
    <label for="table-name" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
      Table name
    </label>
    <input
      id="table-name"
      type="text"
      bind:value={newTableName}
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100 dark:placeholder-gray-400"
      placeholder="usuarios, productos, etc."
      onkeydown={(e) => e.key === 'Enter' && handleAddTable()}
    />
  </div>

  {#snippet footer()}
    <Button variant="ghost" onClick={handleClose}>
      Cancel
    </Button>
    <Button variant="default" onClick={handleAddTable} disabled={!isValidTableName(newTableName, visualTables)}>
      Create Table
    </Button>
  {/snippet}
</Modal>
