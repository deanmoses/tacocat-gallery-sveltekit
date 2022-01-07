<!--
  @component

  On hover, display a button to get into edit mode.  
	Only if current user is an admin.
-->

<script lang="ts">
  import { editMode } from "$lib/stores/EditModeStore";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";

	function onEditButtonClick() {
		const path = $page.url.pathname;
    goto(`${path}/edit`);
  }

</script>

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
</style>

{#if !$editMode}
  <div class="not-yet-editing-controls">
    <button on:click|once={onEditButtonClick}>Edit</button>
  </div>
{/if}