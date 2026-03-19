import { writable, get } from 'svelte/store';
import type { Event } from '$lib/types';

const mockEvents: Event[] = [
	{
		id: '1',
		title: 'Summer Rooftop Mixer',
		description: 'Join us for drinks and networking on the rooftop with stunning city views.',
		date: '2026-04-15',
		time: '18:00',
		location: 'Sky Lounge, Downtown',
		category: 'social',
		attendees: 42,
		createdAt: '2026-03-01T10:00:00Z'
	},
	{
		id: '2',
		title: 'Startup Pitch Night',
		description: 'Watch 10 startups pitch their ideas to a panel of investors and industry experts.',
		date: '2026-04-02',
		time: '19:00',
		location: 'Innovation Hub, 3rd Floor',
		category: 'business',
		attendees: 85,
		createdAt: '2026-03-05T14:30:00Z'
	},
	{
		id: '3',
		title: 'Weekend Soccer Tournament',
		description: '5-a-side tournament open to all skill levels. Prizes for top 3 teams!',
		date: '2026-04-20',
		time: '09:00',
		location: 'Central Park Fields',
		category: 'sports',
		attendees: 60,
		createdAt: '2026-03-10T08:00:00Z'
	},
	{
		id: '4',
		title: 'Jazz & Blues Night',
		description: 'Live performances from local jazz and blues artists. Food trucks on site.',
		date: '2026-03-28',
		time: '20:00',
		location: 'The Blue Note Cafe',
		category: 'music',
		attendees: 120,
		createdAt: '2026-03-12T16:00:00Z'
	},
	{
		id: '5',
		title: 'Community Volunteer Day',
		description: 'Help us clean up the riverfront and plant new trees in the community garden.',
		date: '2026-04-10',
		time: '08:00',
		location: 'Riverfront Park',
		category: 'other',
		attendees: 35,
		createdAt: '2026-03-15T09:00:00Z'
	}
];

export const events = writable<Event[]>(mockEvents);

let nextId = 6;

export function addEvent(event: Omit<Event, 'id' | 'createdAt' | 'attendees'>) {
	const newEvent: Event = {
		...event,
		id: String(nextId++),
		attendees: 0,
		createdAt: new Date().toISOString()
	};
	events.update((list) => [...list, newEvent]);
	return newEvent;
}

export function deleteEvent(id: string) {
	events.update((list) => list.filter((e) => e.id !== id));
}

export function getEventById(id: string): Event | undefined {
	return get(events).find((e) => e.id === id);
}
