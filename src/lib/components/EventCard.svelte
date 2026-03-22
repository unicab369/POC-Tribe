<script lang="ts">
	import type { Event } from '$lib/types';
	import { formatDateRange, getDayCount } from '$lib/utils';

	let { event }: { event: Event } = $props();

	const categoryColors: Record<Event['category'], string> = {
		social: '#8b5cf6',
		business: '#3b82f6',
		sports: '#22c55e',
		music: '#f59e0b',
		travel: '#06b6d4',
		wedding: '#ec4899',
		other: '#64748b'
	};

	let dayCount = $derived(getDayCount(event.startDate, event.endDate));
	let isMultiDay = $derived(dayCount > 1);
</script>

<a href="/events/{event.id}" class="event-card-link">
	<div class="event-card">
		<h3 class="card-title">{event.title}</h3>
		<div class="card-header">
			<span class="category-badge" style="background-color: {categoryColors[event.category]}">
				{event.category}
			</span>
			<span class="header-date">{formatDateRange(event.startDate, event.endDate)}{#if isMultiDay} &middot; {dayCount} days{/if}</span>
		</div>
		<div class="card-details">
			<div class="detail">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
					<circle cx="12" cy="10" r="3" />
				</svg>
				<span>{event.location}</span>
			</div>
			<div class="detail">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
				<span>{event.tribe.length} tribe</span>
			</div>
			{#if event.itinerary.length > 0}
				<div class="detail">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="8" y1="6" x2="21" y2="6" />
						<line x1="8" y1="12" x2="21" y2="12" />
						<line x1="8" y1="18" x2="21" y2="18" />
						<line x1="3" y1="6" x2="3.01" y2="6" />
						<line x1="3" y1="12" x2="3.01" y2="12" />
						<line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
					<span>{event.itinerary.length} agenda item{event.itinerary.length === 1 ? '' : 's'}</span>
				</div>
			{/if}
		</div>
	</div>
</a>

<style>
	.event-card-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.event-card {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		transition: box-shadow 0.2s;
	}

	.event-card:hover {
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
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

	.header-date {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.card-title {
		font-size: var(--font-lg);
		font-weight: 600;
		margin-bottom: var(--space-sm);
		color: var(--color-text);
	}

	.card-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.detail {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--color-text-secondary);
		font-size: var(--font-sm);
	}

	.detail svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}
</style>
