<!--
  @component

  Page showing a year album
-->
<script lang="ts">
    import YearAlbumPageLayout from './YearAlbumPageLayout.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import YearAlbumThumbnails from './YearAlbumThumbnails.svelte';
    import AdminToggle from '$lib/components/site/admin/toggle/AdminToggle.svelte';
    import type { Album } from '$lib/models/GalleryItemInterfaces';

    interface Props {
        album: Album;
    }

    let { album }: Props = $props();
</script>

<YearAlbumPageLayout>
    {#snippet editControls()}
        <AdminToggle />
    {/snippet}

    {#snippet nav()}
        <PrevButton href={album.nextHref} title={album.nextTitle} />
        <UpButton href="../" title="All Years" />
        <NextButton href={album.prevHref} title={album.prevTitle} />
    {/snippet}

    {#snippet caption()}
        {@html album.description}
    {/snippet}

    {#snippet thumbnails()}
        <YearAlbumThumbnails {album} />
    {/snippet}
</YearAlbumPageLayout>
