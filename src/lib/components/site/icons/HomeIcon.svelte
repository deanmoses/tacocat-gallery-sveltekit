<!--
  @component

  An icon representing the concept of "home" or "up"
-->

<script lang="ts">
	import Icon from './Icon.svelte';
	import { createEventDispatcher } from 'svelte';

	export let width = "1.2em";
	export let height = "1.25em";
	export let title: string = null;

	const d = "M18.672 11h-1.672v6c0 0.445-0.194 1-1 1h-4v-6h-4v6h-4c-0.806 0-1-0.555-1-1v-6h-1.672c-0.598 0-0.47-0.324-0.060-0.748l8.024-8.032c0.195-0.202 0.451-0.302 0.708-0.312 0.257 0.010 0.513 0.109 0.708 0.312l8.023 8.031c0.411 0.425 0.539 0.749-0.059 0.749z";
	const viewBox = "0 0 20 20";

	const dispatch = createEventDispatcher();

	function onClick() {
		dispatch("click", {});
	}
</script>

<Icon on:click={onClick} {width} {height} {viewBox} {title} {d} />