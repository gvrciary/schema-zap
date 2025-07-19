import type { CanvasState } from '$lib/types';

export function getBackground(canvas: CanvasState, darkMode: boolean): Partial<CSSStyleDeclaration> {
	const gridSize = 40;
	const scaledGridSize = gridSize * canvas.zoom;
	const offsetX = canvas.panX % scaledGridSize;
	const offsetY = canvas.panY % scaledGridSize;

	const dotSize = Math.max(1, Math.min(3, canvas.zoom * 1.5));
	const gridColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)';

	return {
		backgroundImage: `radial-gradient(circle, ${gridColor} ${dotSize}px, transparent ${dotSize}px)`,
		backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
		backgroundPosition: `${offsetX}px ${offsetY}px`
	};
}

export function cssObjectToString(style: Partial<CSSStyleDeclaration>): string {
	return Object.entries(style)
		.map(([key, value]) => {
			const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
			return `${kebab}: ${value};`;
		})
		.join(' ');
}

