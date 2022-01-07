<!--
  @component

  Controls for editing images
-->

<script lang="ts">
	import EditControlsLayout from "./EditControlsLayout.svelte";
  import { editMode } from "$lib/stores/EditModeStore";
	import draftStore from "$lib/stores/DraftStore";
	import { DraftStatus } from "$lib/models/models";
	import { page } from "$app/stores";

	const status = draftStore.getStatus();

  function onCancelButtonClick() {
		draftStore.cancel();
    const isEditing = false;
    editMode.set(isEditing);
  }

	function onSaveButtonClick() {
		draftStore.save();
	}

	function onPublishedChange(event) {
		draftStore.setPublished(event.target.checked);
	}

	// Cancel the draft when any navigation happens
	// The $: is Svelte syntax.  This gets compiled into a
	// reactive statement that executes whenever any of the 
	// variables referenced within it changes.
	// So while I don't use the $page variable, I must
	// reference it
	$: {
		if ($editMode) {
			console.log("Navigated to ", $page.url.pathname);
			draftStore.init($page.url.pathname);
		}
		else {
			console.log("If I were in edit mode I'd be clearing the draft state right now");
		}
	}
</script>

<EditControlsLayout>

	<svelte:fragment slot="leftControls">
		<button on:click|once={onCancelButtonClick}>Cancel</button>
	</svelte:fragment>

	<svelte:fragment slot="status">
		{#if $status === DraftStatus.SAVING}
			🔄 saving... 
		{:else if $status === DraftStatus.SAVED}
			✅ saved
		{/if}
	</svelte:fragment>

	<svelte:fragment slot="rightControls">
		<button on:click|once={onSaveButtonClick}>Save</button>
	</svelte:fragment>

</EditControlsLayout>