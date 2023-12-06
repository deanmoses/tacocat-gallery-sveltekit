<!--
  @component Page to display an image
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

    export let album: Album;
    export let image: Image;
</script>

<ImagePageLayout title={image.title}>
    <svelte:fragment slot="editControls">
        <AdminToggle />
    </svelte:fragment>

    <svelte:fragment slot="title">
        {image.title}
    </svelte:fragment>

    <svelte:fragment slot="caption">
        {@html image.description}
    </svelte:fragment>

    <svelte:fragment slot="nav">
        <PrevButton href={image.prevHref} />
        <UpButton href={album.href} title={album.title} />
        <NextButton href={image.nextHref} />
    </svelte:fragment>

    <svelte:fragment slot="image">
        <BigImage {image} />
    </svelte:fragment>
</ImagePageLayout>

{#if $isAdmin}
    {#await import('./ImageFullScreenDropZone.svelte') then { default: ImageFullScreenDropZone }}
        <ImageFullScreenDropZone />
    {/await}
{/if}
