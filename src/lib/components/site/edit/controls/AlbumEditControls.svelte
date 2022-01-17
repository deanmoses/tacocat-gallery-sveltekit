<!--
  @component

  Controls for editing albums
-->

<script lang="ts">
	import EditControlsLayout from "./EditControlsLayout.svelte";
	import CancelButton from "./buttons/CancelButton.svelte";
	import SaveButton from "./buttons/SaveButton.svelte";
	import StatusMessage from "./buttons/StatusMessage.svelte";
	import draftStore from "$lib/stores/DraftStore";
	import { DraftStatus } from "$lib/models/draft";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { unEditUrl } from "$lib/utils/path-utils";
	import CancelIcon from "../../icons/CancelIcon.svelte";
	import SaveIcon from "../../icons/SaveIcon.svelte";

	/** Show the published checkbox.  Should only be shown on day albums, not year albums */
	export let showPublished: boolean = false;

	/** Whether album is published or not */
	export let unpublished: boolean;

	const status = draftStore.getStatus();

	let path:string;
	$: path = unEditUrl($page.url.pathname);

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
		<CancelButton on:click|once={onCancelButtonClick} />
	</svelte:fragment>

	<svelte:fragment slot="status">
		<StatusMessage status={$status} />
	</svelte:fragment>

	<svelte:fragment slot="rightControls">
		{#if showPublished}
		<div><input type="checkbox" checked={!unpublished} on:change={onPublishedChange}/> published</div>
		{/if}
		<SaveButton on:click={onSaveButtonClick} {hasUnsavedChanges} />
	</svelte:fragment>

</EditControlsLayout>