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
    import { albumNav } from '$lib/utils/albumNavigation';
    import { getParentAlbum } from '$lib/stores/AlbumState.svelte';

    interface Props {
        album: Album;
    }
    let { album }: Props = $props();
    let neighbours = $derived(albumNav(album.path, getParentAlbum(album.path)));
</script>

<YearAlbumPageLayout>
    {#snippet editControls()}
        <AdminToggle />
    {/snippet}

    {#snippet nav()}
        <PrevButton href={neighbours.nextHref} title={neighbours.nextTitle} />
        <UpButton href="../" title="All Years" />
        <NextButton href={neighbours.prevHref} title={neighbours.prevTitle} />
    {/snippet}

    {#snippet caption()}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- Rich text authored by admins via Quill; not user-supplied -->
        {@html album.description}
    {/snippet}

    {#snippet thumbnails()}
        <YearAlbumThumbnails {album} />
    {/snippet}
</YearAlbumPageLayout>
