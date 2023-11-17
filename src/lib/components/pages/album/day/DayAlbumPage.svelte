<!--
  @component

  Page showing a day album
-->
<script lang="ts">
    import DayAlbumPageLayout from './DayAlbumPageLayout.svelte';
    import EditToggle from '$lib/components/site/edit/toggle/EditToggle.svelte';
    import PrevButton from '$lib/components/site/nav/PrevButton.svelte';
    import UpButton from '$lib/components/site/nav/UpButton.svelte';
    import NextButton from '$lib/components/site/nav/NextButton.svelte';
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import type { Album } from '$lib/models/GalleryItemInterfaces';
    import UploadThumbnail from '$lib/components/site/edit/UploadThumbnail.svelte';
    import type { ImageUpload } from '$lib/stores/UploadStore';

    export let year: string;
    export let album: Album;
    export let uploads: ImageUpload[];
</script>

<DayAlbumPageLayout {year} title={album.title}>
    <svelte:fragment slot="editControls">
        <EditToggle />
    </svelte:fragment>

    <svelte:fragment slot="title">
        {album.title}
    </svelte:fragment>

    <svelte:fragment slot="nav">
        <PrevButton href={album.nextHref} title={album.nextTitle} />
        <UpButton href={album.parentHref} title={album.parentTitle} />
        <NextButton href={album.prevHref} title={album.prevTitle} />
    </svelte:fragment>

    <svelte:fragment slot="caption">
        {@html album.description}
    </svelte:fragment>

    <svelte:fragment slot="thumbnails">
        {#if album.images?.length}
            {#each album.images as image (image.path)}
                <Thumbnail title={image.title} src={image.thumbnailUrl} summary={image.summary} href={image.href} />
            {/each}
        {:else if !album.published}
            <p style="padding:2em">Drag images or a 📁</p>
        {/if}
        {#if uploads?.length}
            {#each uploads as upload (upload.imagePath)}
                <UploadThumbnail {upload} />
            {/each}
        {/if}
    </svelte:fragment>
</DayAlbumPageLayout>
