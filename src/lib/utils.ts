import type { ItineraryItem } from './types';

export function formatDate(dateStr: string): string {
	return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});
}

export function formatTime(time: string): string {
	const [h, m] = time.split(':');
	const hour = parseInt(h);
	const ampm = hour >= 12 ? 'PM' : 'AM';
	const displayHour = hour % 12 || 12;
	return `${displayHour}:${m} ${ampm}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
	const start = new Date(startDate + 'T00:00:00');
	const end = new Date(endDate + 'T00:00:00');
	const startOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
	const endOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };

	if (startDate === endDate) {
		return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	}

	if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
		return `${start.toLocaleDateString('en-US', startOpts)} – ${end.toLocaleDateString('en-US', endOpts)}`;
	}

	return `${start.toLocaleDateString('en-US', startOpts)} – ${end.toLocaleDateString('en-US', endOpts)}`;
}

export function getDayCount(startDate: string, endDate: string): number {
	const start = new Date(startDate + 'T00:00:00');
	const end = new Date(endDate + 'T00:00:00');
	return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function generateId(): string {
	return Math.random().toString(36).substring(2, 10);
}

export function getDateRange(startDate: string, endDate: string): string[] {
	const dates: string[] = [];
	const current = new Date(startDate + 'T00:00:00');
	const end = new Date(endDate + 'T00:00:00');

	while (current <= end) {
		dates.push(current.toISOString().split('T')[0]);
		current.setDate(current.getDate() + 1);
	}

	return dates;
}

function getItemDate(item: ItineraryItem): string {
	switch (item.type) {
		case 'activity':
		case 'flight':
			return item.date;
		case 'hotel':
			return item.checkInDate;
		case 'car-rental':
			return item.pickupDate;
	}
}

function getItemTime(item: ItineraryItem): string {
	switch (item.type) {
		case 'activity':
			return item.startTime;
		case 'flight':
			return item.departureTime;
		case 'hotel':
			return '15:00';
		case 'car-rental':
			return item.pickupTime;
	}
}

export type FlightLeg = 'outbound' | 'return';
export type CarRentalLeg = 'pickup' | 'dropoff';

export interface DisplayItem {
	item: ItineraryItem;
	flightLeg?: FlightLeg;
	carRentalLeg?: CarRentalLeg;
}

function getDisplayItemTime(entry: DisplayItem): string {
	if (entry.item.type === 'flight' && entry.flightLeg === 'return') {
		return entry.item.returnDepartureTime || '08:00';
	}
	if (entry.item.type === 'car-rental' && entry.carRentalLeg === 'dropoff') {
		return entry.item.returnTime;
	}
	return getItemTime(entry.item);
}

export function getItemsForDate(items: ItineraryItem[], date: string): DisplayItem[] {
	const entries: DisplayItem[] = [];

	for (const item of items) {
		switch (item.type) {
			case 'activity':
				if (item.date === date) entries.push({ item });
				break;
			case 'flight':
				if (item.date === date) entries.push({ item, flightLeg: 'outbound' });
				if (item.returnDate && item.returnDate === date) entries.push({ item, flightLeg: 'return' });
				break;
			case 'hotel':
				if (item.checkInDate === date || item.checkOutDate === date) entries.push({ item });
				break;
			case 'car-rental':
				if (item.pickupDate === date) entries.push({ item, carRentalLeg: 'pickup' });
				if (item.returnDate === date) entries.push({ item, carRentalLeg: 'dropoff' });
				break;
		}
	}

	return entries.sort((a, b) => getDisplayItemTime(a).localeCompare(getDisplayItemTime(b)));
}
