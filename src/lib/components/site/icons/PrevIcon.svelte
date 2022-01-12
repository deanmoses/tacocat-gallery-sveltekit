<!--
  @component

  An icon representing the concept of "prev"
-->

<script lang="ts">
	import Icon from './Icon.svelte';
	import { createEventDispatcher } from 'svelte';

	export let title = "Previous";

	const d = "M749 198L397 551l352 353-197 198L0 550 552 0z";
	const viewBox = "0 0 749 1102";

	const dispatch = createEventDispatcher();

	function onClick() {
		dispatch("click", {});
	}
</script>

<Icon on:click={onClick} {viewBox} {title} {d} />