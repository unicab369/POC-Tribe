import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Event, ItineraryItem, TribeMember } from '$lib/types';

const STORAGE_KEY = 'tribe-events';

const mockEvents: Event[] = [
	{
		id: '1',
		title: 'Pacific Coast Road Trip',
		description: 'Epic 5-day road trip from San Francisco to San Diego along the Pacific Coast Highway. Scenic drives, beach stops, and amazing food.',
		startDate: '2026-04-20',
		endDate: '2026-04-24',
		location: 'San Francisco to San Diego, CA',
		category: 'travel',
		attendees: 4,
		tribeGroups: [
			{ id: 'tg1', name: 'Road Trip Crew' },
			{ id: 'tg2', name: 'Photographers' }
		],
		tribe: [
			{ id: 't1', firstName: 'Alex', lastName: 'Chen', email: 'alex@email.com', rsvp: 'going', tribeId: 'tg1' },
			{ id: 't2', firstName: 'Jordan', lastName: 'Lee', phone: '555-0102', rsvp: 'going', tribeId: 'tg1' },
			{ id: 't3', firstName: 'Sam', lastName: 'Rivera', email: 'sam@email.com', phone: '555-0103', rsvp: 'going', tribeId: 'tg2' },
			{ id: 't4', firstName: 'Taylor', lastName: 'Kim', rsvp: 'maybe' }
		],
		itinerary: [
			{
				type: 'flight',
				id: 'f3',
				airline: 'Alaska',
				flightNumber: 'AS 1023',
				date: '2026-04-20',
				departureTime: '06:00',
				arrivalTime: '08:30',
				from: 'SEA',
				to: 'SFO',
				status: 'finalized'
			},
			{
				type: 'car-rental',
				id: 'cr1',
				pickupDate: '2026-04-20',
				pickupTime: '09:00',
				returnDate: '2026-04-24',
				returnTime: '17:00',
				pickupLocation: 'SFO Airport',
				returnLocation: 'SAN Airport',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a1',
				title: 'Golden Gate Bridge Walk',
				date: '2026-04-20',
				startTime: '10:30',
				endTime: '12:00',
				location: 'Golden Gate Bridge, San Francisco',
				notes: 'Start the trip with iconic views',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a2',
				title: 'Drive to Monterey',
				date: '2026-04-20',
				startTime: '13:00',
				endTime: '16:00',
				location: 'Highway 1',
				notes: 'Stop at Half Moon Bay for lunch',
				status: 'finalized'
			},
			{
				type: 'hotel',
				id: 'h1',
				name: 'Monterey Bay Inn',
				checkInDate: '2026-04-20',
				checkOutDate: '2026-04-21',
				location: 'Monterey, CA',
				confirmationNumber: 'MBI-44821',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a3',
				title: 'Monterey Bay Aquarium',
				date: '2026-04-21',
				startTime: '09:00',
				endTime: '12:00',
				location: 'Monterey Bay Aquarium',
				notes: 'Tickets pre-booked',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a4',
				title: '17-Mile Drive',
				date: '2026-04-21',
				startTime: '13:00',
				endTime: '15:30',
				location: 'Pebble Beach, CA',
				notes: 'Scenic drive through Pebble Beach',
				status: 'voting'
			},
			{
				type: 'hotel',
				id: 'h2',
				name: 'Big Sur River Inn',
				checkInDate: '2026-04-21',
				checkOutDate: '2026-04-22',
				location: 'Big Sur, CA',
				confirmationNumber: 'BSRI-7723',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a5',
				title: 'Pfeiffer Beach & McWay Falls',
				date: '2026-04-22',
				startTime: '08:00',
				endTime: '12:00',
				location: 'Big Sur, CA',
				notes: 'Morning hike and beach visit',
				status: 'todo'
			},
			{
				type: 'activity',
				id: 'a6',
				title: 'Drive to Santa Barbara',
				date: '2026-04-22',
				startTime: '13:00',
				endTime: '17:00',
				location: 'Highway 101',
				notes: '',
				status: 'finalized'
			},
			{
				type: 'hotel',
				id: 'h3',
				name: 'Santa Barbara Inn',
				checkInDate: '2026-04-22',
				checkOutDate: '2026-04-23',
				location: 'Santa Barbara, CA',
				confirmationNumber: 'SBI-9912',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a7',
				title: 'Stearns Wharf & Wine Tasting',
				date: '2026-04-23',
				startTime: '10:00',
				endTime: '14:00',
				location: 'Santa Barbara, CA',
				notes: 'Visit local wineries in the Funk Zone',
				status: 'voting'
			},
			{
				type: 'activity',
				id: 'a8',
				title: 'Drive to San Diego',
				date: '2026-04-23',
				startTime: '15:00',
				endTime: '19:00',
				location: 'Highway 101',
				notes: '',
				status: 'finalized'
			},
			{
				type: 'hotel',
				id: 'h4',
				name: 'Hotel del Coronado',
				checkInDate: '2026-04-23',
				checkOutDate: '2026-04-24',
				location: 'San Diego, CA',
				confirmationNumber: 'HDC-5561',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a9',
				title: 'Coronado Beach Morning',
				date: '2026-04-24',
				startTime: '08:00',
				endTime: '10:00',
				location: 'Coronado Beach, San Diego',
				notes: 'Last morning at the beach before heading to airport',
				status: 'todo'
			},
			{
				type: 'flight',
				id: 'f4',
				airline: 'Alaska',
				flightNumber: 'AS 1078',
				date: '2026-04-24',
				departureTime: '13:00',
				arrivalTime: '15:30',
				from: 'SAN',
				to: 'SEA',
				status: 'finalized'
			}
		],
		createdAt: '2026-03-01T10:00:00Z'
	},
	{
		id: '2',
		title: 'Sarah & James Wedding Weekend',
		description: 'Join us for a beautiful weekend celebrating Sarah and James. Events include a welcome dinner, the ceremony, reception, and farewell brunch.',
		startDate: '2026-05-08',
		endDate: '2026-05-10',
		location: 'Napa Valley, CA',
		category: 'wedding',
		attendees: 150,
		tribeGroups: [
			{ id: 'tg3', name: 'Wedding Party' },
			{ id: 'tg4', name: 'Family' },
			{ id: 'tg5', name: 'College Friends' }
		],
		tribe: [
			{ id: 't5', firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah@email.com', rsvp: 'going', tribeId: 'tg3' },
			{ id: 't6', firstName: 'James', lastName: 'Park', email: 'james@email.com', rsvp: 'going', tribeId: 'tg3' },
			{ id: 't7', firstName: 'Emma', lastName: 'Wilson', phone: '555-0201', rsvp: 'going', tribeId: 'tg4' },
			{ id: 't8', firstName: 'Chris', lastName: 'Nguyen', rsvp: 'going', tribeId: 'tg5' },
			{ id: 't9', firstName: 'Mia', lastName: 'Johnson', email: 'mia@email.com', rsvp: 'maybe', tribeId: 'tg5' },
			{ id: 't10', firstName: 'David', lastName: 'Brown', rsvp: 'pending' },
			{ id: 't11', firstName: 'Olivia', lastName: 'Garcia', phone: '555-0204', rsvp: 'not-going' }
		],
		itinerary: [
			{
				type: 'flight',
				id: 'f1',
				airline: 'United',
				flightNumber: 'UA 482',
				date: '2026-05-08',
				departureTime: '08:30',
				arrivalTime: '11:00',
				from: 'JFK',
				to: 'SFO',
				status: 'finalized'
			},
			{
				type: 'car-rental',
				id: 'cr2',
				pickupDate: '2026-05-08',
				pickupTime: '11:30',
				returnDate: '2026-05-10',
				returnTime: '14:00',
				pickupLocation: 'SFO Airport',
				returnLocation: 'SFO Airport',
				status: 'finalized'
			},
			{
				type: 'hotel',
				id: 'h5',
				name: 'Napa Valley Lodge',
				checkInDate: '2026-05-08',
				checkOutDate: '2026-05-10',
				location: 'Yountville, Napa Valley',
				confirmationNumber: 'NVL-33021',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a10',
				title: 'Welcome Dinner',
				date: '2026-05-08',
				startTime: '18:00',
				endTime: '21:00',
				location: 'The French Laundry Garden',
				notes: 'Cocktail attire. Welcome drinks at 6, dinner at 7.',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a11',
				title: 'Wedding Ceremony',
				date: '2026-05-09',
				startTime: '16:00',
				endTime: '17:00',
				location: 'Domaine Chandon Vineyard',
				notes: 'Formal attire. Outdoor ceremony — bring sunglasses.',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a12',
				title: 'Wedding Reception',
				date: '2026-05-09',
				startTime: '17:30',
				endTime: '23:00',
				location: 'Domaine Chandon Vineyard',
				notes: 'Dinner, dancing, and celebrations!',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a13',
				title: 'Farewell Brunch',
				date: '2026-05-10',
				startTime: '10:00',
				endTime: '12:00',
				location: 'Napa Valley Lodge Patio',
				notes: 'Casual. Say goodbyes before departing.',
				status: 'todo'
			},
			{
				type: 'flight',
				id: 'f2',
				airline: 'United',
				flightNumber: 'UA 891',
				date: '2026-05-10',
				departureTime: '17:00',
				arrivalTime: '01:15',
				from: 'SFO',
				to: 'JFK',
				status: 'finalized'
			}
		],
		createdAt: '2026-03-05T14:30:00Z'
	},
	{
		id: '3',
		title: 'Startup Pitch Night',
		description: 'Watch 10 startups pitch their ideas to a panel of investors and industry experts.',
		startDate: '2026-04-02',
		endDate: '2026-04-02',
		location: 'Innovation Hub, 3rd Floor',
		category: 'business',
		attendees: 85,
		tribeGroups: [],
		tribe: [
			{ id: 't12', firstName: 'Ryan', lastName: 'Torres', email: 'ryan@email.com', rsvp: 'going' },
			{ id: 't13', firstName: 'Lisa', lastName: 'Chang', rsvp: 'going' },
			{ id: 't14', firstName: 'Mark', lastName: 'Stevens', phone: '555-0301', rsvp: 'pending' }
		],
		itinerary: [
			{
				type: 'activity',
				id: 'a14',
				title: 'Pitch Presentations',
				date: '2026-04-02',
				startTime: '19:00',
				endTime: '21:00',
				location: 'Innovation Hub, 3rd Floor',
				notes: '10 startups, 5 minutes each, followed by Q&A',
				status: 'finalized'
			},
			{
				type: 'activity',
				id: 'a15',
				title: 'Networking & Drinks',
				date: '2026-04-02',
				startTime: '21:00',
				endTime: '22:30',
				location: 'Innovation Hub Rooftop',
				notes: 'Open bar and appetizers',
				status: 'finalized'
			}
		],
		createdAt: '2026-03-05T14:30:00Z'
	},
	{
		id: '4',
		title: 'Jazz & Blues Night',
		description: 'Live performances from local jazz and blues artists. Food trucks on site.',
		startDate: '2026-03-28',
		endDate: '2026-03-28',
		location: 'The Blue Note Cafe',
		category: 'music',
		attendees: 120,
		tribeGroups: [],
		tribe: [
			{ id: 't15', firstName: 'Nina', lastName: 'Patel', email: 'nina@email.com', phone: '555-0401', rsvp: 'going' },
			{ id: 't16', firstName: 'Jake', lastName: 'Morrison', rsvp: 'going' },
			{ id: 't17', firstName: 'Aisha', lastName: 'Rahman', rsvp: 'maybe' },
			{ id: 't18', firstName: 'Leo', lastName: 'Fernandez', rsvp: 'not-going' }
		],
		itinerary: [
			{
				type: 'activity',
				id: 'a16',
				title: 'Live Jazz Performances',
				date: '2026-03-28',
				startTime: '20:00',
				endTime: '23:00',
				location: 'The Blue Note Cafe',
				notes: 'Three sets with local artists',
				status: 'finalized'
			}
		],
		createdAt: '2026-03-12T16:00:00Z'
	}
];

function loadEvents(): Event[] {
	if (!browser) return mockEvents;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed: Event[] = JSON.parse(stored);
			return parsed.map((e) => ({
				...e,
				tribeGroups: (e as any).tribeGroups ?? [],
				checklist: (e as any).checklist ?? undefined,
				tribe: (e.tribe ?? []).map((m: any) => ({
					...m,
					firstName: m.firstName ?? (m.name ? m.name.split(' ')[0] : ''),
					lastName: m.lastName ?? (m.name ? m.name.split(' ').slice(1).join(' ') : '')
				}))
			}));
		}
	} catch {
		// ignore parse errors
	}
	return mockEvents;
}

