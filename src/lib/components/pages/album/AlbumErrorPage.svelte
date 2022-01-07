<!--
  @component

  Page that displays an error instead of an album
-->

<script lang="ts">
	import BlankAlbumPageLayout from "./BlankAlbumPageLayout.svelte";

	export let year:string = null;;
</script>

<BlankAlbumPageLayout {year}>
	<slot />
</BlankAlbumPageLayout>