<!--
  @component

  Page that displays an error instead of an album
-->

<script lang="ts">
	import BlankAlbumPageLayout from "./layouts/BlankAlbumPageLayout.svelte";

	export let year:string;
</script>

<BlankAlbumPageLayout {year}>
	<slot />
</BlankAlbumPageLayout>