<!--
  @component

  Controls for editing albums
-->

<script lang="ts">
	import EditControlsLayout from "./EditControlsLayout.svelte";
	import draftStore from "$lib/stores/DraftStore";
	import { DraftStatus } from "$lib/models/draft";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { unEditUrl } from "$lib/utils/path-utils";
	import CancelIcon from "../../icons/CancelIcon.svelte";
	import SaveIcon from "../../icons/SaveIcon.svelte";

	const status = draftStore.getStatus();

	let path:string;
	$:path = unEditUrl($page.url.pathname);

	let hasUnsavedChanges: boolean;
	$: hasUnsavedChanges = $status == DraftStatus.UNSAVED_CHANGES;

	// Cancel the draft when any navigation happens
	$: draftStore.init(path);

  function onCancelButtonClick() {
		draftStore.cancel();
		goto(path);
  }

	function onSaveButtonClick() {
		draftStore.save();
	}

	function onPublishedChange(event) {
		draftStore.setPublished(event.target.checked);
	}
</script>

<EditControlsLayout>

	<svelte:fragment slot="leftControls">
		<button on:click|once={onCancelButtonClick}><CancelIcon /> Cancel</button>
	</svelte:fragment>

	<svelte:fragment slot="status">
		{#if $status === DraftStatus.SAVING}
			🔄 saving... 
		{:else if $status === DraftStatus.SAVED}
			✅ saved
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="rightControls">
		<div><input type="checkbox" on:change={onPublishedChange}/> published</div>
		<button on:click|once={onSaveButtonClick} disabled={!hasUnsavedChanges}>
			{#if hasUnsavedChanges}
				<SaveIcon /> Save*
			{:else}
			<SaveIcon /> Save
			{/if}
		</button>
	</svelte:fragment>

</EditControlsLayout>

<style>
	button {
		display: flex;
		align-items: center;
		gap: 0.3em;
	}
</style>