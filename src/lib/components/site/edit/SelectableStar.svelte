<!--
  @component

  Star that allows for selection.  Meant to be used in a thumbnail
-->

<script lang="ts">
	import EmptyStarIcon from "../icons/EmptyStarIcon.svelte";
	import FilledStarIcon from "../icons/FilledStarIcon.svelte";
	import TransitionStarIcon from "../icons/TransitionStarIcon.svelte";
	import { createEventDispatcher } from "svelte";

	export let selected = false;
	export let path: string;

	let selecting: boolean;
	$: {
		console.log("selected: ", selected); // this is needed so that $: changes every time selected changes
		selecting = false;
	}

	const dispatch = createEventDispatcher<{selected: {path: string}}>();

	function onEmptyStarClick() {
		selecting = true;
		dispatch("selected", {path});
	}
</script>

{#if selected}
	<div class="selected"><FilledStarIcon height="2em" width="2em" /></div>
{:else if selecting}
	<div class="selecting"><TransitionStarIcon on:click={onEmptyStarClick} /></div>
{:else}
	<div class="notSelected"><EmptyStarIcon on:click={onEmptyStarClick} /></div>
{/if}

<style>
	div {
		position: absolute;
		top: 10px;
		left: 10px;
	}
	.selected, .selecting {
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