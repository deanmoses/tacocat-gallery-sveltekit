<!--
  @component

  Make the passed-in text (not HTML) editable if we're in edit mode
-->
<script lang="ts">
	import { editMode } from "$lib/stores/EditModeStore";

	/** The text content to be made editable */
	export let textContent = "";
</script>

{#if $editMode}
	<div contenteditable>{textContent}</div>
{:else}
	{textContent}
{/if}