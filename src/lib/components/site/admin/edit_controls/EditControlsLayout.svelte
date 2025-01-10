<!--
  @component

  The layout for the image and album editing controls
-->

<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        leftControls?: Snippet;
        status?: Snippet;
        rightControls?: Snippet;
    }

    let { leftControls, status, rightControls }: Props = $props();
</script>

<div class="editing-controls-container">
    <div class="editing-controls">
        <div class="left">
            {@render leftControls?.()}
            <div>
                {@render status?.()}
            </div>
        </div>
        {@render rightControls?.()}
    </div>
</div>

<style>
    .editing-controls-container {
        background-color: rgb(65, 64, 64);
        border-bottom: 1px solid black;
    }

    .editing-controls {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 1em;
        padding: 0.5em;
        color: rgb(211, 211, 211);
        animation: fadeIn 600ms;
    }

    @keyframes fadeIn {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    .left {
        margin-right: auto;
        display: flex;
        align-items: center;
        gap: 1em;
    }
</style>
