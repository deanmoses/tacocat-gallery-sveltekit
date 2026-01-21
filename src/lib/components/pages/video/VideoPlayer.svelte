<!--
  @component

  Video player with poster image and play button overlay.
  Shows poster with play button when not playing, switches to video with native controls on play.
-->
<script lang="ts">
    import type { Video } from '$lib/models/GalleryItemInterfaces';
    import { videoPlaybackUrl } from '$lib/utils/config';
    import PlayButtonIcon from '$lib/components/site/icons/PlayButtonIcon.svelte';

    interface Props {
        video: Video;
    }

    let { video }: Props = $props();
    let isPlaying = $state(false);
    let posterLoaded = $state(false);
    let videoElement: HTMLVideoElement | undefined = $state();

    let videoUrl = $derived(videoPlaybackUrl(video.path, video.id, video.versionId));

    function formatDuration(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function handlePlay() {
        isPlaying = true;
        // Wait for video element to be rendered, then play
        setTimeout(() => {
            videoElement?.play();
        }, 0);
    }

    function handleEnded() {
        isPlaying = false;
    }
</script>

{#key video.path}
    <div class="video-container" style="aspect-ratio: {video.detailWidth} / {video.detailHeight};">
        {#if isPlaying}
            <!-- svelte-ignore a11y_media_has_caption -->
            <video bind:this={videoElement} src={videoUrl} controls autoplay class="video" onended={handleEnded}>
                Your browser does not support video playback.
            </video>
        {:else}
            <button class="poster-button" onclick={handlePlay} aria-label="Play video: {video.title}">
                <img
                    src={video.detailUrl}
                    alt={video.title}
                    class="poster"
                    draggable="false"
                    onload={() => (posterLoaded = true)}
                />
                {#if posterLoaded}
                    <div class="play-overlay">
                        <PlayButtonIcon size="5em" />
                    </div>
                    <div class="duration-badge">{formatDuration(video.duration)}</div>
                {/if}
            </button>
        {/if}
    </div>
{/key}

<style>
    .video-container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .poster-button {
        display: block;
        width: 100%;
        height: 100%;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        position: relative;
    }

    .poster {
        object-fit: contain;
        width: 100%;
        height: 100%;
        color: transparent;
        background-color: #f0f0f0;
    }

    .video {
        object-fit: contain;
        width: 100%;
        height: 100%;
        background-color: #000;
    }

    .play-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: rgba(255, 255, 255, 0.9);
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
        transition: transform 0.15s ease;
    }

    .poster-button:hover .play-overlay {
        transform: translate(-50%, -50%) scale(1.1);
    }

    .duration-badge {
        position: absolute;
        bottom: 0.5em;
        right: 0.5em;
        background: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 0.2em 0.5em;
        border-radius: 0.25em;
        font-size: 0.9em;
        font-family: monospace;
    }
</style>
