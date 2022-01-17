<!--
  @component

  Controls for editing albums
-->

<script lang="ts">
	import BaseEditControls from "./BaseEditControls.svelte";
	import draftStore from "$lib/stores/DraftStore";

	/** Show the published checkbox.  Should only be shown on day albums, not year albums */
	export let showPublished: boolean = false;

	/** Whether album is published or not */
	export let unpublished: boolean;

	function onPublishedChange(event) {
		draftStore.setPublished(event.target.checked);
	}
</script>

<BaseEditControls>

	<svelte:fragment slot="rightControls">
		{#if showPublished}
			<div>
				<input type="checkbox" checked={!unpublished} on:change={onPublishedChange}/> published
			</div>
		{/if}
	</svelte:fragment>

</BaseEditControls>