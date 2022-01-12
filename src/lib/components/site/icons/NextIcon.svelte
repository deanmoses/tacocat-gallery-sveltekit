<!--
  @component

  An icon representing the concept of "next"
-->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let width = "1em";
	export let height = "1em";
	export let title: string = null;

	const d = "M749 551l-551 551L0 904l353-353L0 198 198 0z";
	const viewBox = "0 0 749 1102";

	const dispatch = createEventDispatcher();

	function onClick() {
		dispatch("click", {});
	}
</script>

<svg on:click={onClick} {width} {height} {viewBox}>
	{#if title}<title>{title}</title>{/if}
	<path {d}></path>
</svg>

<style>
	path {
		fill: currentcolor;
	}
</style>