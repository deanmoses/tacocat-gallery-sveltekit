<!--
  @component

  Fetches and displays a thumbnail of the latest album
-->

<script lang="ts">
	import Thumbnail from "$lib/components/site/Thumbnail.svelte";
	import type { AlbumThumb } from "$lib/models/album";
	import { AlbumLoadStatus } from "$lib/models/album";
	import { latestAlbumThumbnailEntry } from "$lib/stores/LatestAlbumStore";
	import Config from "$lib/utils/config";
	import {shortDate} from "$lib/utils/date-utils";

	let status: AlbumLoadStatus;
	$: status = $latestAlbumThumbnailEntry.status;

	let thumb: AlbumThumb;
	$: thumb = $latestAlbumThumbnailEntry.thumbnail;
</script>

{#if AlbumLoadStatus.NOT_LOADED == status || AlbumLoadStatus.LOADING == status}
	<!-- display nothing until it's loaded -->
{:else if AlbumLoadStatus.ERROR_LOADING == status}
	<!-- display nothing if there's an error -->
{:else if AlbumLoadStatus.LOADED == status}
	<aside>
		<h2>Latest Album</h2>
		<Thumbnail
			title="{shortDate(thumb.date)}"
			summary="{thumb.customdata}"
			href="/{thumb.path}"
			src={Config.cdnUrl(thumb.url_thumb)}
		/>
	</aside>
{:else}
	Unhandled status: {status}
{/if}

<style>
  aside {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7em;
  }
  aside h2 {
      font-size: 16px;
      font-weight: bold;
      color: var(--default-text-color);
  }
</style>