<!--
  @component On hover, display a button to get into edit mode.  
-->
<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { editUrl } from '$lib/utils/path-utils';
    import EditIcon from '../../icons/EditIcon.svelte';
    import CancelIcon from '../../icons/CancelIcon.svelte';
    import { getParentFromPath, isValidAlbumPath, isValidImagePath } from '$lib/utils/galleryPathUtils';
    import { albumStore } from '$lib/stores/AlbumStore';

    let path: string;
    $: path = $page.url.pathname;

    /**
     * The Edit button was clicked.
     * Go to edit version of this page.
     */
    function onEditButtonClick() {
        const url = editUrl(path);
        if (url) goto(url);
    }

    async function onDeleteButtonClick() {
        let thePath = path;
        if (!isValidImagePath(thePath)) {
            thePath = thePath + '/';
            if (!isValidAlbumPath(thePath)) throw new Error(`Invalid path [${thePath}]`);
        }
        await albumStore.delete(thePath);
        goto(getParentFromPath(thePath));
    }
</script>

<div>
    <nav class="editing-controls">
        <button on:click|once={onEditButtonClick}><EditIcon />Edit</button>
        <button on:click|once={onDeleteButtonClick}><CancelIcon />Delete</button>
    </nav>
</div>

<style>
    div {
        position: fixed;
        top: 0;
        left: 0;
        min-height: 4em;
        min-width: 8em;
    }

    nav {
        width: 100%;
        padding: 0.5em;
        border-bottom: 1px solid black;
        border-bottom-right-radius: 8px;
        background-color: rgb(65, 64, 64);
        color: rgb(211, 211, 211);
        display: none; /* will be overridden on hover */
    }

    div:hover nav {
        display: flex;
        align-items: center;
        gap: 1em;
        animation: fadeIn 1400ms;
    }

    @keyframes fadeIn {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
