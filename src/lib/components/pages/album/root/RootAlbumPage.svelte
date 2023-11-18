<!--
  @component

  Page displaying the root album
-->
<script lang="ts">
    import SiteLayout from '$lib/components/site/SiteLayout.svelte';
    import Header from '$lib/components/site/Header.svelte';
    import ResponsiveTitle from '$lib/components/site/ResponsiveTitle.svelte';
    import PageContent from '$lib/components/site/PageContent.svelte';
    import Sidebar from '$lib/components/site/Sidebar.svelte';
    import MainContent from '$lib/components/site/MainContent.svelte';
    import Thumbnails from '$lib/components/site/Thumbnails.svelte';
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import LatestAlbumThumbnail from '$lib/components/data-aware/LatestAlbumThumbnail.svelte';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import { siteShortTitle, siteTitle } from '$lib/utils/config';
    import EditToggle from '$lib/components/site/edit/toggle/EditToggle.svelte';

    export let album: Album;
</script>

<svelte:head>
    <title>The Moses Family</title>
</svelte:head>

<EditToggle />
<SiteLayout>
    <Header hideSiteTitle>
        <ResponsiveTitle title={siteTitle()} shortTitle={siteShortTitle()} />
    </Header>
    <PageContent>
        <Sidebar>
            <LatestAlbumThumbnail />
        </Sidebar>
        <MainContent>
            <Thumbnails>
                {#if album.albums}
                    {#each album.albums as childAlbum (childAlbum.path)}
                        <Thumbnail title={childAlbum.title} href={childAlbum.path} src={childAlbum.thumbnailUrl} />
                    {/each}
                {/if}
            </Thumbnails>
        </MainContent>
    </PageContent>
</SiteLayout>
