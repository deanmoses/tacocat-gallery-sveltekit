<!--
  @component Zone for dropping files into an empty day album
-->
<script lang="ts">
    import { dropImages } from '$lib/stores/UploadStore';

    let dragging = false;
    $: dragging = dragging;

    function dragEnter(e: DragEvent) {
        if (e.dataTransfer?.types.includes('Files')) {
            e.preventDefault();
            dragging = true;
        }
    }

    function dragOver(e: DragEvent) {
        if (e.dataTransfer?.types.includes('Files')) {
            e.preventDefault();
        }
    }

    function dragLeave(e: DragEvent) {
        if (e.dataTransfer?.types.includes('Files')) {
            dragging = false;
        }
    }
</script>

<p
    class:dragging
    on:dragenter|preventDefault={dragEnter}
    on:dragover|preventDefault={dragOver}
    on:dragleave|preventDefault={dragLeave}
>
    Drag images or a 📁
</p>

<style>
    p {
        padding: 2em;
        text-align: center;
        width: 100%;
        border: solid 3px white;
    }
    .dragging {
        background-color: rgb(130, 188, 130);
        border-color: rgb(4, 103, 4);
    }
</style>
