<script lang="ts">
	import { page } from '$app/state';

	const tabs = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/events', label: 'Events', icon: 'events' },
		{ href: '/create', label: 'Create', icon: 'create' },
		{ href: '/profile', label: 'Profile', icon: 'profile' }
	] as const;

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<nav class="bottom-nav">
	{#each tabs as tab}
		<a href={tab.href} class="nav-tab" class:active={isActive(tab.href)}>
			<span class="nav-icon">
				{#if tab.icon === 'home'}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
						<polyline points="9 22 9 12 15 12 15 22" />
					</svg>
				{:else if tab.icon === 'events'}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
						<line x1="16" y1="2" x2="16" y2="6" />
						<line x1="8" y1="2" x2="8" y2="6" />
						<line x1="3" y1="10" x2="21" y2="10" />
					</svg>
				{:else if tab.icon === 'create'}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="16" />
						<line x1="8" y1="12" x2="16" y2="12" />
					</svg>
				{:else if tab.icon === 'profile'}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
						<circle cx="12" cy="7" r="4" />
					</svg>
				{/if}
			</span>
			<span class="nav-label">{tab.label}</span>
		</a>
	{/each}
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: var(--nav-height);
		background: var(--color-surface);
		border-top: 1px solid var(--color-border);
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding-bottom: env(safe-area-inset-bottom, 0);
		z-index: 100;
	}

	.nav-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: var(--space-sm) var(--space-md);
		color: var(--color-text-muted);
		text-decoration: none;
		transition: color 0.2s;
		-webkit-tap-highlight-color: transparent;
	}

	.nav-tab.active {
		color: var(--color-primary);
	}

	.nav-icon {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-icon svg {
		width: 24px;
		height: 24px;
	}

	.nav-label {
		font-size: 0.7rem;
		font-weight: 500;
	}
</style>
