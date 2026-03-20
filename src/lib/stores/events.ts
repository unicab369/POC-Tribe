import { writable, get } from 'svelte/store';
import type { Event, ItineraryItem } from '$lib/types';

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
		itinerary: [
			{
				type: 'car-rental',
				id: 'cr1',
				pickupDate: '2026-04-20',
				pickupTime: '09:00',
				returnDate: '2026-04-24',
				returnTime: '17:00',
				pickupLocation: 'SFO Airport',
				returnLocation: 'SAN Airport'
			},
			{
				type: 'activity',
				id: 'a1',
				title: 'Golden Gate Bridge Walk',
				date: '2026-04-20',
				startTime: '10:30',
				endTime: '12:00',
				location: 'Golden Gate Bridge, San Francisco',
				notes: 'Start the trip with iconic views'
			},
			{
				type: 'activity',
				id: 'a2',
				title: 'Drive to Monterey',
				date: '2026-04-20',
				startTime: '13:00',
				endTime: '16:00',
				location: 'Highway 1',
				notes: 'Stop at Half Moon Bay for lunch'
			},
			{
				type: 'hotel',
				id: 'h1',
				name: 'Monterey Bay Inn',
				checkInDate: '2026-04-20',
				checkOutDate: '2026-04-21',
				location: 'Monterey, CA',
				confirmationNumber: 'MBI-44821'
			},
			{
				type: 'activity',
				id: 'a3',
				title: 'Monterey Bay Aquarium',
				date: '2026-04-21',
				startTime: '09:00',
				endTime: '12:00',
				location: 'Monterey Bay Aquarium',
				notes: 'Tickets pre-booked'
			},
			{
				type: 'activity',
				id: 'a4',
				title: '17-Mile Drive',
				date: '2026-04-21',
				startTime: '13:00',
				endTime: '15:30',
				location: 'Pebble Beach, CA',
				notes: 'Scenic drive through Pebble Beach'
			},
			{
				type: 'hotel',
				id: 'h2',
				name: 'Big Sur River Inn',
				checkInDate: '2026-04-21',
				checkOutDate: '2026-04-22',
				location: 'Big Sur, CA',
				confirmationNumber: 'BSRI-7723'
			},
			{
				type: 'activity',
				id: 'a5',
				title: 'Pfeiffer Beach & McWay Falls',
				date: '2026-04-22',
				startTime: '08:00',
				endTime: '12:00',
				location: 'Big Sur, CA',
				notes: 'Morning hike and beach visit'
			},
			{
				type: 'activity',
				id: 'a6',
				title: 'Drive to Santa Barbara',
				date: '2026-04-22',
				startTime: '13:00',
				endTime: '17:00',
				location: 'Highway 101',
				notes: ''
			},
			{
				type: 'hotel',
				id: 'h3',
				name: 'Santa Barbara Inn',
				checkInDate: '2026-04-22',
				checkOutDate: '2026-04-23',
				location: 'Santa Barbara, CA',
				confirmationNumber: 'SBI-9912'
			},
			{
				type: 'activity',
				id: 'a7',
				title: 'Stearns Wharf & Wine Tasting',
				date: '2026-04-23',
				startTime: '10:00',
				endTime: '14:00',
				location: 'Santa Barbara, CA',
				notes: 'Visit local wineries in the Funk Zone'
			},
			{
				type: 'activity',
				id: 'a8',
				title: 'Drive to San Diego',
				date: '2026-04-23',
				startTime: '15:00',
				endTime: '19:00',
				location: 'Highway 101',
				notes: ''
			},
			{
				type: 'hotel',
				id: 'h4',
				name: 'Hotel del Coronado',
				checkInDate: '2026-04-23',
				checkOutDate: '2026-04-24',
				location: 'San Diego, CA',
				confirmationNumber: 'HDC-5561'
			},
			{
				type: 'activity',
				id: 'a9',
				title: 'Coronado Beach Morning',
				date: '2026-04-24',
				startTime: '08:00',
				endTime: '10:00',
				location: 'Coronado Beach, San Diego',
				notes: 'Last morning at the beach before heading to airport'
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
				to: 'SFO'
			},
			{
				type: 'car-rental',
				id: 'cr2',
				pickupDate: '2026-05-08',
				pickupTime: '11:30',
				returnDate: '2026-05-10',
				returnTime: '14:00',
				pickupLocation: 'SFO Airport',
				returnLocation: 'SFO Airport'
			},
			{
				type: 'hotel',
				id: 'h5',
				name: 'Napa Valley Lodge',
				checkInDate: '2026-05-08',
				checkOutDate: '2026-05-10',
				location: 'Yountville, Napa Valley',
				confirmationNumber: 'NVL-33021'
			},
			{
				type: 'activity',
				id: 'a10',
				title: 'Welcome Dinner',
				date: '2026-05-08',
				startTime: '18:00',
				endTime: '21:00',
				location: 'The French Laundry Garden',
				notes: 'Cocktail attire. Welcome drinks at 6, dinner at 7.'
			},
			{
				type: 'activity',
				id: 'a11',
				title: 'Wedding Ceremony',
				date: '2026-05-09',
				startTime: '16:00',
				endTime: '17:00',
				location: 'Domaine Chandon Vineyard',
				notes: 'Formal attire. Outdoor ceremony — bring sunglasses.'
			},
			{
				type: 'activity',
				id: 'a12',
				title: 'Wedding Reception',
				date: '2026-05-09',
				startTime: '17:30',
				endTime: '23:00',
				location: 'Domaine Chandon Vineyard',
				notes: 'Dinner, dancing, and celebrations!'
			},
			{
				type: 'activity',
				id: 'a13',
				title: 'Farewell Brunch',
				date: '2026-05-10',
				startTime: '10:00',
				endTime: '12:00',
				location: 'Napa Valley Lodge Patio',
				notes: 'Casual. Say goodbyes before departing.'
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
				to: 'JFK'
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
		itinerary: [
			{
				type: 'activity',
				id: 'a14',
				title: 'Pitch Presentations',
				date: '2026-04-02',
				startTime: '19:00',
				endTime: '21:00',
				location: 'Innovation Hub, 3rd Floor',
				notes: '10 startups, 5 minutes each, followed by Q&A'
			},
			{
				type: 'activity',
				id: 'a15',
				title: 'Networking & Drinks',
				date: '2026-04-02',
				startTime: '21:00',
				endTime: '22:30',
				location: 'Innovation Hub Rooftop',
				notes: 'Open bar and appetizers'
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
		itinerary: [
			{
				type: 'activity',
				id: 'a16',
				title: 'Live Jazz Performances',
				date: '2026-03-28',
				startTime: '20:00',
				endTime: '23:00',
				location: 'The Blue Note Cafe',
				notes: 'Three sets with local artists'
			}
		],
		createdAt: '2026-03-12T16:00:00Z'
	}
];

export const events = writable<Event[]>(mockEvents);

let nextId = 5;

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

export function getEventById(id: string): Event | undefined {
	return get(events).find((e) => e.id === id);
}
