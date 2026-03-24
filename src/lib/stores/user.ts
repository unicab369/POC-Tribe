import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '$lib/types';
import { reloadEvents } from '$lib/stores/events';

const STORAGE_KEY = 'tribe-current-user';

export const USERS: User[] = [
	{ id: 'alex', name: 'Alex Johnson', email: 'alex@example.com' },
	{ id: 'maya', name: 'Maya Patel', email: 'maya@example.com' },
	{ id: 'jordan', name: 'Jordan Lee', email: 'jordan@example.com' }
];

function loadCurrentUser(): User | null {
	if (!browser) return null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch {}
	return null;
}

export const currentUser = writable<User | null>(loadCurrentUser());

export function signIn(userId: string) {
	const user = USERS.find((u) => u.id === userId) ?? null;
	if (!user) return;
	currentUser.set(user);
	if (browser) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
		} catch {}
	}
	reloadEvents();
}

export function signOut() {
	currentUser.set(null);
	if (browser) {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {}
	}
	reloadEvents();
}
