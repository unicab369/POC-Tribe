<script lang="ts">
	import { page } from '$app/state';
	import { events, updateItineraryItem } from '$lib/stores/events';
	import ItineraryItemCard from '$lib/components/ItineraryItemCard.svelte';
	import { formatDateRange, getDayCount, getDateRange, getItemsForDate, formatDate } from '$lib/utils';
	import type { Event, ItineraryItem } from '$lib/types';

	let event = $derived($events.find((e) => e.id === page.params.id));
	let dayCount = $derived(event ? getDayCount(event.startDate, event.endDate) : 0);
	let dates = $derived(event ? getDateRange(event.startDate, event.endDate) : []);

	function handleItemSave(updated: ItineraryItem) {
		if (event) {
			updateItineraryItem(event.id, updated);
		}
	}

	const categoryColors: Record<Event['category'], string> = {
		social: '#8b5cf6',
		business: '#3b82f6',
		sports: '#22c55e',
		music: '#f59e0b',
		travel: '#06b6d4',
		wedding: '#ec4899',
		other: '#64748b'
	};
</script>

<div class="container">
	{#if event}
		<div class="page-top">
			<a href="/events" class="back-link">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6" />
				</svg>
			</a>
			<h1 class="page-title">{event.title}</h1>
		</div>

		<header class="event-header">
			<div class="header-top">
				<span class="category-badge" style="background-color: {categoryColors[event.category]}">
					{event.category}
				</span>
				{#if dayCount > 1}
					<span class="day-badge">{dayCount} days</span>
				{/if}
			</div>
			<div class="event-meta">
				<div class="meta-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
						<line x1="16" y1="2" x2="16" y2="6" />
						<line x1="8" y1="2" x2="8" y2="6" />
						<line x1="3" y1="10" x2="21" y2="10" />
					</svg>
					<span>{formatDateRange(event.startDate, event.endDate)}</span>
				</div>
				<div class="meta-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
						<circle cx="12" cy="10" r="3" />
					</svg>
					<span>{event.location}</span>
				</div>
				<div class="meta-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
						<path d="M16 3.13a4 4 0 0 1 0 7.75" />
					</svg>
					<span>{event.attendees} attendees</span>
				</div>
			</div>
			<p class="event-description">{event.description}</p>
		</header>

		{#if event.itinerary.length > 0}
			<section class="itinerary-section">
				<h2>Agenda</h2>
				{#each dates as date, i}
					{@const dayItems = getItemsForDate(event.itinerary, date)}
					{#if dayItems.length > 0}
						<div class="day-section">
							<div class="day-header">
								<span class="day-label">Day {i + 1}</span>
								<span class="day-date">{formatDate(date)}</span>
							</div>
							<div class="day-items">
								{#each dayItems as item (item.id)}
									<ItineraryItemCard {item} onsave={handleItemSave} />
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</section>
		{/if}
	{:else}
		<div class="not-found">
			<h1>Event Not Found</h1>
			<p>The event you're looking for doesn't exist.</p>
			<a href="/events" class="back-btn">Back to Events</a>
		</div>
	{/if}
</div>

<style>
	.page-top {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) 0;
		margin-left: calc(-1 * var(--space-md));
		margin-right: calc(-1 * var(--space-md));
		padding-left: var(--space-md);
		padding-right: var(--space-md);
		margin-bottom: var(--space-md);
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border);
	}

	.back-link {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text);
		text-decoration: none;
	}

	.back-link svg {
		width: 22px;
		height: 22px;
	}

	.page-title {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--color-text);
	}

	.event-header {
		margin-bottom: var(--space-md);
	}

	.header-top {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.category-badge {
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
		padding: 2px 10px;
		border-radius: var(--radius-full);
		text-transform: capitalize;
	}

	.day-badge {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary);
		background: rgba(129, 140, 248, 0.15);
		padding: 2px 10px;
		border-radius: var(--radius-full);
	}

	.event-header h1 {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--space-md);
	}

	.event-meta {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--color-text-secondary);
		font-size: var(--font-sm);
	}

	.meta-item svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	.event-description {
		color: var(--color-text-secondary);
		font-size: var(--font-base);
		line-height: 1.6;
	}

	.itinerary-section h2 {
		font-size: var(--font-xl);
		font-weight: 600;
		margin-bottom: var(--space-md);
		text-align: center;
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.day-section {
		margin-bottom: var(--space-lg);
	}

	.day-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-sm);
	}

	.day-label {
		font-size: var(--font-base);
		font-weight: 700;
		color: var(--color-primary);
	}

	.day-date {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
	}

	.day-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	.not-found {
		text-align: center;
		padding: var(--space-xl) 0;
	}

	.not-found h1 {
		font-size: var(--font-2xl);
		font-weight: 700;
		margin-bottom: var(--space-sm);
	}

	.not-found p {
		color: var(--color-text-secondary);
		margin-bottom: var(--space-lg);
	}

	.back-btn {
		display: inline-block;
		padding: 10px 24px;
		background: var(--color-primary);
		color: white;
		border-radius: var(--radius-md);
		font-weight: 600;
		text-decoration: none;
	}
</style>
