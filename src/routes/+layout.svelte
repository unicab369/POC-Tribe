<script lang="ts">
	import '../app.css';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>POC Tribe</title>
</svelte:head>

<main class="app-content">
	{@render children()}
</main>

<BottomNav />

<style>
	.app-content {
		padding-bottom: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 16px);
		min-height: 100vh;
	}
</style>
