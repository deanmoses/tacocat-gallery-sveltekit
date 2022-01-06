<!--
  @component

  Controls for editing albums and photos
-->

<script lang="ts">
  import { editMode } from "$lib/stores/EditModeStore";
	import draftStore from "$lib/stores/DraftStore";
	import { DraftStatus } from "$lib/models/models";
	import { page } from "$app/stores";

	const status = draftStore.getStatus();

  function onEditButtonClick() {
    const isEditing = true;
    editMode.set(isEditing);
  }

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

{#if !$editMode}
  <div class="not-yet-editing-controls">
    <button on:click|once={onEditButtonClick}>Edit</button>
  </div>
{:else}
  <div class="editing-controls">
		<div class="left">
			<button on:click|once={onCancelButtonClick}>Cancel</button> 
			<div>
				{#if $status === DraftStatus.SAVING}
					🔄 saving... 
				{:else if $status === DraftStatus.SAVED}
					✅ saved
				{/if}
			</div>
		</div>
		<div><input type="checkbox" on:change={onPublishedChange}/> published</div>
    <button on:click|once={onSaveButtonClick}>Save</button>
  </div>
{/if}

<style>
	.not-yet-editing-controls {
			position: fixed;
			top: 0;
			left: 0;
			min-height: 4em;
			min-width: 4em;
	}

	.not-yet-editing-controls button {
			margin: 0.7em;
			display: none; /* will be overridden on hover */
	}

	.not-yet-editing-controls:hover button {
			display: inherit;
	}

	.editing-controls {
			display: flex;
			justify-content: flex-end;
			align-items: center;
			gap: 1em;
			padding: .5em;
			border-bottom: 1px solid black;
			background-color: rgb(65, 64, 64);
			color: rgb(211, 211, 211);
	}

	.left {
		margin-right: auto;
		display: flex;
		align-items: center;
		gap: 1em;
	}
</style>