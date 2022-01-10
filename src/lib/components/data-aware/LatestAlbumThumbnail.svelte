<!--
  @component

  Fetches and displays a thumbnail of the latest album
-->

<script lang="ts">
  import Thumbnail from "$lib/components/site/Thumbnail.svelte";
  import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";
  import {shortDate} from "$lib/utils/date-utils";

  const album = AlbumStoreHelpers.getLatestAlbum();
</script>

{#await AlbumStoreHelpers.fetchLatestAlbum()}
  <!-- display nothing until it's loaded -->
{:then}
  <aside>
    <h2>Latest Album</h2>
    <Thumbnail
      title="{shortDate($album.date)}"
      summary="{$album.customdata}"
      href="/{$album.path}"
      src="https://cdn.tacocat.com{$album.url_thumb}"
    />
  </aside>
{:catch error}
  Error fetching latest album: <div>{error}</div>
{/await}

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