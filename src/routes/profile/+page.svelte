<script lang="ts">
	import { events } from '$lib/stores/events';
	import EventCard from '$lib/components/EventCard.svelte';

	const user = {
		name: 'Alex Johnson',
		email: 'alex@example.com',
		memberSince: 'March 2026'
	};

	let myEvents = $derived($events.slice(-3).reverse());
</script>

<div class="container no-top-padding">
	<div class="page-top">
		<h1 class="page-title">Profile</h1>
	</div>

	<div class="profile-card">
		<div class="avatar">
			<span>{user.name.split(' ').map((n) => n[0]).join('')}</span>
		</div>
		<div class="user-info">
			<h2>{user.name}</h2>
			<p class="email">{user.email}</p>
			<p class="member-since">Member since {user.memberSince}</p>
		</div>
	</div>

	<section class="my-events">
		<h2>My Events</h2>
		{#if myEvents.length > 0}
			<div class="events-list">
				{#each myEvents as event (event.id)}
					<EventCard {event} />
				{/each}
			</div>
		{:else}
			<p class="empty-text">No events yet. Create your first one!</p>
		{/if}
	</section>

	<section class="settings">
		<h2>Settings</h2>
		<div class="settings-list">
			<div class="settings-item">
				<span>Notifications</span>
				<span class="settings-value">On</span>
			</div>
			<div class="settings-item">
				<span>Dark Mode</span>
				<span class="settings-value">On</span>
			</div>
			<div class="settings-item">
				<span>Language</span>
				<span class="settings-value">English</span>
			</div>
		</div>
	</section>
</div>

<style>
	.no-top-padding {
		padding-top: 0;
	}

	.page-top {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--color-bg);
		padding: var(--space-sm) 0;
		margin-left: calc(-1 * var(--space-md));
		margin-right: calc(-1 * var(--space-md));
		padding-left: var(--space-md);
		padding-right: var(--space-md);
		margin-bottom: var(--space-md);
		border-bottom: 1px solid var(--color-border);
	}

	.page-title {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--color-text);
	}

	.profile-card {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.avatar {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-xl);
		font-weight: 700;
		flex-shrink: 0;
	}

	.user-info h2 {
		font-size: var(--font-lg);
		font-weight: 600;
		margin-bottom: 2px;
	}

	.email {
		color: var(--color-text-secondary);
		font-size: var(--font-sm);
	}

	.member-since {
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}

	.my-events {
		margin-bottom: var(--space-xl);
	}

	.my-events h2,
	.settings h2 {
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
		padding: var(--space-lg);
	}

	.settings-list {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		overflow: hidden;
	}

	.settings-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-md);
		border-bottom: 1px solid var(--color-border);
		font-size: var(--font-sm);
	}

	.settings-item:last-child {
		border-bottom: none;
	}

	.settings-value {
		color: var(--color-text-muted);
	}
</style>
