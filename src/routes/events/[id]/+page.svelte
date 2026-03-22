<script lang="ts">
	import { page } from '$app/state';
	import { events, updateItineraryItem, addTribeMember } from '$lib/stores/events';
	import ItineraryItemCard from '$lib/components/ItineraryItemCard.svelte';
	import { formatDateRange, getDayCount, getDateRange, getItemsForDate, formatDate } from '$lib/utils';
	import type { Event, ItineraryItem, RSVPStatus } from '$lib/types';

	let event = $derived($events.find((e) => e.id === page.params.id));
	let dayCount = $derived(event ? getDayCount(event.startDate, event.endDate) : 0);
	let dates = $derived(event ? getDateRange(event.startDate, event.endDate) : []);

	let showTribe = $state(false);
	let savedScrollY = 0;

	const rsvpLabels: Record<RSVPStatus, string> = {
		going: 'Going',
		maybe: 'Maybe',
		'not-going': 'Not Going',
		pending: 'Pending'
	};

	const rsvpColors: Record<RSVPStatus, string> = {
		going: '#22c55e',
		maybe: '#f59e0b',
		'not-going': '#ef4444',
		pending: '#6b7280'
	};

	function openTribe() {
		savedScrollY = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${savedScrollY}px`;
		document.body.style.left = '0';
		document.body.style.right = '0';
		document.body.style.overflow = 'hidden';
		showTribe = true;
	}

	function closeTribe() {
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.left = '';
		document.body.style.right = '';
		document.body.style.overflow = '';
		window.scrollTo(0, savedScrollY);
		showTribe = false;
	}

	function handleTribeOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) closeTribe();
	}

	// Add member form
	let addingMember = $state(false);
	let memberFirstName = $state('');
	let memberLastName = $state('');
	let memberEmail = $state('');
	let memberPhone = $state('');
	let showMemberErrors = $state(false);

	function startAddMember() {
		memberFirstName = '';
		memberLastName = '';
		memberEmail = '';
		memberPhone = '';
		showMemberErrors = false;
		addingMember = true;
	}

	function cancelAddMember() {
		addingMember = false;
	}

	function saveMember() {
		if (!memberFirstName.trim() || !memberLastName.trim()) {
			showMemberErrors = true;
			return;
		}
		if (!event) return;
		addTribeMember(event.id, {
			firstName: memberFirstName.trim(),
			lastName: memberLastName.trim(),
			email: memberEmail.trim() || undefined,
			phone: memberPhone.trim() || undefined,
			rsvp: 'pending'
		});
		addingMember = false;
	}

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

<div class="container no-top-padding">
	{#if event}
		<div class="page-top">
			<a href="/events" class="back-link">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6" />
				</svg>
			</a>
			<h1 class="page-title">{event.title}</h1>
			<button class="tribe-btn" onclick={openTribe} aria-label="View Tribe">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
					<circle cx="9" cy="7" r="4" />
					<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
					<path d="M16 3.13a4 4 0 0 1 0 7.75" />
				</svg>
				{#if event.tribe.length > 0}
					<span class="tribe-count">{event.tribe.length}</span>
				{/if}
			</button>
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
					<span>{event.tribe.length} tribe</span>
				</div>
			</div>
			<p class="event-description">{event.description}</p>
		</header>

		<section class="itinerary-section">
			<h2>Agenda</h2>
			{#each dates as date, i}
				{@const dayItems = getItemsForDate(event.itinerary, date)}
				<div class="day-section">
					<div class="day-header">
						<span class="day-label">Day {i + 1}</span>
						<span class="day-date">{formatDate(date)}</span>
					</div>
					{#if dayItems.length > 0}
						<div class="day-items">
							{#each dayItems as entry (entry.item.id + (entry.flightLeg || ''))}
								<ItineraryItemCard item={entry.item} flightLeg={entry.flightLeg} carRentalLeg={entry.carRentalLeg} onsave={handleItemSave} />
							{/each}
						</div>
					{:else}
						<p class="day-empty">No items yet</p>
					{/if}
				</div>
			{/each}
		</section>
		{#if showTribe}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-overlay" onclick={handleTribeOverlayClick} onkeydown={() => {}}>
				<div class="modal">
					<div class="modal-header">
						<h3>Tribe</h3>
					</div>
					<div class="modal-body">
						{#if addingMember}
							<div class="add-member-form">
								<div class="add-member-title">Add Tribe Member</div>
								<div class="member-field-row">
									<div class="member-field">
										<label class="member-label required">First Name</label>
										<input type="text" bind:value={memberFirstName} placeholder="First name" class:input-error={showMemberErrors && !memberFirstName.trim()} />
									</div>
									<div class="member-field">
										<label class="member-label required">Last Name</label>
										<input type="text" bind:value={memberLastName} placeholder="Last name" class:input-error={showMemberErrors && !memberLastName.trim()} />
									</div>
								</div>
								<div class="member-field">
									<label class="member-label">Email</label>
									<input type="email" bind:value={memberEmail} placeholder="Email address" />
								</div>
								<div class="member-field">
									<label class="member-label">Phone</label>
									<input type="tel" bind:value={memberPhone} placeholder="Phone number" />
								</div>
								<div class="add-member-actions">
									<button class="btn-add-member" onclick={saveMember}>Add</button>
									<button class="btn-cancel-member" onclick={cancelAddMember}>Cancel</button>
								</div>
							</div>
						{:else if event.tribe.length === 0}
							<p class="empty-tribe">No tribe members yet.</p>
						{:else}
							<div class="tribe-list">
								{#each event.tribe as member (member.id)}
									<div class="tribe-member">
										<div class="member-avatar">
											{member.firstName[0]}{member.lastName[0]}
										</div>
										<div class="member-info">
											<span class="member-name">{member.firstName} {member.lastName}</span>
											{#if member.email || member.phone}
												<span class="member-contact">{member.email || member.phone}</span>
											{/if}
										</div>
										<span class="rsvp-badge" style="background-color: {rsvpColors[member.rsvp]}">{rsvpLabels[member.rsvp]}</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
					{#if !addingMember}
						<button class="fab" onclick={startAddMember} aria-label="Add tribe member">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<line x1="12" y1="5" x2="12" y2="19" />
								<line x1="5" y1="12" x2="19" y2="12" />
							</svg>
						</button>
					{/if}
					<div class="modal-footer">
						<button class="btn-close" onclick={closeTribe}>Close</button>
					</div>
				</div>
			</div>
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
	.no-top-padding {
		padding-top: 0;
	}

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

	.day-empty {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		padding: var(--space-sm) 0;
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

	/* Tribe button in header */
	.tribe-btn {
		margin-left: auto;
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		gap: 4px;
		border-radius: var(--radius-sm);
		position: relative;
	}

	.tribe-btn svg {
		width: 22px;
		height: 22px;
	}

	.tribe-count {
		font-size: 0.7rem;
		font-weight: 700;
		background: var(--color-primary);
		color: white;
		min-width: 18px;
		height: 18px;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 4px;
	}

	/* Tribe modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: stretch;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--color-surface);
		width: 100%;
		max-width: 600px;
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.modal-header {
		padding: var(--space-md) var(--space-md) var(--space-sm);
		border-bottom: 1px solid var(--color-border);
		text-align: center;
	}

	.modal-header h3 {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--color-text);
	}

	.modal-body {
		padding: var(--space-md);
		overflow-y: auto;
		flex: 1 1 0;
		min-height: 0;
	}

	.modal-footer {
		padding: var(--space-md);
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.btn-close {
		width: 100%;
		padding: 14px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		font-size: var(--font-base);
		font-weight: 600;
		cursor: pointer;
	}

	.empty-tribe {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--space-lg) 0;
	}

	.tribe-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.tribe-member {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.tribe-member:last-child {
		border-bottom: none;
	}

	.member-avatar {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-full);
		background: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.member-name {
		flex: 1;
		font-size: var(--font-base);
		font-weight: 500;
		color: var(--color-text);
	}

	.member-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.member-contact {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rsvp-badge {
		font-size: 0.65rem;
		font-weight: 700;
		color: white;
		padding: 2px 8px;
		border-radius: var(--radius-full);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		flex-shrink: 0;
	}

	/* FAB */
	.fab {
		position: absolute;
		bottom: 80px;
		right: var(--space-md);
		width: 48px;
		height: 48px;
		border-radius: var(--radius-full);
		background: var(--color-primary);
		color: white;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.fab svg {
		width: 24px;
		height: 24px;
	}

	/* Add member form */
	.add-member-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.add-member-title {
		font-size: var(--font-base);
		font-weight: 700;
		color: var(--color-text);
	}

	.member-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		flex: 1;
	}

	.member-field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}

	.member-label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.member-label.required::after {
		content: ' *';
		color: var(--color-danger, #ef4444);
	}

	.add-member-form input {
		padding: 12px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: var(--font-base);
		outline: none;
		transition: border-color 0.2s;
		color-scheme: dark;
	}

	.add-member-form input:focus {
		border-color: var(--color-primary);
	}

	.add-member-form input.input-error {
		border-color: var(--color-danger, #ef4444);
	}

	.add-member-actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-xs);
	}

	.btn-add-member {
		flex: 1;
		padding: 14px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--font-base);
		font-weight: 600;
		cursor: pointer;
	}

	.btn-cancel-member {
		flex: 1;
		padding: 14px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		font-size: var(--font-base);
		font-weight: 600;
		cursor: pointer;
	}
</style>
