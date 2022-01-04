<script lang="ts">
    import Header from "$lib/site/Header.svelte";
    import PageContent from "$lib/site/PageContent.svelte";
    import Sidebar from "$lib/site/Sidebar.svelte";
    import MainContent from "$lib/site/MainContent.svelte";
    import Thumbnails from "$lib/site/Thumbnails.svelte";
    import Thumbnail from "$lib/site/Thumbnail.svelte";
    import LatestAlbumThumbnail from "$lib/components/data-aware/LatestAlbumThumbnail.svelte";

    export let album;
</script>

<svelte:head>
	<title>Dean, Lucie, Felix and Milo Moses</title>
</svelte:head>

<Header>
  <span slot="title">Dean, Lucie, Felix and Milo Moses</span>
  <span slot="short-title">The Moses Family</span>
</Header>
<PageContent>
  <Sidebar>
    <LatestAlbumThumbnail />
  </Sidebar>
  <MainContent>
    <Thumbnails>
      {#if $album.albums}
      {#each $album.albums as childAlbum (childAlbum.path)}
        <Thumbnail
          title="{childAlbum.title}"
          summary="{childAlbum.customdata}"
          href="/{childAlbum.path}"
          src="https://cdn.tacocat.com{childAlbum.url_thumb}"
        />
      {/each}
      {/if}
    </Thumbnails>
  </MainContent>
</PageContent>