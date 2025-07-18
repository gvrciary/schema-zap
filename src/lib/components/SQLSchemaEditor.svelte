<script lang="ts">
	import { sqlInput, selectedDialect, schema } from '$lib/stores/app';
	import { SQLDialect, type Table, type Column } from '$lib/types';
	import { SQL_DATA_TYPES, REQUIRED_LENGTH_TYPES, OPTIONAL_LENGTH_TYPES } from '$lib/constants';
	import { handleParseSQL } from '$lib/services';
	import {
		Plus,
		Trash2,
		Database,
		ChevronDown,
		ChevronRight,
		Pencil,
		GripVertical,
		MessageCircleXIcon
	} from 'lucide-svelte';

	let visualTables: Table[] = $state([]);
	let expandedTables: Set<string> = $state(new Set());
	let selectedTable: string | null = $state(null);
	let SQL_TYPES = $derived(SQL_DATA_TYPES[$selectedDialect] || []);

	let dragState = $state({
		isDragging: false,
		dragType: '' as 'table' | 'column' | '',
		dragIndex: -1,
		dragTableName: '',
		dragColumnName: '',
		dropIndex: -1,
		dropTableName: ''
	});

	let newTableName = $state('');
	let showNewTableForm = $state(false);

	let editTableForm = $state({
		originalName: '',
		name: '',
		isVisible: false
	});

	let columnForm = $state({
		isEdit: false,
		originalName: '',
		tableName: '',
		name: '',
		type: '',
		nullable: true,
		primaryKey: false,
		foreignKey: undefined as { table: string; column: string } | undefined,
		defaultValue: '',
		autoIncrement: false,
		unique: false,
		length: undefined as number | undefined
	});
	let showColumnForm = $state(false);

	$effect(() => {
		if ($schema.tables.length > 0 && visualTables.length === 0) {
			updateSQLAndSchema(false, false, false);

			visualTables = [...$schema.tables];
			const newExpanded = new Set<string>();
			for (const table of visualTables) {
				if (table.columns.length > 0) {
					newExpanded.add(table.name);
				}
			}
			expandedTables = newExpanded;
		}
	});

	$effect(() => {
		if (columnForm.primaryKey) {
			columnForm.nullable = false;
			columnForm.unique = false;
		} else {
			columnForm.autoIncrement = false;
		}
	});

	$effect(() => {
		if (columnForm.type && !canHaveLength(columnForm.type)) {
			columnForm.length = undefined;
		}
	});

	function tableHasPrimaryKey(tableName: string, excludeColumn: string = ''): boolean {
		const table = visualTables.find((t) => t.name === tableName);
		if (!table) return false;

		return table.columns.some((column) => column.primaryKey && column.name !== excludeColumn);
	}

	function isValidTableName(name: string): boolean {
		if (!name.trim()) return false;
		if (visualTables.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) return false;
		return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
	}

	function handleTableDragStart(event: DragEvent, tableIndex: number) {
		if (!event.dataTransfer) return;

		dragState.isDragging = true;
		dragState.dragType = 'table';
		dragState.dragIndex = tableIndex;
		dragState.dragTableName = visualTables[tableIndex].name;

		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', '');
	}

	function handleTableDragOver(event: DragEvent, targetIndex: number) {
		if (dragState.dragType !== 'table') return;

		event.preventDefault();
		event.dataTransfer!.dropEffect = 'move';
		dragState.dropIndex = targetIndex;
	}

	function handleTableDrop(event: DragEvent, targetIndex: number) {
		if (dragState.dragType !== 'table') return;

		event.preventDefault();

		const sourceIndex = dragState.dragIndex;
		if (sourceIndex === targetIndex) {
			resetDragState();
			return;
		}

		const newTables = [...visualTables];
		const [draggedTable] = newTables.splice(sourceIndex, 1);
		newTables.splice(targetIndex, 0, draggedTable);

		visualTables = newTables;
		updateSQLAndSchema();
		resetDragState();
	}

	function handleColumnDragStart(event: DragEvent, tableName: string, columnIndex: number) {
		if (!event.dataTransfer) return;

		const table = visualTables.find((t) => t.name === tableName);
		if (!table) return;

		dragState.isDragging = true;
		dragState.dragType = 'column';
		dragState.dragIndex = columnIndex;
		dragState.dragTableName = tableName;
		dragState.dragColumnName = table.columns[columnIndex].name;

		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/plain', '');
	}

	function handleColumnDragOver(event: DragEvent, tableName: string, targetIndex: number) {
		if (dragState.dragType !== 'column' || dragState.dragTableName !== tableName) return;

		event.preventDefault();
		event.dataTransfer!.dropEffect = 'move';
		dragState.dropIndex = targetIndex;
		dragState.dropTableName = tableName;
	}

	function handleColumnDrop(event: DragEvent, tableName: string, targetIndex: number) {
		if (dragState.dragType !== 'column' || dragState.dragTableName !== tableName) return;

		event.preventDefault();

		const sourceIndex = dragState.dragIndex;
		if (sourceIndex === targetIndex) {
			resetDragState();
			return;
		}

		const tableIndex = visualTables.findIndex((t) => t.name === tableName);
		if (tableIndex === -1) {
			resetDragState();
			return;
		}

		const newTables = visualTables.map((table, idx) => {
			if (idx === tableIndex) {
				const newColumns = [...table.columns];
				const [draggedColumn] = newColumns.splice(sourceIndex, 1);
				newColumns.splice(targetIndex, 0, draggedColumn);
				return { ...table, columns: newColumns };
			}
			return table;
		});

		visualTables = newTables;
		updateSQLAndSchema();
		resetDragState();
	}

	function resetDragState() {
		dragState.isDragging = false;
		dragState.dragType = '';
		dragState.dragIndex = -1;
		dragState.dragTableName = '';
		dragState.dragColumnName = '';
		dragState.dropIndex = -1;
		dragState.dropTableName = '';
	}

	function handleDragEnd() {
		resetDragState();
	}

	function requiresLength(dataType: string): boolean {
		const requiredTypes = REQUIRED_LENGTH_TYPES[$selectedDialect] || [];
		return requiredTypes.includes(dataType.toUpperCase());
	}

	function canHaveLength(dataType: string): boolean {
		const requiredTypes = REQUIRED_LENGTH_TYPES[$selectedDialect] || [];
		const optionalTypes = OPTIONAL_LENGTH_TYPES[$selectedDialect] || [];
		return (
			requiredTypes.includes(dataType.toUpperCase()) ||
			optionalTypes.includes(dataType.toUpperCase())
		);
	}

	function isFeatureSupported(feature: string): boolean {
		switch (feature) {
			case 'autoIncrement':
				return $selectedDialect !== SQLDialect.POSTGRESQL;
			case 'foreignKey':
				return true;
			case 'unique':
				return true;
			case 'defaultValue':
				return true;
			default:
				return true;
		}
	}

	function generateSQLFromSchema(): string {
		let sql = '';

		for (const table of visualTables) {
			sql += `CREATE TABLE ${table.name} (\n`;

			const columnDefs: string[] = [];

			for (const column of table.columns) {
				let columnDef = `  ${column.name} ${column.type}`;

				if (column.length && canHaveLength(column.type)) {
					columnDef += `(${column.length})`;
				}

				if (column.primaryKey) {
					columnDef += ' PRIMARY KEY';
				}

				if (column.autoIncrement && isFeatureSupported('autoIncrement')) {
					if ($selectedDialect === SQLDialect.MYSQL || $selectedDialect === SQLDialect.MARIADB) {
						columnDef += ' AUTO_INCREMENT';
					} else if ($selectedDialect === SQLDialect.SQLITE) {
						columnDef += ' AUTOINCREMENT';
					}
				}

				if (!column.nullable) {
					columnDef += ' NOT NULL';
				}

				if (column.unique && !column.primaryKey) {
					columnDef += ' UNIQUE';
				}

				if (column.defaultValue) {
					columnDef += ` DEFAULT ${column.defaultValue}`;
				}

				columnDefs.push(columnDef);
			}

			for (const column of table.columns) {
				if (column.foreignKey) {
					columnDefs.push(
						`  FOREIGN KEY (${column.name}) REFERENCES ${column.foreignKey.table}(${column.foreignKey.column})`
					);
				}
			}

			sql += columnDefs.join(',\n');
			sql += '\n);\n\n';
		}

		return sql.trim();
	}

	function updateSQLAndSchema(
		resetZoom: boolean = false,
		resetPositions: boolean = false,
		updateSqlFromSchema: boolean = true
	): boolean {
		if (updateSqlFromSchema) {
			const newSQL = generateSQLFromSchema();
			sqlInput.set(newSQL);
		}

		const result = handleParseSQL(resetZoom, resetPositions);

		return result.success;
	}

	function addTable() {
		if (!newTableName.trim()) return;

		const newTable: Table = {
			name: newTableName.trim(),
			columns: [],
			position: { x: 0, y: visualTables.length * 200 }
		};

		newTable.columns.push({
			name: 'id',
			type: 'INT',
			nullable: false,
			primaryKey: true,
			foreignKey: undefined,
			defaultValue: undefined,
			autoIncrement: true,
			unique: true,
			length: undefined
		});

		visualTables = [...visualTables, newTable];
		expandedTables = new Set([...expandedTables, newTable.name]);
		newTableName = '';
		showNewTableForm = false;
		updateSQLAndSchema(true, false);
	}

	function editTable(tableName: string) {
		editTableForm = {
			originalName: tableName,
			name: tableName,
			isVisible: true
		};
	}

	function saveTableChanges() {
		if (!editTableForm.name.trim() || editTableForm.name === editTableForm.originalName) {
			editTableForm.isVisible = false;
			return;
		}

		const tableIndex = visualTables.findIndex((t) => t.name === editTableForm.originalName);
		if (tableIndex === -1) return;

		visualTables[tableIndex].name = editTableForm.name.trim();

		for (const table of visualTables) {
			for (const column of table.columns) {
				if (column.foreignKey?.table === editTableForm.originalName) {
					column.foreignKey.table = editTableForm.name.trim();
				}
			}
		}

		visualTables = [...visualTables];
		editTableForm.isVisible = false;
		updateSQLAndSchema();
	}

	function removeTable(tableName: string) {
		visualTables = visualTables.filter((t) => t.name !== tableName);
		const newExpanded = new Set(expandedTables);
		newExpanded.delete(tableName);
		expandedTables = newExpanded;

		if (selectedTable === tableName) {
			selectedTable = null;
		}

		for (const table of visualTables) {
			for (const column of table.columns) {
				if (column.foreignKey?.table === tableName) {
					column.foreignKey = undefined;
				}
			}
		}
		visualTables = [...visualTables];
		updateSQLAndSchema();
	}

	function initNewColumnForm(tableName: string) {
		columnForm = {
			isEdit: false,
			originalName: '',
			tableName,
			name: '',
			type: '',
			nullable: true,
			primaryKey: false,
			foreignKey: undefined,
			defaultValue: '',
			autoIncrement: false,
			unique: false,
			length: undefined
		};
		showColumnForm = true;
	}

	function extractTypeAndLength(fullType: string): {
		baseType: string;
		length: number | undefined;
	} {
		const match = fullType.match(/^([A-Z\s]+)\((\d+(?:,\d+)*)\)$/i);
		if (match) {
			const baseType = match[1].trim().toUpperCase();
			const lengthStr = match[2];
			const firstNumber = lengthStr.split(',')[0];
			const length = parseInt(firstNumber);
			return { baseType, length: isNaN(length) ? undefined : length };
		}
		return { baseType: fullType.toUpperCase(), length: undefined };
	}

	function initEditColumnForm(tableName: string, column: Column) {
		const { baseType, length } = extractTypeAndLength(column.type);

		columnForm = {
			isEdit: true,
			originalName: column.name,
			tableName,
			name: column.name,
			type: baseType,
			nullable: column.nullable,
			primaryKey: column.primaryKey,
			foreignKey: column.foreignKey ? { ...column.foreignKey } : undefined,
			defaultValue: column.defaultValue || '',
			autoIncrement: column.autoIncrement || false,
			unique: column.unique || false,
			length: length || column.length
		};
		showColumnForm = true;
	}

	function saveColumn() {
		if (!columnForm.name.trim() || !columnForm.type) return;

		if (requiresLength(columnForm.type) && (!columnForm.length || columnForm.length <= 0)) {
			return;
		}

		const tableIndex = visualTables.findIndex((t) => t.name === columnForm.tableName);
		if (tableIndex === -1) return;

		const newColumn: Column = {
			name: columnForm.name.trim(),
			type: columnForm.type,
			nullable: columnForm.nullable,
			primaryKey: columnForm.primaryKey,
			foreignKey: columnForm.foreignKey,
			defaultValue: columnForm.defaultValue || undefined,
			autoIncrement: columnForm.autoIncrement,
			unique: columnForm.unique,
			length: columnForm.length
		};

		if (columnForm.isEdit) {
			const columnIndex = visualTables[tableIndex].columns.findIndex(
				(c) => c.name === columnForm.originalName
			);
			if (columnIndex !== -1) {
				visualTables[tableIndex].columns[columnIndex] = newColumn;

				if (columnForm.originalName !== columnForm.name) {
					for (const table of visualTables) {
						for (const column of table.columns) {
							if (
								column.foreignKey?.table === columnForm.tableName &&
								column.foreignKey?.column === columnForm.originalName
							) {
								column.foreignKey.column = columnForm.name.trim();
							}
						}
					}
				}
			}
		} else {
			visualTables[tableIndex].columns.push(newColumn);
		}

		visualTables = [...visualTables];
		showColumnForm = false;
		updateSQLAndSchema();
	}

	function removeColumn(tableName: string, columnName: string) {
		const tableIndex = visualTables.findIndex((t) => t.name === tableName);
		if (tableIndex === -1) return;

		visualTables[tableIndex].columns = visualTables[tableIndex].columns.filter(
			(c) => c.name !== columnName
		);

		for (const table of visualTables) {
			for (const column of table.columns) {
				if (column.foreignKey?.table === tableName && column.foreignKey?.column === columnName) {
					column.foreignKey = undefined;
				}
			}
		}

		visualTables = [...visualTables];
		updateSQLAndSchema();
	}

	function toggleTableExpansion(tableName: string) {
		const newExpanded = new Set(expandedTables);
		if (newExpanded.has(tableName)) {
			newExpanded.delete(tableName);
		} else {
			newExpanded.add(tableName);
		}
		expandedTables = newExpanded;
	}

	function getCompatiblePrimaryKeys(
		excludeTable: string = '',
		currentType: string = '',
		currentLength?: number
	): Array<{ table: string; column: string; type: string; length?: number }> {
		const compatibleKeys: Array<{ table: string; column: string; type: string; length?: number }> =
			[];

		if (!currentType) return compatibleKeys;

		for (const table of visualTables) {
			if (table.name !== excludeTable) {
				for (const column of table.columns) {
					if (column.primaryKey) {
						const { baseType, length } = extractTypeAndLength(column.type);
						const isTypeCompatible = baseType === currentType.toUpperCase();

						let isLengthCompatible = true;
						const columnLength = length || column.length;
						if (columnLength && currentLength) {
							isLengthCompatible = columnLength === currentLength;
						} else if (columnLength || currentLength) {
							if (requiresLength(baseType) || requiresLength(currentType)) {
								isLengthCompatible = false;
							}
						}

						if (isTypeCompatible && isLengthCompatible) {
							compatibleKeys.push({
								table: table.name,
								column: column.name,
								type: baseType,
								length: columnLength
							});
						}
					}
				}
			}
		}

		return compatibleKeys;
	}

	function clearAll() {
		visualTables = [];
		expandedTables = new Set();
		selectedTable = null;
		updateSQLAndSchema();
	}
