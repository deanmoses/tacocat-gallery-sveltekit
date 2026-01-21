<!--
  @component

  Renders the appropriate detail page hero contents for a media item (the image or video player)
-->
<script lang="ts">
    import BigImage from '../image/BigImage.svelte';
    import VideoPlayer from '../video/VideoPlayer.svelte';
    import type { Media, Image, Video } from '$lib/models/GalleryItemInterfaces';

    interface Props {
        media: Media;
    }
    let { media }: Props = $props();
</script>

{#if media.mediaType === 'video'}
    <VideoPlayer video={media as Video} />
{:else if media.mediaType === 'image'}
    <BigImage image={media as Image} />
{:else}
    Unsupported media type
{/if}
