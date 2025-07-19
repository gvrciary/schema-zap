<script lang="ts">
	import { canvasState, schema } from '$lib/stores/app';
	import { initializeRelations, isLoading } from '$lib/stores/ui';
	import { tick } from 'svelte';

	let shouldRerender = 0;

	function getTableElement(tableName: string): HTMLElement | null {
		return document.querySelector(`#table-${tableName.toLowerCase()}`);
	}

	function getTableBounds(
		tableName: string
	): { x: number; y: number; width: number; height: number } | null {
		const element = getTableElement(tableName);
		if (!element) return null;

		const rect = element.getBoundingClientRect();
		const canvasContainer = element.closest('.canvas-container');
		if (!canvasContainer) return null;

		const canvasRect = canvasContainer.getBoundingClientRect();

		const x = (rect.left - canvasRect.left - $canvasState.panX) / $canvasState.zoom;
		const y = (rect.top - canvasRect.top - $canvasState.panY) / $canvasState.zoom;
		const width = rect.width / $canvasState.zoom;
		const height = rect.height / $canvasState.zoom;

		return { x, y, width, height };
	}

	function getConnectionPoint(
		fromTableName: string,
		toTableName: string
	): { x: number; y: number } {
		const fromBounds = getTableBounds(fromTableName);
		const toBounds = getTableBounds(toTableName);

		if (!fromBounds || !toBounds) {
			return { x: 0, y: 0 };
		}

		const fromCenter = {
			x: fromBounds.x + fromBounds.width / 2,
			y: fromBounds.y + fromBounds.height / 2
		};

		const toCenter = {
			x: toBounds.x + toBounds.width / 2,
			y: toBounds.y + toBounds.height / 2
		};

		const dx = toCenter.x - fromCenter.x;
		const dy = toCenter.y - fromCenter.y;

		let connectionPoint = { x: 0, y: 0 };

		if (Math.abs(dx) > Math.abs(dy)) {
			if (dx > 0) {
				const edgeCenter = fromBounds.y + fromBounds.height / 2;
				const targetOffset = (toCenter.y - edgeCenter) * 0.3;
				connectionPoint = {
					x: fromBounds.x + fromBounds.width,
					y: Math.max(
						fromBounds.y + 10,
						Math.min(fromBounds.y + fromBounds.height - 10, edgeCenter + targetOffset)
					)
				};
			} else {
				const edgeCenter = fromBounds.y + fromBounds.height / 2;
				const targetOffset = (toCenter.y - edgeCenter) * 0.3;
				connectionPoint = {
					x: fromBounds.x,
					y: Math.max(
						fromBounds.y + 10,
						Math.min(fromBounds.y + fromBounds.height - 10, edgeCenter + targetOffset)
					)
				};
			}
		} else {
			if (dy > 0) {
				const edgeCenter = fromBounds.x + fromBounds.width / 2;
				const targetOffset = (toCenter.x - edgeCenter) * 0.3;
				connectionPoint = {
					x: Math.max(
						fromBounds.x + 10,
						Math.min(fromBounds.x + fromBounds.width - 10, edgeCenter + targetOffset)
					),
					y: fromBounds.y + fromBounds.height
				};
			} else {
				const edgeCenter = fromBounds.x + fromBounds.width / 2;
				const targetOffset = (toCenter.x - edgeCenter) * 0.3;
				connectionPoint = {
					x: Math.max(
						fromBounds.x + 10,
						Math.min(fromBounds.x + fromBounds.width - 10, edgeCenter + targetOffset)
					),
					y: fromBounds.y
				};
			}
		}

		return connectionPoint;
	}

	function createOrthogonalPath(
		start: { x: number; y: number },
		end: { x: number; y: number }
	): string {
		const midX = start.x + (end.x - start.x) * 0.5;
		const midY = start.y + (end.y - start.y) * 0.5;

		const dx = Math.abs(end.x - start.x);
		const dy = Math.abs(end.y - start.y);

		if (dx > dy) {
			return `M ${start.x},${start.y} L ${midX},${start.y} L ${midX},${end.y} L ${end.x},${end.y}`;
		} else {
			return `M ${start.x},${start.y} L ${start.x},${midY} L ${end.x},${midY} L ${end.x},${end.y}`;
		}
	}

	function renderManyToManyRelationship(
		fromTableName: string,
		toTableName: string,
		junctionTableName: string
	): {
		path1: string;
		path2: string;
		line1: { start: { x: number; y: number }; end: { x: number; y: number } };
		line2: { start: { x: number; y: number }; end: { x: number; y: number } };
		junctionCenter: { x: number; y: number };
	} {
		const startPoint1 = getConnectionPoint(fromTableName, junctionTableName);
		const endPoint1 = getConnectionPoint(junctionTableName, fromTableName);

		const startPoint2 = getConnectionPoint(junctionTableName, toTableName);
		const endPoint2 = getConnectionPoint(toTableName, junctionTableName);

		const junctionBounds = getTableBounds(junctionTableName);
		const junctionCenter = junctionBounds
			? {
					x: junctionBounds.x + junctionBounds.width / 2,
					y: junctionBounds.y + junctionBounds.height / 2
				}
			: { x: 0, y: 0 };

		return {
			path1: createOrthogonalPath(startPoint1, endPoint1),
			path2: createOrthogonalPath(startPoint2, endPoint2),
			line1: { start: startPoint1, end: endPoint1 },
			line2: { start: startPoint2, end: endPoint2 },
			junctionCenter
		};
	}

	function checkTableElements() {
		const missingElements = $schema.relationships.some((relationship) => {
			const fromTable = $schema.tables.find((t) => t.name === relationship.fromTable);
			const toTable = $schema.tables.find((t) => t.name === relationship.toTable);

			if (!fromTable || !toTable) return false;

			const fromBounds = getTableBounds(fromTable.name);
			const toBounds = getTableBounds(toTable.name);

			if (!fromBounds || !toBounds) return true;

			if (relationship.type === 'many-to-many' && relationship.junctionTable) {
				const junctionBounds = getTableBounds(relationship.junctionTable);
				if (!junctionBounds) return true;
			}

			return false;
		});

		if (missingElements) {
			tick().then(() => {
				shouldRerender++;
			});
		}
	}

	$: if ($schema.relationships.length > 0 && !$isLoading && $initializeRelations) {
		checkTableElements();
	}
