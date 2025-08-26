<script lang="ts">
  import { onMount } from 'svelte';
  import { SQLDialect } from '$lib/types';
  import { SQL_EXAMPLES } from '$lib/constants';
  import { RotateCcw, AlertCircle, CheckCircle, Database } from 'lucide-svelte';
  import Button from '$lib/components/ui/button.svelte';
  import CopyButton from '$lib/components/ui/copy-button.svelte';
  import DeleteButton from '$lib/components/ui/delete-button.svelte';
  import Dropdown from '$lib/components/ui/dropdown.svelte';
  import SQLInput from '$lib/components/sql/sql-input.svelte';
  import { sqlInput, selectedDialect } from '$lib/stores/app';
  import { handleParseSQL } from '$lib/handlers/sqlHandler';
  import { hasMounted } from '$lib/stores/ui';

  onMount(() => {
    if (!$hasMounted) {
      handleParse(true, true);
      hasMounted.set(true);
      return;
    }

    handleParse();
  });

  function handleSQLChange(
    value: string,
    resetZoom: boolean = false,
    resetPosition: boolean = false
  ): void {
    sqlInput.set(value);
    handleParse(resetZoom, resetPosition);
  }

  let isParsingError = $state(false);
  let errorMessage = $state('');
  let isValidSQL = $state(false);
  let errorStatementIndex = $state(-1);

  const dialects = Object.values(SQLDialect);

  function getDialectColor(dialect: SQLDialect): string {
    switch (dialect) {
      case SQLDialect.MYSQL:
        return 'text-orange-600';
      case SQLDialect.POSTGRESQL:
        return 'text-blue-600';
      case SQLDialect.SQLITE:
        return 'text-gray-600';
      case SQLDialect.MARIADB:
        return 'text-green-600';
      default:
        return 'text-gray-500';
    }
  }

  let currentDialect = $state($selectedDialect);

  function handleParse(resetZoom: boolean = false, resetPosition: boolean = false): void {
    const result = handleParseSQL(resetZoom, resetPosition);

    if (result.success) clearError();
    else setError(result.error || 'Failed to parse SQL', (result.statementIndex ?? 0) - 1);
  }

  function setError(message: string, statementIndex: number = -1): void {
    isParsingError = true;
    errorMessage = message;
    errorStatementIndex = statementIndex;
    isValidSQL = false;
  }

  function clearError(): void {
    isParsingError = false;
    errorMessage = '';
    errorStatementIndex = -1;
    isValidSQL = true;
  }

  function handleInputChange(value: string): void {
    isParsingError = false;
    errorMessage = '';
    errorStatementIndex = -1;
    handleSQLChange(value);
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          handleParse(false, false);
          break;
        case 'a':
          break;
      }
    }
  }

  function clearInput(): void {
    handleSQLChange('');
    isParsingError = false;
    errorMessage = '';
    errorStatementIndex = -1;
    isValidSQL = false;
  }

  function loadSample(): void {
    const sampleSQL = SQL_EXAMPLES[$selectedDialect] || '';
    handleSQLChange(sampleSQL, true, true);
    clearError();
  }
</script>

<div class="flex h-full flex-col">
  <div class="mb-3 flex-shrink-0">
    <label
      for="sql-dialect-selector"
      class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      SQL Dialect
    </label>

    <Dropdown
      id="sql-dialect-selector"
      options={dialects.map((dialect) => ({
        value: dialect,
        label: dialect,
        icon: Database,
        iconClass: getDialectColor(dialect)
      }))}
      bind:value={currentDialect}
      onselect={(detail) => {
        selectedDialect.set(detail.value as SQLDialect);
        handleParse(true, true);
      }}
    />
  </div>

  <div
    class="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800"
  >
    <div
      class="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-[#111111]/60"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2 text-xs">
        {#if isParsingError}
          <AlertCircle class="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
          <span class="truncate text-gray-600 dark:text-gray-300">{errorMessage}</span>
        {:else if isValidSQL}
          <CheckCircle class="h-4 w-4 flex-shrink-0 text-green-500 dark:text-green-400" />
          <span class="text-gray-600 dark:text-gray-300">Valid SQL</span>
        {:else}
          <span class="text-gray-600 dark:text-gray-300">Enter Schema SQL</span>
        {/if}
      </div>

      <div class="flex flex-shrink-0 items-center gap-2">
        <Button variant="icon" size="sm" title="Load sample SQL" onClick={loadSample}>
          <RotateCcw class="h-4 w-4" />
        </Button>

        <CopyButton text={$sqlInput} disabled={!$sqlInput} />

        <DeleteButton title="Clear input" disabled={!$sqlInput} onConfirm={clearInput} />
      </div>
    </div>

    <SQLInput
      bind:value={$sqlInput}
      selectedDialect={$selectedDialect}
      {errorStatementIndex}
      onchange={handleInputChange}
      onkeydown={handleKeyDown}
    />
  </div>
</div>
