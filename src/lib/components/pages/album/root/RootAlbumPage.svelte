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
    import AdminToggle from '$lib/components/site/admin/toggle/AdminToggle.svelte';

    export let album: Album;

    $: sortedAlbums = album.albums ? album.albums.sort((a, b) => b.path.localeCompare(a.path)) : [];
</script>

<svelte:head>
    <title>The Moses Family</title>
</svelte:head>

<AdminToggle />
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
                {#each sortedAlbums as childAlbum (childAlbum.path)}
                    <Thumbnail title={childAlbum.title} href={childAlbum.path} src={childAlbum.thumbnailUrl} />
                {/each}
            </Thumbnails>
        </MainContent>
    </PageContent>
</SiteLayout>
