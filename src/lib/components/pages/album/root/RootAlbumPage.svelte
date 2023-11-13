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
    import Config from '$lib/utils/config';
    import { albumPathToDate } from '$lib/utils/galleryPathUtils';
    import type { Album } from '$lib/models/impl/GalleryItemInterfaces';

    export let album: Album;

    function getTitle(albumPath: string): string {
        return albumPathToDate(albumPath).getFullYear().toString();
    }
</script>

<svelte:head>
    <title>The Moses Family</title>
</svelte:head>

<SiteLayout>
    <Header hideSiteTitle>
        <ResponsiveTitle title={Config.siteTitle()} shortTitle={Config.siteShortTitle()} />
    </Header>
    <PageContent>
        <Sidebar>
            <LatestAlbumThumbnail />
        </Sidebar>
        <MainContent>
            <Thumbnails>
                {#if album.albums}
                    {#each album.albums as childAlbum (childAlbum.path)}
                        <Thumbnail
                            title={getTitle(childAlbum.path)}
                            summary={childAlbum.summary}
                            href={childAlbum.path}
                            src={childAlbum.thumbnailUrl}
                        />
                    {/each}
                {/if}
            </Thumbnails>
        </MainContent>
    </PageContent>
</SiteLayout>
