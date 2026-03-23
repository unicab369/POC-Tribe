<script lang="ts">
	import type { ItineraryItem, ItemStatus } from '$lib/types';
	import type { FlightLeg, CarRentalLeg } from '$lib/utils';
	import { formatTime, formatDate, timeOptions } from '$lib/utils';

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

	let { item, flightLeg, carRentalLeg, onsave }: { item: ItineraryItem; flightLeg?: FlightLeg; carRentalLeg?: CarRentalLeg; onsave?: (updated: ItineraryItem) => void } = $props();

	const typeLabels: Record<ItineraryItem['type'], string> = {
		activity: 'Activity',
		flight: 'Flight',
		hotel: 'Accommodation',
		'car-rental': 'Car Rental'
	};

	let editing = $state(false);
	let viewing = $state(false);
	let savedScrollY = 0;

	// Activity edit fields
	let actTitle = $state('');
	let actDate = $state('');
	let actStartTime = $state('');
	let actEndTime = $state('');
	let actLocation = $state('');
	let actNotes = $state('');

	// Flight edit fields
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

	// Hotel edit fields
	let htName = $state('');
	let htCheckIn = $state('');
	let htCheckOut = $state('');
	let htLocation = $state('');
	let htConfirmation = $state('');

	// Car rental edit fields
	let crPickupDate = $state('');
	let crPickupTime = $state('');
	let crReturnDate = $state('');
	let crReturnTime = $state('');
	let crPickupLocation = $state('');
	let crReturnLocation = $state('');
	let crSameDropoff = $state(false);

	let crMinReturnDate = $derived.by(() => {
		if (!crPickupDate) return '';
		const d = new Date(crPickupDate + 'T00:00:00');
		d.setDate(d.getDate() + 1);
		return d.toISOString().split('T')[0];
	});

	// Flight required field logic
	let flOutFromToRequired = $derived(!!flDate);
	let flRetFromToRequired = $derived(!!flRetDate);
	let flOutAllRequired = $derived(item.status === 'finalized');
	let flRetAllRequired = $derived(item.status === 'finalized' && !!flRetDate);

	let crMaxPickupDate = $derived.by(() => {
		if (!crReturnDate) return '';
		const d = new Date(crReturnDate + 'T00:00:00');
		d.setDate(d.getDate() - 1);
		return d.toISOString().split('T')[0];
	});

	function startEdit() {
		if (item.type === 'activity') {
			actTitle = item.title;
			actDate = item.date;
			actStartTime = item.startTime;
			actEndTime = item.endTime;
			actLocation = item.location;
			actNotes = item.notes;
		} else if (item.type === 'flight') {
			flAirline = item.airline;
			flNumber = item.flightNumber;
			flDate = item.date;
			flDepartureTime = item.departureTime;
			flArrivalTime = item.arrivalTime;
			flFrom = item.from;
			flTo = item.to;
			flRetAirline = item.returnAirline || '';
			flRetNumber = item.returnFlightNumber || '';
			flRetDate = item.returnDate || '';
			flRetDepartureTime = item.returnDepartureTime || '';
			flRetArrivalTime = item.returnArrivalTime || '';
			flRetFrom = item.returnFrom || '';
			flRetTo = item.returnTo || '';
			flightTab = flightLeg || 'outbound';
		} else if (item.type === 'hotel') {
			htName = item.name;
			htCheckIn = item.checkInDate;
			htCheckOut = item.checkOutDate;
			htLocation = item.location;
			htConfirmation = item.confirmationNumber;
		} else if (item.type === 'car-rental') {
			crPickupDate = item.pickupDate;
			crPickupTime = item.pickupTime;
			crReturnDate = item.returnDate;
			crReturnTime = item.returnTime;
			crPickupLocation = item.pickupLocation;
			crReturnLocation = item.returnLocation;
			crSameDropoff = item.pickupLocation === item.returnLocation;
		}

		savedScrollY = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${savedScrollY}px`;
		document.body.style.left = '0';
		document.body.style.right = '0';
		document.body.style.overflow = 'hidden';
		editing = true;
	}

	function unlockScroll() {
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.left = '';
		document.body.style.right = '';
		document.body.style.overflow = '';
		window.scrollTo(0, savedScrollY);
	}

	function cancel() {
		editing = false;
		if (!viewing) {
			unlockScroll();
		}
	}

	let showErrors = $state(false);

	function validateFlight(): boolean {
		// Outbound: if date is set, from/to are required
		if (flDate && (!flFrom.trim() || !flTo.trim())) return false;
		// Finalized: all outbound fields required
		if (item.status === 'finalized') {
			if (!flAirline.trim() || !flNumber.trim() || !flDate || !flFrom.trim() || !flTo.trim() || !flDepartureTime || !flArrivalTime) return false;
		}
		// Return: if date is set, from/to are required
		if (flRetDate && (!flRetFrom.trim() || !flRetTo.trim())) return false;
		// Finalized + return date: all return fields required
		if (item.status === 'finalized' && flRetDate) {
			if (!flRetAirline.trim() || !flRetNumber.trim() || !flRetFrom.trim() || !flRetTo.trim() || !flRetDepartureTime || !flRetArrivalTime) return false;
		}
		return true;
	}

	function save() {
		if (item.type === 'flight' && !validateFlight()) {
			showErrors = true;
			return;
		}
		showErrors = false;
		let updated: ItineraryItem;
		if (item.type === 'activity') {
			updated = { ...item, title: actTitle.trim(), date: actDate, startTime: actStartTime, endTime: actEndTime, location: actLocation.trim(), notes: actNotes.trim(), status: item.status };
		} else if (item.type === 'flight') {
			updated = {
				...item,
				airline: flAirline.trim(),
				flightNumber: flNumber.trim(),
				date: flDate,
				departureTime: flDepartureTime,
				arrivalTime: flArrivalTime,
				from: flFrom.trim(),
				to: flTo.trim(),
				returnAirline: flRetAirline.trim() || undefined,
				returnFlightNumber: flRetNumber.trim() || undefined,
				returnDate: flRetDate || undefined,
				returnDepartureTime: flRetDepartureTime || undefined,
				returnArrivalTime: flRetArrivalTime || undefined,
				returnFrom: flRetFrom.trim() || undefined,
				returnTo: flRetTo.trim() || undefined,
				status: item.status
			};
		} else if (item.type === 'hotel') {
			updated = { ...item, name: htName.trim(), checkInDate: htCheckIn, checkOutDate: htCheckOut, location: htLocation.trim(), confirmationNumber: htConfirmation.trim(), status: item.status };
		} else {
			updated = { ...item, pickupDate: crPickupDate, pickupTime: crPickupTime, returnDate: crReturnDate, returnTime: crReturnTime, pickupLocation: crPickupLocation.trim(), returnLocation: crSameDropoff ? crPickupLocation.trim() : crReturnLocation.trim(), status: item.status };
		}
		onsave?.(updated);
		editing = false;
		if (!viewing) {
			unlockScroll();
		}
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) cancel();
	}

	function lockScroll() {
		savedScrollY = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${savedScrollY}px`;
		document.body.style.left = '0';
		document.body.style.right = '0';
		document.body.style.overflow = 'hidden';
	}

	function startView() {
		lockScroll();
		viewing = true;
	}

	function closeView() {
		unlockScroll();
		viewing = false;
		editing = false;
	}

	function changeStatus(newStatus: ItemStatus) {
		const updated = { ...item, status: newStatus };
		onsave?.(updated);
	}

	function handleViewOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) closeView();
	}

	function openEditFromView() {
		// scroll is already locked, keep viewing open so we return to it
		if (item.type === 'activity') {
			actTitle = item.title;
			actDate = item.date;
			actStartTime = item.startTime;
			actEndTime = item.endTime;
			actLocation = item.location;
			actNotes = item.notes;
		} else if (item.type === 'flight') {
			flAirline = item.airline;
			flNumber = item.flightNumber;
			flDate = item.date;
			flDepartureTime = item.departureTime;
			flArrivalTime = item.arrivalTime;
			flFrom = item.from;
			flTo = item.to;
			flRetAirline = item.returnAirline || '';
			flRetNumber = item.returnFlightNumber || '';
			flRetDate = item.returnDate || '';
			flRetDepartureTime = item.returnDepartureTime || '';
			flRetArrivalTime = item.returnArrivalTime || '';
			flRetFrom = item.returnFrom || '';
			flRetTo = item.returnTo || '';
			flightTab = flightLeg || 'outbound';
		} else if (item.type === 'hotel') {
			htName = item.name;
			htCheckIn = item.checkInDate;
			htCheckOut = item.checkOutDate;
			htLocation = item.location;
			htConfirmation = item.confirmationNumber;
		} else if (item.type === 'car-rental') {
			crPickupDate = item.pickupDate;
			crPickupTime = item.pickupTime;
			crReturnDate = item.returnDate;
			crReturnTime = item.returnTime;
			crPickupLocation = item.pickupLocation;
			crReturnLocation = item.returnLocation;
			crSameDropoff = item.pickupLocation === item.returnLocation;
		}

		editing = true;
	}
