import { schema, canvasState } from '$lib/stores/app';
import { showSidebar } from '$lib/stores/ui';
import { get } from 'svelte/store';
import type { Column } from '$lib/types';

export function fitCanvasToTables(): void {
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

export function getColumnBadges(column: Column): string[] {
  const badges: string[] = [];

  if (column.primaryKey) badges.push('PK');
  if (column.foreignKey) badges.push('FK');
  if (column.unique && !column.primaryKey) badges.push('UQ');
  if (column.autoIncrement) badges.push('AI');
  if (!column.nullable) badges.push('NN');
  if (column.defaultValue) badges.push('DF');

  return badges;
}
