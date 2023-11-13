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
    import BaseEditControls from '$lib/components/site/edit/controls/BaseEditControls.svelte';
    import EditableText from '$lib/components/site/edit/EditableText.svelte';
    import EditableHtml from '$lib/components/site/edit/EditableHtml.svelte';
    import { editUrl } from '$lib/utils/path-utils';
    import DraftStore from '$lib/stores/DraftStore';
    import type { Album, Image } from '$lib/models/GalleryItemInterfaces';

    export let year: string;
    export let album: Album;
    export let image: Image;

    let okToNavigate = DraftStore.getOkToNavigate();
</script>

<ImagePageLayout {year} title={image.title}>
    <svelte:fragment slot="editControls">
        <BaseEditControls />
    </svelte:fragment>

    <svelte:fragment slot="title">
        <!-- The #key block is an attempt to prevent the lagging title problem. Have not yet tested it out.  -->
        {#key image.path}
            <EditableText textContent={image.title} />
        {/key}
    </svelte:fragment>

    <svelte:fragment slot="caption">
        <EditableHtml htmlContent={image.description} />
    </svelte:fragment>

    <svelte:fragment slot="nav">
        {#if $okToNavigate}
            <PrevButton href={editUrl(image.prevHref)} />
            <UpButton href={editUrl(album.href)} title={album.title} />
            <NextButton href={editUrl(image.nextHref)} />
        {:else}
            <PrevButton />
            <UpButton title={album.title} />
            <NextButton />
        {/if}
    </svelte:fragment>

    <svelte:fragment slot="image">
        <BigImage {image} />
    </svelte:fragment>
</ImagePageLayout>