</script>

<!-- Card (read-only) -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="itinerary-card" onclick={startView} onkeydown={() => {}}>
	<div class="card-type">
		{#if item.type === 'activity'}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="12" cy="12" r="10" />
				<polyline points="12 6 12 12 16 14" />
			</svg>
		{:else if item.type === 'flight'}
			<svg class={flightLeg === 'return' ? 'icon-return' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
			{#if carRentalLeg === 'dropoff'}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h3" />
					<circle cx="6.5" cy="16.5" r="2.5" />
					<circle cx="16.5" cy="16.5" r="2.5" />
					<path d="M12 1v5" />
					<path d="M10 4l2 2 2-2" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h3" />
					<circle cx="6.5" cy="16.5" r="2.5" />
					<circle cx="16.5" cy="16.5" r="2.5" />
				</svg>
			{/if}
		{/if}
		<span class="type-label">{typeLabels[item.type]}{#if item.type === 'flight' && flightLeg}{flightLeg === 'outbound' ? ' · Outbound' : ' · Return'}{/if}{#if item.type === 'car-rental' && carRentalLeg}{carRentalLeg === 'pickup' ? ' · Pickup' : ' · Drop-off'}{/if}</span>
	</div>

	<span class="status-badge" style="background-color: {statusColors[item.status]}">{statusLabels[item.status]}</span>

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
			{#if flightLeg === 'return'}
				<h4 class="item-title">{item.returnAirline} {item.returnFlightNumber}</h4>
				<div class="flight-route">
					<div class="airport">
						<span class="airport-code">{item.returnFrom}</span>
						<span class="airport-time">{formatTime(item.returnDepartureTime || '')}</span>
					</div>
					<div class="flight-line">
						<span class="line"></span>
						<svg class="plane-icon plane-icon-return" viewBox="0 0 24 24" fill="currentColor">
							<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
						</svg>
						<span class="line"></span>
					</div>
					<div class="airport">
						<span class="airport-code">{item.returnTo}</span>
						<span class="airport-time">{formatTime(item.returnArrivalTime || '')}</span>
					</div>
				</div>
			{:else}
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
			{/if}
		{:else if item.type === 'hotel'}
			<h4 class="item-title">{item.name}</h4>
			<div class="item-details">
				<span>{item.location}</span>
			</div>
			{#if item.confirmationNumber}
				<p class="item-notes">Confirmation: {item.confirmationNumber}</p>
			{/if}
		{:else if item.type === 'car-rental'}
			{#if carRentalLeg === 'dropoff'}
				<div class="item-details">
					<span>Drop-off: {formatTime(item.returnTime)} at {item.returnLocation}</span>
				</div>
			{:else}
				<div class="item-details">
					<span>Pickup: {formatTime(item.pickupTime)} at {item.pickupLocation}</span>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Detail View Modal -->
{#if viewing}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={handleViewOverlayClick} onkeydown={() => {}}>
		<div class="modal">
			<div class="modal-header view-header">
				<button class="header-edit-btn" onclick={openEditFromView} aria-label="Edit">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
					</svg>
				</button>
				<h3>{typeLabels[item.type]}{#if item.type === 'flight' && flightLeg}{flightLeg === 'outbound' ? ' · Outbound' : ' · Return'}{/if}{#if item.type === 'car-rental' && carRentalLeg}{carRentalLeg === 'pickup' ? ' · Pickup' : ' · Drop-off'}{/if}</h3>
				<div class="header-edit-spacer"></div>
			</div>

			<div class="modal-body">
			<div class="modal-body-inner">
					{#if item.type === 'activity'}
					<div class="detail-row">
						<span class="detail-label">Title</span>
						<span class="detail-value">{item.title}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Date</span>
						<span class="detail-value">{formatDate(item.date)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Time</span>
						<span class="detail-value">{formatTime(item.startTime)} – {formatTime(item.endTime)}</span>
					</div>
					{#if item.location}
						<div class="detail-row">
							<span class="detail-label">Location</span>
							<span class="detail-value">{item.location}</span>
						</div>
					{/if}
					{#if item.notes}
						<div class="detail-row">
							<span class="detail-label">Notes</span>
							<span class="detail-value">{item.notes}</span>
						</div>
					{/if}
				{:else if item.type === 'flight'}
					{#if flightLeg === 'return'}
						<div class="detail-row">
							<span class="detail-label">Airline</span>
							<span class="detail-value">{item.returnAirline} {item.returnFlightNumber}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Date</span>
							<span class="detail-value">{formatDate(item.returnDate || '')}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">From</span>
							<span class="detail-value">{item.returnFrom} · {formatTime(item.returnDepartureTime || '')}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">To</span>
							<span class="detail-value">{item.returnTo} · {formatTime(item.returnArrivalTime || '')}</span>
						</div>
					{:else}
						<div class="detail-row">
							<span class="detail-label">Airline</span>
							<span class="detail-value">{item.airline} {item.flightNumber}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Date</span>
							<span class="detail-value">{formatDate(item.date)}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">From</span>
							<span class="detail-value">{item.from} · {formatTime(item.departureTime)}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">To</span>
							<span class="detail-value">{item.to} · {formatTime(item.arrivalTime)}</span>
						</div>
					{/if}
				{:else if item.type === 'hotel'}
					<div class="detail-row">
						<span class="detail-label">Hotel</span>
						<span class="detail-value">{item.name}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Check-in</span>
						<span class="detail-value">{formatDate(item.checkInDate)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Check-out</span>
						<span class="detail-value">{formatDate(item.checkOutDate)}</span>
					</div>
					{#if item.location}
						<div class="detail-row">
							<span class="detail-label">Location</span>
							<span class="detail-value">{item.location}</span>
						</div>
					{/if}
					{#if item.confirmationNumber}
						<div class="detail-row">
							<span class="detail-label">Confirmation</span>
							<span class="detail-value">{item.confirmationNumber}</span>
						</div>
					{/if}
				{:else if item.type === 'car-rental'}
					{#if carRentalLeg === 'dropoff'}
						<div class="detail-row">
							<span class="detail-label">Drop-off Date</span>
							<span class="detail-value">{formatDate(item.returnDate)}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Drop-off Time</span>
							<span class="detail-value">{formatTime(item.returnTime)}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Location</span>
							<span class="detail-value">{item.returnLocation}</span>
						</div>
					{:else}
						<div class="detail-row">
							<span class="detail-label">Pickup Date</span>
							<span class="detail-value">{formatDate(item.pickupDate)}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Pickup Time</span>
							<span class="detail-value">{formatTime(item.pickupTime)}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Pickup Location</span>
							<span class="detail-value">{item.pickupLocation}</span>
						</div>
						{#if item.returnDate}
							<div class="detail-row">
								<span class="detail-label">Drop-off Date</span>
								<span class="detail-value">{formatDate(item.returnDate)}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Drop-off Time</span>
								<span class="detail-value">{formatTime(item.returnTime)}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Drop-off Location</span>
								<span class="detail-value">{item.returnLocation}</span>
							</div>
						{/if}
					{/if}
				{/if}

				<div class="status-picker-section">
					<span class="status-picker-label">Status</span>
					<div class="status-picker">
						{#each (['todo', 'voting', 'finalized', 'cancelled'] as const) as s}
							<button
								class="status-option"
								class:active={item.status === s}
								style={item.status === s ? `background-color: ${statusColors[s]}; color: white; border-color: ${statusColors[s]};` : ''}
								onclick={() => changeStatus(s)}
							>
								{statusLabels[s]}
							</button>
						{/each}
					</div>
				</div>
			</div>
			</div>

			<div class="modal-footer">
				<button class="btn-save" onclick={closeView}>Done</button>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Modal -->
{#if editing}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={handleOverlayClick} onkeydown={() => {}}>
		<div class="modal">
			<div class="modal-header">
				<h3>Edit {typeLabels[item.type]}</h3>
			</div>

			<div class="modal-body">
			<div class="modal-body-inner">
				{#if item.type === 'activity'}
					<div class="field">
						<label>Title / Location</label>
						<input type="text" bind:value={actTitle} />
					</div>
					<div class="field">
						<label>Date</label>
						<input type="date" bind:value={actDate} />
					</div>
					<div class="field-row">
						<div class="field">
							<label>Start Time</label>
							<select bind:value={actStartTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
						</div>
						<div class="field">
							<label>End Time</label>
							<select bind:value={actEndTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
						</div>
					</div>
					<div class="field">
						<label>Notes</label>
						<input type="text" bind:value={actNotes} />
					</div>
				{:else if item.type === 'flight'}
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
								<label class:required={flOutAllRequired}>Airline</label>
								<input type="text" bind:value={flAirline} class:input-error={showErrors && flOutAllRequired && !flAirline.trim()} />
							</div>
							<div class="field">
								<label class:required={flOutAllRequired}>Flight #</label>
								<input type="text" bind:value={flNumber} class:input-error={showErrors && flOutAllRequired && !flNumber.trim()} />
							</div>
						</div>
						<div class="field">
							<label class:required={flOutAllRequired}>Date</label>
							<input type="date" bind:value={flDate} class:input-error={showErrors && flOutAllRequired && !flDate} />
						</div>
						<div class="field-row">
							<div class="field">
								<label class:required={flOutFromToRequired || flOutAllRequired}>From</label>
								<input type="text" bind:value={flFrom} class:input-error={showErrors && (flOutFromToRequired || flOutAllRequired) && !flFrom.trim()} />
							</div>
							<div class="field">
								<label class:required={flOutFromToRequired || flOutAllRequired}>To</label>
								<input type="text" bind:value={flTo} class:input-error={showErrors && (flOutFromToRequired || flOutAllRequired) && !flTo.trim()} />
							</div>
						</div>
						<div class="field-row">
							<div class="field">
								<label class:required={flOutAllRequired}>Departure</label>
								<select bind:value={flDepartureTime} class:input-error={showErrors && flOutAllRequired && !flDepartureTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
							</div>
							<div class="field">
								<label class:required={flOutAllRequired}>Arrival</label>
								<select bind:value={flArrivalTime} class:input-error={showErrors && flOutAllRequired && !flArrivalTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
							</div>
						</div>
					{:else}
						<div class="field-row">
							<div class="field">
								<label class:required={flRetAllRequired}>Airline</label>
								<input type="text" bind:value={flRetAirline} class:input-error={showErrors && flRetAllRequired && !flRetAirline.trim()} />
							</div>
							<div class="field">
								<label class:required={flRetAllRequired}>Flight #</label>
								<input type="text" bind:value={flRetNumber} class:input-error={showErrors && flRetAllRequired && !flRetNumber.trim()} />
							</div>
						</div>
						<div class="field">
							<label>Date</label>
							<input type="date" bind:value={flRetDate} />
						</div>
						<div class="field-row">
							<div class="field">
								<label class:required={flRetFromToRequired || flRetAllRequired}>From</label>
								<input type="text" bind:value={flRetFrom} class:input-error={showErrors && (flRetFromToRequired || flRetAllRequired) && !flRetFrom.trim()} />
							</div>
							<div class="field">
								<label class:required={flRetFromToRequired || flRetAllRequired}>To</label>
								<input type="text" bind:value={flRetTo} class:input-error={showErrors && (flRetFromToRequired || flRetAllRequired) && !flRetTo.trim()} />
							</div>
						</div>
						<div class="field-row">
							<div class="field">
								<label class:required={flRetAllRequired}>Departure</label>
								<select bind:value={flRetDepartureTime} class:input-error={showErrors && flRetAllRequired && !flRetDepartureTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
							</div>
							<div class="field">
								<label class:required={flRetAllRequired}>Arrival</label>
								<select bind:value={flRetArrivalTime} class:input-error={showErrors && flRetAllRequired && !flRetArrivalTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
							</div>
						</div>
					{/if}
				{:else if item.type === 'hotel'}
					<div class="field">
						<label>Hotel Name</label>
						<input type="text" bind:value={htName} />
					</div>
					<div class="field-row">
						<div class="field">
							<label>Check-in</label>
							<input type="date" bind:value={htCheckIn} />
						</div>
						<div class="field">
							<label>Check-out</label>
							<input type="date" bind:value={htCheckOut} />
						</div>
					</div>
					<div class="field">
						<label>Location</label>
						<input type="text" bind:value={htLocation} />
					</div>
					<div class="field">
						<label>Confirmation #</label>
						<input type="text" bind:value={htConfirmation} />
					</div>
				{:else if item.type === 'car-rental'}
					<div class="field">
						<label>Pickup Location</label>
						<input type="text" bind:value={crPickupLocation} />
					</div>
					<div class="field-row">
						<div class="field">
							<label>Pickup Date</label>
							<input type="date" bind:value={crPickupDate} max={crMaxPickupDate} />
						</div>
						<div class="field">
							<label>Pickup Time</label>
							<select bind:value={crPickupTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
						</div>
					</div>
					<label class="checkbox-row">
						<input type="checkbox" bind:checked={crSameDropoff} />
						<span>Same drop-off location</span>
					</label>
					{#if !crSameDropoff}
						<div class="field">
							<label>Return Location</label>
							<input type="text" bind:value={crReturnLocation} />
						</div>
					{/if}
					<div class="field-row">
						<div class="field">
							<label>Return Date</label>
							<input type="date" bind:value={crReturnDate} min={crMinReturnDate} />
						</div>
						<div class="field">
							<label>Return Time</label>
							<select bind:value={crReturnTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
						</div>
					</div>
				{/if}
			</div>
			</div>

			<div class="modal-footer">
				<button class="btn-save" onclick={save}>Save</button>
				<button class="btn-cancel" onclick={cancel}>Cancel</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.itinerary-card {
		background: var(--color-surface);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.itinerary-card:active {
		border-color: var(--color-primary);
	}

	.card-type {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
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

	.status-badge {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		color: white;
		padding: 1px 7px;
		border-radius: var(--radius-full);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		line-height: 1.4;
		margin-top: 2px;
		margin-bottom: var(--space-sm);
	}

	.edit-btn {
		margin-left: auto;
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		border-radius: var(--radius-sm);
		transition: color 0.2s;
	}

	.edit-btn:hover {
		color: var(--color-primary);
	}

	.edit-btn svg {
		width: 16px;
		height: 16px;
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
		transform: rotate(45deg);
	}

	.plane-icon-return {
		transform: rotate(135deg);
	}

	.icon-return {
		transform: rotate(90deg);
	}

	/* Modal styles */
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

	.view-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-edit-btn {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		border-radius: var(--radius-sm);
		transition: color 0.2s;
	}

	.header-edit-btn:hover {
		color: var(--color-primary);
	}

	.header-edit-btn svg {
		width: 18px;
		height: 18px;
	}

	.header-edit-spacer {
		width: 26px;
	}

	.modal-body {
		padding: var(--space-md);
		overflow-y: auto;
		overflow-x: hidden;
		flex: 1 1 0;
		min-height: 0;
	}

	.modal-body-inner {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.modal-footer {
		padding: var(--space-md);
		border-top: 1px solid var(--color-border);
		display: flex;
		gap: var(--space-sm);
		flex-shrink: 0;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		flex: 1;
		min-width: 0;
	}

	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}

	.modal label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.modal input,
	.modal select {
		padding: 12px 14px;
		min-width: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: var(--font-base);
		outline: none;
		transition: border-color 0.2s;
		color-scheme: dark;
	}

	.modal input:focus,
	.modal select:focus {
		border-color: var(--color-primary);
	}

	.modal label.required::after {
		content: ' *';
		color: var(--color-danger, #ef4444);
	}

	.modal input.input-error,
	.modal select.input-error {
		border-color: var(--color-danger, #ef4444);
	}

	.checkbox-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-base);
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.checkbox-row input[type='checkbox'] {
		width: 18px;
		height: 18px;
		padding: 0;
		cursor: pointer;
		accent-color: var(--color-primary);
	}

	.btn-save {
		flex: 1;
		padding: 14px;
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--font-base);
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-save:hover {
		background: var(--color-primary-dark);
	}

	.btn-cancel {
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

	.status-picker-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-top: var(--space-sm);
		padding-top: var(--space-md);
		border-top: 1px solid var(--color-border);
	}

	.status-picker-label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-muted);
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
		background: var(--color-bg);
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

	/* Detail view */
	.detail-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.detail-value {
		font-size: var(--font-base);
		color: var(--color-text);
	}
</style>
