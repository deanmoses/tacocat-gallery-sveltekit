<!--
  @component

  The base editing controls shared by both images and albums
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
</script>

<EditControlsLayout>

	<svelte:fragment slot="leftControls">
		<CancelButton on:click|once={onCancelButtonClick} />
	</svelte:fragment>

	<svelte:fragment slot="status">
		<StatusMessage status={$status} />
	</svelte:fragment>

	<svelte:fragment slot="rightControls">
		<slot name="rightControls" />
		<SaveButton on:click={onSaveButtonClick} {hasUnsavedChanges} />
	</svelte:fragment>

</EditControlsLayout>