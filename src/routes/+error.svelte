<script>
    import { page } from '$app/stores';
    import AlbumErrorPage from '$lib/components/pages/album/AlbumErrorPage.svelte';
</script>

<AlbumErrorPage>
    {#if $page.status === 404}
        <p>Page not found</p>
    {:else}
        <p>{$page.error?.message}</p>
    {/if}
    <p><a href="/">Go back home?</a></p>
</AlbumErrorPage>
