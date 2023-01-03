<!--
  @component

  Base component for all SVG icons
-->
<script lang="ts">
	export let width = '1em';
	export let height = '1em';
	export let title: string | undefined = undefined;
	export let d: string;
	export let viewBox: string;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<svg on:click {width} {height} {viewBox}>
	{#if title}<title>{title}</title>{/if}
	<path {d} />
</svg>

<style>
	svg {
		display: inline;
		position: relative;
		bottom: 0.125em;
		vertical-align: middle;
	}
	path {
		fill: currentcolor;
	}
</style>
