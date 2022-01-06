<!--
  @component

  Make the passed-in HTML editable if we're in edit mode
-->
<script lang="ts">
	import { editMode } from "$lib/stores/EditModeStore";
	import HtmlEditor from "./HtmlEditor.svelte";
	import DraftStore from "$lib/stores/DraftStore";

	/** The HTML content to be made editable */
	export let htmlContent = "";

	let newHtmlContent;

	// Update the draft store any time the HTML is edited
	// The $: is Svelte syntax.  This gets compiled into a
	// reactive statement that executes whenever any of the 
	// variables referenced within it changes.
	$: {
		DraftStore.setDesc(newHtmlContent);
	}
</script>

{#if $editMode}
	<HtmlEditor {htmlContent} bind:newHtmlContent />
{:else}
	<div class="caption">{@html htmlContent}</div>
{/if}