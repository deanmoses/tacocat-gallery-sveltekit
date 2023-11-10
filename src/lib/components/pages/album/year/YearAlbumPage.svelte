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
    import EditToggle from '$lib/components/site/edit/toggle/EditToggle.svelte';
    import type { Album } from '$lib/models/album';

    export let album: Album;
    export let year: string;
</script>

<YearAlbumPageLayout {year}>
    <svelte:fragment slot="editControls">
        <EditToggle />
    </svelte:fragment>

    <svelte:fragment slot="nav">
        <PrevButton href={album.nextAlbumHref} title={album.nextAlbumTitle} />
        <UpButton href="../" title="All Years" />
        <NextButton href={album.prevAlbumHref} title={album.prevAlbumTitle} />
    </svelte:fragment>

    <svelte:fragment slot="caption">
        {@html album.pageDescription}
    </svelte:fragment>

    <svelte:fragment slot="thumbnails">
        <YearAlbumThumbnails {album} />
    </svelte:fragment>
</YearAlbumPageLayout>
