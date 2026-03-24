<script lang="ts">
	import { events } from '$lib/stores/events';
	import { currentUser, USERS, signIn, signOut } from '$lib/stores/user';
	import EventCard from '$lib/components/EventCard.svelte';

	let myEvents = $derived($events.slice(-3).reverse());
</script>

<div class="container no-top-padding">
	<div class="page-top">
		<h1 class="page-title">Profile</h1>
	</div>

	{#if $currentUser}
		<div class="profile-card">
			<div class="avatar">
				<span>{$currentUser.name.split(' ').map((n) => n[0]).join('')}</span>
			</div>
			<div class="user-info">
				<h2>{$currentUser.name}</h2>
				<p class="email">{$currentUser.email}</p>
				<p class="member-since">Member since March 2026</p>
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

		<button class="sign-out-btn" onclick={() => signOut()}>Sign Out</button>
	{:else}
		<section class="sign-in-section">
			<h2>Sign In</h2>
			<p class="sign-in-subtitle">Choose a profile to continue</p>
			<div class="user-cards">
				{#each USERS as user (user.id)}
					<button class="user-card" onclick={() => signIn(user.id)}>
						<div class="user-card-avatar">
							<span>{user.name.split(' ').map((n) => n[0]).join('')}</span>
						</div>
						<div class="user-card-info">
							<span class="user-card-name">{user.name}</span>
							<span class="user-card-email">{user.email}</span>
						</div>
					</button>
				{/each}
			</div>
		</section>
	{/if}
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
		text-align: center;
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

	.my-events h2 {
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

	.sign-out-btn {
		width: 100%;
		padding: var(--space-md);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-danger, #ef4444);
		background: transparent;
		color: var(--color-danger, #ef4444);
		font-size: var(--font-md);
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.sign-out-btn:hover {
		background: var(--color-danger, #ef4444);
		color: white;
	}

	/* Sign in section */
	.sign-in-section h2 {
		font-size: var(--font-xl);
		font-weight: 600;
		margin-bottom: var(--space-xs);
	}

	.sign-in-subtitle {
		color: var(--color-text-muted);
		font-size: var(--font-sm);
		margin-bottom: var(--space-lg);
	}

	.user-cards {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.user-card {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: var(--space-md);
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		width: 100%;
		text-align: left;
	}

	.user-card:hover {
		border-color: var(--color-primary);
		background: var(--color-surface-hover, var(--color-surface));
	}

	.user-card-avatar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-md);
		font-weight: 700;
		flex-shrink: 0;
	}

	.user-card-info {
		display: flex;
		flex-direction: column;
	}

	.user-card-name {
		font-size: var(--font-md);
		font-weight: 600;
		color: var(--color-text);
	}

	.user-card-email {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
	}
</style>
