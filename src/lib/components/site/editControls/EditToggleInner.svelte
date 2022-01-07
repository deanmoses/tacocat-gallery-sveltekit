<!--
  @component

  On hover, display a button to get into edit mode.  
-->

<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { editUrl } from "$lib/utils/path-utils";

	function onEditButtonClick() {
		const path = $page.url.pathname;
		goto(editUrl(path));
  }
</script>

<style>
	div {
		position: fixed;
		top: 0;
		left: 0;
		min-height: 4em;
		min-width: 4em;
	}

	button {
		margin: 0.7em;
		display: none; /* will be overridden on hover */
	}

	div:hover button {
		display: inherit;
	}
</style>

<div>
	<button on:click|once={onEditButtonClick}>Edit</button>
</div>