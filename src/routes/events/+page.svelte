<script lang="ts">
	import { events } from '$lib/stores/events';
	import EventCard from '$lib/components/EventCard.svelte';
	import type { EventCategory } from '$lib/types';

	let search = $state('');
	let activeCategory = $state<EventCategory | 'all'>('all');

	const categories: Array<{ value: EventCategory | 'all'; label: string }> = [
		{ value: 'all', label: 'All' },
		{ value: 'social', label: 'Social' },
		{ value: 'business', label: 'Business' },
		{ value: 'sports', label: 'Sports' },
		{ value: 'music', label: 'Music' },
		{ value: 'travel', label: 'Travel' },
		{ value: 'wedding', label: 'Wedding' },
		{ value: 'other', label: 'Other' }
	];

	let filteredEvents = $derived(
		$events
			.filter((e) => {
				const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase());
				const matchesCategory = activeCategory === 'all' || e.category === activeCategory;
				return matchesSearch && matchesCategory;
			})
			.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
	);
</script>

<div class="container no-top-padding">
	<div class="sticky-header">
		<h1 class="page-title">Events</h1>

		<div class="search-bar">
			<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="11" cy="11" r="8" />
				<line x1="21" y1="21" x2="16.65" y2="16.65" />
			</svg>
			<input
				type="text"
				placeholder="Search events..."
				bind:value={search}
			/>
		</div>

		<div class="filter-chips">
			{#each categories as cat}
				<button
					class="chip"
					class:active={activeCategory === cat.value}
					onclick={() => (activeCategory = cat.value)}
				>
					{cat.label}
				</button>
			{/each}
		</div>
		<div class="separator"></div>
	</div>

	<div class="events-list">
		{#if filteredEvents.length > 0}
			{#each filteredEvents as event (event.id)}
				<EventCard {event} />
			{/each}
		{:else}
			<p class="empty-text">No events found.</p>
		{/if}
	</div>
</div>

<a href="/create" class="fab" aria-label="Create Event">
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
		<line x1="12" y1="5" x2="12" y2="19" />
		<line x1="5" y1="12" x2="19" y2="12" />
	</svg>
</a>

<style>
	.no-top-padding {
		padding-top: 0;
	}

	.sticky-header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--color-bg);
		padding-bottom: var(--space-sm);
		margin-left: calc(-1 * var(--space-md));
		margin-right: calc(-1 * var(--space-md));
		padding-left: var(--space-md);
		padding-right: var(--space-md);
	}

	.page-title {
		font-size: var(--font-2xl);
		font-weight: 700;
		padding-top: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.search-bar {
		position: relative;
		margin-bottom: var(--space-md);
	}

	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		width: 18px;
		height: 18px;
		color: var(--color-text-muted);
		pointer-events: none;
	}

	.search-bar input {
		width: 100%;
		padding: 10px 12px 10px 40px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		outline: none;
		transition: border-color 0.2s;
	}

	.search-bar input:focus {
		border-color: var(--color-primary);
	}

	.filter-chips {
		display: flex;
		gap: var(--space-sm);
		overflow-x: auto;
		padding-bottom: var(--space-sm);
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.filter-chips::-webkit-scrollbar {
		display: none;
	}

	.chip {
		flex-shrink: 0;
		padding: 6px 16px;
		border-radius: var(--radius-full);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		cursor: pointer;
		font-size: var(--font-sm);
		transition: all 0.2s;
	}

	.chip.active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.separator {
		height: 1px;
		background: var(--color-border);
		margin-bottom: var(--space-md);
	}

	.events-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.empty-text {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--space-xl);
	}

	.fab {
		position: fixed;
		bottom: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 16px);
		right: 16px;
		width: 56px;
		height: 56px;
		border-radius: var(--radius-full);
		background: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		text-decoration: none;
		z-index: 50;
	}

	.fab svg {
		width: 28px;
		height: 28px;
	}
</style>
