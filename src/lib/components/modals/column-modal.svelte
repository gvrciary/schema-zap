<script lang="ts">
  import Modal from '$lib/components/ui/modal.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { selectedDialect, schema } from '$lib/stores/app';
  import { SQL_DATA_TYPES } from '$lib/constants';
  import { requiresLength, canHaveLength, isFeatureSupported, tableHasPrimaryKey } from '$lib/utils/validators';
  import { getCompatiblePrimaryKeys } from '$lib/utils/column-helpers';
  import type { Table } from '$lib/types';

  interface ColumnForm {
    isEdit: boolean;
    originalName: string;
    tableName: string;
    name: string;
    type: string;
    nullable: boolean;
    primaryKey: boolean;
    foreignKey: { table: string; column: string } | undefined;
    defaultValue: string;
    autoIncrement: boolean;
    unique: boolean;
    length: number | undefined;
  }

  interface Props {
    open: boolean;
    columnForm: ColumnForm;
    visualTables: Table[];
    onClose: () => void;
    onSaveColumn: () => void;
    onUpdateColumnForm: (updates: Partial<ColumnForm>) => void;
  }

  let { open, columnForm, visualTables, onClose, onSaveColumn, onUpdateColumnForm }: Props = $props();

  const SQL_TYPES = $derived(SQL_DATA_TYPES[$selectedDialect]);

  function handleSaveColumn(): void {
    onSaveColumn();
  }

  function updateField<K extends keyof ColumnForm>(field: K, value: ColumnForm[K]): void {
    onUpdateColumnForm({ [field]: value });
  }

  function handleForeignKeyChange(value: string): void {
    if (value) {
      const [table, column] = value.split('.');
      updateField('foreignKey', { table, column });
    } else {
      updateField('foreignKey', undefined);
    }
  }

  const compatiblePKs = $derived(getCompatiblePrimaryKeys(
    visualTables,
    columnForm.tableName,
    columnForm.type,
    columnForm.length,
    $selectedDialect
  ));
</script>

