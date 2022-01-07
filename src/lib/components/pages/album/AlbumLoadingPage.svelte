<!--
  @component

  An "Album is Loading" stencil page to show while waiting for an album to load
-->

<script lang="ts">
	import BlankAlbumPageLayout from "./BlankAlbumPageLayout.svelte";
	import WaitingSpinner from "$lib/components/site/WaitingSpinner.svelte";

	export let year:string = null;
</script>

<BlankAlbumPageLayout {year}>
	<WaitingSpinner />
</BlankAlbumPageLayout>