</script>

<div class="flex h-full w-full flex-col">
	<div
		class="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-600"
	>
		<div class="flex items-center gap-4">
			<span class="text-sm font-medium text-gray-900 dark:text-gray-100">Schema Editor</span>
		</div>
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="cursor-pointer rounded-md p-1.5 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
				onclick={() => (showNewTableForm = true)}
				title="Add table"
			>
				<Plus class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="cursor-pointer rounded-md p-1.5 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
				onclick={clearAll}
				title="Clear all"
				disabled={visualTables.length === 0 && !$sqlInput.trim()}
			>
				<Trash2 class="h-4 w-4" />
			</button>
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto p-4">
		{#if visualTables.length === 0}
			<div class="py-8 text-center text-gray-500 dark:text-gray-400">
				{#if $sqlInput.trim()}
					<MessageCircleXIcon class="mx-auto mb-2 h-8 w-8 text-gray-600 dark:text-gray-400" />
					<p class="mb-4 text-sm">Error in your SQL code</p>
				{:else}
					<Database class="mx-auto mb-2 h-8 w-8 text-gray-600 dark:text-gray-400" />
					<p class="mb-4 text-sm">No tables defined</p>
				{/if}
				<button
					type="button"
					class="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white transition-colors duration-150 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
					onclick={() => (showNewTableForm = true)}
				>
					Create first table
				</button>
			</div>
		{:else}
			<div class="space-y-3">
				{#each visualTables as table, tableIndex (table.name)}
					<div
						class="overflow-hidden rounded-lg border border-gray-200 bg-white {dragState.isDragging &&
						dragState.dragType === 'table' &&
						dragState.dragIndex === tableIndex
							? 'opacity-50'
							: ''} {dragState.isDragging &&
						dragState.dragType === 'table' &&
						dragState.dropIndex === tableIndex
							? 'border-gray-400 bg-gray-50 dark:border-gray-500 dark:bg-gray-800/50'
							: ''} dark:border-gray-700 dark:bg-black"
						ondragover={(e) => handleTableDragOver(e, tableIndex)}
						ondrop={(e) => handleTableDrop(e, tableIndex)}
						role="application"
					>
						<div class="flex items-center justify-between bg-gray-50 px-3 py-2 dark:bg-zinc-900">
							<div class="flex flex-1 items-center gap-2">
								<div
									class="drag-handle cursor-move rounded p-1 transition-colors duration-150 hover:bg-gray-200 dark:hover:bg-gray-600"
									title="Drag to reorder"
									draggable="true"
									ondragstart={(e) => handleTableDragStart(e, tableIndex)}
									ondragend={handleDragEnd}
									role="application"
								>
									<GripVertical class="h-3 w-3 text-gray-600 dark:text-gray-400" />
								</div>
								<button
									type="button"
									class="flex flex-1 items-center gap-2 text-left"
									onclick={() => toggleTableExpansion(table.name)}
								>
									{#if expandedTables.has(table.name)}
										<ChevronDown class="h-4 w-4 text-gray-600 dark:text-gray-400" />
									{:else}
										<ChevronRight class="h-4 w-4 text-gray-600 dark:text-gray-400" />
									{/if}
									<Database class="h-4 w-4 text-gray-600 dark:text-gray-400" />
									<span class="max-w-[100px] truncate font-medium text-gray-900 dark:text-gray-100"
										>{table.name}</span
									>
									<span class="text-xs text-gray-500 dark:text-gray-400"
										>({table.columns.length})</span
									>
								</button>
							</div>
							<div class="flex items-center gap-1">
								<button
									type="button"
									class="cursor-pointer rounded p-1 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
									onclick={() => editTable(table.name)}
									title="Edit table"
								>
									<Pencil class="h-3 w-3" />
								</button>
								<button
									type="button"
									class="cursor-pointer rounded p-1 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
									onclick={() => initNewColumnForm(table.name)}
									title="Add column"
								>
									<Plus class="h-3 w-3" />
								</button>
								<button
									type="button"
									class="cursor-pointer rounded p-1 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
									onclick={() => removeTable(table.name)}
									title="Remove table"
								>
									<Trash2 class="h-3 w-3 " />
								</button>
							</div>
						</div>

						{#if expandedTables.has(table.name)}
							<div class="space-y-2 p-3">
								{#if table.columns.length === 0}
									<p class="text-sm text-gray-500 italic dark:text-gray-400">No columns defined</p>
								{:else}
									{#each table.columns as column, columnIndex (column.name)}
										<div
											class="flex items-center justify-between rounded border border-gray-300 bg-gray-50 p-2 {dragState.isDragging &&
											dragState.dragType === 'column' &&
											dragState.dragTableName === table.name &&
											dragState.dragIndex === columnIndex
												? 'opacity-50'
												: ''} {dragState.isDragging &&
											dragState.dragType === 'column' &&
											dragState.dropTableName === table.name &&
											dragState.dropIndex === columnIndex
												? 'border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-800/30'
												: ''} dark:border-gray-700 dark:bg-zinc-900"
											ondragover={(e) => handleColumnDragOver(e, table.name, columnIndex)}
											ondrop={(e) => handleColumnDrop(e, table.name, columnIndex)}
											role="application"
										>
											<div class="flex flex-1 items-center gap-2">
												<div
													class="drag-handle cursor-move rounded p-1 transition-colors duration-150 hover:bg-gray-200 dark:hover:bg-gray-500"
													title="Drag to reorder"
													draggable="true"
													ondragstart={(e) => handleColumnDragStart(e, table.name, columnIndex)}
													ondragend={handleDragEnd}
													role="application"
												>
													<GripVertical class="h-3 w-3 text-gray-600 dark:text-gray-400" />
												</div>
												<div class="flex flex-col">
													<span class="font-mono text-sm text-gray-900 dark:text-gray-100"
														>{column.name}</span
													>
													<span class="font-mono text-xs text-gray-500 dark:text-gray-400"
														>{column.type}</span
													>
												</div>

												{#if column.primaryKey}
													<span
														class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
														title="Primary Key">PK</span
													>
												{/if}
												{#if column.foreignKey}
													<span
														class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
														title="Foreign Key → {column.foreignKey.table}.{column.foreignKey
															.column}">FK</span
													>
												{/if}
												{#if column.autoIncrement}
													<span
														class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
														title="Auto Increment">AI</span
													>
												{/if}
												{#if !column.nullable}
													<span
														class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
														title="Not Null">NN</span
													>
												{/if}
												{#if column.unique}
													<span
														class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
														title="Unique">UQ</span
													>
												{/if}
												{#if column.defaultValue}
													<span
														class="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-300"
														title="Default: {column.defaultValue}">DF</span
													>
												{/if}
											</div>
											<div class="flex items-center gap-1">
												<button
													type="button"
													class="cursor-pointer rounded p-1 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
													onclick={() => initEditColumnForm(table.name, column)}
													title="Edit column"
												>
													<Pencil class="h-3 w-3 " />
												</button>
												<button
													type="button"
													class="cursor-pointer rounded p-1 text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
													onclick={() => removeColumn(table.name, column.name)}
													title="Remove column"
												>
													<Trash2 class="h-3 w-3" />
												</button>
											</div>
										</div>
									{/each}
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if showNewTableForm}
	<div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl dark:bg-[#111111]">
			<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">New Table</h3>
			<div class="space-y-4">
				<div>
					<label
						for="table-name"
						class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Table name
					</label>
					<input
						id="table-name"
						type="text"
						bind:value={newTableName}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100 dark:placeholder-gray-400"
						placeholder="usuarios, productos, etc."
						onkeydown={(e) => e.key === 'Enter' && addTable()}
					/>
				</div>
			</div>
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors duration-150 hover:bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
					onclick={() => {
						showNewTableForm = false;
						newTableName = '';
					}}
				>
					Cancel
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors duration-150 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
					onclick={addTable}
					disabled={!isValidTableName(newTableName)}
				>
					Create Table
				</button>
			</div>
		</div>
	</div>
{/if}

{#if editTableForm.isVisible}
	<div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl dark:bg-[#111111]">
			<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">Edit Table</h3>
			<div class="space-y-4">
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
						bind:value={editTableForm.name}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100 dark:placeholder-gray-400"
						placeholder="usuarios, productos, etc."
						onkeydown={(e) => e.key === 'Enter' && saveTableChanges()}
					/>
				</div>
			</div>
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors duration-150 hover:bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
					onclick={() => (editTableForm.isVisible = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors duration-150 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
					onclick={saveTableChanges}
					disabled={!editTableForm.name.trim()}
				>
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showColumnForm}
	<div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div
			class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-2xl dark:bg-[#111111]"
		>
			<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
				{columnForm.isEdit ? 'Edit' : 'New'} Column - {columnForm.tableName}
			</h3>
			<div class="space-y-4">
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
						bind:value={columnForm.name}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100 dark:placeholder-gray-400"
						placeholder="id, name, email, etc."
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
						bind:value={columnForm.type}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100"
					>
						<option value="">Select type...</option>
						{#each SQL_TYPES as dataType, index (index)}
							<option value={dataType}>{dataType}</option>
						{/each}
					</select>
				</div>

				{#if columnForm.type && canHaveLength(columnForm.type)}
					<div>
						<label
							for="column-length"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Length {requiresLength(columnForm.type) ? '(required)' : '(optional)'}
						</label>
						<input
							id="column-length"
							type="number"
							min="1"
							max="65535"
							bind:value={columnForm.length}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-gray-100 dark:placeholder-gray-400"
							placeholder="Ej: 255, 50, 100..."
							required={requiresLength(columnForm.type)}
							oninput={(e) => {
								const target = e.target as HTMLInputElement;
								target.value = target.value.replace(/[^0-9]/g, '');
								const numValue = parseInt(target.value);
								columnForm.length = isNaN(numValue) ? undefined : numValue;
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
						{#if requiresLength(columnForm.type) && (!columnForm.length || columnForm.length <= 0)}
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
							columnForm.originalName
						) && !columnForm.primaryKey
							? 'opacity-50'
							: ''} dark:hover:bg-gray-700"
					>
						<input
							type="checkbox"
							bind:checked={columnForm.primaryKey}
							class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-gray-600 focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600"
							disabled={tableHasPrimaryKey(columnForm.tableName, columnForm.originalName) &&
								!columnForm.primaryKey}
						/>
						<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
							Primary Key
							{#if tableHasPrimaryKey(columnForm.tableName, columnForm.originalName) && !columnForm.primaryKey}
								<span class="block text-xs text-gray-500">(Already exists a PK in this table)</span>
							{/if}
						</span>
					</label>

					{#if isFeatureSupported('autoIncrement')}
						<label
							class="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50 {!columnForm.primaryKey
								? 'opacity-50'
								: ''} dark:hover:bg-gray-700"
						>
							<input
								type="checkbox"
								bind:checked={columnForm.autoIncrement}
								class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-gray-600 focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600"
								disabled={!columnForm.primaryKey}
							/>
							<span class="text-sm font-medium text-gray-700 dark:text-gray-300"
								>Auto Increment</span
							>
						</label>
					{/if}

					<label
						class="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-50 {columnForm.primaryKey
							? 'opacity-50'
							: ''} dark:hover:bg-gray-700"
					>
						<input
							type="checkbox"
							bind:checked={columnForm.nullable}
							class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-gray-600 focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600"
							disabled={columnForm.primaryKey}
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
							bind:checked={columnForm.unique}
							class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-gray-600 focus:ring-2 focus:ring-gray-500 dark:border-gray-500 dark:bg-gray-600"
							disabled={columnForm.primaryKey}
						/>
						<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Unique</span>
					</label>
				</div>

				<div>
					{#if columnForm.type}
						{@const compatiblePKs = getCompatiblePrimaryKeys(
							columnForm.tableName,
							columnForm.type,
							columnForm.length
						)}

						{#if compatiblePKs.length > 0}
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
								onchange={(e) => {
									const target = e.target as HTMLSelectElement;
									if (target.value) {
										const [table, column] = target.value.split('.');
										columnForm.foreignKey = { table, column };
									} else {
										columnForm.foreignKey = undefined;
									}
								}}
							>
								<option value="">none</option>
								{#each compatiblePKs as pk, index (index)}
									<option value="{pk.table}.{pk.column}">
										{pk.table}.{pk.column} ({pk.type}{pk.length ? `(${pk.length})` : ''})
									</option>
								{/each}
							</select>
						{/if}
					{/if}
				</div>
			</div>

			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors duration-150 hover:bg-gray-200 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
					onclick={() => (showColumnForm = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors duration-150 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
					onclick={saveColumn}
					disabled={!columnForm.name.trim() ||
						$schema.tables.some((t) => {
							return (
								t.name === columnForm.tableName &&
								t.columns.some(
									(c) =>
										c.name.toLowerCase() === columnForm.name.toLowerCase() &&
										((columnForm.isEdit &&
											columnForm.originalName !== columnForm.name.toLowerCase()) ||
											!columnForm.isEdit)
								)
							);
						}) ||
						!columnForm.type ||
						(requiresLength(columnForm.type) && (!columnForm.length || columnForm.length <= 0))}
				>
					{columnForm.isEdit ? 'Save' : 'Add'} Column
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.max-h-\[90vh\]::-webkit-scrollbar) {
		width: 6px;
	}

	:global(.max-h-\[90vh\]::-webkit-scrollbar-track) {
		background: #f1f5f9;
	}

	:global(.max-h-\[90vh\]::-webkit-scrollbar-thumb) {
		background: #cbd5e1;
		border-radius: 3px;
	}

	:global(.max-h-\[90vh\]::-webkit-scrollbar-thumb:hover) {
		background: #94a3b8;
	}

	.drag-handle {
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	.drag-handle:hover {
		opacity: 1;
	}

	[draggable='true'] {
		transition: all 0.2s ease;
	}

	[draggable='true']:active {
		cursor: grabbing;
	}
</style>
