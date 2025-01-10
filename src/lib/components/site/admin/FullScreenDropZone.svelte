<!--
  @component Full screen zone for dropping images into an album or replacing a single image
-->
<script lang="ts">
    import { run, preventDefault } from 'svelte/legacy';

    interface Props {
        isDropAllowed: (e: DragEvent) => boolean;
        onDrop: (e: DragEvent) => Promise<void>;
        children?: import('svelte').Snippet;
    }

    let { isDropAllowed, onDrop, children }: Props = $props();

    let dragging = $state(false);
    run(() => {
        dragging = dragging;
    });

    function dragEnter(e: DragEvent) {
        if (!isDropAllowed(e)) return;
        e.preventDefault();
        dragging = true;
    }

    function dragOver(e: DragEvent) {
        if (!isDropAllowed(e)) return;
        e.preventDefault();
    }

    function dragLeave() {
        dragging = false;
    }

    async function drop(e: DragEvent) {
        if (!isDropAllowed(e)) return;
        e.preventDefault();
        dragging = false;
        await onDrop(e);
    }
</script>

{#if dragging}
    <p ondragleave={preventDefault(dragLeave)} ondragover={preventDefault(dragOver)} ondrop={preventDefault(drop)}>
        {@render children?.()}
    </p>
{/if}
<svelte:window ondragenter={preventDefault(dragEnter)} ondragover={preventDefault(dragOver)} />

<style>
    p {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 3em;
        z-index: 5;

        display: flex;
        align-items: center;
        justify-content: center;

        background-color: rgb(255, 255, 255, 0.8);
        font-size: 3em;
        color: rgb(78, 78, 78);
        border-color: rgb(78, 78, 78);
        border-style: dashed;
        border-width: 3px;
    }
</style>
