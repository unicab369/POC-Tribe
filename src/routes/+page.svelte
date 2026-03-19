<script lang="ts">
	import { events } from '$lib/stores/events';
	import EventCard from '$lib/components/EventCard.svelte';

	let allEvents = $derived($events);

	let upcomingEvents = $derived(
		allEvents
			.filter((e) => new Date(e.startDate) >= new Date(new Date().toDateString()))
			.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
			.slice(0, 3)
	);

	let upcomingCount = $derived(
		allEvents.filter((e) => new Date(e.startDate) >= new Date(new Date().toDateString())).length
	);
</script>

<div class="container">
	<header class="hero">
		<h1>POC Tribe</h1>
		<p>Discover and create events with your community</p>
	</header>

	<section class="stats">
		<div class="stat-card">
			<span class="stat-number">{allEvents.length}</span>
			<span class="stat-label">Total Events</span>
		</div>
		<div class="stat-card">
			<span class="stat-number">{upcomingCount}</span>
			<span class="stat-label">Upcoming</span>
		</div>
	</section>

	<section class="upcoming">
		<h2>Upcoming Events</h2>
		{#if upcomingEvents.length > 0}
			<div class="events-list">
				{#each upcomingEvents as event (event.id)}
					<EventCard {event} />
				{/each}
			</div>
		{:else}
			<p class="empty-text">No upcoming events. Create one!</p>
		{/if}
	</section>
</div>

<style>
	.hero {
		text-align: center;
		padding: var(--space-xl) 0 var(--space-lg);
	}

	.hero h1 {
		font-size: var(--font-3xl);
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: var(--space-xs);
	}

	.hero p {
		color: var(--color-text-secondary);
		font-size: var(--font-lg);
	}

	.stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	.stat-card {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		text-align: center;
		border: 1px solid var(--color-border);
	}

	.stat-number {
		display: block;
		font-size: var(--font-3xl);
		font-weight: 700;
		color: var(--color-primary);
	}

	.stat-label {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
	}

	.upcoming h2 {
		font-size: var(--font-xl);
		font-weight: 600;
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
</style>
