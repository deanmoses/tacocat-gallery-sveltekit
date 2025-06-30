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
    import AlbumThumbnail from '$lib/components/site/AlbumThumbnail.svelte';
    import LatestAlbumThumbnail from '$lib/components/data-aware/LatestAlbumThumbnail.svelte';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import { siteShortTitle, siteTitle } from '$lib/utils/config';
    import AdminToggle from '$lib/components/site/admin/toggle/AdminToggle.svelte';
    import FeelingLuckyButton from '$lib/components/site/FeelingLuckyButton.svelte';

    interface Props {
        album: Album;
    }

    let { album }: Props = $props();

    let sortedAlbums = $derived(album.albums.sort((a, b) => b.path.localeCompare(a.path)) ?? []);
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
            <aside class="sidebar-item">
                <LatestAlbumThumbnail />
            </aside>
            <div class="sidebar-item">
                <FeelingLuckyButton />
            </div>
        </Sidebar>
        <MainContent>
            <Thumbnails>
                {#each sortedAlbums as childAlbum (childAlbum.path)}
                    <AlbumThumbnail
                        path={childAlbum.path}
                        href={childAlbum.path}
                        src={childAlbum.thumbnailUrl}
                        title={childAlbum.title}
                    />
                {/each}
            </Thumbnails>
        </MainContent>
    </PageContent>
</SiteLayout>

<style>
    .sidebar-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.7em;
    }
    div.sidebar-item {
        margin-top: 2em;
    }
</style>
