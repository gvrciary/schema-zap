<script lang="ts">
  import Modal from '$lib/components/ui/modal.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { isValidTableName } from '$lib/utils/validators';
  import type { Table } from '$lib/types';

  interface EditTableForm {
    originalName: string;
    name: string;
    isVisible: boolean;
  }

  interface Props {
    editTableForm: EditTableForm;
    visualTables: Table[];
    onClose: () => void;
    onSaveChanges: () => void;
    onUpdateName: (name: string) => void;
  }

  let { editTableForm, visualTables, onClose, onSaveChanges, onUpdateName }: Props = $props();

  function handleSaveChanges(): void {
    onSaveChanges();
  }
</script>

<Modal open={editTableForm.isVisible} size="md" {onClose}>
  {#snippet title()}
    <span>Edit Table</span>
  {/snippet}

  <div>
    <label
      for="edit-table-name"
      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      Table name
    </label>
    <input
      id="edit-table-name"
      type="text"
      value={editTableForm.name}
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100 dark:placeholder-gray-400"
      onkeydown={(e) => e.key === 'Enter' && handleSaveChanges()}
      oninput={(e) => onUpdateName((e.target as HTMLInputElement).value)}
    />
  </div>

  {#snippet footer()}
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button
      variant="default"
      disabled={editTableForm.originalName === editTableForm.name ||
        !isValidTableName(editTableForm.name, visualTables)}
      onClick={handleSaveChanges}>Save Changes</Button
    >
  {/snippet}
</Modal>