</script>

{#if $schema.relationships.length > 0 && !$isLoading && $initializeRelations}
	{#key shouldRerender}
		<svg class="pointer-events-none absolute top-0 left-0 z-1 h-full w-full select-none">
			<g transform="translate({$canvasState.panX}, {$canvasState.panY}) scale({$canvasState.zoom})">
				{#each $schema.relationships as relationship, index (index)}
					{@const fromTable = $schema.tables.find((t) => t.name === relationship.fromTable)}
					{@const toTable = $schema.tables.find((t) => t.name === relationship.toTable)}
					{#if fromTable && toTable}
						{#if relationship.type === 'many-to-many' && relationship.junctionTable}
							{@const junctionTable = $schema.tables.find(
								(t) => t.name === relationship.junctionTable
							)}
							{#if junctionTable}
								{@const manyToMany = renderManyToManyRelationship(
									fromTable.name,
									toTable.name,
									junctionTable.name
								)}

								<path
									d={manyToMany.path1}
									stroke="#6b7280"
									stroke-width="2"
									stroke-dasharray="10,1"
									fill="none"
									class="cursor-pointer hover:stroke-3"
								/>

								<path
									d={manyToMany.path2}
									stroke="#6b7280"
									stroke-width="2"
									stroke-dasharray="10,1"
									fill="none"
									class="cursor-pointer hover:stroke-3"
								/>

								{@const midX1 = (manyToMany.line1.start.x + manyToMany.line1.end.x) / 2}
								{@const midY1 = (manyToMany.line1.start.y + manyToMany.line1.end.y) / 2}
								<g transform="translate({midX1}, {midY1})">
									<rect
										x="-15"
										y="-8"
										width="30"
										height="16"
										rx="8"
										fill="white"
										stroke="#6b7280"
										stroke-width="1"
										opacity="0.95"
										class="dark:fill-gray-800"
									/>
									<text
										text-anchor="middle"
										dominant-baseline="middle"
										fill="#6b7280"
										font-size="10"
										font-weight="600"
										class="select-none dark:fill-gray-100"
									>
										N:M
									</text>
								</g>

								{@const midX2 = (manyToMany.line2.start.x + manyToMany.line2.end.x) / 2}
								{@const midY2 = (manyToMany.line2.start.y + manyToMany.line2.end.y) / 2}
								<g transform="translate({midX2}, {midY2})">
									<rect
										x="-15"
										y="-8"
										width="30"
										height="16"
										rx="8"
										fill="white"
										stroke="#6b7280"
										stroke-width="1"
										opacity="0.95"
										class="dark:fill-gray-800"
									/>
									<text
										text-anchor="middle"
										dominant-baseline="middle"
										fill="#6b7280"
										font-size="10"
										font-weight="600"
										class="select-none dark:fill-gray-100"
									>
										N:M
									</text>
								</g>
							{/if}
						{:else}
							{@const startPoint = getConnectionPoint(fromTable.name, toTable.name)}
							{@const endPoint = getConnectionPoint(toTable.name, fromTable.name)}
							{@const orthogonalPath = createOrthogonalPath(startPoint, endPoint)}

							<path
								d={orthogonalPath}
								stroke="#6b7280"
								stroke-width="2"
								stroke-dasharray="10,1"
								fill="none"
								class="cursor-pointer hover:stroke-3"
							/>

							{@const midX = startPoint.x + (endPoint.x - startPoint.x) * 0.5}
							{@const midY = startPoint.y + (endPoint.y - startPoint.y) * 0.5}
							<g transform="translate({midX}, {midY})">
								<rect
									x="-25"
									y="-10"
									width="50"
									height="20"
									rx="10"
									fill="white"
									stroke="#6b7280"
									stroke-width="1"
									opacity="0.9"
									class="dark:fill-gray-800"
								/>
								<text
									text-anchor="middle"
									dominant-baseline="middle"
									fill="#6b7280"
									font-size="12"
									font-weight="600"
									class="select-none dark:fill-gray-100"
								>
									{relationship.type === 'one-to-one' ? '1:1' : '1:N'}
								</text>
							</g>
						{/if}
					{/if}
				{/each}
			</g>
		</svg>
	{/key}
{/if}
