import { writable, type Writable } from 'svelte/store';
import { SQLDialect, type DatabaseSchema, type CanvasState } from '$lib/types';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { SQL_EXAMPLES } from '$lib/constants';

export const selectedDialect: Writable<SQLDialect> = writable(SQLDialect.MYSQL);
export const schema: Writable<DatabaseSchema> = writable({ tables: [], relationships: [] });
export const canvasState: Writable<CanvasState> = writable({
  zoom: 1,
  panX: 0,
  panY: 0,
  selectedTable: undefined,
  draggedTable: undefined
});

function createSqlInputStore(): Writable<string> {
  let currentDialect = get(selectedDialect);

  const getKey = (dialect: SQLDialect): string => `sqlInput:${dialect.toLowerCase()}`;

  const storedInitialValue = browser ? localStorage.getItem(getKey(currentDialect)) : null;
  const initialValue = browser
    ? storedInitialValue !== null
      ? storedInitialValue
      : SQL_EXAMPLES[currentDialect]
    : SQL_EXAMPLES[currentDialect];

  const store = writable<string>(initialValue);

  selectedDialect.subscribe((newDialect) => {
    if (!browser) return;
    currentDialect = newDialect;
    const storedValue = localStorage.getItem(getKey(newDialect));
    const newValue = storedValue !== null ? storedValue : SQL_EXAMPLES[newDialect];
    store.set(newValue);
  });

  store.subscribe((value) => {
    if (!browser) return;
    localStorage.setItem(getKey(currentDialect), value.trim());
  });

  return store;
}

export const sqlInput = createSqlInputStore();
