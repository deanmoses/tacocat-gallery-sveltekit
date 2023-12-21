<!--
  @component Full screen zone for dropping images into an album or replacing a single image
-->
<script lang="ts">
    export let isDropAllowed: (e: DragEvent) => boolean;
    export let onDrop: (e: DragEvent) => Promise<void>;

    let dragging = false;
    $: dragging = dragging;

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
    <p on:dragleave|preventDefault={dragLeave} on:dragover|preventDefault={dragOver} on:drop|preventDefault={drop}>
        <slot />
    </p>
{/if}
<svelte:window on:dragenter|preventDefault={dragEnter} on:dragover|preventDefault={dragOver} />

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
