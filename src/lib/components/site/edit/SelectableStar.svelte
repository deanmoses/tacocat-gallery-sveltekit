<!--
  @component

  Star that allows for selection.  Meant to be used in a thumbnail
-->

<script lang="ts">
	import EmptyStarIcon from "../icons/EmptyStarIcon.svelte";
	import FilledStarIcon from "../icons/FilledStarIcon.svelte";

	export let selected = false;

	function onFilledStarClick() {
		console.log("filled star click");
		selected = false;
	}

	function onEmptyStarClick() {
		console.log("empty star click");
		selected = true;
	}
</script>

{#if selected}
	<div class="selected"><FilledStarIcon on:click={onFilledStarClick} /></div>
{:else}
	<div class="notSelected"><EmptyStarIcon on:click={onEmptyStarClick} /></div>
{/if}

<style>
	div {
		position: absolute;
		top: 10px;
		left: 10px;
	}
	.selected {
		color: yellow;
	}
	.notSelected {
		color: white;
	}
	.notSelected:hover {
		color: yellow;
	}
</style>