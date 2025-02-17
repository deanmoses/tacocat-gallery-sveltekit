<!--
  @component 
  
  Page to edit an image
-->
<script lang="ts">
    import ImagePageLayout from './layouts/ImagePageLayout.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import BigImage from './BigImage.svelte';
    import BaseEditControls from '$lib/components/site/admin/edit_controls/BaseEditControls.svelte';
    import EditableText from '$lib/components/site/admin/EditableText.svelte';
    import EditableHtml from '$lib/components/site/admin/EditableHtml.svelte';
    import type { Album, Image } from '$lib/models/GalleryItemInterfaces';
    import ImageFullScreenDropZone from './ImageFullScreenDropZone.svelte';
    import { draftMachine } from '$lib/stores/admin/DraftMachine.svelte';

    interface Props {
        album: Album;
        image: Image;
    }
    let { album, image }: Props = $props();
    let imageTitle = $derived(image.title);
    let okToNavigate = $derived(draftMachine.okToNavigate);
</script>

<ImagePageLayout title={imageTitle}>
    {#snippet editControls()}
        <BaseEditControls />
    {/snippet}

    {#snippet titleEditor()}
        <!-- #key ensures title changes when navigating prev/next -->
        {#key image.path}
            <EditableText textContent={imageTitle} />
        {/key}
    {/snippet}

    {#snippet caption()}
        <EditableHtml htmlContent={image.description} />
    {/snippet}

    {#snippet nav()}
        {#if okToNavigate}
            <PrevButton href={image.prevHref} />
            <UpButton href={album.href} title={album.title} />
            <NextButton href={image.nextHref} />
        {:else}
            <PrevButton />
            <UpButton title={album.title} />
            <NextButton />
        {/if}
    {/snippet}

    {#snippet imageHtml()}
        <!-- #key ensures image changes when navigating prev/next -->
        {#key image.path}
            <BigImage {image} />
        {/key}
    {/snippet}
</ImagePageLayout>
<ImageFullScreenDropZone imagePath={image.path} allowDrop={okToNavigate} />
