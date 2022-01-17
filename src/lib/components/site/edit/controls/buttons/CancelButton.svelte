<!--
  @component

  A cancel button
-->

<script lang="ts">
	import CancelIcon from "$lib/components/site/icons/CancelIcon.svelte";
</script>

<button on:click><CancelIcon /> Cancel</button>

<style>
	button {
		display: flex;
		align-items: center;
		gap: 0.3em;
	}
</style>