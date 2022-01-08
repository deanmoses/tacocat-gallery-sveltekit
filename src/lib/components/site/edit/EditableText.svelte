<!--
  @component

  Make the passed-in text editable
	Plain text, not HTML
-->
<script lang="ts">
	import DraftStore from "$lib/stores/DraftStore";

	/** The text content to be made editable */
	export let textContent = "";

	let div;

	function onInput(e) {
		let editedText = div.innerText;
		DraftStore.setTitle(editedText)
	}
</script>

<div contenteditable bind:this={div} on:input={onInput}>{textContent}</div>
