<!--
  @component

  Controls for editing albums and photos
-->

<script lang="ts">
  import { editMode } from "$lib/stores/EditModeStore";

  function onEditClick() {
    const isEditing = true;
    editMode.set(isEditing);
  }
  function onCancelClick() {
    const isEditing = false;
    editMode.set(isEditing);
  }
</script>

<style>
    .edit-controls {
        position: fixed;
        top: 0;
        left: 0;
        min-height: 4em;
        min-width: 4em;
    }

    .edit-controls button {
        margin: 0.7em;
        display: none; /* will be overridden on hover */
    }

    .edit-controls:hover button {
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

    .cancel {
      margin-right: auto;
    }
</style>

{#if !$editMode}
  <div class="edit-controls">
    <button on:click|once={onEditClick}>Edit</button>
  </div>
{:else}
  <div class="editing-controls">
    <button class="cancel" on:click|once={onCancelClick}>Cancel</button> 
    <button class="save">Save</button>
  </div>
{/if}