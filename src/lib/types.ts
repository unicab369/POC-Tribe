export interface Event {
	id: string;
	title: string;
	description: string;
	date: string;
	time: string;
	location: string;
	category: 'social' | 'business' | 'sports' | 'music' | 'other';
	attendees: number;
	createdAt: string;
}
