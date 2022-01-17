<!--
  @component

  A save button
-->

<script lang="ts">
	import SaveIcon from "$lib/components/site/icons/SaveIcon.svelte";

	export let hasUnsavedChanges:boolean;
</script>

<button on:click disabled={!hasUnsavedChanges}>
	{#if hasUnsavedChanges}
		<SaveIcon /> Save*
	{:else}
		<SaveIcon /> Save
	{/if}
</button>

<style>
	button {
		display: flex;
		align-items: center;
		gap: 0.3em;
	}
</style>