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

    export let year: string;
    export let album: Album;
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
        {#if album.images}
            {#each album.images as image (image.path)}
                <Thumbnail title={image.title} summary={image.summary} href={image.href} src={image.thumbnailUrl} />
            {/each}
        {/if}
    </svelte:fragment>
</DayAlbumPageLayout>
