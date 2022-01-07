<!--
  @component

  Make the passed-in HTML editable
	When you select some text, it pops up a rich text editor
-->
<script lang="ts">
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

<HtmlEditor {htmlContent} bind:newHtmlContent />
