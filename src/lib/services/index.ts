import { isLoading, lastParseTime, showSidebar } from '$lib/stores/ui';
import { schema, canvasState, sqlInput, selectedDialect } from '$lib/stores/app';
import { get } from 'svelte/store';
import { parseSQL } from '$lib/services/sql/sqlParser';
import type { SyntaxParseResult } from '$lib/types';

export function handleParseSQL(
	resetZoom: boolean = false,
	resetPositions: boolean = false
): SyntaxParseResult {
	const sql = get(sqlInput);
	lastParseTime.set(new Date());

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

export function fitCanvasToTables() {
	const tables = get(schema);

	if (tables.tables.length === 0) return;

	const isMobile =
		window.matchMedia('(max-width: 768px)').matches ||
		'ontouchstart' in window ||
		navigator.maxTouchPoints > 0;

	const padding = isMobile ? 20 : 50;

	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity;

	for (const table of tables.tables) {
		minX = Math.min(minX, table.position.x);
		minY = Math.min(minY, table.position.y);
		maxX = Math.max(maxX, table.position.x + 280);
		maxY = Math.max(maxY, table.position.y + 250);
	}

	const headerHeight = isMobile ? 60 : 100;
	const sidebarWidth = get(showSidebar) ? (isMobile ? 0 : 400) : 0;

	const viewportWidth = window.innerWidth - sidebarWidth;
	const viewportHeight = window.innerHeight - headerHeight;

	const contentWidth = maxX - minX + 2 * padding;
	const contentHeight = maxY - minY + 2 * padding;

	const scaleX = viewportWidth / contentWidth;
	const scaleY = viewportHeight / contentHeight;

	const minZoom = isMobile ? 0.3 : 0.1;
	const maxZoom = isMobile ? 2 : 1;

	const scale = Math.min(scaleX, scaleY, maxZoom);
	const finalScale = Math.max(scale, minZoom);

	const panX =
		(viewportWidth - contentWidth * finalScale) / 2 - minX * finalScale + padding * finalScale;
	const panY =
		(viewportHeight - contentHeight * finalScale) / 2 - minY * finalScale + padding * finalScale;

	canvasState.set({
		zoom: finalScale,
		panX,
		panY,
		selectedTable: get(canvasState).selectedTable,
		draggedTable: get(canvasState).draggedTable
	});
}