function saveEvents(eventList: Event[]) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(eventList));
	} catch {
		// ignore storage errors
	}
}

export const events = writable<Event[]>(loadEvents());

// Persist on every change
events.subscribe((value) => {
	saveEvents(value);
});

let nextId = browser
	? Math.max(...loadEvents().map((e) => parseInt(e.id) || 0), 0) + 1
	: 5;

export function addEvent(event: Omit<Event, 'id' | 'createdAt' | 'attendees' | 'tribe' | 'tribeGroups'>) {
	const newEvent: Event = {
		...event,
		id: String(nextId++),
		attendees: 0,
		tribe: [],
		tribeGroups: [],
		createdAt: new Date().toISOString()
	};
	events.update((list) => [...list, newEvent]);
	return newEvent;
}

export function deleteEvent(id: string) {
	events.update((list) => list.filter((e) => e.id !== id));
}

export function addItineraryItem(eventId: string, item: ItineraryItem) {
	events.update((list) =>
		list.map((e) => {
			if (e.id !== eventId) return e;
			return { ...e, itinerary: [...e.itinerary, item] };
		})
	);
}

export function updateItineraryItem(eventId: string, updatedItem: ItineraryItem) {
	events.update((list) =>
		list.map((e) => {
			if (e.id !== eventId) return e;
			return {
				...e,
				itinerary: e.itinerary.map((item) => (item.id === updatedItem.id ? updatedItem : item))
			};
		})
	);
}

