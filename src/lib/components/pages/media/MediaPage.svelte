<!--
  @component

  Page to display a media item (image or video)
-->
<script lang="ts">
    import MediaPageLayout from './layouts/MediaPageLayout.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import MediaDetail from './MediaDetail.svelte';
    import AdminToggle from '$lib/components/site/admin/toggle/AdminToggle.svelte';
    import type { Album, Media } from '$lib/models/GalleryItemInterfaces';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';

    interface Props {
        album: Album;
        media: Media;
    }
    let { album, media }: Props = $props();
    let mediaTitle = $derived(media.title);

    // Preload adjacent media for smoother navigation
    let nextMedia = $derived(media.nextHref ? album.getMedia(media.nextHref) : undefined);
    let prevMedia = $derived(media.prevHref ? album.getMedia(media.prevHref) : undefined);
</script>

<svelte:head>
    {#if nextMedia}
        <link rel="preload" as="image" href={nextMedia.detailUrl} />
    {/if}
    {#if prevMedia}
        <link rel="preload" as="image" href={prevMedia.detailUrl} />
    {/if}
</svelte:head>

<MediaPageLayout title={mediaTitle}>
    {#snippet editControls()}
        <AdminToggle />
    {/snippet}

    {#snippet caption()}
        {@html media.description}
    {/snippet}

    {#snippet nav()}
        <PrevButton href={media.prevHref} />
        <UpButton href={album.href} title={album.title} />
        <NextButton href={media.nextHref} />
    {/snippet}

    {#snippet imageHtml()}
        <!-- #key ensures media changes when navigating prev/next -->
        {#key media.path}
            <MediaDetail {media} />
        {/key}
    {/snippet}
</MediaPageLayout>

{#if sessionStore.isAdmin}
    {#await import('./MediaPageFullScreenDropZone.svelte') then { default: FullScreenDropZone }}
        <FullScreenDropZone mediaPath={media.path} versionId={media.versionId} />
    {/await}
{/if}
