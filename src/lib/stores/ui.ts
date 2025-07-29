import { writable, type Writable } from 'svelte/store';
import { createPersistentToggle } from './persistent';

export const showSidebar: Writable<boolean> = writable(true);
export const isLoading: Writable<boolean> = writable(false);
export const initializeRelations: Writable<boolean> = writable(false);
export const hasMounted: Writable<boolean> = writable(false);
export const showBadgets = createPersistentToggle('showBadgets');
