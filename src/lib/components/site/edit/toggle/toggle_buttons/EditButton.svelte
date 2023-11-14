<!--
  @component Button to go into edit mode for an album or image
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import EditIcon from '$lib/components/site/icons/EditIcon.svelte';
    import { editUrl } from '$lib/utils/path-utils';

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
</script>

<button on:click|once={onEditButtonClick}><EditIcon />Edit</button>

<style>
    button {
        display: flex;
        align-items: center;
        gap: 0.3em;
    }
</style>
