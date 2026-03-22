<script lang="ts">
	import { goto } from '$app/navigation';
	import { addEvent } from '$lib/stores/events';
	import { generateId, getDateRange, getItemsForDate, formatDate } from '$lib/utils';
	import type { EventCategory, FlightItem, ItineraryItem, ItemStatus } from '$lib/types';

	const today = new Date().toISOString().split('T')[0];

	let title = $state('');
	let description = $state('');
	let startDate = $state(today);
	let endDate = $state(today);
	let location = $state('');
	let category = $state<EventCategory>('social');
	let itinerary = $state<ItineraryItem[]>([]);
	let dates = $derived(startDate && endDate ? getDateRange(startDate, endDate) : []);
	let errors = $state<Record<string, string>>({});
	let showSuccess = $state(false);

	// Itinerary builder state
	let addingType = $state<ItineraryItem['type'] | null>(null);
	let addingForDate = $state<string | null>(null);
	let itemStatus = $state<ItemStatus>('todo');

	const statusLabels: Record<ItemStatus, string> = {
		todo: 'Todo',
		voting: 'Voting',
		finalized: 'Finalized',
		cancelled: 'Cancelled'
	};

	const statusColors: Record<ItemStatus, string> = {
		todo: '#6b7280',
		voting: '#f59e0b',
		finalized: '#22c55e',
		cancelled: '#ef4444'
	};

	// Activity form fields
	let actTitle = $state('');
	let actDate = $state('');
	let actStartTime = $state('');
	let actEndTime = $state('');
	let actLocation = $state('');
	let actNotes = $state('');

	// Flight form fields
	let flightTab = $state<'outbound' | 'return'>('outbound');
	// Outbound
	let flAirline = $state('');
	let flNumber = $state('');
	let flDate = $state('');
	let flDepartureTime = $state('');
	let flArrivalTime = $state('');
	let flFrom = $state('');
	let flTo = $state('');
	// Return
	let flRetAirline = $state('');
	let flRetNumber = $state('');
	let flRetDate = $state('');
	let flRetDepartureTime = $state('');
	let flRetArrivalTime = $state('');
	let flRetFrom = $state('');
	let flRetTo = $state('');

	// Hotel form fields
	let htName = $state('');
	let htCheckIn = $state('');
	let htCheckOut = $state('');
	let htLocation = $state('');
	let htConfirmation = $state('');

	// Car rental form fields
	let crPickupDate = $state('');
	let crPickupTime = $state('');
	let crReturnDate = $state('');
	let crReturnTime = $state('');
	let crPickupLocation = $state('');
	let crReturnLocation = $state('');
	let crSameDropoff = $state(false);

	// Flight required field logic
	let flOutFromToRequired = $derived(!!flDate);
	let flRetFromToRequired = $derived(!!flRetDate);
	let flOutAllRequired = $derived(itemStatus === 'finalized');
	let flRetAllRequired = $derived(itemStatus === 'finalized' && !!flRetDate);
	let showFlightErrors = $state(false);

	function validateFlight(): boolean {
		if (flDate && (!flFrom.trim() || !flTo.trim())) return false;
		if (itemStatus === 'finalized') {
			if (!flAirline.trim() || !flNumber.trim() || !flDate || !flFrom.trim() || !flTo.trim() || !flDepartureTime || !flArrivalTime) return false;
		}
		if (flRetDate && (!flRetFrom.trim() || !flRetTo.trim())) return false;
		if (itemStatus === 'finalized' && flRetDate) {
			if (!flRetAirline.trim() || !flRetNumber.trim() || !flRetFrom.trim() || !flRetTo.trim() || !flRetDepartureTime || !flRetArrivalTime) return false;
		}
		return true;
	}

	let crMinReturnDate = $derived.by(() => {
		if (!crPickupDate) return '';
		const d = new Date(crPickupDate + 'T00:00:00');
		d.setDate(d.getDate() + 1);
		return d.toISOString().split('T')[0];
	});

	let isValid = $derived(
		!!title.trim() && !!startDate && !!endDate && !(startDate && endDate && endDate < startDate)
	);

	let snackbar = $state('');
	let snackbarTimer: ReturnType<typeof setTimeout> | null = null;

	function showSnackbar(msg: string) {
		snackbar = msg;
		if (snackbarTimer) clearTimeout(snackbarTimer);
		snackbarTimer = setTimeout(() => { snackbar = ''; }, 3000);
	}

	function getMissingFields(): string[] {
		const missing: string[] = [];
		if (!title.trim()) missing.push('Title');
		if (!startDate) missing.push('Start Date');
		if (!endDate) missing.push('End Date');
		if (startDate && endDate && endDate < startDate) missing.push('End Date must be after Start Date');
		return missing;
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!isValid) {
			const missing = getMissingFields();
			showSnackbar('Missing: ' + missing.join(', '));
			return;
		}

		addEvent({
			title: title.trim(),
			description: description.trim(),
			startDate,
			endDate,
			location: location.trim(),
			category,
			itinerary
		});

		showSuccess = true;
		setTimeout(() => {
			goto('/events');
		}, 1000);
	}

	function cancelAdd() {
		addingType = null;
		addingForDate = null;
		resetItemForms();
	}

	function startAddForDay(date: string, type: ItineraryItem['type']) {
		addingForDate = date;
		addingType = type;
		// Pre-fill date fields based on item type
		if (type === 'activity') actDate = date;
		else if (type === 'flight') flDate = date;
		else if (type === 'hotel') htCheckIn = date;
		else if (type === 'car-rental') crPickupDate = date;
	}

	function resetItemForms() {
		actTitle = ''; actDate = ''; actStartTime = ''; actEndTime = ''; actLocation = ''; actNotes = '';
		flAirline = ''; flNumber = ''; flDate = ''; flDepartureTime = ''; flArrivalTime = ''; flFrom = ''; flTo = '';
		flRetAirline = ''; flRetNumber = ''; flRetDate = ''; flRetDepartureTime = ''; flRetArrivalTime = ''; flRetFrom = ''; flRetTo = '';
		flightTab = 'outbound';
		htName = ''; htCheckIn = ''; htCheckOut = ''; htLocation = ''; htConfirmation = '';
		crPickupDate = ''; crPickupTime = ''; crReturnDate = ''; crReturnTime = ''; crPickupLocation = ''; crReturnLocation = ''; crSameDropoff = false;
		itemStatus = 'todo';
		showFlightErrors = false;
	}

	function addActivity() {
		if (!actTitle.trim() || !actDate) return;
		itinerary = [...itinerary, {
			type: 'activity',
			id: generateId(),
			title: actTitle.trim(),
			date: actDate,
			startTime: actStartTime || '09:00',
			endTime: actEndTime || '10:00',
			location: actLocation.trim(),
			notes: actNotes.trim(),
			status: itemStatus
		}];
		cancelAdd();
	}

	function addFlight() {
		if (!validateFlight()) {
			showFlightErrors = true;
			return;
		}
		showFlightErrors = false;
		if (!flDate) return;
		const flight: FlightItem = {
			type: 'flight',
			id: generateId(),
			airline: flAirline.trim(),
			flightNumber: flNumber.trim(),
			date: flDate,
			departureTime: flDepartureTime || '08:00',
			arrivalTime: flArrivalTime || '11:00',
			from: flFrom.trim(),
			to: flTo.trim(),
			status: itemStatus
		};
		if (flRetAirline.trim() && flRetDate) {
			flight.returnAirline = flRetAirline.trim();
			flight.returnFlightNumber = flRetNumber.trim();
			flight.returnDate = flRetDate;
			flight.returnDepartureTime = flRetDepartureTime || '08:00';
			flight.returnArrivalTime = flRetArrivalTime || '11:00';
			flight.returnFrom = flRetFrom.trim();
			flight.returnTo = flRetTo.trim();
		}
		itinerary = [...itinerary, flight];
		cancelAdd();
	}

	function addHotel() {
		if (!htName.trim() || !htCheckIn) return;
		itinerary = [...itinerary, {
			type: 'hotel',
			id: generateId(),
			name: htName.trim(),
			checkInDate: htCheckIn,
			checkOutDate: htCheckOut || htCheckIn,
			location: htLocation.trim(),
			confirmationNumber: htConfirmation.trim(),
			status: itemStatus
		}];
		cancelAdd();
	}

	function addCarRental() {
		if (!crPickupLocation.trim() || !crPickupDate) return;
		itinerary = [...itinerary, {
			type: 'car-rental',
			id: generateId(),
			pickupDate: crPickupDate,
			pickupTime: crPickupTime || '09:00',
			returnDate: crReturnDate || crPickupDate,
			returnTime: crReturnTime || '17:00',
			pickupLocation: crPickupLocation.trim(),
			returnLocation: crSameDropoff ? crPickupLocation.trim() : crReturnLocation.trim(),
			status: itemStatus
		}];
		cancelAdd();
	}

	function removeItem(id: string) {
		itinerary = itinerary.filter((i) => i.id !== id);
	}

	function getItemSummary(item: ItineraryItem): string {
		switch (item.type) {
			case 'activity':
				return `${item.title} — ${item.date}`;
			case 'flight':
				return `${item.airline} ${item.flightNumber} ${item.from} → ${item.to} — ${item.date}`;
			case 'hotel':
				return `${item.name} — ${item.checkInDate} to ${item.checkOutDate}`;
			case 'car-rental':
				return `${item.pickupLocation} — ${item.pickupDate} to ${item.returnDate}`;
		}
	}

	const typeLabels: Record<ItineraryItem['type'], string> = {
		activity: 'Activity',
		flight: 'Flight',
		hotel: 'Hotel',
		'car-rental': 'Car Rental'
	};

	const typeColors: Record<ItineraryItem['type'], string> = {
		activity: '#8b5cf6',
		flight: '#3b82f6',
		hotel: '#f59e0b',
		'car-rental': '#22c55e'
	};
