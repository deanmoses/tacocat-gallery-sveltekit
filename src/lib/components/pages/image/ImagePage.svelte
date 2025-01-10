<!--
  @component 
  
  Page to display an image
-->
<script lang="ts">
    import ImagePageLayout from './layouts/ImagePageLayout.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import BigImage from './BigImage.svelte';
    import AdminToggle from '$lib/components/site/admin/toggle/AdminToggle.svelte';
    import type { Album, Image } from '$lib/models/GalleryItemInterfaces';
    import { isAdmin } from '$lib/stores/SessionStore';

    interface Props {
        album: Album;
        image: Image;
    }

    let { album, image }: Props = $props();
</script>

<ImagePageLayout title={image.title}>
    {#snippet editControls()}
        <AdminToggle />
    {/snippet}

    {#snippet caption()}
        {@html image?.description}
    {/snippet}

    {#snippet nav()}
        <PrevButton href={image?.prevHref} />
        <UpButton href={album.href} title={album.title} />
        <NextButton href={image?.nextHref} />
    {/snippet}

    {#snippet image()}
        <BigImage {image} />
    {/snippet}
</ImagePageLayout>

{#if $isAdmin}
    {#await import('./ImageFullScreenDropZone.svelte') then { default: ImageFullScreenDropZone }}
        <ImageFullScreenDropZone imagePath={image.path} />
    {/await}
{/if}
