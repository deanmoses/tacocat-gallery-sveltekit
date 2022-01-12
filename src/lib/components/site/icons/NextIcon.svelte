<!--
  @component

  An icon representing the concept of "next"
-->

<script lang="ts">
	import Icon from './Icon.svelte';
	import { createEventDispatcher } from 'svelte';

	export let title = "Next";

	const d = "M749 551l-551 551L0 904l353-353L0 198 198 0z";
	const viewBox = "0 0 749 1102";

	const dispatch = createEventDispatcher();

	function onClick() {
		dispatch("click", {});
	}
</script>

<Icon on:click={onClick} {viewBox} {title} {d} />