</script>

<div class="container no-top-padding">
	<div class="page-top">
		<h1 class="page-title">Create Event</h1>
	</div>

	{#if showSuccess}
		<div class="success-banner">Event created successfully!</div>
	{/if}

	<form class="form" onsubmit={handleSubmit}>
		<!-- Event Details -->
		<div class="section-title">Event Details</div>

		<div class="field">
			<label for="title" class="required">Title</label>
			<input id="title" type="text" bind:value={title} placeholder="Event title" />
			{#if errors.title}<span class="error">{errors.title}</span>{/if}
		</div>

		<div class="field">
			<label for="description">Description</label>
			<textarea id="description" bind:value={description} placeholder="What's this event about?" rows="3"></textarea>
			{#if errors.description}<span class="error">{errors.description}</span>{/if}
		</div>

		<div class="field">
			<label for="category">Category</label>
			<select id="category" bind:value={category}>
				<option value="social">Social</option>
				<option value="business">Business</option>
				<option value="sports">Sports</option>
				<option value="music">Music</option>
				<option value="travel">Travel</option>
				<option value="wedding">Wedding</option>
				<option value="other">Other</option>
			</select>
		</div>

		<div class="field-row">
			<div class="field">
				<label for="startDate" class="required">Start Date</label>
				<input id="startDate" type="date" bind:value={startDate} min={today} max={endDate || ''} />
				{#if errors.startDate}<span class="error">{errors.startDate}</span>{/if}
			</div>
			<div class="field">
				<label for="endDate" class="required">End Date</label>
				<input id="endDate" type="date" bind:value={endDate} min={startDate || today} />
				{#if errors.endDate}<span class="error">{errors.endDate}</span>{/if}
			</div>
		</div>

		<div class="field">
			<label for="location">Location</label>
			<input id="location" type="text" bind:value={location} placeholder="Where is it?" />
			{#if errors.location}<span class="error">{errors.location}</span>{/if}
		</div>

		<!-- Itinerary Builder -->
		<div class="section-title">Agenda</div>

		{#if dates.length > 0}
			{#each dates as date, i}
				{@const dayItems = getItemsForDate(itinerary, date)}
				<div class="day-section">
					<div class="day-header">
						<span class="day-label">Day {i + 1}</span>
						<span class="day-date">{formatDate(date)}</span>
					</div>
					{#if dayItems.length > 0}
						<div class="day-items">
							{#each dayItems as entry (entry.item.id + (entry.flightLeg || '') + (entry.carRentalLeg || ''))}
								<div class="itinerary-row">
									<span class="item-type-badge" style="background-color: {typeColors[entry.item.type]}">{typeLabels[entry.item.type]}</span>
									<span class="item-summary">{getItemSummary(entry.item)}</span>
									<button type="button" class="remove-btn" onclick={() => removeItem(entry.item.id)}>×</button>
								</div>
							{/each}
						</div>
					{/if}
					{#if addingForDate !== date || addingType === null}
						<div class="day-type-picker">
							<button type="button" class="day-type-btn activity" onclick={() => startAddForDay(date, 'activity')}>+ Activity</button>
							<button type="button" class="day-type-btn flight" onclick={() => startAddForDay(date, 'flight')}>+ Flight</button>
							<button type="button" class="day-type-btn hotel" onclick={() => startAddForDay(date, 'hotel')}>+ Hotel</button>
							<button type="button" class="day-type-btn car-rental" onclick={() => startAddForDay(date, 'car-rental')}>+ Car Rental</button>
						</div>
					{/if}
				</div>
			{/each}
		{/if}

		{#if addingType !== null && addingForDate !== null}
		{#if addingType === 'activity'}
			<div class="inline-form">
				<div class="inline-form-header">
					<span class="inline-form-title" style="color: #8b5cf6">Add Activity</span>
				</div>
				<div class="field">
					<label for="actTitle">Title</label>
					<input id="actTitle" type="text" bind:value={actTitle} placeholder="Activity name" />
				</div>
				<div class="field-row">
					<div class="field">
						<label for="actDate">Date</label>
						<input id="actDate" type="date" bind:value={actDate} />
					</div>
					<div class="field">
						<label for="actLocation">Location</label>
						<input id="actLocation" type="text" bind:value={actLocation} placeholder="Where?" />
					</div>
				</div>
				<div class="field-row">
					<div class="field">
						<label for="actStartTime">Start Time</label>
						<input id="actStartTime" type="time" bind:value={actStartTime} />
					</div>
					<div class="field">
						<label for="actEndTime">End Time</label>
						<input id="actEndTime" type="time" bind:value={actEndTime} />
					</div>
				</div>
				<div class="field">
					<label for="actNotes">Notes</label>
					<input id="actNotes" type="text" bind:value={actNotes} placeholder="Optional notes" />
				</div>
				<div class="status-picker-section">
					<label class="status-picker-label">Status</label>
					<div class="status-picker">
						{#each (['todo', 'voting', 'finalized', 'cancelled'] as const) as s}
							<button
								type="button"
								class="status-option"
								class:active={itemStatus === s}
								style={itemStatus === s ? `color: ${statusColors[s]}; border-color: ${statusColors[s]}` : ''}
								onclick={() => (itemStatus = s)}
							>
								{statusLabels[s]}
							</button>
						{/each}
					</div>
				</div>
				<div class="inline-form-actions">
					<button type="button" class="btn-add" onclick={addActivity}>Add</button>
					<button type="button" class="btn-cancel" onclick={cancelAdd}>Cancel</button>
				</div>
			</div>
		{:else if addingType === 'flight'}
			<div class="inline-form">
				<div class="inline-form-header">
					<span class="inline-form-title" style="color: #3b82f6">Add Flight</span>
				</div>
				<div class="flight-tabs">
					<button
						type="button"
						class="flight-tab"
						class:active={flightTab === 'outbound'}
						onclick={() => (flightTab = 'outbound')}
					>
						Outbound
					</button>
					<button
						type="button"
						class="flight-tab"
						class:active={flightTab === 'return'}
						onclick={() => (flightTab = 'return')}
					>
						Return
					</button>
				</div>
				{#if flightTab === 'outbound'}
					<div class="field-row">
						<div class="field">
							<label for="flAirline" class:required={flOutAllRequired}>Airline</label>
							<input id="flAirline" type="text" bind:value={flAirline} placeholder="e.g. United" class:input-error={showFlightErrors && flOutAllRequired && !flAirline.trim()} />
						</div>
						<div class="field">
							<label for="flNumber" class:required={flOutAllRequired}>Flight #</label>
							<input id="flNumber" type="text" bind:value={flNumber} placeholder="e.g. UA 482" class:input-error={showFlightErrors && flOutAllRequired && !flNumber.trim()} />
						</div>
					</div>
					<div class="field">
						<label for="flDate" class:required={flOutAllRequired}>Date</label>
						<input id="flDate" type="date" bind:value={flDate} class:input-error={showFlightErrors && flOutAllRequired && !flDate} />
					</div>
					<div class="field-row">
						<div class="field">
							<label for="flFrom" class:required={flOutFromToRequired || flOutAllRequired}>From</label>
							<input id="flFrom" type="text" bind:value={flFrom} placeholder="e.g. JFK" class:input-error={showFlightErrors && (flOutFromToRequired || flOutAllRequired) && !flFrom.trim()} />
						</div>
						<div class="field">
							<label for="flTo" class:required={flOutFromToRequired || flOutAllRequired}>To</label>
							<input id="flTo" type="text" bind:value={flTo} placeholder="e.g. SFO" class:input-error={showFlightErrors && (flOutFromToRequired || flOutAllRequired) && !flTo.trim()} />
						</div>
					</div>
					<div class="field-row">
						<div class="field">
							<label for="flDepartureTime" class:required={flOutAllRequired}>Departure</label>
							<input id="flDepartureTime" type="time" bind:value={flDepartureTime} class:input-error={showFlightErrors && flOutAllRequired && !flDepartureTime} />
						</div>
						<div class="field">
							<label for="flArrivalTime" class:required={flOutAllRequired}>Arrival</label>
							<input id="flArrivalTime" type="time" bind:value={flArrivalTime} class:input-error={showFlightErrors && flOutAllRequired && !flArrivalTime} />
						</div>
					</div>
				{:else}
					<div class="field-row">
						<div class="field">
							<label for="flRetAirline" class:required={flRetAllRequired}>Airline</label>
							<input id="flRetAirline" type="text" bind:value={flRetAirline} placeholder="e.g. United" class:input-error={showFlightErrors && flRetAllRequired && !flRetAirline.trim()} />
						</div>
						<div class="field">
							<label for="flRetNumber" class:required={flRetAllRequired}>Flight #</label>
							<input id="flRetNumber" type="text" bind:value={flRetNumber} placeholder="e.g. UA 482" class:input-error={showFlightErrors && flRetAllRequired && !flRetNumber.trim()} />
						</div>
					</div>
					<div class="field">
						<label for="flRetDate">Date</label>
						<input id="flRetDate" type="date" bind:value={flRetDate} />
					</div>
					<div class="field-row">
						<div class="field">
							<label for="flRetFrom" class:required={flRetFromToRequired || flRetAllRequired}>From</label>
							<input id="flRetFrom" type="text" bind:value={flRetFrom} placeholder="e.g. SFO" class:input-error={showFlightErrors && (flRetFromToRequired || flRetAllRequired) && !flRetFrom.trim()} />
						</div>
						<div class="field">
							<label for="flRetTo" class:required={flRetFromToRequired || flRetAllRequired}>To</label>
							<input id="flRetTo" type="text" bind:value={flRetTo} placeholder="e.g. JFK" class:input-error={showFlightErrors && (flRetFromToRequired || flRetAllRequired) && !flRetTo.trim()} />
						</div>
					</div>
					<div class="field-row">
						<div class="field">
							<label for="flRetDepartureTime" class:required={flRetAllRequired}>Departure</label>
							<input id="flRetDepartureTime" type="time" bind:value={flRetDepartureTime} class:input-error={showFlightErrors && flRetAllRequired && !flRetDepartureTime} />
						</div>
						<div class="field">
							<label for="flRetArrivalTime" class:required={flRetAllRequired}>Arrival</label>
							<input id="flRetArrivalTime" type="time" bind:value={flRetArrivalTime} class:input-error={showFlightErrors && flRetAllRequired && !flRetArrivalTime} />
						</div>
					</div>
				{/if}
				<div class="status-picker-section">
					<label class="status-picker-label">Status</label>
					<div class="status-picker">
						{#each (['todo', 'voting', 'finalized', 'cancelled'] as const) as s}
							<button
								type="button"
								class="status-option"
								class:active={itemStatus === s}
								style={itemStatus === s ? `color: ${statusColors[s]}; border-color: ${statusColors[s]}` : ''}
								onclick={() => (itemStatus = s)}
							>
								{statusLabels[s]}
							</button>
						{/each}
					</div>
				</div>
				<div class="inline-form-actions">
					<button type="button" class="btn-add" onclick={addFlight}>Add</button>
					<button type="button" class="btn-cancel" onclick={cancelAdd}>Cancel</button>
				</div>
			</div>
		{:else if addingType === 'hotel'}
			<div class="inline-form">
				<div class="inline-form-header">
					<span class="inline-form-title" style="color: #f59e0b">Add Hotel</span>
				</div>
				<div class="field">
					<label for="htName">Hotel Name</label>
					<input id="htName" type="text" bind:value={htName} placeholder="Hotel name" />
				</div>
				<div class="field-row">
					<div class="field">
						<label for="htCheckIn">Check-in</label>
						<input id="htCheckIn" type="date" bind:value={htCheckIn} />
					</div>
					<div class="field">
						<label for="htCheckOut">Check-out</label>
						<input id="htCheckOut" type="date" bind:value={htCheckOut} />
					</div>
				</div>
				<div class="field">
					<label for="htLocation">Location</label>
					<input id="htLocation" type="text" bind:value={htLocation} placeholder="Hotel location" />
				</div>
				<div class="field">
					<label for="htConfirmation">Confirmation #</label>
					<input id="htConfirmation" type="text" bind:value={htConfirmation} placeholder="Optional" />
				</div>
				<div class="status-picker-section">
					<label class="status-picker-label">Status</label>
					<div class="status-picker">
						{#each (['todo', 'voting', 'finalized', 'cancelled'] as const) as s}
							<button
								type="button"
								class="status-option"
								class:active={itemStatus === s}
								style={itemStatus === s ? `color: ${statusColors[s]}; border-color: ${statusColors[s]}` : ''}
								onclick={() => (itemStatus = s)}
							>
								{statusLabels[s]}
							</button>
						{/each}
					</div>
				</div>
				<div class="inline-form-actions">
					<button type="button" class="btn-add" onclick={addHotel}>Add</button>
					<button type="button" class="btn-cancel" onclick={cancelAdd}>Cancel</button>
				</div>
			</div>
		{:else if addingType === 'car-rental'}
			<div class="inline-form">
				<div class="inline-form-header">
					<span class="inline-form-title" style="color: #22c55e">Add Car Rental</span>
				</div>
				<div class="field">
					<label for="crPickupLocation">Pickup Location</label>
					<input id="crPickupLocation" type="text" bind:value={crPickupLocation} placeholder="Pickup location" />
				</div>
				<div class="field-row">
					<div class="field">
						<label for="crPickupDate">Pickup Date</label>
						<input id="crPickupDate" type="date" bind:value={crPickupDate} />
					</div>
					<div class="field">
						<label for="crPickupTime">Pickup Time</label>
						<input id="crPickupTime" type="time" bind:value={crPickupTime} />
					</div>
				</div>
				<label class="checkbox-row">
					<input type="checkbox" bind:checked={crSameDropoff} />
					<span>Same drop-off location</span>
				</label>
				{#if !crSameDropoff}
					<div class="field">
						<label for="crReturnLocation">Return Location</label>
						<input id="crReturnLocation" type="text" bind:value={crReturnLocation} placeholder="Return location" />
					</div>
				{/if}
				<div class="field-row">
					<div class="field">
						<label for="crReturnDate">Return Date</label>
						<input id="crReturnDate" type="date" bind:value={crReturnDate} min={crMinReturnDate} />
					</div>
					<div class="field">
						<label for="crReturnTime">Return Time</label>
						<input id="crReturnTime" type="time" bind:value={crReturnTime} />
					</div>
				</div>
				<div class="status-picker-section">
					<label class="status-picker-label">Status</label>
					<div class="status-picker">
						{#each (['todo', 'voting', 'finalized', 'cancelled'] as const) as s}
							<button
								type="button"
								class="status-option"
								class:active={itemStatus === s}
								style={itemStatus === s ? `color: ${statusColors[s]}; border-color: ${statusColors[s]}` : ''}
								onclick={() => (itemStatus = s)}
							>
								{statusLabels[s]}
							</button>
						{/each}
					</div>
				</div>
				<div class="inline-form-actions">
					<button type="button" class="btn-add" onclick={addCarRental}>Add</button>
					<button type="button" class="btn-cancel" onclick={cancelAdd}>Cancel</button>
				</div>
			</div>
		{/if}
		{/if}

		<button type="submit" class="submit-btn" class:submit-disabled={!isValid} disabled={showSuccess}>Create Event</button>
	</form>
</div>

{#if snackbar}
	<div class="snackbar">{snackbar}</div>
{/if}

<style>
	.no-top-padding {
		padding-top: 0;
	}

	.page-top {
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

	.page-title {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--color-text);
	}

	.success-banner {
		background: var(--color-success);
		color: white;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		text-align: center;
		font-weight: 600;
		margin-bottom: var(--space-md);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding-bottom: var(--space-xl);
	}

	.section-title {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--color-text);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--color-border);
		margin-top: var(--space-sm);
	}

	.section-title:first-of-type {
		border-top: none;
		margin-top: 0;
		padding-top: 0;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		flex: 1;
	}

	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}

	label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	input,
	textarea,
	select {
		padding: 10px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		outline: none;
		transition: border-color 0.2s;
		color-scheme: dark;
	}

	input:focus,
	textarea:focus,
	select:focus {
		border-color: var(--color-primary);
	}

	textarea {
		resize: vertical;
	}

	.error {
		font-size: 0.75rem;
		color: var(--color-danger);
	}

	.submit-btn {
		padding: 14px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: var(--font-base);
		cursor: pointer;
		transition: background-color 0.2s;
		margin-top: var(--space-sm);
	}

	.submit-btn:hover {
		background: var(--color-primary-dark);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.submit-btn.submit-disabled {
		opacity: 0.5;
	}

	/* Snackbar */
	.snackbar {
		position: fixed;
		bottom: 80px;
		left: 50%;
		transform: translateX(-50%);
		background: #1e293b;
		color: #f8fafc;
		padding: 12px 24px;
		border-radius: var(--radius-md);
		font-size: var(--font-sm);
		font-weight: 500;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		z-index: 2000;
		max-width: calc(100% - 32px);
		text-align: center;
		border: 1px solid var(--color-border);
		animation: snackbar-in 0.2s ease-out;
	}

	@keyframes snackbar-in {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	/* Day sections */
	.day-section {
		margin-bottom: var(--space-md);
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

	.day-type-btn.activity { color: #8b5cf6; }
	.day-type-btn.flight { color: #3b82f6; }
	.day-type-btn.hotel { color: #f59e0b; }
	.day-type-btn.car-rental { color: #22c55e; }

	.day-type-btn:hover {
		border-style: solid;
		background: var(--color-bg);
	}

	/* Itinerary builder */
	.itinerary-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.itinerary-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.item-type-badge {
		font-size: 0.7rem;
		font-weight: 700;
		color: white;
		padding: 2px 8px;
		border-radius: var(--radius-full);
		white-space: nowrap;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.item-summary {
		flex: 1;
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.remove-btn {
		background: none;
		border: none;
		color: var(--color-danger);
		font-size: 1.25rem;
		font-weight: 700;
		cursor: pointer;
		padding: 0 4px;
		line-height: 1;
	}

	.add-item-section {
		text-align: center;
	}

	.add-label {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		margin-bottom: var(--space-sm);
	}

	.type-picker {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	.type-btn {
		padding: 10px;
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		font-size: var(--font-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.type-btn.activity { color: #8b5cf6; }
	.type-btn.flight { color: #3b82f6; }
	.type-btn.hotel { color: #f59e0b; }
	.type-btn.car-rental { color: #22c55e; }

	.type-btn:hover {
		border-style: solid;
		background: var(--color-bg);
	}

	.inline-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.inline-form-header {
		margin-bottom: var(--space-xs);
	}

	.inline-form-title {
		font-size: var(--font-base);
		font-weight: 700;
	}

	.inline-form-actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-xs);
	}

	.btn-add {
		flex: 1;
		padding: 10px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-add:hover {
		background: var(--color-primary-dark);
	}

	.btn-cancel {
		padding: 10px 20px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		font-weight: 600;
		cursor: pointer;
	}

	.checkbox-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.checkbox-row input[type='checkbox'] {
		width: 16px;
		height: 16px;
		padding: 0;
		cursor: pointer;
		accent-color: var(--color-primary);
	}

	.status-picker-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--color-border);
	}

	.status-picker-label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.status-picker {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 6px;
	}

	.status-option {
		padding: 8px 4px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: var(--font-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		text-align: center;
	}

	.status-option:hover:not(.active) {
		border-color: var(--color-text-muted);
	}

	/* Flight tabs */
	.flight-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.flight-tab {
		padding: 8px;
		border: none;
		background: var(--color-bg);
		color: var(--color-text-muted);
		font-size: var(--font-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.flight-tab.active {
		background: #3b82f6;
		color: white;
	}

	label.required::after {
		content: ' *';
		color: var(--color-danger, #ef4444);
	}

	input.input-error {
		border-color: var(--color-danger, #ef4444);
	}
</style>
