<script lang="ts">
	import { page } from '$app/state';
	import { events, updateItineraryItem, addItineraryItem, addTribeMember, updateEvent, addTribeGroup, deleteTribeGroup, renameTribeGroup, assignMemberToTribe, updateTribeMember, deleteTribeMember, detailsExpanded } from '$lib/stores/events';
	import ItineraryItemCard from '$lib/components/ItineraryItemCard.svelte';
	import { formatDateRange, getDayCount, getDateRange, getItemsForDate, formatDate, generateId, timeOptions, formatTime } from '$lib/utils';
	import type { Event, ItineraryItem, RSVPStatus, ItemStatus, FlightItem, TribeMember, ChecklistItem, ChecklistState } from '$lib/types';

	let event = $derived($events.find((e) => e.id === page.params.id));
	let dayCount = $derived(event ? getDayCount(event.startDate, event.endDate) : 0);
	let dates = $derived(event ? getDateRange(event.startDate, event.endDate) : []);

	let showTribe = $state(false);
	let showEdit = $state(false);
	let showPrint = $state(false);
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

	function openPrint() {
		savedScrollY = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${savedScrollY}px`;
		document.body.style.left = '0';
		document.body.style.right = '0';
		document.body.style.overflow = 'hidden';
		showPrint = true;
	}

	function closePrint() {
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.left = '';
		document.body.style.right = '';
		document.body.style.overflow = '';
		window.scrollTo(0, savedScrollY);
		showPrint = false;
	}

	function handlePrintOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) closePrint();
	}

	function doPrint() {
		window.print();
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

	// Tribe management
	let tribeManageMode = $state(false);
	let newTribeName = $state('');
	let selectedTribeId = $state<string | null>(null);
	let editTribeName = $state('');
	let pendingAssignments = $state<Set<string>>(new Set());

	function selectTribeForEdit(groupId: string) {
		const group = event?.tribeGroups.find((g) => g.id === groupId);
		selectedTribeId = groupId;
		editTribeName = group?.name ?? '';
		pendingAssignments = new Set();
	}

	function cancelTribeEdit() {
		selectedTribeId = null;
		editTribeName = '';
		pendingAssignments = new Set();
	}

	function saveTribeEdit() {
		if (!event || !selectedTribeId) return;
		if (editTribeName.trim()) {
			renameTribeGroup(event.id, selectedTribeId, editTribeName.trim());
		}
		for (const memberId of pendingAssignments) {
			assignMemberToTribe(event.id, memberId, selectedTribeId);
		}
		selectedTribeId = null;
		editTribeName = '';
		pendingAssignments = new Set();
	}

	function togglePendingAssignment(memberId: string) {
		const next = new Set(pendingAssignments);
		if (next.has(memberId)) {
			next.delete(memberId);
		} else {
			next.add(memberId);
		}
		pendingAssignments = next;
	}

	let unassignedMembers = $derived(event ? event.tribe.filter((m) => !m.tribeId) : []);

	let groupedMembers = $derived.by(() => {
		if (!event || event.tribeGroups.length === 0) return [];
		const groups: { id: string | null; name: string; members: TribeMember[] }[] = [];
		for (const g of event.tribeGroups) {
			groups.push({ id: g.id, name: g.name, members: event.tribe.filter((m) => m.tribeId === g.id) });
		}
		const unassigned = event.tribe.filter((m) => !m.tribeId);
		groups.push({ id: null, name: 'Unassigned', members: unassigned });
		return groups;
	});

	function addNewTribeGroup() {
		if (!event || !newTribeName.trim()) return;
		addTribeGroup(event.id, newTribeName.trim());
		newTribeName = '';
	}

	let memberTribeId = $state('');

	function startAddMember() {
		memberFirstName = '';
		memberLastName = '';
		memberEmail = '';
		memberPhone = '';
		memberTribeId = '';
		showMemberErrors = false;
		addingMember = true;
	}

	function cancelAddMember() {
		addingMember = false;
	}

	// View / edit member
	let viewingMemberId = $state<string | null>(null);
	let editingMember = $state(false);
	let editMemberFirstName = $state('');
	let editMemberLastName = $state('');
	let editMemberEmail = $state('');
	let editMemberPhone = $state('');
	let editMemberRsvp = $state<RSVPStatus>('pending');
	let editMemberTribeId = $state('');
	let showEditMemberErrors = $state(false);

	let viewingMember = $derived(event?.tribe.find((m) => m.id === viewingMemberId) ?? null);

	function openMemberDetail(memberId: string) {
		viewingMemberId = memberId;
		editingMember = false;
	}

	function closeMemberDetail() {
		viewingMemberId = null;
		editingMember = false;
	}

	function startEditMember() {
		if (!viewingMember) return;
		editMemberFirstName = viewingMember.firstName;
		editMemberLastName = viewingMember.lastName;
		editMemberEmail = viewingMember.email ?? '';
		editMemberPhone = viewingMember.phone ?? '';
		editMemberRsvp = viewingMember.rsvp;
		editMemberTribeId = viewingMember.tribeId ?? '';
		showEditMemberErrors = false;
		editingMember = true;
	}

	function cancelEditMember() {
		editingMember = false;
	}

	function saveEditMember() {
		if (!editMemberFirstName.trim() || !editMemberLastName.trim()) {
			showEditMemberErrors = true;
			return;
		}
		if (!event || !viewingMemberId) return;
		updateTribeMember(event.id, viewingMemberId, {
			firstName: editMemberFirstName.trim(),
			lastName: editMemberLastName.trim(),
			email: editMemberEmail.trim() || undefined,
			phone: editMemberPhone.trim() || undefined,
			rsvp: editMemberRsvp,
			tribeId: editMemberTribeId || undefined
		});
		editingMember = false;
	}

	function removeCurrentMember() {
		if (!event || !viewingMemberId) return;
		deleteTribeMember(event.id, viewingMemberId);
		viewingMemberId = null;
		editingMember = false;
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
			rsvp: 'pending',
			tribeId: memberTribeId || undefined
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

	function startAddForDay(date: string) {
		resetAddItemFields();
		addingForDate = date;
		addingType = 'activity';
		savedScrollY = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${savedScrollY}px`;
		document.body.style.left = '0';
		document.body.style.right = '0';
		document.body.style.overflow = 'hidden';
	}

	function switchAddType(type: ItineraryItem['type']) {
		resetAddItemFields();
		addingType = type;
	}

	function cancelAddItem() {
		addingType = null;
		addingForDate = null;
		resetAddItemFields();
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.left = '';
		document.body.style.right = '';
		document.body.style.overflow = '';
		window.scrollTo(0, savedScrollY);
	}

	function handleAddItemOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) cancelAddItem();
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

	// Print style switching
	const printStyles = ['classic', 'modern', 'elegant', 'minimal', 'botanical', 'retro', 'midnight'] as const;
	let printStyleIndex = $state(0);
	let printStyle = $derived(printStyles[printStyleIndex]);

	function prevStyle() {
		printStyleIndex = (printStyleIndex - 1 + printStyles.length) % printStyles.length;
	}

	function nextStyle() {
		printStyleIndex = (printStyleIndex + 1) % printStyles.length;
	}

	// Day title editing
	let editingDayDate = $state<string | null>(null);
	let editingDayIndex = $state(0);
	let editingDayTitle = $state('');

	function startEditDayTitle(date: string) {
		editingDayIndex = dates.indexOf(date) + 1;
		editingDayTitle = event?.dayTitles?.[date] ?? '';
		editingDayDate = date;
	}

	function saveDayTitle() {
		if (!event || !editingDayDate) return;
		const titles = { ...(event.dayTitles ?? {}) };
		const trimmed = editingDayTitle.trim();
		if (trimmed) {
			titles[editingDayDate] = trimmed;
		} else {
			delete titles[editingDayDate];
		}
		updateEvent(event.id, { dayTitles: titles });
		editingDayDate = null;
	}

	function cancelEditDayTitle() {
		editingDayDate = null;
	}

	function handleDayTitleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) cancelEditDayTitle();
	}

	// Wedding checklist
	const DEFAULT_WEDDING_CHECKLIST: ChecklistItem[] = [
		{ id: 'wc1', label: 'Set wedding budget', checked: false },
		{ id: 'wc2', label: 'Book ceremony & reception venues', checked: false },
		{ id: 'wc3', label: 'Hire photographer & videographer', checked: false },
		{ id: 'wc4', label: 'Send save-the-dates', checked: false },
		{ id: 'wc5', label: 'Send invitations', checked: false },
		{ id: 'wc6', label: 'Book caterer & tastings', checked: false },
		{ id: 'wc7', label: 'Book DJ or band', checked: false },
		{ id: 'wc8', label: 'Order wedding cake', checked: false },
		{ id: 'wc9', label: 'Choose wedding attire', checked: false },
		{ id: 'wc10', label: 'Arrange florals & decorations', checked: false },
		{ id: 'wc11', label: 'Plan rehearsal dinner', checked: false },
		{ id: 'wc12', label: 'Obtain marriage license', checked: false },
		{ id: 'wc13', label: 'Create seating chart', checked: false },
		{ id: 'wc14', label: 'Arrange transportation', checked: false },
		{ id: 'wc15', label: 'Write vows', checked: false }
	];

	let showChecklist = $state(false);

	function openChecklist() {
		if (!event) return;
		if (!event.checklist) {
			updateEvent(event.id, { checklist: DEFAULT_WEDDING_CHECKLIST.map(item => ({ ...item })) });
		}
		savedScrollY = window.scrollY;
		document.body.style.position = 'fixed';
		document.body.style.top = `-${savedScrollY}px`;
		document.body.style.left = '0';
		document.body.style.right = '0';
		document.body.style.overflow = 'hidden';
		showChecklist = true;
	}

	function closeChecklist() {
		document.body.style.position = '';
		document.body.style.top = '';
		document.body.style.left = '';
		document.body.style.right = '';
		document.body.style.overflow = '';
		window.scrollTo(0, savedScrollY);
		showChecklist = false;
	}

	function handleChecklistOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) closeChecklist();
	}

	function toggleChecklistItem(id: string) {
		if (!event || !event.checklist) return;
		const updated = event.checklist.map(item =>
			item.id === id ? { ...item, checked: !item.checked } : item
		);
		updateEvent(event.id, { checklist: updated });
	}

	let checklistEditMode = $state(false);
	let newChecklistLabel = $state('');
	let renamingChecklistId = $state<string | null>(null);
	let renamingChecklistLabel = $state('');

	function addChecklistItem() {
		if (!event || !event.checklist || !newChecklistLabel.trim()) return;
		const id = 'wc' + Math.random().toString(36).substring(2, 8);
		const newItem: ChecklistItem = { id, label: newChecklistLabel.trim(), checked: false };
		if (event.checklistMode === 'states' && event.checklistStates?.length) {
			newItem.stateId = event.checklistStates[0].id;
		}
		updateEvent(event.id, { checklist: [...event.checklist, newItem] });
		newChecklistLabel = '';
	}

	function removeChecklistItem(id: string) {
		if (!event || !event.checklist) return;
		updateEvent(event.id, { checklist: event.checklist.filter(item => item.id !== id) });
	}

	let dragChecklistIndex = $state<number | null>(null);
	let dragOverChecklistIndex = $state<number | null>(null);

	function handleChecklistDragStart(index: number) {
		dragChecklistIndex = index;
	}

	function handleChecklistDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		dragOverChecklistIndex = index;
	}

	function handleChecklistDrop(index: number) {
		if (!event || !event.checklist || dragChecklistIndex === null || dragChecklistIndex === index) {
			dragChecklistIndex = null;
			dragOverChecklistIndex = null;
			return;
		}
		const items = [...event.checklist];
		const [moved] = items.splice(dragChecklistIndex, 1);
		items.splice(index, 0, moved);
		updateEvent(event.id, { checklist: items });
		dragChecklistIndex = null;
		dragOverChecklistIndex = null;
	}

	function handleChecklistDragEnd() {
		dragChecklistIndex = null;
		dragOverChecklistIndex = null;
	}

	// Touch drag support for mobile
	function handleChecklistTouchStart(e: TouchEvent, index: number) {
		const handle = (e.target as HTMLElement).closest('.checklist-drag-handle');
		if (!handle) return;
		dragChecklistIndex = index;
	}

	function handleChecklistTouchMove(e: TouchEvent) {
		if (dragChecklistIndex === null || !event?.checklist) return;
		e.preventDefault();
		const y = e.touches[0].clientY;
		const items = document.querySelectorAll('.checklist-edit-row');
		for (let i = 0; i < items.length; i++) {
			const rect = items[i].getBoundingClientRect();
			if (y >= rect.top && y <= rect.bottom && i !== dragChecklistIndex) {
				dragOverChecklistIndex = i;
				return;
			}
		}
	}

	function nonPassiveTouchMove(node: HTMLElement) {
		node.addEventListener('touchmove', handleChecklistTouchMove as EventListener, { passive: false });
		return {
			destroy() {
				node.removeEventListener('touchmove', handleChecklistTouchMove as EventListener);
			}
		};
	}

	function handleChecklistTouchEnd() {
		if (dragChecklistIndex !== null && dragOverChecklistIndex !== null && dragChecklistIndex !== dragOverChecklistIndex) {
			handleChecklistDrop(dragOverChecklistIndex);
		} else {
			dragChecklistIndex = null;
			dragOverChecklistIndex = null;
		}
	}

	function startRenameChecklist(id: string, label: string) {
		renamingChecklistId = id;
		renamingChecklistLabel = label;
	}

	function saveRenameChecklist() {
		if (!event || !event.checklist || !renamingChecklistId || !renamingChecklistLabel.trim()) return;
		updateEvent(event.id, { checklist: event.checklist.map(item =>
			item.id === renamingChecklistId ? { ...item, label: renamingChecklistLabel.trim() } : item
		) });
		renamingChecklistId = null;
		renamingChecklistLabel = '';
	}

	function cancelRenameChecklist() {
		renamingChecklistId = null;
		renamingChecklistLabel = '';
	}

	// Checklist states
	const DEFAULT_CHECKLIST_STATES: ChecklistState[] = [
		{ id: 'todo', label: 'Todo', color: '#6b7280' },
		{ id: 'progress', label: 'Progress', color: '#f59e0b' },
		{ id: 'completed', label: 'Completed', color: '#22c55e' }
	];

	let statePickerItemId = $state<string | null>(null);
	let newStateName = $state('');
	let editingStateId = $state<string | null>(null);
	let editingStateLabel = $state('');
	let editingStateColor = $state('');
	let showModePicker = $state(false);
	let showStatesEditor = $state(false);

	function selectChecklistMode(mode: 'simple' | 'states') {
		if (!event) return;
		const updates: Partial<Event> = { checklistMode: mode } as any;
		if (mode === 'states' && !event.checklistStates?.length) {
			updates.checklistStates = DEFAULT_CHECKLIST_STATES.map(s => ({ ...s }));
			if (event.checklist) {
				updates.checklist = event.checklist.map(item => ({
					...item,
					stateId: item.stateId ?? 'todo'
				}));
			}
		}
		updateEvent(event.id, updates);
		showModePicker = false;
	}

	function addChecklistState() {
		if (!event || !newStateName.trim() || !event.checklistStates) return;
		const id = 'cs' + Math.random().toString(36).substring(2, 8);
		updateEvent(event.id, {
			checklistStates: [...event.checklistStates, { id, label: newStateName.trim(), color: '#6b7280' }]
		});
		newStateName = '';
	}

	function startEditState(id: string) {
		const state = event?.checklistStates?.find(s => s.id === id);
		if (!state) return;
		editingStateId = id;
		editingStateLabel = state.label;
		editingStateColor = state.color;
	}

	function saveEditState() {
		if (!event || !event.checklistStates || !editingStateId || !editingStateLabel.trim()) return;
		updateEvent(event.id, {
			checklistStates: event.checklistStates.map(s =>
				s.id === editingStateId ? { ...s, label: editingStateLabel.trim(), color: editingStateColor } : s
			)
		});
		editingStateId = null;
		editingStateLabel = '';
		editingStateColor = '';
	}

	function removeChecklistState(id: string) {
		if (!event || !event.checklistStates || event.checklistStates.length <= 1) return;
		const remaining = event.checklistStates.filter(s => s.id !== id);
		const firstId = remaining[0].id;
		const updatedChecklist = event.checklist?.map(item =>
			item.stateId === id ? { ...item, stateId: firstId } : item
		);
		updateEvent(event.id, {
			checklistStates: remaining,
			checklist: updatedChecklist
		});
	}

	function setItemState(itemId: string, stateId: string) {
		if (!event || !event.checklist || !event.checklistStates) return;
		const lastStateId = event.checklistStates[event.checklistStates.length - 1].id;
		const updated = event.checklist.map(item =>
			item.id === itemId ? { ...item, stateId, checked: stateId === lastStateId } : item
		);
		updateEvent(event.id, { checklist: updated });
		statePickerItemId = null;
	}

	function toggleStatePicker(itemId: string) {
		statePickerItemId = statePickerItemId === itemId ? null : itemId;
	}

	function updateStateColor(stateId: string, color: string) {
		if (!event || !event.checklistStates) return;
		updateEvent(event.id, {
			checklistStates: event.checklistStates.map(s =>
				s.id === stateId ? { ...s, color } : s
			)
		});
	}

	let checklistProgress = $derived.by(() => {
		if (!event?.checklist) return { done: 0, total: 0 };
		const total = event.checklist.length;
		if (event.checklistMode === 'states' && event.checklistStates?.length) {
			const lastStateId = event.checklistStates[event.checklistStates.length - 1].id;
			const done = event.checklist.filter(item => item.stateId === lastStateId).length;
			return { done, total };
		}
		const done = event.checklist.filter(item => item.checked).length;
		return { done, total };
	});

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
			<button class="tribe-btn" onclick={openTribe} aria-label="View Members">
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
				<div class="header-top-right">
					<span class="category-badge" style="background-color: {categoryColors[event.category]}">
						{event.category}
					</span>
				</div>
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
						<span>{event.tribe.length} members</span>
					</div>
				</div>
				<button class="details-toggle" onclick={() => detailsExpanded.update(v => !v)} aria-label={$detailsExpanded ? 'Collapse details' : 'Expand details'}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class:details-toggle-collapsed={!$detailsExpanded}>
						<polyline points="6 9 12 15 18 9" />
					</svg>
					{$detailsExpanded ? 'Less' : 'More'}
				</button>
			{#if $detailsExpanded}
				<p class="event-description">{event.description}</p>
			{/if}
		</header>


		{#if event.category === 'wedding'}
			<div class="wedding-actions">
				<button class="wedding-action-btn checklist-btn" onclick={openChecklist}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 11l3 3L22 4" />
						<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
					</svg>
					Checklist
					{#if checklistProgress.total > 0}
						<span class="checklist-badge">{checklistProgress.done}/{checklistProgress.total}</span>
					{/if}
				</button>
				<button class="wedding-action-btn edit-action-btn" onclick={openEdit}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
					</svg>
					Edit
				</button>
			</div>
		{/if}

		<section class="itinerary-section">
			<div class="agenda-header">
				<h2>Agenda</h2>
				<div class="agenda-actions">
					<button class="edit-btn" onclick={openPrint} aria-label="Print Event">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="6 9 6 2 18 2 18 9" />
							<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
							<rect x="6" y="14" width="12" height="8" />
						</svg>
					</button>
					{#if event.category !== 'wedding'}
						<button class="edit-btn" onclick={openEdit} aria-label="Edit Event">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
								<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
							</svg>
						</button>
					{/if}
				</div>
			</div>
			{#each dates as date, i}
				{@const dayItems = getItemsForDate(event.itinerary, date)}
				<div class="day-section">
					<button class="day-header" onclick={() => startEditDayTitle(date)}>
						<span class="day-label">Day {i + 1}{#if event.dayTitles?.[date]}&nbsp;- {event.dayTitles[date]}{/if}</span>
						<span class="day-date">{formatDate(date)}</span>
					</button>
					{#if dayItems.length > 0}
						<div class="day-items">
							{#each dayItems as entry (entry.item.id + (entry.flightLeg || ''))}
								<ItineraryItemCard item={entry.item} flightLeg={entry.flightLeg} carRentalLeg={entry.carRentalLeg} onsave={handleItemSave} />
							{/each}
						</div>
					{/if}
					<div class="day-add-row">
						<button type="button" class="day-add-btn" onclick={() => startAddForDay(date)}>+ Add</button>
					</div>
				</div>
			{/each}
		</section>
		{#if addingType !== null}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-overlay" onclick={handleAddItemOverlayClick} onkeydown={() => {}}>
				<div class="modal">
					<div class="modal-header">
						<div class="item-type-tabs">
							<button type="button" class="item-type-tab" class:active={addingType === 'activity'} onclick={() => switchAddType('activity')}>Activity</button>
							<button type="button" class="item-type-tab" class:active={addingType === 'flight'} onclick={() => switchAddType('flight')}>Flight</button>
							<button type="button" class="item-type-tab" class:active={addingType === 'hotel'} onclick={() => switchAddType('hotel')}>Hotel</button>
							<button type="button" class="item-type-tab" class:active={addingType === 'car-rental'} onclick={() => switchAddType('car-rental')}>Car Rental</button>
						</div>
					</div>
					<div class="modal-body">
						<div class="edit-form">
							{#if addingType === 'activity'}
								<div class="edit-field">
									<label class="edit-label">Title</label>
									<input type="text" bind:value={actTitle} placeholder="Activity name" />
								</div>
								<div class="edit-field-row">
									<div class="edit-field">
										<label class="edit-label">Start Time</label>
										<select bind:value={actStartTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
									</div>
									<div class="edit-field">
										<label class="edit-label">End Time</label>
										<select bind:value={actEndTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
									</div>
								</div>
								<div class="edit-field">
									<label class="edit-label">Location</label>
									<input type="text" bind:value={actLocation} placeholder="Where?" />
								</div>
								<div class="edit-field">
									<label class="edit-label">Notes</label>
									<input type="text" bind:value={actNotes} placeholder="Optional notes" />
								</div>
							{:else if addingType === 'flight'}
								<div class="edit-field-row">
									<div class="edit-field">
										<label class="edit-label">Airline</label>
										<input type="text" bind:value={flAirline} placeholder="e.g. United" />
									</div>
									<div class="edit-field">
										<label class="edit-label">Flight #</label>
										<input type="text" bind:value={flNumber} placeholder="e.g. UA 482" />
									</div>
								</div>
								<div class="edit-field-row">
									<div class="edit-field">
										<label class="edit-label">From</label>
										<input type="text" bind:value={flFrom} placeholder="e.g. JFK" />
									</div>
									<div class="edit-field">
										<label class="edit-label">To</label>
										<input type="text" bind:value={flTo} placeholder="e.g. SFO" />
									</div>
								</div>
								<div class="edit-field-row">
									<div class="edit-field">
										<label class="edit-label">Departure</label>
										<select bind:value={flDepartureTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
									</div>
									<div class="edit-field">
										<label class="edit-label">Arrival</label>
										<select bind:value={flArrivalTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
									</div>
								</div>
							{:else if addingType === 'hotel'}
								<div class="edit-field">
									<label class="edit-label">Hotel Name</label>
									<input type="text" bind:value={htName} placeholder="Hotel name" />
								</div>
								<div class="edit-field">
									<label class="edit-label">Check-out</label>
									<input type="date" bind:value={htCheckOut} min={addingForDate || ''} />
								</div>
								<div class="edit-field">
									<label class="edit-label">Location</label>
									<input type="text" bind:value={htLocation} placeholder="Hotel location" />
								</div>
								<div class="edit-field">
									<label class="edit-label">Confirmation #</label>
									<input type="text" bind:value={htConfirmation} placeholder="Optional" />
								</div>
							{:else if addingType === 'car-rental'}
								<div class="edit-field">
									<label class="edit-label">Pickup Location</label>
									<input type="text" bind:value={crPickupLocation} placeholder="Pickup location" />
								</div>
								<div class="edit-field">
									<label class="edit-label">Pickup Time</label>
									<select bind:value={crPickupTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
								</div>
								<label class="add-checkbox-row"><input type="checkbox" bind:checked={crSameDropoff} /><span>Same drop-off location</span></label>
								{#if !crSameDropoff}
									<div class="edit-field">
										<label class="edit-label">Return Location</label>
										<input type="text" bind:value={crReturnLocation} placeholder="Return location" />
									</div>
								{/if}
								<div class="edit-field-row">
									<div class="edit-field">
										<label class="edit-label">Return Date</label>
										<input type="date" bind:value={crReturnDate} min={addingForDate || ''} />
									</div>
									<div class="edit-field">
										<label class="edit-label">Return Time</label>
										<select bind:value={crReturnTime}><option value="">--:--</option>{#each timeOptions as t}<option value={t}>{formatTime(t)}</option>{/each}</select>
									</div>
								</div>
							{/if}
							<div class="add-status-section">
								<label class="add-status-label">Status</label>
								<div class="add-status-picker">
									{#each (['todo', 'voting', 'finalized', 'cancelled'] as const) as s}
										<button type="button" class="add-status-option" class:active={addItemStatus === s} style={addItemStatus === s ? `color: ${statusColors[s]}; border-color: ${statusColors[s]}` : ''} onclick={() => (addItemStatus = s)}>{statusLabels[s]}</button>
									{/each}
								</div>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<button class="btn-footer-add" onclick={() => { if (addingType === 'activity') saveActivity(); else if (addingType === 'flight') saveFlight(); else if (addingType === 'hotel') saveHotel(); else if (addingType === 'car-rental') saveCarRental(); }}>Add</button>
						<button class="btn-footer-close" onclick={cancelAddItem}>Cancel</button>
					</div>
				</div>
			</div>
		{/if}
		{#if editingDayDate !== null}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-overlay" onclick={handleDayTitleOverlayClick} onkeydown={() => {}}>
				<div class="modal">
					<div class="modal-header">
						<h3>Day {editingDayIndex} Title</h3>
					</div>
					<div class="modal-body">
						<div class="edit-form">
							<div class="edit-field">
								<label class="edit-label">Title</label>
								<!-- svelte-ignore a11y_autofocus -->
								<input type="text" bind:value={editingDayTitle} placeholder="e.g. Arrival, Beach Day..." autofocus onkeydown={(e) => { if (e.key === 'Enter') saveDayTitle(); }} />
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<button class="btn-footer-add" onclick={saveDayTitle}>Submit</button>
						<button class="btn-footer-close" onclick={cancelEditDayTitle}>Cancel</button>
					</div>
				</div>
			</div>
		{/if}
		{#if showTribe}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-overlay" onclick={handleTribeOverlayClick} onkeydown={() => {}}>
				<div class="modal">
					<div class="modal-header">
						{#if tribeManageMode && selectedTribeId}
							<h3>Edit Tribe</h3>
						{:else if tribeManageMode}
							<h3>Manage Tribes</h3>
						{:else if viewingMemberId && viewingMember}
							<h3>{editingMember ? 'Edit Member' : viewingMember.firstName + ' ' + viewingMember.lastName}</h3>
						{:else}
							<div class="modal-header-row">
								<h3>Members</h3>
								<button class="tribe-manage-btn" onclick={() => (tribeManageMode = true)}>Tribes</button>
							</div>
						{/if}
					</div>
					<div class="modal-body">
						{#if tribeManageMode && selectedTribeId}
							<div class="member-field">
								<label class="member-label">Tribe Name</label>
								<input type="text" bind:value={editTribeName} placeholder="Tribe name" />
							</div>
							<div class="manage-section-title">Add Members</div>
							{#if unassignedMembers.length === 0}
								<p class="empty-tribe">No unassigned members.</p>
							{:else}
								{#each unassignedMembers as member (member.id)}
									<label class="assign-checkbox-row">
										<div class="member-avatar" style="width: 28px; height: 28px; font-size: 0.65rem;">
											{member.firstName[0]}{member.lastName[0]}
										</div>
										<span class="assign-member-name">{member.firstName} {member.lastName}</span>
										<input type="checkbox" checked={pendingAssignments.has(member.id)} onchange={() => togglePendingAssignment(member.id)} />
									</label>
								{/each}
							{/if}
						{:else if tribeManageMode}
							<div class="add-tribe-row">
								<input type="text" bind:value={newTribeName} placeholder="New tribe name" onkeydown={(e) => { if (e.key === 'Enter') addNewTribeGroup(); }} />
								<button class="btn-footer-add" onclick={addNewTribeGroup}>Add</button>
							</div>
							<div class="manage-section-title">Tribes</div>
							{#if event.tribeGroups.length === 0}
								<p class="empty-tribe">No tribes yet.</p>
							{:else}
								{#each event.tribeGroups as group (group.id)}
									<button class="tribe-group-row" onclick={() => selectTribeForEdit(group.id)}>
										<span class="tribe-group-name">{group.name}</span>
										<span class="tribe-section-count">{event.tribe.filter((m) => m.tribeId === group.id).length}</span>
										<span class="tribe-group-delete" role="button" tabindex="-1" onclick={(e) => { e.stopPropagation(); deleteTribeGroup(event.id, group.id); }} onkeydown={() => {}} aria-label="Delete group">&times;</span>
									</button>
								{/each}
							{/if}
						{:else if viewingMemberId && viewingMember}
							{#if editingMember}
								<div class="add-member-form">
									<div class="member-field-row">
										<div class="member-field">
											<label class="member-label required">First Name</label>
											<input type="text" bind:value={editMemberFirstName} placeholder="First name" class:input-error={showEditMemberErrors && !editMemberFirstName.trim()} />
										</div>
										<div class="member-field">
											<label class="member-label required">Last Name</label>
											<input type="text" bind:value={editMemberLastName} placeholder="Last name" class:input-error={showEditMemberErrors && !editMemberLastName.trim()} />
										</div>
									</div>
									<div class="member-field">
										<label class="member-label">Phone</label>
										<input type="tel" bind:value={editMemberPhone} placeholder="Phone number" />
									</div>
									<div class="member-field">
										<label class="member-label">Email</label>
										<input type="email" bind:value={editMemberEmail} placeholder="Email address" />
									</div>
									<div class="member-field">
										<label class="member-label">RSVP</label>
										<select bind:value={editMemberRsvp}>
											<option value="going">Going</option>
											<option value="maybe">Maybe</option>
											<option value="not-going">Not Going</option>
											<option value="pending">Pending</option>
										</select>
									</div>
									{#if event.tribeGroups.length > 0}
										<div class="member-field">
											<label class="member-label">Tribe</label>
											<select bind:value={editMemberTribeId}>
												<option value="">Unassigned</option>
												{#each event.tribeGroups as group (group.id)}
													<option value={group.id}>{group.name}</option>
												{/each}
											</select>
										</div>
									{/if}
								</div>
							{:else}
								<div class="member-detail">
									<div class="member-detail-header">
										<div class="member-avatar member-avatar-lg">
											{viewingMember.firstName[0]}{viewingMember.lastName[0]}
										</div>
										<div class="member-detail-name">{viewingMember.firstName} {viewingMember.lastName}</div>
										<span class="rsvp-badge" style="background-color: {rsvpColors[viewingMember.rsvp]}">{rsvpLabels[viewingMember.rsvp]}</span>
									</div>
									<div class="member-detail-fields">
										{#if viewingMember.email}
											<div class="member-detail-row">
												<span class="member-detail-label">Email</span>
												<span class="member-detail-value">{viewingMember.email}</span>
											</div>
										{/if}
										{#if viewingMember.phone}
											<div class="member-detail-row">
												<span class="member-detail-label">Phone</span>
												<span class="member-detail-value">{viewingMember.phone}</span>
											</div>
										{/if}
										{#if event.tribeGroups.length > 0}
											{@const tribeName = event.tribeGroups.find((g) => g.id === viewingMember.tribeId)?.name ?? 'Unassigned'}
											<div class="member-detail-row">
												<span class="member-detail-label">Tribe</span>
												<span class="member-detail-value">{tribeName}</span>
											</div>
										{/if}
									</div>
								</div>
							{/if}
						{:else if addingMember}
							<div class="add-member-form">
								<div class="add-member-title">Add Member</div>
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
									<label class="member-label">Phone</label>
									<input type="tel" bind:value={memberPhone} placeholder="Phone number" />
								</div>
								<div class="member-field">
									<label class="member-label">Email</label>
									<input type="email" bind:value={memberEmail} placeholder="Email address" />
								</div>
								{#if event.tribeGroups.length > 0}
									<div class="member-field">
										<label class="member-label">Tribe</label>
										<select bind:value={memberTribeId}>
											<option value="">Unassigned</option>
											{#each event.tribeGroups as group (group.id)}
												<option value={group.id}>{group.name}</option>
											{/each}
										</select>
									</div>
								{/if}
							</div>
						{:else if event.tribe.length === 0}
							<p class="empty-tribe">No members yet.</p>
						{:else if groupedMembers.length > 0}
							<div class="tribe-list">
								{#each groupedMembers as group (group.id ?? '__unassigned')}
									<div class="tribe-section-header">
										<span class="tribe-section-name">{group.name}</span>
										<span class="tribe-section-count">{group.members.length}</span>
									</div>
									{#if group.members.length === 0}
										<p class="empty-group-hint">No members in this group</p>
									{:else}
										{#each group.members as member (member.id)}
											<button class="tribe-member tribe-member-clickable" onclick={() => openMemberDetail(member.id)}>
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
											</button>
										{/each}
									{/if}
								{/each}
							</div>
						{:else}
							<div class="tribe-list">
								{#each event.tribe as member (member.id)}
									<button class="tribe-member tribe-member-clickable" onclick={() => openMemberDetail(member.id)}>
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
									</button>
								{/each}
							</div>
						{/if}
					</div>
					<div class="modal-footer">
						{#if tribeManageMode && selectedTribeId}
							<button class="btn-footer-add" onclick={saveTribeEdit}>Save</button>
							<button class="btn-footer-close" onclick={cancelTribeEdit}>Cancel</button>
						{:else if tribeManageMode}
							<button class="btn-footer-add" onclick={() => (tribeManageMode = false)}>Done</button>
						{:else if viewingMemberId && editingMember}
							<button class="btn-footer-add" onclick={saveEditMember}>Save</button>
							<button class="btn-footer-close" onclick={cancelEditMember}>Cancel</button>
						{:else if viewingMemberId}
							<button class="btn-footer-add" onclick={startEditMember}>Edit</button>
							<button class="btn-footer-close" onclick={closeMemberDetail}>Back</button>
						{:else if addingMember}
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
		{#if showPrint}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-overlay" onclick={handlePrintOverlayClick} onkeydown={() => {}}>
				<div class="modal">
					<div class="modal-header">
						<div class="style-switcher">
							<button class="style-chevron" onclick={prevStyle} aria-label="Previous style">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="15 18 9 12 15 6" />
								</svg>
							</button>
							<span class="style-label">{printStyle[0].toUpperCase() + printStyle.slice(1)}</span>
							<button class="style-chevron" onclick={nextStyle} aria-label="Next style">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="9 18 15 12 9 6" />
								</svg>
							</button>
						</div>
					</div>
					<div class="modal-body">
						<div class="print-content print-style-{printStyle}">
							<h2 class="print-title">{event.title}</h2>
							<div class="print-meta">
								<span>{formatDateRange(event.startDate, event.endDate)}{#if dayCount > 1} &middot; {dayCount} days{/if}</span>
								{#if event.location}<span>{event.location}</span>{/if}
								<span class="print-category">{event.category}</span>
							</div>
							{#if event.description}
								<p class="print-description">{event.description}</p>
							{/if}

							<h3 class="print-section-title">Agenda</h3>
							{#each dates as date, i}
								{@const dayItems = getItemsForDate(event.itinerary, date)}
								<div class="print-day">
									<div class="print-day-header">Day {i + 1}{#if event.dayTitles?.[date]}&nbsp;- {event.dayTitles[date]}{/if} &mdash; {formatDate(date)}</div>
									{#if dayItems.length === 0}
										<p class="print-empty">No items</p>
									{:else}
										{#each dayItems as entry}
											<div class="print-item">
												{#if entry.item.type === 'activity'}
													<div class="print-item-type" style="color: #8b5cf6">Activity</div>
													<div class="print-item-title">{entry.item.title}</div>
													<div class="print-item-detail">{entry.item.startTime} &ndash; {entry.item.endTime}</div>
													{#if entry.item.location}<div class="print-item-detail">{entry.item.location}</div>{/if}
													{#if entry.item.notes}<div class="print-item-detail print-item-notes">{entry.item.notes}</div>{/if}
												{:else if entry.item.type === 'flight'}
													<div class="print-item-type" style="color: #3b82f6">Flight{#if entry.flightLeg === 'return'} (Return){/if}</div>
													{#if entry.flightLeg === 'return'}
														<div class="print-item-title">{entry.item.returnAirline || entry.item.airline} {entry.item.returnFlightNumber || entry.item.flightNumber}</div>
														<div class="print-item-detail">{entry.item.returnFrom || entry.item.to} &rarr; {entry.item.returnTo || entry.item.from}</div>
														<div class="print-item-detail">Departs {entry.item.returnDepartureTime || ''} &ndash; Arrives {entry.item.returnArrivalTime || ''}</div>
													{:else}
														<div class="print-item-title">{entry.item.airline} {entry.item.flightNumber}</div>
														<div class="print-item-detail">{entry.item.from} &rarr; {entry.item.to}</div>
														<div class="print-item-detail">Departs {entry.item.departureTime} &ndash; Arrives {entry.item.arrivalTime}</div>
													{/if}
												{:else if entry.item.type === 'hotel'}
													<div class="print-item-type" style="color: #f59e0b">Hotel</div>
													<div class="print-item-title">{entry.item.name}</div>
													<div class="print-item-detail">Check-in: {formatDate(entry.item.checkInDate)} &ndash; Check-out: {formatDate(entry.item.checkOutDate)}</div>
													{#if entry.item.location}<div class="print-item-detail">{entry.item.location}</div>{/if}
													{#if entry.item.confirmationNumber}<div class="print-item-detail">Confirmation: {entry.item.confirmationNumber}</div>{/if}
												{:else if entry.item.type === 'car-rental'}
													<div class="print-item-type" style="color: #22c55e">Car Rental{#if entry.carRentalLeg === 'dropoff'} (Drop-off){:else} (Pickup){/if}</div>
													{#if entry.carRentalLeg === 'dropoff'}
														<div class="print-item-detail">{formatDate(entry.item.returnDate)} at {entry.item.returnTime}</div>
														<div class="print-item-detail">{entry.item.returnLocation}</div>
													{:else}
														<div class="print-item-detail">{formatDate(entry.item.pickupDate)} at {entry.item.pickupTime}</div>
														<div class="print-item-detail">{entry.item.pickupLocation}</div>
													{/if}
												{/if}
											</div>
										{/each}
									{/if}
								</div>
							{/each}

						</div>
					</div>
					<div class="modal-footer">
						<button class="btn-footer-add" onclick={doPrint}>Print</button>
						<button class="btn-footer-close" onclick={closePrint}>Cancel</button>
					</div>
				</div>
			</div>
		{/if}
		{#if showChecklist}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-overlay" onclick={handleChecklistOverlayClick} onkeydown={() => {}}>
				<div class="modal checklist-modal">
					<div class="modal-header">
						{#if checklistEditMode}
							<h3 style="color: #ec4899">Edit Checklist</h3>
						{:else}
							<div class="modal-header-row">
								<button class="checklist-edit-btn" onclick={() => (checklistEditMode = true)} aria-label="Edit checklist">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
								</button>
								<h3 style="color: #ec4899">Checklist</h3>
								<span></span>
							</div>
						{/if}
					</div>
					<div class="modal-body">
						{#if event.checklist}
							{#if checklistEditMode}
								<div class="checklist-mode-toggle">
									<button class="mode-picker-btn" onclick={() => (showModePicker = !showModePicker)}>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
										Checklist Mode
									</button>
									{#if showModePicker}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div class="mode-picker-overlay" onclick={() => (showModePicker = false)} onkeydown={() => {}}></div>
										<div class="mode-picker-popup">
											<button class="mode-option" class:active={event.checklistMode !== 'states'} onclick={() => selectChecklistMode('simple')}>
												<span class="mode-option-header">
													<span class="mode-option-icon">
														<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
													</span>
													<span class="mode-option-title">Simple Checkboxes</span>
													{#if event.checklistMode !== 'states'}
														<span class="mode-active-badge">Active</span>
													{/if}
												</span>
												<span class="mode-option-desc">Each item is either done or not done. Great for simple to-do lists.</span>
											</button>
											<button class="mode-option" class:active={event.checklistMode === 'states'} onclick={() => selectChecklistMode('states')}>
												<span class="mode-option-header">
													<span class="mode-option-icon">
														<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
													</span>
													<span class="mode-option-title">Custom States</span>
													{#if event.checklistMode === 'states'}
														<span class="mode-active-badge">Active</span>
													{/if}
												</span>
												<span class="mode-option-desc">Track items through multiple stages like Todo, In Progress, and Completed. Customize colors and labels.</span>
											</button>
										</div>
									{/if}
								</div>
								{#if event.checklistMode === 'states' && event.checklistStates}
									<button class="manage-states-btn" onclick={() => (showStatesEditor = true)}>
										<span class="manage-states-dots">
											{#each event.checklistStates.slice(0, 4) as s}
												<span class="state-dot-mini" style="background: {s.color}"></span>
											{/each}
										</span>
										Manage States
									</button>
								{/if}
								<div class="checklist-add-row">
									<input type="text" bind:value={newChecklistLabel} placeholder="New item" onkeydown={(e) => { if (e.key === 'Enter') addChecklistItem(); }} />
									<button class="btn-footer-add" onclick={addChecklistItem}>+ Add</button>
								</div>
								<div class="checklist-items">
									{#each event.checklist as item, i (item.id)}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="checklist-edit-row"
											class:checklist-drag-over={dragOverChecklistIndex === i && dragChecklistIndex !== i}
											class:checklist-dragging={dragChecklistIndex === i}
											draggable="true"
											ondragstart={() => handleChecklistDragStart(i)}
											ondragover={(e) => handleChecklistDragOver(e, i)}
											ondrop={() => handleChecklistDrop(i)}
											ondragend={handleChecklistDragEnd}
											ontouchstart={(e) => handleChecklistTouchStart(e, i)}
											use:nonPassiveTouchMove
											ontouchend={handleChecklistTouchEnd}
										>
											<span class="checklist-drag-handle" aria-label="Drag to reorder">
												<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
											</span>
											{#if renamingChecklistId === item.id}
												<input class="checklist-rename-input" type="text" bind:value={renamingChecklistLabel} onkeydown={(e) => { if (e.key === 'Enter') saveRenameChecklist(); if (e.key === 'Escape') cancelRenameChecklist(); }} />
												<button class="checklist-action-btn checklist-save-btn" onclick={saveRenameChecklist} aria-label="Save">
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
												</button>
											{:else}
												<span class="checklist-edit-label" onclick={() => startRenameChecklist(item.id, item.label)} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter') startRenameChecklist(item.id, item.label); }}>{item.label}</span>
												<button class="checklist-action-btn checklist-remove-btn" onclick={() => removeChecklistItem(item.id)} aria-label="Remove">
													&times;
												</button>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<div class="checklist-progress">
									<div class="checklist-progress-text">
										<span>{checklistProgress.done} of {checklistProgress.total} completed</span>
										<span class="checklist-progress-pct">{checklistProgress.total > 0 ? Math.round((checklistProgress.done / checklistProgress.total) * 100) : 0}%</span>
									</div>
									<div class="checklist-progress-bar">
										<div class="checklist-progress-fill" style="width: {checklistProgress.total > 0 ? (checklistProgress.done / checklistProgress.total) * 100 : 0}%"></div>
									</div>
								</div>
								<div class="checklist-items">
									{#if event.checklistMode === 'states' && event.checklistStates}
										{#each event.checklist as item (item.id)}
											{@const itemState = event.checklistStates.find(s => s.id === item.stateId)}
											<div class="checklist-item-wrapper">
												<button class="checklist-item" onclick={() => toggleStatePicker(item.id)}>
													<span class="state-dot" style="background: {itemState?.color ?? '#6b7280'}"></span>
													<span class="checklist-label">{item.label}</span>
													<span class="state-badge" style="color: {itemState?.color ?? '#6b7280'}">{itemState?.label ?? 'Unknown'}</span>
												</button>
												{#if statePickerItemId === item.id}
													<div class="state-picker-popup">
														{#each event.checklistStates as s (s.id)}
															<button class="state-picker-option" class:active={item.stateId === s.id} onclick={() => setItemState(item.id, s.id)}>
																<span class="state-dot" style="background: {s.color}"></span>
																{s.label}
															</button>
														{/each}
													</div>
												{/if}
											</div>
										{/each}
									{:else}
										{#each event.checklist as item (item.id)}
											<button class="checklist-item" class:checklist-item-checked={item.checked} onclick={() => toggleChecklistItem(item.id)}>
												<span class="checklist-checkbox" class:checklist-checkbox-checked={item.checked}>
													{#if item.checked}
														<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
															<polyline points="20 6 9 17 4 12" />
														</svg>
													{/if}
												</span>
												<span class="checklist-label" class:checklist-label-checked={item.checked}>{item.label}</span>
											</button>
										{/each}
									{/if}
								</div>
							{/if}
						{/if}
					</div>
					<div class="modal-footer">
						{#if checklistEditMode}
							<button class="btn-footer-add" onclick={() => { checklistEditMode = false; renamingChecklistId = null; }}>Done</button>
						{:else}
							<button class="btn-footer-close" onclick={closeChecklist}>Close</button>
						{/if}
					</div>
				</div>
			</div>
		{/if}
		{#if showStatesEditor && event.checklistStates}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showStatesEditor = false; }} onkeydown={() => {}}>
				<div class="modal states-editor-modal">
					<div class="modal-header">
						<h3 style="color: #ec4899">Manage States</h3>
					</div>
					<div class="modal-body">
						<div class="checklist-states-editor">
							{#each event.checklistStates as state (state.id)}
								<div class="state-editor-row">
									<input type="color" value={state.color} onchange={(e) => updateStateColor(state.id, (e.target as HTMLInputElement).value)} />
									{#if editingStateId === state.id}
										<input class="state-label-input" type="text" bind:value={editingStateLabel} onkeydown={(e) => { if (e.key === 'Enter') saveEditState(); if (e.key === 'Escape') { editingStateId = null; } }} />
										<button class="checklist-action-btn checklist-save-btn" onclick={saveEditState} aria-label="Save">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
										</button>
									{:else}
										<span class="state-label" onclick={() => startEditState(state.id)} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter') startEditState(state.id); }}>{state.label}</span>
										{#if event.checklistStates.length > 1}
											<button class="checklist-action-btn checklist-remove-btn" onclick={() => removeChecklistState(state.id)} aria-label="Remove state">
												&times;
											</button>
										{/if}
									{/if}
								</div>
							{/each}
							<div class="state-add-row">
								<input type="text" placeholder="New state" bind:value={newStateName} onkeydown={(e) => { if (e.key === 'Enter') addChecklistState(); }} />
								<button class="btn-footer-add" onclick={addChecklistState}>+ Add</button>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<button class="btn-footer-close" onclick={() => { showStatesEditor = false; editingStateId = null; }}>Done</button>
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

	.header-top-right {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.details-toggle {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		margin: 0 auto;
		border-radius: var(--radius-sm);
		transition: color 0.15s;
	}

	.details-toggle:hover {
		color: var(--color-text);
	}

	.details-toggle svg {
		width: 18px;
		height: 18px;
		transition: transform 0.2s;
	}

	.details-toggle svg.details-toggle-collapsed {
		transform: rotate(-90deg);
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

	.agenda-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.itinerary-section h2 {
		font-size: var(--font-xl);
		font-weight: 600;
		text-align: left;
	}

	.agenda-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.day-section {
		margin-bottom: var(--space-lg);
	}

	.day-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-sm);
		background: none;
		border: none;
		width: 100%;
		padding: var(--space-xs) 0;
		cursor: pointer;
		text-align: left;
	}

	.day-label {
		font-size: var(--font-base);
		font-weight: 700;
		color: #9ca3af;
	}

	.day-date {
		font-size: var(--font-sm);
		color: #9ca3af;
	}

	.day-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	.day-add-row {
		display: flex;
		justify-content: center;
		margin-top: var(--space-md);
	}

	.day-add-btn {
		padding: 4px 14px;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-full);
		background: none;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.day-add-btn:hover {
		border-style: solid;
		background: var(--color-bg);
	}

	.item-type-tabs {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		overflow: hidden;
		width: 100%;
	}

	.item-type-tab {
		padding: 8px 4px;
		border: none;
		background: var(--color-bg);
		color: var(--color-text-muted);
		font-size: var(--font-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		text-align: center;
	}

	.item-type-tab:not(:last-child) {
		border-right: 1px solid var(--color-border);
	}

	.item-type-tab.active {
		color: white;
	}

	.item-type-tab:nth-child(1).active { background: #8b5cf6; }
	.item-type-tab:nth-child(2).active { background: #3b82f6; }
	.item-type-tab:nth-child(3).active { background: #f59e0b; }
	.item-type-tab:nth-child(4).active { background: #22c55e; }

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

	/* Modals */
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

	.add-member-form input,
	.add-member-form select {
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

	.add-member-form input:focus,
	.add-member-form select:focus {
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

	/* Style switcher */
	.style-switcher {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
	}

	.style-chevron {
		background: none;
		border: none;
		color: var(--color-text);
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		border-radius: var(--radius-sm);
	}

	.style-chevron svg {
		width: 22px;
		height: 22px;
	}

	.style-label {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--color-text);
		min-width: 80px;
		text-align: center;
	}

	/* Print preview content — shared base */
	.print-content {
		padding: var(--space-md);
	}

	.print-title {
		font-size: var(--font-2xl);
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--space-sm);
	}

	.print-meta {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-bottom: var(--space-md);
	}

	.print-category {
		text-transform: capitalize;
	}

	.print-description {
		color: var(--color-text-secondary);
		font-size: var(--font-base);
		line-height: 1.6;
		margin-bottom: var(--space-md);
	}

	.print-section-title {
		font-size: var(--font-lg);
		font-weight: 700;
		color: var(--color-text);
		margin-bottom: var(--space-sm);
		padding-bottom: var(--space-xs);
	}

	.print-day {
		margin-bottom: var(--space-md);
	}

	.print-day-header {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--color-primary);
		margin-bottom: var(--space-xs);
	}

	.print-empty {
		font-size: var(--font-sm);
		color: var(--color-text-muted);
		padding-left: var(--space-sm);
	}

	.print-item {
		padding: var(--space-sm) var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	.print-item-type {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 2px;
	}

	.print-item-title {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--color-text);
	}

	.print-item-detail {
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
	}

	.print-item-notes {
		font-style: italic;
	}

	/* ===== Style 1: Classic ===== */
	.print-style-classic {
		font-family: Georgia, 'Times New Roman', serif;
		text-align: center;
		border: 3px double var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-lg);
		background: var(--color-surface);
	}

	.print-style-classic .print-title {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: #5c4033;
	}

	.print-style-classic .print-meta {
		align-items: center;
		color: #7a6555;
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid #c9b99a;
		margin-bottom: var(--space-md);
	}

	.print-style-classic .print-category {
		font-style: italic;
	}

	.print-style-classic .print-description {
		color: #7a6555;
		font-style: italic;
		border-bottom: 1px solid #c9b99a;
		padding-bottom: var(--space-md);
	}

	.print-style-classic .print-section-title {
		color: #5c4033;
		border-bottom: 1px solid #c9b99a;
		text-align: center;
	}

	.print-style-classic .print-day-header {
		color: #5c4033;
		text-align: center;
		padding: var(--space-xs) 0;
		border-bottom: 1px dashed #c9b99a;
		margin-bottom: var(--space-sm);
	}

	.print-style-classic .print-item {
		border-left: 2px solid #c9b99a;
		text-align: left;
	}

	.print-style-classic .print-item-type {
		color: #8b7355;
	}

	.print-style-classic .print-item-title {
		color: #5c4033;
	}

	.print-style-classic .print-item-detail {
		color: #7a6555;
	}

	/* ===== Style 2: Modern ===== */
	.print-style-modern {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		text-align: left;
		border-top: 5px solid var(--color-primary);
		border-radius: var(--radius-md);
		padding: var(--space-lg);
		background: var(--color-surface);
	}

	.print-style-modern .print-title {
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.print-style-modern .print-meta {
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: center;
	}

	.print-style-modern .print-category {
		background: var(--color-primary);
		color: white;
		padding: 2px 10px;
		border-radius: var(--radius-full);
		font-size: 0.7rem;
		font-weight: 700;
	}

	.print-style-modern .print-description {
		border-left: 3px solid var(--color-primary);
		padding-left: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.print-style-modern .print-section-title {
		font-size: var(--font-xl);
		font-weight: 800;
		letter-spacing: -0.01em;
		border-bottom: 2px solid var(--color-primary);
		padding-bottom: var(--space-xs);
	}

	.print-style-modern .print-day-header {
		font-weight: 700;
		font-size: var(--font-base);
		padding: var(--space-xs) var(--space-sm);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-sm);
	}

	.print-style-modern .print-item {
		border-left: 3px solid var(--color-primary);
		padding: var(--space-sm) var(--space-md);
	}

	/* ===== Style 3: Elegant ===== */
	.print-style-elegant {
		font-family: Georgia, 'Times New Roman', serif;
		text-align: center;
		padding: var(--space-lg);
		background: var(--color-surface);
		border-top: 3px solid #d4a574;
		border-bottom: 3px solid #d4a574;
		position: relative;
	}

	.print-style-elegant::before,
	.print-style-elegant::after {
		content: '\2726 \2726 \2726';
		display: block;
		text-align: center;
		color: #d4a574;
		font-size: 1rem;
		letter-spacing: 0.5em;
	}

	.print-style-elegant::before {
		margin-bottom: var(--space-md);
	}

	.print-style-elegant::after {
		margin-top: var(--space-md);
	}

	.print-style-elegant .print-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #d4a574;
		letter-spacing: 0.04em;
	}

	.print-style-elegant .print-meta {
		align-items: center;
		color: #a08b76;
	}

	.print-style-elegant .print-category {
		font-style: italic;
		color: #d4a574;
		font-weight: 600;
	}

	.print-style-elegant .print-description {
		font-style: italic;
		color: #a08b76;
		max-width: 85%;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.8;
	}

	.print-style-elegant .print-section-title {
		color: #d4a574;
		border-bottom: 1px solid #d4a574;
		display: inline-block;
		padding: 0 var(--space-lg) var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.print-style-elegant .print-day-header {
		color: #d4a574;
		font-style: italic;
		text-align: center;
		margin-bottom: var(--space-sm);
	}

	.print-style-elegant .print-item {
		border-left: 2px solid #d4a574;
		text-align: left;
	}

	.print-style-elegant .print-item-type {
		color: #d4a574;
	}

	.print-style-elegant .print-item-title {
		color: #8b7355;
	}

	.print-style-elegant .print-item-detail {
		color: #a08b76;
	}

	/* ===== Style 4: Minimal ===== */
	.print-style-minimal {
		font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
		text-align: left;
		padding: var(--space-lg);
		background: var(--color-surface);
	}

	.print-style-minimal .print-title {
		font-size: 1.5rem;
		font-weight: 300;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--color-text);
	}

	.print-style-minimal .print-meta {
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--space-sm);
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.print-style-minimal .print-meta span:not(:last-child)::after {
		content: '/';
		margin-left: var(--space-sm);
		color: var(--color-border);
	}

	.print-style-minimal .print-category {
		font-weight: 500;
	}

	.print-style-minimal .print-description {
		color: var(--color-text-secondary);
		font-weight: 300;
		line-height: 1.7;
	}

	.print-style-minimal .print-section-title {
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		border-bottom: none;
		margin-top: var(--space-md);
	}

	.print-style-minimal .print-day-header {
		font-size: var(--font-sm);
		font-weight: 400;
		color: var(--color-text);
		letter-spacing: 0.02em;
		padding-bottom: var(--space-xs);
		border-bottom: 1px solid var(--color-border);
	}

	.print-style-minimal .print-item {
		border-left: none;
		padding: var(--space-xs) 0;
		border-bottom: 1px dotted var(--color-border);
	}

	.print-style-minimal .print-item:last-child {
		border-bottom: none;
	}

	.print-style-minimal .print-item-type {
		font-size: 0.6rem;
		font-weight: 500;
		color: var(--color-text-muted);
		letter-spacing: 0.08em;
	}

	.print-style-minimal .print-item-title {
		font-weight: 400;
	}

	.print-style-minimal .print-item-detail {
		font-weight: 300;
	}

	/* ===== Style 5: Botanical ===== */
	.print-style-botanical {
		font-family: Georgia, 'Times New Roman', serif;
		text-align: center;
		padding: var(--space-lg);
		background: var(--color-surface);
		border: 1px solid #7a9e7e;
		border-radius: var(--radius-lg, 12px);
		position: relative;
	}

	.print-style-botanical::before {
		content: '\2E19  \2740  \2E19';
		display: block;
		text-align: center;
		color: #7a9e7e;
		font-size: 1.2rem;
		letter-spacing: 0.3em;
		margin-bottom: var(--space-md);
	}

	.print-style-botanical::after {
		content: '\2E19  \2740  \2E19';
		display: block;
		text-align: center;
		color: #7a9e7e;
		font-size: 1.2rem;
		letter-spacing: 0.3em;
		margin-top: var(--space-md);
	}

	.print-style-botanical .print-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #3d6b41;
		letter-spacing: 0.02em;
	}

	.print-style-botanical .print-meta {
		align-items: center;
		color: #6b8f6e;
	}

	.print-style-botanical .print-category {
		color: #7a9e7e;
		font-style: italic;
		font-weight: 600;
	}

	.print-style-botanical .print-description {
		color: #5a7d5e;
		font-style: italic;
		line-height: 1.8;
		max-width: 90%;
		margin-left: auto;
		margin-right: auto;
		padding-bottom: var(--space-md);
		border-bottom: 1px solid #b5d3b8;
	}

	.print-style-botanical .print-section-title {
		color: #3d6b41;
		border-bottom: 1px solid #b5d3b8;
		display: inline-block;
		padding: 0 var(--space-lg) var(--space-xs);
	}

	.print-style-botanical .print-day-header {
		color: #3d6b41;
		font-style: italic;
		text-align: center;
		padding: var(--space-xs) 0;
		margin-bottom: var(--space-sm);
	}

	.print-style-botanical .print-item {
		border-left: 2px solid #b5d3b8;
		text-align: left;
	}

	.print-style-botanical .print-item-type {
		color: #7a9e7e;
	}

	.print-style-botanical .print-item-title {
		color: #3d6b41;
	}

	.print-style-botanical .print-item-detail {
		color: #5a7d5e;
	}

	/* ===== Style 6: Retro ===== */
	.print-style-retro {
		font-family: 'Courier New', Courier, monospace;
		text-align: left;
		padding: var(--space-lg);
		background: var(--color-surface);
		border: 2px solid var(--color-text);
		position: relative;
	}

	.print-style-retro::before {
		content: '* * * * * * * * * * * * * * * * * * * *';
		display: block;
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.7rem;
		letter-spacing: 0.15em;
		margin-bottom: var(--space-md);
		overflow: hidden;
		white-space: nowrap;
	}

	.print-style-retro::after {
		content: '* * * * * * * * * * * * * * * * * * * *';
		display: block;
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.7rem;
		letter-spacing: 0.15em;
		margin-top: var(--space-md);
		overflow: hidden;
		white-space: nowrap;
	}

	.print-style-retro .print-title {
		font-size: 1.5rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text);
	}

	.print-style-retro .print-meta {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
	}

	.print-style-retro .print-category {
		text-transform: uppercase;
		font-weight: 700;
		letter-spacing: 0.06em;
	}

	.print-style-retro .print-description {
		color: var(--color-text-secondary);
		padding-bottom: var(--space-sm);
		border-bottom: 2px dashed var(--color-text-muted);
	}

	.print-style-retro .print-section-title {
		font-size: var(--font-base);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text);
		border-bottom: 2px solid var(--color-text);
		padding-bottom: var(--space-xs);
	}

	.print-style-retro .print-day-header {
		font-weight: 700;
		font-size: var(--font-sm);
		color: var(--color-text);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: var(--space-xs) 0;
		border-bottom: 1px dashed var(--color-text-muted);
		margin-bottom: var(--space-sm);
	}

	.print-style-retro .print-item {
		border-left: 3px solid var(--color-text-muted);
		padding: var(--space-xs) var(--space-sm);
	}

	.print-style-retro .print-item-type {
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--color-text-secondary);
	}

	.print-style-retro .print-item-title {
		font-weight: 700;
	}

	/* ===== Style 7: Midnight ===== */
	.print-style-midnight {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		text-align: center;
		padding: var(--space-lg);
		background: #1a1a2e;
		border-radius: var(--radius-lg, 12px);
		color: #e0d6ff;
	}

	.print-style-midnight .print-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #c4b5fd;
		letter-spacing: 0.02em;
	}

	.print-style-midnight .print-meta {
		align-items: center;
		color: #a89cc8;
	}

	.print-style-midnight .print-category {
		background: #7c3aed;
		color: white;
		padding: 2px 10px;
		border-radius: var(--radius-full);
		font-size: 0.7rem;
		font-weight: 700;
	}

	.print-style-midnight .print-description {
		color: #a89cc8;
		line-height: 1.7;
		max-width: 90%;
		margin-left: auto;
		margin-right: auto;
		padding-bottom: var(--space-md);
		border-bottom: 1px solid #2d2b55;
	}

	.print-style-midnight .print-section-title {
		color: #c4b5fd;
		border-bottom: 1px solid #2d2b55;
		padding-bottom: var(--space-xs);
	}

	.print-style-midnight .print-day-header {
		color: #c4b5fd;
		font-weight: 600;
		padding: var(--space-xs) var(--space-sm);
		background: #2d2b55;
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-sm);
		text-align: center;
	}

	.print-style-midnight .print-item {
		border-left: 3px solid #7c3aed;
		text-align: left;
		background: #16213e;
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
		padding: var(--space-sm) var(--space-md);
	}

	.print-style-midnight .print-item-type {
		color: #a78bfa;
	}

	.print-style-midnight .print-item-title {
		color: #e0d6ff;
	}

	.print-style-midnight .print-item-detail {
		color: #a89cc8;
	}

	.print-style-midnight .print-empty {
		color: #6b6190;
	}

	/* Tribe management styles */
	.modal-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.modal-header-row h3 {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--color-text);
	}

	.tribe-manage-btn {
		padding: 4px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		background: none;
		color: var(--color-text-secondary);
		font-size: var(--font-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.tribe-manage-btn:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.tribe-member-clickable {
		background: none;
		border: none;
		outline: none;
		width: 100%;
		cursor: pointer;
		text-align: left;
		font: inherit;
		color: inherit;
		padding: var(--space-sm) 0;
	}

	.tribe-member-clickable:hover {
		background: var(--color-bg);
	}

	/* Member detail view */
	.member-detail {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.member-detail-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md) 0;
	}

	.member-avatar-lg {
		width: 64px;
		height: 64px;
		font-size: 1.25rem;
	}

	.member-detail-name {
		font-size: var(--font-xl);
		font-weight: 700;
		color: var(--color-text);
	}

	.member-detail-fields {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.member-detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.member-detail-row:last-child {
		border-bottom: none;
	}

	.member-detail-label {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.member-detail-value {
		font-size: var(--font-base);
		color: var(--color-text);
	}

	.tribe-section-header {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 4px var(--space-md);
		margin: var(--space-sm) calc(-1 * var(--space-md)) 0;
		background: var(--color-bg);
	}

	.tribe-section-header:first-child {
		margin-top: 0;
	}

	.tribe-section-name {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.tribe-section-count {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-left: auto;
	}

	.empty-group-hint {
		font-size: var(--font-sm);
		font-style: italic;
		color: var(--color-text-muted);
		padding: var(--space-xs) 0 var(--space-sm);
	}

	.tribe-group-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) 0;
		border: none;
		border-bottom: 1px solid var(--color-border);
		background: none;
		width: 100%;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}

	.tribe-group-row:hover {
		background: var(--color-bg);
	}

	.tribe-group-name {
		flex: 1;
		font-size: var(--font-base);
		font-weight: 500;
		color: var(--color-text);
	}

	.tribe-group-delete {
		background: none;
		border: none;
		color: var(--color-text-muted);
		font-size: 1.2rem;
		cursor: pointer;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		line-height: 1;
	}

	.tribe-group-delete:hover {
		color: var(--color-danger, #ef4444);
	}

	.add-tribe-row {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.add-tribe-row input {
		flex: 1;
		padding: 10px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: var(--font-base);
		outline: none;
		color-scheme: dark;
	}

	.add-tribe-row input:focus {
		border-color: var(--color-primary);
	}

	.add-tribe-row .btn-footer-add {
		flex: none;
		padding: 10px 20px;
	}

	.assign-checkbox-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--color-border);
		cursor: pointer;
	}

	.assign-checkbox-row:last-child {
		border-bottom: none;
	}

	.assign-checkbox-row input[type='checkbox'] {
		width: 18px;
		height: 18px;
		padding: 0;
		cursor: pointer;
		accent-color: var(--color-primary);
		flex-shrink: 0;
	}

	.assign-member-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xs) 0;
		border-bottom: 1px solid var(--color-border);
	}

	.assign-member-row:last-child {
		border-bottom: none;
	}

	.assign-member-name {
		flex: 1;
		font-size: var(--font-sm);
		font-weight: 500;
		color: var(--color-text);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tribe-select {
		padding: 6px 10px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: var(--font-sm);
		outline: none;
		color-scheme: dark;
		max-width: 140px;
	}

	.tribe-select:focus {
		border-color: var(--color-primary);
	}

	.manage-section-title {
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: var(--space-sm);
		margin-top: var(--space-sm);
	}

	.manage-section-title:first-child {
		margin-top: 0;
	}

	@media print {
		:global(body > *) {
			display: none !important;
		}

		:global(body) {
			background: white !important;
		}

		:global(.modal-overlay) {
			position: static !important;
			background: none !important;
			display: block !important;
		}

		:global(.modal) {
			position: static !important;
			height: auto !important;
			background: white !important;
		}

		:global(.modal-header),
		:global(.modal-footer) {
			display: none !important;
		}

		:global(.modal-body) {
			padding: 0 !important;
			overflow: visible !important;
		}

		.print-content {
			display: block !important;
			background: white !important;
		}

		.print-title {
			color: black !important;
		}

		.print-meta {
			color: #333 !important;
		}

		.print-description {
			color: #333 !important;
		}

		.print-section-title {
			color: black !important;
		}

		.print-day-header {
			color: #333 !important;
		}

		.print-item {
			border-color: #ccc !important;
		}

		.print-item-title {
			color: black !important;
		}

		.print-item-detail {
			color: #333 !important;
		}

		/* Classic print overrides */
		.print-style-classic {
			border-color: #999 !important;
		}

		.print-style-classic .print-title { color: #3a2a1a !important; }
		.print-style-classic .print-meta { border-color: #ccc !important; }
		.print-style-classic .print-description { border-color: #ccc !important; }
		.print-style-classic .print-section-title { border-color: #ccc !important; }
		.print-style-classic .print-day-header { border-color: #ccc !important; color: #3a2a1a !important; }

		/* Modern print overrides */
		.print-style-modern {
			border-top-color: #333 !important;
		}

		.print-style-modern .print-category {
			background: #333 !important;
			color: white !important;
		}

		.print-style-modern .print-section-title { border-color: #333 !important; }
		.print-style-modern .print-day-header { background: #f0f0f0 !important; color: #333 !important; }
		.print-style-modern .print-description { border-color: #333 !important; }

		/* Elegant print overrides */
		.print-style-elegant {
			border-color: #999 !important;
		}

		.print-style-elegant::before,
		.print-style-elegant::after {
			color: #999 !important;
		}

		.print-style-elegant .print-title { color: #666 !important; }
		.print-style-elegant .print-section-title { border-color: #999 !important; color: #666 !important; }
		.print-style-elegant .print-day-header { color: #666 !important; }
		.print-style-elegant .print-item-type { color: #666 !important; }

		/* Minimal print overrides */
		.print-style-minimal .print-title { border-color: black !important; }
		.print-style-minimal .print-item { border-color: #ccc !important; }
		.print-style-minimal .print-day-header { border-color: #ccc !important; }

		/* Botanical print overrides */
		.print-style-botanical {
			border-color: #5a8a5e !important;
		}

		.print-style-botanical::before,
		.print-style-botanical::after {
			color: #5a8a5e !important;
		}

		.print-style-botanical .print-title { color: #2a4d2e !important; }
		.print-style-botanical .print-description { border-color: #ccc !important; color: #444 !important; }
		.print-style-botanical .print-section-title { color: #2a4d2e !important; border-color: #aac8ad !important; }
		.print-style-botanical .print-day-header { color: #2a4d2e !important; }
		.print-style-botanical .print-item { border-color: #aac8ad !important; }
		.print-style-botanical .print-item-type { color: #5a8a5e !important; }

		/* Retro print overrides */
		.print-style-retro {
			border-color: black !important;
		}

		.print-style-retro::before,
		.print-style-retro::after {
			color: #999 !important;
		}

		.print-style-retro .print-description { border-color: #999 !important; }
		.print-style-retro .print-section-title { border-color: black !important; }
		.print-style-retro .print-day-header { border-color: #999 !important; }
		.print-style-retro .print-item { border-color: #999 !important; }

		/* Midnight print overrides */
		.print-style-midnight {
			background: white !important;
			color: black !important;
		}

		.print-style-midnight .print-title { color: #333 !important; }
		.print-style-midnight .print-meta { color: #555 !important; }
		.print-style-midnight .print-category { background: #333 !important; color: white !important; }
		.print-style-midnight .print-description { color: #444 !important; border-color: #ccc !important; }
		.print-style-midnight .print-section-title { color: #333 !important; border-color: #ccc !important; }
		.print-style-midnight .print-day-header { background: #f0f0f0 !important; color: #333 !important; }
		.print-style-midnight .print-item { background: #fafafa !important; border-color: #666 !important; }
		.print-style-midnight .print-item-title { color: black !important; }
		.print-style-midnight .print-item-detail { color: #444 !important; }
		.print-style-midnight .print-item-type { color: #555 !important; }
		.print-style-midnight .print-empty { color: #999 !important; }
	}

	/* Wedding actions bar */
	.wedding-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.wedding-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 16px;
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--font-sm);
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.wedding-action-btn:active {
		opacity: 0.8;
	}

	.wedding-action-btn svg {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.checklist-btn {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.edit-action-btn {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.checklist-badge {
		background: var(--color-border);
		font-size: 0.7rem;
		font-weight: 700;
		padding: 1px 7px;
		border-radius: var(--radius-full);
		margin-left: 2px;
	}

	/* Checklist modal */
	.checklist-modal .modal-body {
		padding: var(--space-md);
	}

	.checklist-progress {
		margin-bottom: var(--space-md);
	}

	.checklist-progress-text {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-sm);
		color: var(--color-text-secondary);
		margin-bottom: 6px;
	}

	.checklist-progress-pct {
		font-weight: 600;
		color: #22c55e;
	}

	.checklist-progress-bar {
		width: 100%;
		height: 8px;
		background: rgba(34, 197, 94, 0.15);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.checklist-progress-fill {
		height: 100%;
		background: #22c55e;
		border-radius: var(--radius-full);
		transition: width 0.25s ease;
	}

	.checklist-items {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.checklist-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: 10px 12px 10px 4px;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background 0.12s;
	}

	.checklist-item:hover {
		background: var(--color-surface);
	}

	.checklist-checkbox {
		width: 22px;
		height: 22px;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.15s;
	}

	.checklist-checkbox svg {
		width: 14px;
		height: 14px;
	}

	.checklist-checkbox-checked {
		background: #ec4899;
		border-color: #ec4899;
		color: white;
	}

	.checklist-label {
		font-size: var(--font-sm);
		color: var(--color-text);
		transition: all 0.15s;
	}

	.checklist-label-checked {
		text-decoration: line-through;
		color: var(--color-text-secondary);
	}

	.checklist-add-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.checklist-add-row input {
		padding: 10px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: var(--font-base);
		outline: none;
		color-scheme: dark;
	}

	.checklist-add-row input:focus {
		border-color: var(--color-primary);
	}

	.checklist-add-row .btn-footer-add {
		align-self: center;
		flex: none;
		padding: 8px 24px;
		font-size: var(--font-sm);
	}

	/* Checklist edit mode */
	.checklist-edit-btn {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		border-radius: var(--radius-sm);
	}

	.checklist-edit-btn svg {
		width: 20px;
		height: 20px;
	}

	.checklist-edit-btn:hover {
		color: #ec4899;
	}

	.checklist-edit-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: 8px 0;
		border-bottom: 1px solid var(--color-border);
	}

	.checklist-edit-row:last-child {
		border-bottom: none;
	}

	.checklist-drag-handle {
		display: flex;
		align-items: center;
		cursor: grab;
		color: var(--color-text-muted);
		flex-shrink: 0;
		padding: 2px;
		touch-action: none;
	}

	.checklist-drag-handle:active {
		cursor: grabbing;
	}

	.checklist-drag-handle svg {
		width: 18px;
		height: 18px;
	}

	.checklist-dragging {
		opacity: 0.4;
	}

	.checklist-drag-over {
		border-top: 2px solid #ec4899;
	}

	.checklist-edit-label {
		flex: 1;
		font-size: var(--font-sm);
		color: var(--color-text);
		cursor: pointer;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.checklist-edit-label:hover {
		color: #ec4899;
	}

	.checklist-rename-input {
		flex: 1;
		padding: 6px 10px;
		border: 1px solid #ec4899;
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: var(--font-sm);
		font-family: inherit;
		outline: none;
		min-width: 0;
		color-scheme: dark;
	}

	.checklist-action-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.checklist-remove-btn {
		color: var(--color-text-muted);
		font-size: 1.2rem;
		line-height: 1;
	}

	.checklist-remove-btn:hover {
		color: var(--color-danger, #ef4444);
	}

	.checklist-save-btn {
		color: #ec4899;
	}

	.checklist-save-btn svg {
		width: 18px;
		height: 18px;
	}

	/* Checklist mode toggle */
	.checklist-mode-toggle {
		position: relative;
		padding: 10px 0;
		margin-bottom: var(--space-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.mode-picker-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		background: none;
		color: var(--color-text-secondary);
		font-size: var(--font-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.mode-picker-btn:hover {
		border-color: #ec4899;
		color: #ec4899;
	}

	.mode-picker-btn svg {
		width: 16px;
		height: 16px;
	}

	.mode-picker-overlay {
		position: fixed;
		inset: 0;
		z-index: 19;
	}

	.mode-picker-popup {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin-top: 6px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg, 12px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
		z-index: 20;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.mode-option {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px 16px;
		background: none;
		border: none;
		border-bottom: 1px solid var(--color-border);
		text-align: left;
		cursor: pointer;
		transition: background 0.12s;
		color: var(--color-text);
	}

	.mode-option:last-child {
		border-bottom: none;
	}

	.mode-option:hover {
		background: var(--color-bg);
	}

	.mode-option.active {
		background: var(--color-bg);
	}

	.mode-option-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.mode-option-icon {
		display: flex;
		align-items: center;
		color: var(--color-text-secondary);
	}

	.mode-option-icon svg {
		width: 18px;
		height: 18px;
	}

	.mode-option.active .mode-option-icon {
		color: #ec4899;
	}

	.mode-option-title {
		font-size: var(--font-sm);
		font-weight: 600;
	}

	.mode-option.active .mode-option-title {
		color: #ec4899;
	}

	.mode-active-badge {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		color: #ec4899;
		background: rgba(236, 72, 153, 0.12);
		padding: 1px 8px;
		border-radius: var(--radius-full);
		letter-spacing: 0.03em;
	}

	.mode-option-desc {
		font-size: var(--font-xs, 0.75rem);
		color: var(--color-text-muted);
		line-height: 1.4;
		padding-left: 26px;
	}

	/* Manage States button */
	.manage-states-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: none;
		color: var(--color-text-secondary);
		font-size: var(--font-sm);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.manage-states-btn:hover {
		border-color: #ec4899;
		color: #ec4899;
	}

	.manage-states-dots {
		display: flex;
		gap: 4px;
	}

	.state-dot-mini {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* States editor modal */
	.states-editor-modal .modal-body {
		padding: var(--space-md);
	}

	/* Checklist states editor */
	.checklist-states-editor {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.state-editor-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.state-editor-row input[type="color"] {
		width: 24px;
		height: 24px;
		border: none;
		border-radius: 50%;
		padding: 0;
		cursor: pointer;
		background: none;
		flex-shrink: 0;
	}

	.state-editor-row input[type="color"]::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	.state-editor-row input[type="color"]::-webkit-color-swatch {
		border: none;
		border-radius: 50%;
	}

	.state-label {
		flex: 1;
		font-size: var(--font-sm);
		color: var(--color-text);
		cursor: pointer;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.state-label:hover {
		color: #ec4899;
	}

	.state-label-input {
		flex: 1;
		padding: 6px 10px;
		border: 1px solid #ec4899;
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: var(--font-sm);
		font-family: inherit;
		outline: none;
		min-width: 0;
		color-scheme: dark;
	}

	.state-add-row {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
		margin-top: 4px;
	}

	.state-add-row input {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font-size: var(--font-sm);
		font-family: inherit;
		outline: none;
		color-scheme: dark;
	}

	.state-add-row input:focus {
		border-color: var(--color-primary);
	}

	.state-add-row .btn-footer-add {
		flex: none;
		padding: 8px 16px;
		font-size: var(--font-sm);
	}

	/* State dot & badge */
	.state-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.state-badge {
		font-size: var(--font-xs, 0.75rem);
		font-weight: 600;
		margin-left: auto;
		flex-shrink: 0;
	}

	/* State picker popup */
	.checklist-item-wrapper {
		position: relative;
	}

	.state-picker-popup {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 10;
		overflow: hidden;
	}

	.state-picker-option {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: 10px 14px;
		width: 100%;
		background: none;
		border: none;
		color: var(--color-text);
		font-size: var(--font-sm);
		cursor: pointer;
		text-align: left;
		transition: background 0.12s;
	}

	.state-picker-option:hover {
		background: var(--color-bg);
	}

	.state-picker-option.active {
		background: var(--color-bg);
		font-weight: 600;
	}
</style>
