<!--
  @component

  Star that allows for selection.  Meant to be used in a thumbnail
-->

<script lang="ts">
	import EmptyStarIcon from "../icons/EmptyStarIcon.svelte";
	import FilledStarIcon from "../icons/FilledStarIcon.svelte";
	import { createEventDispatcher } from "svelte";

	export let selected = false;
	export let path: string;

	const dispatch = createEventDispatcher<{selected: {path: string}}>();

	function onEmptyStarClick() {
		dispatch("selected", {path});
	}
</script>

{#if selected}
	<div class="selected"><FilledStarIcon /></div>
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
		display: none;
	}
	.notSelected:hover {
		color: yellow;
	}
</style>