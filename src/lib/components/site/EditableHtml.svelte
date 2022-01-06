<!--
  @component

  Make the passed-in HTML editable if we're in edit mode
-->
<script lang="ts">
	import { editMode } from "$lib/stores/EditModeStore";
	import HtmlEditor from "./HtmlEditor.svelte";

	/** The HTML content to be made editable */
	export let htmlContent = "";
</script>

{#if $editMode}
	<HtmlEditor {htmlContent} />
{:else}
	<div class="caption">{@html htmlContent}</div>
{/if}