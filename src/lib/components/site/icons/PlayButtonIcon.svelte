<!--
  @component

  A play button with a semi-transparent circular backdrop (YouTube-style)
-->
<script lang="ts">
    import PlayIcon from './PlayIcon.svelte';

    interface Props {
        size?: string;
    }

    let { size = '3em' }: Props = $props();
</script>

<div class="play-button" style="width: {size}; height: {size};">
    <PlayIcon width="50%" height="50%" bottom="0" />
</div>

<style>
    .play-button {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.4);
        color: white;
    }
</style>
