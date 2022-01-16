<script lang="ts">
	import "$lib/styles/reset.css";
	import "$lib/styles/global.css";
	import "$lib/styles/years.css";
	import { handleKeyboardNavigation } from "$lib/utils/keyboard-navigation";
	import { page } from '$app/stores';

	/**
	 * Handle keyboard navigation
	 */
	function onKeyPress(event: KeyboardEvent): void {		
		if (event.defaultPrevented) {
			return;
		}

		let path = $page.url.pathname;
		if (!path.endsWith('edit')) {
			path = path.replace(/^\//, ''); // remove first character if it's a slash
			handleKeyboardNavigation(event.key, path);
		}
	}
</script>

<slot />

<svelte:window on:keydown={onKeyPress}/>