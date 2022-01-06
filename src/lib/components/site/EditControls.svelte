<!--
  @component

  Controls for editing albums and photos
-->

<script lang="ts">
  import { editMode } from "$lib/stores/EditModeStore";

  function onEditButtonClick() {
    const isEditing = true;
    editMode.set(isEditing);
  }

  function onCancelButtonClick() {
    const isEditing = false;
    editMode.set(isEditing);
  }

	function onSaveButtonClick() {
		console.log("TODO: Save button clicked");
	}
</script>

{#if !$editMode}
  <div class="not-yet-editing-controls">
    <button on:click|once={onEditButtonClick}>Edit</button>
  </div>
{:else}
  <div class="editing-controls">
    <button class="cancel" on:click|once={onCancelButtonClick}>Cancel</button> 
    <button class="save" on:click|once={onSaveButtonClick}>Save</button>
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
			display: inherit;/* */
	}

	.editing-controls {
			display: flex;
			justify-content: flex-end;
			gap: .5em;
			padding: .5em;
			background-color: rgb(65, 64, 64);
			border-bottom: 1px solid black;
	}

	.editing-controls .cancel {
		margin-right: auto;
	}
</style>