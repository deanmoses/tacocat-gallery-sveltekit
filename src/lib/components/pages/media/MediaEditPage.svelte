<!--
  @component

  Page to edit a media item (image or video)
-->
<script lang="ts">
    import MediaPageLayout from './layouts/MediaPageLayout.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import MediaDetail from './MediaDetail.svelte';
    import BaseEditControls from '$lib/components/site/admin/edit_controls/BaseEditControls.svelte';
    import EditableText from '$lib/components/site/admin/EditableText.svelte';
    import EditableHtml from '$lib/components/site/admin/EditableHtml.svelte';
    import type { Album, Media } from '$lib/models/GalleryItemInterfaces';
    import FullScreenDropZone from './MediaPageFullScreenDropZone.svelte';
    import { draftMachine } from '$lib/stores/admin/DraftMachine.svelte';

    interface Props {
        album: Album;
        media: Media;
    }
    let { album, media }: Props = $props();
    let mediaTitle = $derived(media.title);
    let okToNavigate = $derived(draftMachine.okToNavigate);
</script>

<MediaPageLayout title={mediaTitle}>
    {#snippet editControls()}
        <BaseEditControls />
    {/snippet}

    {#snippet titleEditor()}
        <!-- #key ensures title changes when navigating prev/next -->
        {#key media.path}
            <EditableText textContent={mediaTitle} />
        {/key}
    {/snippet}

    {#snippet caption()}
        <EditableHtml htmlContent={media.description} />
    {/snippet}

    {#snippet nav()}
        {#if okToNavigate}
            <PrevButton href={media.prevHref} />
            <UpButton href={album.href} title={album.title} />
            <NextButton href={media.nextHref} />
        {:else}
            <PrevButton />
            <UpButton title={album.title} />
            <NextButton />
        {/if}
    {/snippet}

    {#snippet imageHtml()}
        <!-- #key ensures media changes when navigating prev/next -->
        {#key media.path}
            <MediaDetail {media} />
        {/key}
    {/snippet}
</MediaPageLayout>
<FullScreenDropZone mediaPath={media.path} versionId={media.versionId} allowDrop={okToNavigate} />
