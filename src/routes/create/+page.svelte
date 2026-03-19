<script lang="ts">
	import { goto } from '$app/navigation';
	import { addEvent } from '$lib/stores/events';
	import type { Event } from '$lib/types';

	let title = $state('');
	let description = $state('');
	let date = $state('');
	let time = $state('');
	let location = $state('');
	let category = $state<Event['category']>('social');
	let errors = $state<Record<string, string>>({});
	let showSuccess = $state(false);

	function validate(): boolean {
		const newErrors: Record<string, string> = {};
		if (!title.trim()) newErrors.title = 'Title is required';
		if (!description.trim()) newErrors.description = 'Description is required';
		if (!date) newErrors.date = 'Date is required';
		if (!time) newErrors.time = 'Time is required';
		if (!location.trim()) newErrors.location = 'Location is required';
		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!validate()) return;

		addEvent({
			title: title.trim(),
			description: description.trim(),
			date,
			time,
			location: location.trim(),
			category
		});

		showSuccess = true;
		setTimeout(() => {
			goto('/events');
		}, 1000);
	}
</script>

<div class="container">
	<h1 class="page-title">Create Event</h1>

	{#if showSuccess}
		<div class="success-banner">Event created successfully!</div>
	{/if}

	<form class="form" onsubmit={handleSubmit}>
		<div class="field">
			<label for="title">Title</label>
			<input id="title" type="text" bind:value={title} placeholder="Event title" />
			{#if errors.title}<span class="error">{errors.title}</span>{/if}
		</div>

		<div class="field">
			<label for="description">Description</label>
			<textarea id="description" bind:value={description} placeholder="What's this event about?" rows="3"></textarea>
			{#if errors.description}<span class="error">{errors.description}</span>{/if}
		</div>

		<div class="field-row">
			<div class="field">
				<label for="date">Date</label>
				<input id="date" type="date" bind:value={date} />
				{#if errors.date}<span class="error">{errors.date}</span>{/if}
			</div>
			<div class="field">
				<label for="time">Time</label>
				<input id="time" type="time" bind:value={time} />
				{#if errors.time}<span class="error">{errors.time}</span>{/if}
			</div>
		</div>

		<div class="field">
			<label for="location">Location</label>
			<input id="location" type="text" bind:value={location} placeholder="Where is it?" />
			{#if errors.location}<span class="error">{errors.location}</span>{/if}
		</div>

		<div class="field">
			<label for="category">Category</label>
			<select id="category" bind:value={category}>
				<option value="social">Social</option>
				<option value="business">Business</option>
				<option value="sports">Sports</option>
				<option value="music">Music</option>
				<option value="other">Other</option>
			</select>
		</div>

		<button type="submit" class="submit-btn" disabled={showSuccess}>Create Event</button>
	</form>
</div>

<style>
	.page-title {
		font-size: var(--font-2xl);
		font-weight: 700;
		padding-top: var(--space-lg);
		margin-bottom: var(--space-md);
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
</style>