export function updateEvent(id: string, updates: Partial<Omit<Event, 'id' | 'createdAt'>>) {
	events.update((list) => list.map((e) => (e.id === id ? { ...e, ...updates } : e)));
}

export function addTribeMember(eventId: string, member: Omit<TribeMember, 'id'>) {
	events.update((list) =>
		list.map((e) => {
			if (e.id !== eventId) return e;
			return {
				...e,
				tribe: [...e.tribe, { ...member, id: Math.random().toString(36).substring(2, 10) }]
			};
		})
	);
}

export function addTribeGroup(eventId: string, name: string) {
	const id = Math.random().toString(36).substring(2, 10);
	events.update((list) =>
		list.map((e) => {
			if (e.id !== eventId) return e;
			return { ...e, tribeGroups: [...e.tribeGroups, { id, name }] };
		})
	);
}

export function renameTribeGroup(eventId: string, groupId: string, name: string) {
	events.update((list) =>
		list.map((e) => {
			if (e.id !== eventId) return e;
			return { ...e, tribeGroups: e.tribeGroups.map((g) => (g.id === groupId ? { ...g, name } : g)) };
		})
	);
}

export function deleteTribeGroup(eventId: string, groupId: string) {
	events.update((list) =>
		list.map((e) => {
			if (e.id !== eventId) return e;
			return {
				...e,
				tribeGroups: e.tribeGroups.filter((g) => g.id !== groupId),
				tribe: e.tribe.map((m) => (m.tribeId === groupId ? { ...m, tribeId: undefined } : m))
			};
		})
	);
}

export function assignMemberToTribe(eventId: string, memberId: string, tribeId: string | undefined) {
	events.update((list) =>
		list.map((e) => {
			if (e.id !== eventId) return e;
			return {
				...e,
				tribe: e.tribe.map((m) => (m.id === memberId ? { ...m, tribeId } : m))
			};
		})
	);
}

export function updateTribeMember(eventId: string, memberId: string, updates: Partial<Omit<TribeMember, 'id'>>) {
	events.update((list) =>
		list.map((e) => {
			if (e.id !== eventId) return e;
			return {
				...e,
				tribe: e.tribe.map((m) => (m.id === memberId ? { ...m, ...updates } : m))
			};
		})
	);
}

export function deleteTribeMember(eventId: string, memberId: string) {
	events.update((list) =>
		list.map((e) => {
			if (e.id !== eventId) return e;
			return { ...e, tribe: e.tribe.filter((m) => m.id !== memberId) };
		})
	);
}

export function getEventById(id: string): Event | undefined {
	return get(events).find((e) => e.id === id);
}
