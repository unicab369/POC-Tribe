<script lang="ts">
	import { page } from '$app/state';
	import { events, updateItineraryItem, addItineraryItem, addTribeMember, updateEvent } from '$lib/stores/events';
	import ItineraryItemCard from '$lib/components/ItineraryItemCard.svelte';
	import { formatDateRange, getDayCount, getDateRange, getItemsForDate, formatDate, generateId } from '$lib/utils';
	import type { Event, ItineraryItem, RSVPStatus, ItemStatus, FlightItem } from '$lib/types';

	let event = $derived($events.find((e) => e.id === page.params.id));
	let dayCount = $derived(event ? getDayCount(event.startDate, event.endDate) : 0);
	let dates = $derived(event ? getDateRange(event.startDate, event.endDate) : []);

	let showTribe = $state(false);
	let showEdit = $state(false);
	let savedScrollY = 0;

	// Edit form state
	let editTitle = $state('');
	let editDescription = $state('');
	let editCategory = $state<Event['category']>('social');
	let editStartDate = $state('');
	let editEndDate = $state('');
	let editLocation = $state('');
	let showEditErrors = $state(false);

	function openEdit() {
		if (!event) return;
		editTitle = event.title;
		editDescription = event.description;
		editCategory = event.category;
		editStartDate = event.startDate;
		editEndDate = event.endDate;
		editLocation = event.location;
		showEditErrors = false;
		savedScrollY = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${savedScrollY}px`;
		document.body.style.left = '0';
		document.body.style.right = '0';
		document.body.style.overflow = 'hidden';
		showEdit = true;
	}

	function closeEdit() {
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.left = '';
		document.body.style.right = '';
		document.body.style.overflow = '';
		window.scrollTo(0, savedScrollY);
		showEdit = false;
	}

	function saveEdit() {
		if (!editTitle.trim() || !editStartDate || !editEndDate) {
			showEditErrors = true;
			return;
		}
		if (!event) return;
		updateEvent(event.id, {
			title: editTitle.trim(),
			description: editDescription.trim(),
			category: editCategory,
			startDate: editStartDate,
			endDate: editEndDate,
			location: editLocation.trim()
		});
		closeEdit();
	}

	function handleEditOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) closeEdit();
	}

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

	// Add item state
	let addingType = $state<ItineraryItem['type'] | null>(null);
	let addingForDate = $state<string | null>(null);
	let addItemStatus = $state<ItemStatus>('todo');

	const statusLabels: Record<ItemStatus, string> = { todo: 'Todo', voting: 'Voting', finalized: 'Finalized', cancelled: 'Cancelled' };
	const statusColors: Record<ItemStatus, string> = { todo: '#6b7280', voting: '#f59e0b', finalized: '#22c55e', cancelled: '#ef4444' };

	// Activity fields
	let actTitle = $state('');
	let actStartTime = $state('');
	let actEndTime = $state('');
	let actLocation = $state('');
	let actNotes = $state('');

	// Flight fields
	let flAirline = $state('');
	let flNumber = $state('');
	let flDepartureTime = $state('');
	let flArrivalTime = $state('');
	let flFrom = $state('');
	let flTo = $state('');

	// Hotel fields
	let htName = $state('');
	let htCheckOut = $state('');
	let htLocation = $state('');
	let htConfirmation = $state('');

	// Car rental fields
	let crPickupTime = $state('');
	let crReturnDate = $state('');
	let crReturnTime = $state('');
	let crPickupLocation = $state('');
	let crReturnLocation = $state('');
	let crSameDropoff = $state(false);

	function startAddForDay(date: string, type: ItineraryItem['type']) {
		resetAddItemFields();
		addingForDate = date;
		addingType = type;
	}

	function cancelAddItem() {
		addingType = null;
		addingForDate = null;
		resetAddItemFields();
	}

	function resetAddItemFields() {
		actTitle = ''; actStartTime = ''; actEndTime = ''; actLocation = ''; actNotes = '';
		flAirline = ''; flNumber = ''; flDepartureTime = ''; flArrivalTime = ''; flFrom = ''; flTo = '';
		htName = ''; htCheckOut = ''; htLocation = ''; htConfirmation = '';
		crPickupTime = ''; crReturnDate = ''; crReturnTime = ''; crPickupLocation = ''; crReturnLocation = ''; crSameDropoff = false;
		addItemStatus = 'todo';
	}

	function saveActivity() {
		if (!event || !addingForDate || !actTitle.trim()) return;
		addItineraryItem(event.id, {
			type: 'activity', id: generateId(), title: actTitle.trim(), date: addingForDate,
			startTime: actStartTime || '09:00', endTime: actEndTime || '10:00',
			location: actLocation.trim(), notes: actNotes.trim(), status: addItemStatus
		});
		cancelAddItem();
	}

	function saveFlight() {
		if (!event || !addingForDate) return;
		const flight: FlightItem = {
			type: 'flight', id: generateId(), airline: flAirline.trim(), flightNumber: flNumber.trim(),
			date: addingForDate, departureTime: flDepartureTime || '08:00', arrivalTime: flArrivalTime || '11:00',
			from: flFrom.trim(), to: flTo.trim(), status: addItemStatus
		};
		addItineraryItem(event.id, flight);
		cancelAddItem();
	}

	function saveHotel() {
		if (!event || !addingForDate || !htName.trim()) return;
		addItineraryItem(event.id, {
			type: 'hotel', id: generateId(), name: htName.trim(), checkInDate: addingForDate,
			checkOutDate: htCheckOut || addingForDate, location: htLocation.trim(),
			confirmationNumber: htConfirmation.trim(), status: addItemStatus
		});
		cancelAddItem();
	}

	function saveCarRental() {
		if (!event || !addingForDate || !crPickupLocation.trim()) return;
		addItineraryItem(event.id, {
			type: 'car-rental', id: generateId(), pickupDate: addingForDate,
			pickupTime: crPickupTime || '09:00', returnDate: crReturnDate || addingForDate,
			returnTime: crReturnTime || '17:00', pickupLocation: crPickupLocation.trim(),
			returnLocation: crSameDropoff ? crPickupLocation.trim() : crReturnLocation.trim(), status: addItemStatus
		});
		cancelAddItem();
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
			<button class="edit-btn" onclick={openEdit} aria-label="Edit Event">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
				</svg>
			</button>
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
				<span class="header-date">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
						<line x1="16" y1="2" x2="16" y2="6" />
						<line x1="8" y1="2" x2="8" y2="6" />
						<line x1="3" y1="10" x2="21" y2="10" />
					</svg>
					{formatDateRange(event.startDate, event.endDate)}{#if dayCount > 1} &middot; {dayCount} days{/if}
				</span>
				<span class="category-badge" style="background-color: {categoryColors[event.category]}">
					{event.category}
				</span>
			</div>
			<div class="event-meta">
				<div class="meta-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
						<circle cx="12" cy="10" r="3" />
					</svg>
					<span>{event.location || 'Unknown'}</span>
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
					{/if}
					{#if addingForDate === date && addingType !== null}
						<div class="inline-form">
							{#if addingType === 'activity'}
								<div class="inline-form-header"><span class="inline-form-title" style="color: #8b5cf6">Add Activity</span></div>
								<div class="add-field"><label>Title</label><input type="text" bind:value={actTitle} placeholder="Activity name" /></div>
								<div class="add-field-row">
									<div class="add-field"><label>Start Time</label><input type="time" bind:value={actStartTime} /></div>
									<div class="add-field"><label>End Time</label><input type="time" bind:value={actEndTime} /></div>
								</div>
								<div class="add-field"><label>Location</label><input type="text" bind:value={actLocation} placeholder="Where?" /></div>
								<div class="add-field"><label>Notes</label><input type="text" bind:value={actNotes} placeholder="Optional notes" /></div>
								<div class="add-status-section">
									<label class="add-status-label">Status</label>
									<div class="add-status-picker">
										{#each (['todo', 'voting', 'finalized', 'cancelled'] as const) as s}
											<button type="button" class="add-status-option" class:active={addItemStatus === s} style={addItemStatus === s ? `color: ${statusColors[s]}; border-color: ${statusColors[s]}` : ''} onclick={() => (addItemStatus = s)}>{statusLabels[s]}</button>
										{/each}
									</div>
								</div>
								<div class="inline-form-actions"><button type="button" class="btn-add-item" onclick={saveActivity}>Add</button><button type="button" class="btn-cancel-item" onclick={cancelAddItem}>Cancel</button></div>
							{:else if addingType === 'flight'}
								<div class="inline-form-header"><span class="inline-form-title" style="color: #3b82f6">Add Flight</span></div>
								<div class="add-field-row">
									<div class="add-field"><label>Airline</label><input type="text" bind:value={flAirline} placeholder="e.g. United" /></div>
									<div class="add-field"><label>Flight #</label><input type="text" bind:value={flNumber} placeholder="e.g. UA 482" /></div>
								</div>
								<div class="add-field-row">
									<div class="add-field"><label>From</label><input type="text" bind:value={flFrom} placeholder="e.g. JFK" /></div>
									<div class="add-field"><label>To</label><input type="text" bind:value={flTo} placeholder="e.g. SFO" /></div>
								</div>
								<div class="add-field-row">
									<div class="add-field"><label>Departure</label><input type="time" bind:value={flDepartureTime} /></div>
									<div class="add-field"><label>Arrival</label><input type="time" bind:value={flArrivalTime} /></div>
								</div>
								<div class="add-status-section">
									<label class="add-status-label">Status</label>
									<div class="add-status-picker">
										{#each (['todo', 'voting', 'finalized', 'cancelled'] as const) as s}
											<button type="button" class="add-status-option" class:active={addItemStatus === s} style={addItemStatus === s ? `color: ${statusColors[s]}; border-color: ${statusColors[s]}` : ''} onclick={() => (addItemStatus = s)}>{statusLabels[s]}</button>
										{/each}
									</div>
								</div>
								<div class="inline-form-actions"><button type="button" class="btn-add-item" onclick={saveFlight}>Add</button><button type="button" class="btn-cancel-item" onclick={cancelAddItem}>Cancel</button></div>
							{:else if addingType === 'hotel'}
								<div class="inline-form-header"><span class="inline-form-title" style="color: #f59e0b">Add Hotel</span></div>
								<div class="add-field"><label>Hotel Name</label><input type="text" bind:value={htName} placeholder="Hotel name" /></div>
								<div class="add-field"><label>Check-out</label><input type="date" bind:value={htCheckOut} min={date} /></div>
								<div class="add-field"><label>Location</label><input type="text" bind:value={htLocation} placeholder="Hotel location" /></div>
								<div class="add-field"><label>Confirmation #</label><input type="text" bind:value={htConfirmation} placeholder="Optional" /></div>
								<div class="add-status-section">
									<label class="add-status-label">Status</label>
									<div class="add-status-picker">
										{#each (['todo', 'voting', 'finalized', 'cancelled'] as const) as s}
											<button type="button" class="add-status-option" class:active={addItemStatus === s} style={addItemStatus === s ? `color: ${statusColors[s]}; border-color: ${statusColors[s]}` : ''} onclick={() => (addItemStatus = s)}>{statusLabels[s]}</button>
										{/each}
									</div>
								</div>
								<div class="inline-form-actions"><button type="button" class="btn-add-item" onclick={saveHotel}>Add</button><button type="button" class="btn-cancel-item" onclick={cancelAddItem}>Cancel</button></div>
							{:else if addingType === 'car-rental'}
								<div class="inline-form-header"><span class="inline-form-title" style="color: #22c55e">Add Car Rental</span></div>
								<div class="add-field"><label>Pickup Location</label><input type="text" bind:value={crPickupLocation} placeholder="Pickup location" /></div>
								<div class="add-field"><label>Pickup Time</label><input type="time" bind:value={crPickupTime} /></div>
								<label class="add-checkbox-row"><input type="checkbox" bind:checked={crSameDropoff} /><span>Same drop-off location</span></label>
								{#if !crSameDropoff}
									<div class="add-field"><label>Return Location</label><input type="text" bind:value={crReturnLocation} placeholder="Return location" /></div>
								{/if}
								<div class="add-field-row">
									<div class="add-field"><label>Return Date</label><input type="date" bind:value={crReturnDate} min={date} /></div>
									<div class="add-field"><label>Return Time</label><input type="time" bind:value={crReturnTime} /></div>
								</div>
								<div class="add-status-section">
									<label class="add-status-label">Status</label>
									<div class="add-status-picker">
										{#each (['todo', 'voting', 'finalized', 'cancelled'] as const) as s}
											<button type="button" class="add-status-option" class:active={addItemStatus === s} style={addItemStatus === s ? `color: ${statusColors[s]}; border-color: ${statusColors[s]}` : ''} onclick={() => (addItemStatus = s)}>{statusLabels[s]}</button>
										{/each}
									</div>
								</div>
								<div class="inline-form-actions"><button type="button" class="btn-add-item" onclick={saveCarRental}>Add</button><button type="button" class="btn-cancel-item" onclick={cancelAddItem}>Cancel</button></div>
							{/if}
						</div>
					{:else}
						<div class="day-type-picker">
							<button type="button" class="day-type-btn" onclick={() => startAddForDay(date, 'activity')} style="color: #8b5cf6">+ Activity</button>
							<button type="button" class="day-type-btn" onclick={() => startAddForDay(date, 'flight')} style="color: #3b82f6">+ Flight</button>
							<button type="button" class="day-type-btn" onclick={() => startAddForDay(date, 'hotel')} style="color: #f59e0b">+ Hotel</button>
							<button type="button" class="day-type-btn" onclick={() => startAddForDay(date, 'car-rental')} style="color: #22c55e">+ Car Rental</button>
						</div>
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
					<div class="modal-footer">
						{#if addingMember}
							<button class="btn-footer-add" onclick={saveMember}>Add</button>
							<button class="btn-footer-close" onclick={cancelAddMember}>Cancel</button>
						{:else}
							<button class="btn-footer-add" onclick={startAddMember}>Add</button>
							<button class="btn-footer-close" onclick={closeTribe}>Close</button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
		{#if showEdit}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-overlay" onclick={handleEditOverlayClick} onkeydown={() => {}}>
				<div class="modal">
					<div class="modal-header">
						<h3>Edit Event</h3>
					</div>
					<div class="modal-body">
						<div class="edit-form">
							<div class="edit-field">
								<label class="edit-label required">Title</label>
								<input type="text" bind:value={editTitle} placeholder="Event title" class:input-error={showEditErrors && !editTitle.trim()} />
							</div>
							<div class="edit-field">
								<label class="edit-label">Description</label>
								<textarea bind:value={editDescription} placeholder="Event description" rows="3"></textarea>
							</div>
							<div class="edit-field">
								<label class="edit-label">Category</label>
								<select bind:value={editCategory}>
									<option value="social">Social</option>
									<option value="business">Business</option>
									<option value="sports">Sports</option>
									<option value="music">Music</option>
									<option value="travel">Travel</option>
									<option value="wedding">Wedding</option>
									<option value="other">Other</option>
								</select>
							</div>
							<div class="edit-field-row">
								<div class="edit-field">
									<label class="edit-label required">Start Date</label>
									<input type="date" bind:value={editStartDate} class:input-error={showEditErrors && !editStartDate} />
								</div>
								<div class="edit-field">
									<label class="edit-label required">End Date</label>
									<input type="date" bind:value={editEndDate} min={editStartDate} class:input-error={showEditErrors && !editEndDate} />
								</div>
							</div>
							<div class="edit-field">
								<label class="edit-label">Location</label>
								<input type="text" bind:value={editLocation} placeholder="Event location" />
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<button class="btn-footer-add" onclick={saveEdit}>Save</button>
						<button class="btn-footer-close" onclick={closeEdit}>Cancel</button>
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
		justify-content: space-between;
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
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.header-date svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
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

	.day-type-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: var(--space-sm);
	}

	.day-type-btn {
		padding: 4px 10px;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-full);
		background: none;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.day-type-btn:hover {
		border-style: solid;
		background: var(--color-bg);
	}

	/* Inline add forms */
	.inline-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		margin-top: var(--space-sm);
	}

	.inline-form-header {
		margin-bottom: var(--space-xs);
	}

	.inline-form-title {
		font-size: var(--font-base);
		font-weight: 700;
	}

	.add-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		flex: 1;
	}

	.add-field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}

	.add-field label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.inline-form input {
		padding: 10px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: var(--font-base);
		outline: none;
		transition: border-color 0.2s;
		color-scheme: dark;
	}

	.inline-form input:focus {
		border-color: var(--color-primary);
	}

	.add-checkbox-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.add-checkbox-row input[type='checkbox'] {
		width: 16px;
		height: 16px;
		padding: 0;
		cursor: pointer;
		accent-color: var(--color-primary);
	}

	.add-status-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--color-border);
	}

	.add-status-label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.add-status-picker {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 6px;
	}

	.add-status-option {
		padding: 8px 4px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text-secondary);
		font-size: var(--font-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		text-align: center;
	}

	.add-status-option:hover:not(.active) {
		border-color: var(--color-text-muted);
	}

	.inline-form-actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-xs);
	}

	.btn-add-item {
		flex: 1;
		padding: 10px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
	}

	.btn-cancel-item {
		padding: 10px 20px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		font-weight: 600;
		cursor: pointer;
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

	/* Edit button in header */
	.edit-btn {
		margin-left: auto;
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		border-radius: var(--radius-sm);
	}

	.edit-btn svg {
		width: 22px;
		height: 22px;
	}

	/* Tribe button in header */
	.tribe-btn {
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
		display: flex;
		gap: var(--space-sm);
	}

	.btn-footer-add {
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

	.btn-footer-close {
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
		min-width: 0;
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

	/* Edit event form */
	.edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.edit-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		flex: 1;
		min-width: 0;
	}

	.edit-field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}

	.edit-label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.edit-label.required::after {
		content: ' *';
		color: var(--color-danger, #ef4444);
	}

	.edit-form input,
	.edit-form textarea,
	.edit-form select {
		padding: 12px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: var(--font-base);
		font-family: inherit;
		outline: none;
		transition: border-color 0.2s;
		color-scheme: dark;
	}

	.edit-form input:focus,
	.edit-form textarea:focus,
	.edit-form select:focus {
		border-color: var(--color-primary);
	}

	.edit-form textarea {
		resize: vertical;
		min-height: 80px;
	}

	.edit-form input.input-error {
		border-color: var(--color-danger, #ef4444);
	}

</style>
