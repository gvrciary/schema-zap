<script lang="ts">
	import { onMount } from 'svelte';
	import { SQLDialect } from '$lib/types';
	import { SQL_EXAMPLES, SQL_DATA_TYPES, SQL_KEYWORDS } from '$lib/constants';
	import { RotateCcw, AlertCircle, CheckCircle, ChevronDown, Database } from 'lucide-svelte';
	import { Button, CopyButton, DeleteButton } from '$lib/components/ui';
	import { sqlInput, selectedDialect } from '$lib/stores/app';
	import { handleParseSQL } from '$lib/utils/sqlHandler';
	import { hasMounted } from '$lib/stores/ui';

	onMount(() => {
		if (!$hasMounted) {
			handleParse(true, true);
			hasMounted.set(true);
			return;
		}

		handleParse();
	});

	const placeholder = 'Enter your SQL DDL statements here...';

	function handleSQLChange(
		value: string,
		resetZoom: boolean = false,
		resetPosition: boolean = false
	): void {
		sqlInput.set(value);
		handleParse(resetZoom, resetPosition);
	}

	let textareaElement: HTMLTextAreaElement;
	let codeElement: HTMLElement;
	let isParsingError = $state(false);

	let errorMessage = $state('');
	let isValidSQL = $state(false);
	let errorStatementIndex = $state(-1);

	const SQL_TYPES = $derived(SQL_DATA_TYPES[$selectedDialect] || []);

	function highlightSQL(code: string): string {
		if (!code) return '';

		const statements = parseCreateStatements(code);

		const tokens = tokenizeSQL(code);
		let result = '';
		let currentPos = 0;

		for (const token of tokens) {
			const isInErrorStatement =
				errorStatementIndex >= 0 &&
				statements[errorStatementIndex] &&
				currentPos >= statements[errorStatementIndex].start &&
				currentPos < statements[errorStatementIndex].end;

			const baseClass = getTokenClass(token.type);
			const errorClass = isInErrorStatement ? ' sql-error-statement' : '';
			const className = baseClass + errorClass;

			result += `<span class="${className}">${escapeHtml(token.value)}</span>`;
			currentPos += token.value.length;
		}

		return result;
	}

	function getTokenClass(type: string): string {
		switch (type) {
			case 'keyword':
				return 'sql-keyword';
			case 'type':
				return 'sql-type';
			case 'string':
				return 'sql-string';
			case 'number':
				return 'sql-number';
			case 'comment':
				return 'sql-comment';
			case 'operator':
				return 'sql-operator';
			case 'paren':
				return 'sql-paren';
			case 'identifier':
				return 'sql-identifier';
			case 'whitespace':
				return 'sql-text';
			case 'punctuation':
				return 'sql-text';
			default:
				return 'sql-text';
		}
	}

	function parseCreateStatements(code: string): Array<{ start: number; end: number }> {
		const statements: Array<{ start: number; end: number }> = [];
		const matches = [...code.matchAll(/CREATE\s+TABLE/gi)];

		for (let i = 0; i < matches.length; i++) {
			const match = matches[i];
			const start = match.index!;
			const end = i < matches.length - 1 ? matches[i + 1].index! : code.length;

			statements.push({ start, end });
		}

		return statements;
	}

	function escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function tokenizeSQL(code: string): Array<{ type: string; value: string }> {
		const tokens: Array<{ type: string; value: string }> = [];
		let i = 0;

		while (i < code.length) {
			const char = code[i];

			if (/\s/.test(char)) {
				let whitespace = '';
				while (i < code.length && /\s/.test(code[i])) {
					whitespace += code[i++];
				}
				tokens.push({ type: 'whitespace', value: whitespace });
				continue;
			}

			if (char === '-' && code[i + 1] === '-') {
				let comment = '';
				while (i < code.length && code[i] !== '\n') {
					comment += code[i++];
				}
				tokens.push({ type: 'comment', value: comment });
				continue;
			}

			if (char === '/' && code[i + 1] === '*') {
				let comment = '';
				while (i < code.length - 1) {
					comment += code[i];
					if (code[i] === '*' && code[i + 1] === '/') {
						comment += code[++i];
						i++;
						break;
					}
					i++;
				}
				tokens.push({ type: 'comment', value: comment });
				continue;
			}

			if (char === "'" || char === '"') {
				const quote = char;
				let string = quote;
				i++;
				while (i < code.length) {
					if (code[i] === quote) {
						string += code[i++];
						if (i < code.length && code[i] === quote) {
							string += code[i++];
							continue;
						}
						break;
					}
					if (code[i] === '\\') {
						string += code[i++];
						if (i < code.length) string += code[i++];
					} else {
						string += code[i++];
					}
				}
				tokens.push({ type: 'string', value: string });
				continue;
			}

			if (/\d/.test(char)) {
				let number = '';
				while (i < code.length && /[\d.]/.test(code[i])) {
					number += code[i++];
				}
				tokens.push({ type: 'number', value: number });
				continue;
			}

			if (/[=<>!]/.test(char)) {
				let operator = '';
				while (i < code.length && /[=<>!]/.test(code[i])) {
					operator += code[i++];
				}
				tokens.push({ type: 'operator', value: operator });
				continue;
			}

			if (/[()]/.test(char)) {
				tokens.push({ type: 'paren', value: char });
				i++;
				continue;
			}

			if (/[,;.]/.test(char)) {
				tokens.push({ type: 'punctuation', value: char });
				i++;
				continue;
			}

			if (/[a-zA-Z_]/.test(char)) {
				let word = '';
				while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
					word += code[i++];
				}

				const upperWord = word.toUpperCase();
				if (SQL_KEYWORDS.includes(upperWord)) {
					tokens.push({ type: 'keyword', value: word });
				} else if (SQL_TYPES.includes(upperWord)) {
					tokens.push({ type: 'type', value: word });
				} else {
					tokens.push({ type: 'identifier', value: word });
				}
				continue;
			}

			tokens.push({ type: 'other', value: char });
			i++;
		}

		return tokens;
	}

	function syncScroll(): void {
		if (textareaElement && codeElement) {
			codeElement.scrollTop = textareaElement.scrollTop;
			codeElement.scrollLeft = textareaElement.scrollLeft;
		}
	}

	function syncContent(): void {
		if (codeElement) {
			const codeTag = codeElement.querySelector('code');
			if (codeTag) {
				const highlighted = highlightSQL($sqlInput);
				const extraContent = '\n'.repeat(10);
				codeTag.innerHTML = highlighted + extraContent;
			}
		}
	}

	$effect(() => {
		syncContent();
	});

	function onDialectChange(dialect: SQLDialect): void {
		selectedDialect.set(dialect);
		handleParse(true, true);
	}

	let isOpen = $state(false);
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

	function handleDialectSelect(dialect: SQLDialect): void {
		isOpen = false;
		if (dialect !== $selectedDialect) {
			onDialectChange(dialect);
		}
	}

	function handleClickOutside(event: MouseEvent): void {
		const target = event.target as HTMLElement;
		if (!target.closest('.dialect-selector')) {
			isOpen = false;
		}
	}

	function handleKeyDownSelector(event: KeyboardEvent): void {
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				isOpen = !isOpen;
				break;
			case 'Escape':
				isOpen = false;
				break;
			case 'ArrowDown':
				if (!isOpen) {
					event.preventDefault();
					isOpen = true;
				}
				break;
			case 'ArrowUp':
				if (isOpen) {
					event.preventDefault();
					isOpen = false;
				}
				break;
		}
	}

	function handleOptionKeyDown(event: KeyboardEvent, dialect: SQLDialect): void {
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				handleDialectSelect(dialect);
				break;
		}
	}

	function handleInputChange(event: Event): void {
		const target = event.target as HTMLTextAreaElement;
		const newValue = target.value;

		isParsingError = false;
		errorMessage = '';
		errorStatementIndex = -1;

		handleSQLChange(newValue);
	}

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

		if (event.key === 'Tab') {
			event.preventDefault();
			const start = textareaElement.selectionStart;
			const end = textareaElement.selectionEnd;
			const newValue = $sqlInput.substring(0, start) + '    ' + $sqlInput.substring(end);
			handleSQLChange(newValue);

			setTimeout(() => {
				textareaElement.selectionStart = start + 4;
				textareaElement.selectionEnd = start + 4;
			}, 0);
		}
	}

	function clearInput(): void {
		handleSQLChange('');
		isParsingError = false;
		errorMessage = '';
		errorStatementIndex = -1;
		isValidSQL = false;
		textareaElement.focus();
	}

	function loadSample(): void {
		const sampleSQL = SQL_EXAMPLES[$selectedDialect] || '';
		handleSQLChange(sampleSQL, true, true);
		clearError();
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="flex h-full flex-col">
	<div class="dialect-selector relative mb-2 flex-shrink-0">
		<label
			for="sql-dialect-selector"
			class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
		>
			SQL Dialect
		</label>

		<button
			id="sql-dialect-selector"
			type="button"
			class="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-all duration-200 hover:border-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/50 dark:border-gray-600 dark:bg-[#111111]/60 dark:text-gray-100 dark:hover:border-gray-500"
			onclick={() => (isOpen = !isOpen)}
			onkeydown={handleKeyDownSelector}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
		>
			<div class="flex items-center gap-3">
				<Database class="h-4 w-4 {getDialectColor($selectedDialect)}" />
				<span class="flex-1 text-left font-medium">
					{$selectedDialect}
				</span>
			</div>
			<ChevronDown
				class="h-4 w-4 text-gray-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
			/>
		</button>

		{#if isOpen}
			<div
				class="dialect-dropdown absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
			>
				<div role="listbox" aria-label="SQL dialects">
					{#each dialects as dialect, index (index)}
						<button
							type="button"
							class="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm text-gray-900 transition-colors duration-150 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:bg-[#111111]/60 {dialect ===
							$selectedDialect
								? 'bg-gray-50 text-gray-900 dark:bg-gray-700/50 dark:text-gray-300'
								: ''} dark:text-gray-100 dark:hover:bg-gray-700"
							onclick={() => handleDialectSelect(dialect)}
							onkeydown={(e) => handleOptionKeyDown(e, dialect)}
							role="option"
							aria-selected={dialect === $selectedDialect}
						>
							<div class="flex items-center gap-3">
								<Database class="h-4 w-4 {getDialectColor(dialect)}" />
								<span class="font-medium">
									{dialect}
								</span>
							</div>
							{#if dialect === $selectedDialect}
								<div class="h-2 w-2 rounded-full bg-gray-500"></div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}
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

		<div class="relative flex-1 overflow-hidden bg-white dark:bg-[#111111]">
			<pre bind:this={codeElement}><code class="sql-highlighted"></code></pre>

			<textarea
				id="sql-textarea"
				bind:this={textareaElement}
				class="placeholder:text-gray-400 dark:placeholder:text-gray-500"
				value={$sqlInput}
				{placeholder}
				oninput={handleInputChange}
				onkeydown={handleKeyDown}
				onscroll={syncScroll}
				spellcheck="false"
			></textarea>
		</div>
	</div>
</div>

<style>
	#sql-textarea::-webkit-scrollbar,
	pre::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	#sql-textarea::-webkit-scrollbar-track,
	pre::-webkit-scrollbar-track {
		background: #f8fafc;
		border-radius: 4px;
	}

	#sql-textarea::-webkit-scrollbar-thumb,
	pre::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 4px;
	}

	#sql-textarea::-webkit-scrollbar-thumb:hover,
	pre::-webkit-scrollbar-thumb:hover {
		background: #94a3b8;
	}

	#sql-textarea::-webkit-scrollbar-corner,
	pre::-webkit-scrollbar-corner {
		background: #f8fafc;
	}

	:global(.dialect-dropdown::-webkit-scrollbar) {
		width: 6px;
	}

	:global(.dialect-dropdown::-webkit-scrollbar-track) {
		background: #f1f5f9;
	}

	:global(.dialect-dropdown::-webkit-scrollbar-thumb) {
		background: #cbd5e1;
		border-radius: 3px;
	}

	:global(.dialect-dropdown::-webkit-scrollbar-thumb:hover) {
		background: #94a3b8;
	}

	#sql-textarea:focus {
		outline: none;
		box-shadow: inset 0 0 0 2px #6b7280;
	}

	:global(.sql-keyword) {
		color: #6b7280;
		font-weight: 700;
	}
	:global(.dark .sql-keyword) {
		color: #9ca3af;
		font-weight: 700;
	}

	:global(.sql-type) {
		color: #6b7280;
		font-weight: 600;
	}

	:global(.dark .sql-type) {
		color: #9ca3af;
		font-weight: 600;
	}

	:global(.sql-string) {
		color: #7f1d1d;
	}
	:global(.dark .sql-string) {
		color: #f87171;
	}

	:global(.sql-number) {
		color: #4b5563;
	}
	:global(.dark .sql-number) {
		color: #9ca3af;
	}

	:global(.sql-comment) {
		color: #6b7280;
		font-style: italic;
		font-weight: 400;
		opacity: 0.6;
	}
	:global(.dark .sql-comment) {
		color: #9ca3af;
		font-style: italic;
		font-weight: 400;
		opacity: 0.6;
	}

	:global(.sql-paren) {
		color: #000000;
		font-weight: 600;
	}
	:global(.dark .sql-paren) {
		color: #ffffff;
		font-weight: 600;
	}

	:global(.sql-operator) {
		color: #4338ca;
		font-weight: 600;
	}
	:global(.dark .sql-operator) {
		color: #818cf8;
		font-weight: 600;
	}

	:global(.sql-identifier) {
		color: #000000;
	}
	:global(.dark .sql-identifier) {
		color: #ffffff;
	}

	:global(.sql-text) {
		color: #111827;
	}
	:global(.dark .sql-text) {
		color: #f9fafb;
	}

	:global(.sql-highlighted) {
		font-family: inherit !important;
		font-size: inherit !important;
		line-height: inherit !important;
		letter-spacing: inherit !important;
		word-spacing: inherit !important;
		font-weight: inherit !important;
		margin: 0 !important;
		padding: 0 !important;
		white-space: inherit !important;
		word-wrap: inherit !important;
		font-variant-ligatures: inherit !important;
		font-stretch: inherit !important;
		text-rendering: inherit !important;
		-webkit-font-smoothing: inherit !important;
		-moz-osx-font-smoothing: inherit !important;
	}

	:global(.sql-highlighted span) {
		font-family: 'JetBrains Mono Variable', monospace !important;
		font-size: 14px !important;
		line-height: 20px !important;
		font-variant-ligatures: none !important;
		letter-spacing: 0 !important;
		word-spacing: 0 !important;
		display: inline !important;
		vertical-align: baseline !important;
		box-decoration-break: clone !important;
		-webkit-box-decoration-break: clone !important;
	}

	:global(.sql-error-statement) {
		background-color: rgba(239, 68, 68, 0.1);
		border-radius: 2px;
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
	}

	:global(.sql-keyword.sql-error-statement) {
		color: #dc2626;
		background-color: rgba(239, 68, 68, 0.15);
	}

	:global(.sql-identifier.sql-error-statement) {
		background-color: rgba(239, 68, 68, 0.12);
	}

	pre {
		position: absolute !important;
		top: 0 !important;
		left: 0 !important;
		right: 0 !important;
		bottom: 0 !important;
		z-index: 1 !important;
		font-family: 'JetBrains Mono Variable', monospace !important;
		font-size: 14px !important;
		line-height: 20px !important;
		letter-spacing: 0 !important;
		word-spacing: 0 !important;
		margin: 0 !important;
		padding: 16px !important;
		box-sizing: border-box !important;
		white-space: pre-wrap !important;
		word-wrap: break-word !important;
		overflow-wrap: break-word !important;
		font-weight: 400 !important;
		font-variant-ligatures: none !important;
		border: none !important;
		outline: none !important;
		resize: none !important;
		overflow: auto !important;
		background: transparent !important;
		color: transparent !important;
		tab-size: 4 !important;
		pointer-events: none !important;
	}

	#sql-textarea {
		position: absolute !important;
		top: 0 !important;
		left: 0 !important;
		right: 0 !important;
		bottom: 0 !important;
		z-index: 2 !important;
		caret-color: #374151 !important;
		color: transparent !important;
		background: transparent !important;
		font-family: 'JetBrains Mono Variable', monospace !important;
		font-size: 14px !important;
		line-height: 20px !important;
		letter-spacing: 0 !important;
		word-spacing: 0 !important;
		margin: 0 !important;
		padding: 16px !important;
		box-sizing: border-box !important;
		white-space: pre-wrap !important;
		word-wrap: break-word !important;
		overflow-wrap: break-word !important;
		font-weight: 400 !important;
		font-variant-ligatures: none !important;
		border: none !important;
		outline: none !important;
		resize: none !important;
		overflow: auto !important;
		tab-size: 4 !important;
	}

	#sql-textarea::selection {
		background: rgba(107, 114, 128, 0.3);
	}

	#sql-textarea:placeholder-shown {
		color: #9ca3af;
	}

	#sql-textarea:focus:not(:placeholder-shown) {
		color: rgba(55, 65, 81, 0.1);
	}
</style>
