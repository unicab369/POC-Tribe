export type EventCategory = 'social' | 'business' | 'sports' | 'music' | 'travel' | 'wedding' | 'other';

export interface ActivityItem {
	type: 'activity';
	id: string;
	title: string;
	date: string;
	startTime: string;
	endTime: string;
	location: string;
	notes: string;
}

export interface FlightItem {
	type: 'flight';
	id: string;
	airline: string;
	flightNumber: string;
	date: string;
	departureTime: string;
	arrivalTime: string;
	from: string;
	to: string;
}

export interface HotelItem {
	type: 'hotel';
	id: string;
	name: string;
	checkInDate: string;
	checkOutDate: string;
	location: string;
	confirmationNumber: string;
}

export interface CarRentalItem {
	type: 'car-rental';
	id: string;
	pickupDate: string;
	pickupTime: string;
	returnDate: string;
	returnTime: string;
	pickupLocation: string;
	returnLocation: string;
}

export type ItineraryItem = ActivityItem | FlightItem | HotelItem | CarRentalItem;

export interface Event {
	id: string;
	title: string;
	description: string;
	startDate: string;
	endDate: string;
	location: string;
	category: EventCategory;
	attendees: number;
	itinerary: ItineraryItem[];
	createdAt: string;
}
