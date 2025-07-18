import { darkMode } from '$lib/stores/ui';
import { canvasState } from '$lib/stores/app';
import { get } from 'svelte/store';

export function getGridPattern(): Partial<CSSStyleDeclaration> {
	const canvas = get(canvasState);
	const gridSize = 40;
	const scaledGridSize = gridSize * canvas.zoom;
	const offsetX = canvas.panX % scaledGridSize;
	const offsetY = canvas.panY % scaledGridSize;

	const dotSize = Math.max(1, Math.min(3, canvas.zoom * 1.5));
	const gridColor = get(darkMode) ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

	return {
		backgroundImage: `radial-gradient(circle, ${gridColor} ${dotSize}px, transparent ${dotSize}px)`,
		backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
		backgroundPosition: `${offsetX}px ${offsetY}px`
	};
}