<Modal {open} size="lg" {onClose}>
  {#snippet title()}
    <span>{columnForm.isEdit ? 'Edit' : 'New'} Column</span>
  {/snippet}

  <div>
    <label
      for="column-name"
      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      Column name
    </label>
    <input
      id="column-name"
      type="text"
      value={columnForm.name}
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100 dark:placeholder-gray-400"
      placeholder="id, nombre, email, etc."
      onkeydown={(e) => e.key === 'Enter' && handleSaveColumn()}
      oninput={(e) => updateField('name', (e.target as HTMLInputElement).value)}
    />
  </div>

  <div>
    <label
      for="column-type"
      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      Data type
    </label>
    <select
      id="column-type"
      value={columnForm.type}
      class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100"
      onchange={(e) => updateField('type', (e.target as HTMLSelectElement).value)}
    >
      <option value="">Select type...</option>
      {#each SQL_TYPES as dataType, index (index)}
        <option value={dataType}>{dataType}</option>
      {/each}
    </select>
  </div>

  {#if columnForm.type && canHaveLength(columnForm.type, $selectedDialect)}
    <div>
      <label
        for="column-length"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Length {requiresLength(columnForm.type, $selectedDialect) ? '(required)' : '(optional)'}
      </label>
      <input
        id="column-length"
        type="number"
        min="1"
        max="65535"
        value={columnForm.length || ''}
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100 dark:placeholder-gray-400"
        placeholder="Ej: 255, 50, 100..."
        required={requiresLength(columnForm.type, $selectedDialect)}
        oninput={(e) => {
          const target = e.target as HTMLInputElement;
          target.value = target.value.replace(/[^0-9]/g, '');
          const numValue = parseInt(target.value);
          updateField('length', isNaN(numValue) ? undefined : numValue);
        }}
        onkeydown={(e) => {
          const allowedKeys = [
            'Backspace',
            'Delete',
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'Tab',
            'Enter'
          ];
          const isNumber = /^[0-9]$/.test(e.key);
          if (!isNumber && !allowedKeys.includes(e.key)) {
            e.preventDefault();
          }
        }}
      />
      {#if requiresLength(columnForm.type, $selectedDialect) && (!columnForm.length || columnForm.length <= 0)}
        <p class="mt-1 text-xs text-red-600 dark:text-red-400">
          This data type requires specifying a length
        </p>
      {/if}
    </div>
  {/if}

  <div class="grid grid-cols-2 gap-4">
    <label
      class="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50 {tableHasPrimaryKey(
        columnForm.tableName,
        visualTables,
        columnForm.originalName
      ) && !columnForm.primaryKey
        ? 'opacity-50'
        : ''} dark:hover:bg-gray-700"
    >
      <input
        type="checkbox"
        checked={columnForm.primaryKey}
        class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-gray-600 focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600"
        disabled={tableHasPrimaryKey(columnForm.tableName, visualTables, columnForm.originalName) &&
          !columnForm.primaryKey}
        onchange={(e) => updateField('primaryKey', (e.target as HTMLInputElement).checked)}
      />
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Primary Key
        {#if tableHasPrimaryKey(columnForm.tableName, visualTables, columnForm.originalName) && !columnForm.primaryKey}
          <span class="block text-xs text-gray-500">(Already exists a PK in this table)</span>
        {/if}
      </span>
    </label>

    {#if isFeatureSupported('autoIncrement', $selectedDialect)}
      <label
        class="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50 {!columnForm.primaryKey
          ? 'opacity-50'
          : ''} dark:hover:bg-gray-700"
      >
        <input
          type="checkbox"
          checked={columnForm.autoIncrement}
          class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-gray-600 focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600"
          disabled={!columnForm.primaryKey}
          onchange={(e) => updateField('autoIncrement', (e.target as HTMLInputElement).checked)}
        />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Auto Increment</span>
      </label>
    {/if}

    <label
      class="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50 {columnForm.primaryKey
        ? 'opacity-50'
        : ''} dark:hover:bg-gray-700"
    >
      <input
        type="checkbox"
        checked={columnForm.nullable}
        class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-gray-600 focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600"
        disabled={columnForm.primaryKey}
        onchange={(e) => updateField('nullable', (e.target as HTMLInputElement).checked)}
      />
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Nullable</span>
    </label>

    <label
      class="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50 {columnForm.primaryKey
        ? 'opacity-50'
        : ''} dark:hover:bg-gray-700"
    >
      <input
        type="checkbox"
        checked={columnForm.unique}
        class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-gray-600 focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600"
        disabled={columnForm.primaryKey}
        onchange={(e) => updateField('unique', (e.target as HTMLInputElement).checked)}
      />
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Unique</span>
    </label>
  </div>

  <div>
    {#if columnForm.type && compatiblePKs.length > 0}
      <label
        for="foreign-key-select"
        class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Foreign Key
      </label>
      <select
        id="foreign-key-select"
        value={columnForm.foreignKey
          ? `${columnForm.foreignKey.table}.${columnForm.foreignKey.column}`
          : ''}
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100"
        onchange={(e) => handleForeignKeyChange((e.target as HTMLSelectElement).value)}
      >
        <option value="">none</option>
        {#each compatiblePKs as pk, index (index)}
          <option value="{pk.table}.{pk.column}">
            {pk.table}.{pk.column} ({pk.type}{pk.length ? `(${pk.length})` : ''})
          </option>
        {/each}
      </select>
    {/if}
  </div>

  {#snippet footer()}
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button
      variant="default"
      onClick={handleSaveColumn}
      disabled={!columnForm.name.trim() ||
        $schema.tables.some((t) => {
          return (
            t.name === columnForm.tableName &&
            t.columns.some(
              (c) =>
                c.name.toLowerCase() === columnForm.name.toLowerCase() &&
                ((columnForm.isEdit && columnForm.originalName !== columnForm.name.toLowerCase()) ||
                  !columnForm.isEdit)
            )
          );
        }) ||
        !columnForm.type ||
        (requiresLength(columnForm.type, $selectedDialect) && (!columnForm.length || columnForm.length <= 0))}
    >
      {columnForm.isEdit ? 'Save' : 'Add'} Column
    </Button>
  {/snippet}
</Modal>
