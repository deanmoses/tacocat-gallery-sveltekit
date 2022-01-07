<!--
  @component

  Controls for editing albums
-->

<script lang="ts">
	import EditControlsLayout from "./EditControlsLayout.svelte";
	import draftStore from "$lib/stores/DraftStore";
	import { DraftStatus } from "$lib/models/models";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";

	const status = draftStore.getStatus();

  function onCancelButtonClick() {
		draftStore.cancel();

		let path:string = $page.url.pathname;
		path = path.replace("/edit", "");
		goto(path);
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
		console.log("Navigated to ", $page.url.pathname);
		draftStore.init($page.url.pathname);
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
		<div><input type="checkbox" on:change={onPublishedChange}/> published</div>
		<button on:click|once={onSaveButtonClick}>Save</button>
	</svelte:fragment>

</EditControlsLayout>