<!--
  @component

  Make the passed-in text editable
	Plain text, not HTML
-->
<script lang="ts">
	import DraftStore from "$lib/stores/DraftStore";

	/** The text content to be made editable */
	export let textContent:string = "";

	// Update the draft store any time the text is edited.
	// The $: is Svelte syntax.  This gets compiled into a
	// reactive statement that executes whenever any of the 
	// variables referenced within it changes.
	$: {
		DraftStore.setTitle(textContent);
	}
</script>

<div contenteditable bind:textContent={textContent}/>
