export type EventCategory = 'social' | 'business' | 'sports' | 'music' | 'travel' | 'wedding' | 'other';

export type ItemStatus = 'todo' | 'voting' | 'finalized' | 'cancelled';

export interface ActivityItem {
	type: 'activity';
	id: string;
	title: string;
	date: string;
	startTime: string;
	endTime: string;
	location: string;
	notes: string;
	status: ItemStatus;
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
	status: ItemStatus;
	// Optional return flight
	returnAirline?: string;
	returnFlightNumber?: string;
	returnDate?: string;
	returnDepartureTime?: string;
	returnArrivalTime?: string;
	returnFrom?: string;
	returnTo?: string;
}

export interface HotelItem {
	type: 'hotel';
	id: string;
	name: string;
	checkInDate: string;
	checkOutDate: string;
	location: string;
	confirmationNumber: string;
	status: ItemStatus;
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
	status: ItemStatus;
}

export type ItineraryItem = ActivityItem | FlightItem | HotelItem | CarRentalItem;

export interface ChecklistState {
	id: string;
	label: string;
	color: string;
}

export interface ChecklistItem {
	id: string;
	label: string;
	checked: boolean;
	stateId?: string;
}

export type RSVPStatus = 'going' | 'maybe' | 'not-going' | 'pending';

export interface TribeGroup {
	id: string;
	name: string;
}

export interface TribeMember {
	id: string;
	firstName: string;
	lastName: string;
	email?: string;
	phone?: string;
	rsvp: RSVPStatus;
	tribeId?: string;
}

export interface Event {
	id: string;
	title: string;
	description: string;
	startDate: string;
	endDate: string;
	location: string;
	category: EventCategory;
	attendees: number;
	tribe: TribeMember[];
	tribeGroups: TribeGroup[];
	itinerary: ItineraryItem[];
	dayTitles?: Record<string, string>;
	checklist?: ChecklistItem[];
	checklistStates?: ChecklistState[];
	checklistMode?: 'simple' | 'states';
	createdAt: string;
}
