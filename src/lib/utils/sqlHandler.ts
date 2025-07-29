import { isLoading } from '$lib/stores/ui';
import { schema, selectedDialect, sqlInput } from '$lib/stores/app';
import { get } from 'svelte/store';
import { parseSQL } from '$lib/parsers/sql-parser';
import { fitCanvasToTables } from '$lib/utils/canvas';
import type { SyntaxParseResult } from '$lib/types';

export function handleParseSQL(
	resetZoom: boolean = false,
	resetPositions: boolean = false
): SyntaxParseResult {
	const sql = get(sqlInput);

	if (!sql.trim()) {
		schema.set({ tables: [], relationships: [] });
		return {
			success: false,
			error: 'SQL input is empty'
		};
	}

	isLoading.set(true);

	try {
		const result = parseSQL(sql, get(selectedDialect), resetPositions);

		if (result.schema) {
			schema.set(result.schema);
		}

		if (result.success) {
			if (resetZoom && result.schema && result.schema.tables.length > 0) {
				fitCanvasToTables();
			}

			return {
				success: true
			};
		}

		return {
			success: false,
			error: result.error?.message || 'Failed to parse SQL',
			statementIndex: result.error?.statementIndex || -1
		};
	} finally {
		isLoading.set(false);
	}
}
