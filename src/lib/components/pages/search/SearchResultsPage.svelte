<script lang="ts">
    import Thumbnail from "$lib/components/site/Thumbnail.svelte";
    import Thumbnails from "$lib/components/site/Thumbnails.svelte";

    export let searchTerms;
    export let searchResults;
</script>

<style>
    section {
        background-color: white;
        padding: var(--default-padding);
    }
</style>

<svelte:head>
	<title>Search for {searchTerms}</title>
</svelte:head>

<section>
    <h2 style="display:none">Thumbnails</h2>
    <Thumbnails>
        {#if $searchResults.images}
        {#each $searchResults.images as image (image.path)}
            <Thumbnail
                title="{image.title}"
                summary="{image.customdata}"
                href="/{image.path}"
                src="https://cdn.tacocat.com{image.url_thumb}"
            />
        {/each}
        {/if}

        {#if $searchResults.albums}
        {#each $searchResults.albums as album (album.path)}
            <Thumbnail
                title="{album.title}"
                summary="{album.customdata}"
                href="/{album.path}"
                src="https://cdn.tacocat.com{album.url_thumb}"
            />
        {/each}
        {/if}
    </Thumbnails>
</section>