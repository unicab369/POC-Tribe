<script lang="ts">
	import type { ItineraryItem } from '$lib/types';
	import { formatTime } from '$lib/utils';

	let { item }: { item: ItineraryItem } = $props();

	const typeConfig: Record<ItineraryItem['type'], { label: string; color: string }> = {
		activity: { label: 'Activity', color: '#8b5cf6' },
		flight: { label: 'Flight', color: '#3b82f6' },
		hotel: { label: 'Hotel', color: '#f59e0b' },
		'car-rental': { label: 'Car Rental', color: '#22c55e' }
	};

	let config = $derived(typeConfig[item.type]);
</script>

<div class="itinerary-card">
	<div class="card-type">
		{#if item.type === 'activity'}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10" />
				<polyline points="12 6 12 12 16 14" />
			</svg>
		{:else if item.type === 'flight'}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
			</svg>
		{:else if item.type === 'hotel'}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M3 21h18" />
				<path d="M3 7v14" />
				<path d="M21 7v14" />
				<path d="M3 7l9-4 9 4" />
				<path d="M9 21v-4h6v4" />
			</svg>
		{:else if item.type === 'car-rental'}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h3" />
				<circle cx="6.5" cy="16.5" r="2.5" />
				<circle cx="16.5" cy="16.5" r="2.5" />
			</svg>
		{/if}
		<span class="type-label">{config.label}</span>
	</div>

	<div class="card-content">
		{#if item.type === 'activity'}
			<h4 class="item-title">{item.title}</h4>
			<div class="item-details">
				<span>{formatTime(item.startTime)} – {formatTime(item.endTime)}</span>
				{#if item.location}
					<span class="detail-sep">·</span>
					<span>{item.location}</span>
				{/if}
			</div>
			{#if item.notes}
				<p class="item-notes">{item.notes}</p>
			{/if}
		{:else if item.type === 'flight'}
			<h4 class="item-title">{item.airline} {item.flightNumber}</h4>
			<div class="flight-route">
				<div class="airport">
					<span class="airport-code">{item.from}</span>
					<span class="airport-time">{formatTime(item.departureTime)}</span>
				</div>
				<div class="flight-line">
					<span class="line"></span>
					<svg class="plane-icon" viewBox="0 0 24 24" fill="currentColor">
						<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
					</svg>
					<span class="line"></span>
				</div>
				<div class="airport">
					<span class="airport-code">{item.to}</span>
					<span class="airport-time">{formatTime(item.arrivalTime)}</span>
				</div>
			</div>
		{:else if item.type === 'hotel'}
			<h4 class="item-title">{item.name}</h4>
			<div class="item-details">
				<span>{item.location}</span>
			</div>
			{#if item.confirmationNumber}
				<p class="item-notes">Confirmation: {item.confirmationNumber}</p>
			{/if}
		{:else if item.type === 'car-rental'}
			<h4 class="item-title">{item.company}</h4>
			<div class="item-details">
				<span>Pick up: {formatTime(item.pickupTime)} at {item.pickupLocation}</span>
			</div>
			<div class="item-details">
				<span>Return: {formatTime(item.returnTime)} at {item.returnLocation}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.itinerary-card {
		background: var(--color-surface);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
	}

	.card-type {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.card-type svg {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.type-label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-secondary);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.item-title {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--color-text);
	}

	.item-details {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
	}

	.detail-sep {
		color: var(--color-text-muted);
	}

	.item-notes {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		margin-top: 2px;
	}

	.flight-route {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-top: 4px;
	}

	.airport {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.airport-code {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--color-text);
	}

	.airport-time {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
	}

	.flight-line {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.line {
		flex: 1;
		height: 2px;
		background: var(--color-border);
	}

	.plane-icon {
		width: 18px;
		height: 18px;
		color: var(--color-text-muted);
		flex-shrink: 0;
	}
</style>
