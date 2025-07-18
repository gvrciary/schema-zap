import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export function createPersistentToggle(key: string, defaultValue = false) {
	const initialValue = browser
		? localStorage.getItem(key) === 'true'
		: defaultValue;

	const { subscribe, set, update } = writable(initialValue);

	function persist(value: boolean) {
		if (browser) localStorage.setItem(key, value.toString());
		set(value);
	}

	return {
		subscribe,
		set: persist,
		toggle: () =>
			update(current => {
				const next = !current;
				if (browser) localStorage.setItem(key, next.toString());
				return next;
			})
	};
}
