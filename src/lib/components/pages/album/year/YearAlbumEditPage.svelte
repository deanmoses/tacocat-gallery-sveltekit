<!--
  @component

  Page to edit a year album
-->
<script lang="ts">
    import YearAlbumPageLayout from './YearAlbumPageLayout.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import YearAlbumThumbnails from './YearAlbumThumbnails.svelte';
    import AlbumEditControls from '$lib/components/site/admin/edit_controls/AlbumEditControls.svelte';
    import EditableHtml from '$lib/components/site/admin/EditableHtml.svelte';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import { draftMachine } from '$lib/stores/admin/DraftMachine.svelte';

    interface Props {
        album: Album;
    }
    let { album }: Props = $props();
    let okToNavigate = $derived(draftMachine.okToNavigate);
</script>

<YearAlbumPageLayout>
    {#snippet editControls()}
        <AlbumEditControls published={album.published} />
    {/snippet}

    {#snippet nav()}
        <PrevButton href={okToNavigate ? album.nextHref : undefined} title={album.nextTitle} />
        <UpButton href={okToNavigate ? '../' : undefined} title="All Years" />
        <NextButton href={okToNavigate ? album.prevHref : undefined} title={album.prevTitle} />
    {/snippet}

    {#snippet caption()}
        <EditableHtml htmlContent={album.description} />
    {/snippet}

    {#snippet thumbnails()}
        <YearAlbumThumbnails {album} />
    {/snippet}
</YearAlbumPageLayout>
