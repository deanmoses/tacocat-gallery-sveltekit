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
    import { editUrl } from '$lib/utils/path-utils';
    import DraftStore from '$lib/stores/DraftStore';
    import type { Album, Image } from '$lib/models/GalleryItemInterfaces';
    import ImageFullScreenDropZone from './ImageFullScreenDropZone.svelte';

    interface Props {
        album: Album;
        image: Image;
    }

    let { album, image }: Props = $props();

    let okToNavigate = DraftStore.getOkToNavigate();
</script>

<ImagePageLayout title={image.title}>
    {#snippet editControls()}
        <BaseEditControls />
    {/snippet}

    {#snippet titleEditor()}
        <EditableText textContent={image.title} />
    {/snippet}

    {#snippet caption()}
        <EditableHtml htmlContent={image.description} />
    {/snippet}

    {#snippet nav()}
        {#if $okToNavigate}
            <PrevButton href={editUrl(image.prevHref)} />
            <UpButton href={editUrl(album.href)} title={album.title} />
            <NextButton href={editUrl(image.nextHref)} />
        {:else}
            <PrevButton />
            <UpButton title={album.title} />
            <NextButton />
        {/if}
    {/snippet}

    {#snippet image()}
        <BigImage {image} />
    {/snippet}
</ImagePageLayout>
<ImageFullScreenDropZone imagePath={image.path} allowDrop={$okToNavigate} />
