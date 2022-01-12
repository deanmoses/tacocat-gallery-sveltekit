<script lang="ts">
    import Thumbnail from "$lib/components/site/Thumbnail.svelte";
    import Thumbnails from "$lib/components/site/Thumbnails.svelte";
    import SearchPage from "$lib/components/pages/search/SearchPage.svelte";
import Config from "$lib/utils/config";

    export let searchTerms: string;
    export let searchResults;
    export let returnPath: string;
</script>

<style>
    section {
        background-color: white;
        padding: var(--default-padding);
    }
</style>
<SearchPage {searchTerms} {returnPath}>
    <section>
        <h2 style="display:none">Thumbnails</h2>
        <Thumbnails>
            {#if searchResults.albums}
            {#each searchResults.albums as album (album.path)}
                <Thumbnail
                    title={album.title}
                    summary={album.customdata}
                    href="/{album.path}"
                    src={Config.cdnUrl(album.url_thumb)}
                />
            {/each}
            {/if}

						{#if searchResults.images}
            {#each searchResults.images as image (image.path)}
                <Thumbnail
                    title={image.title}
                    summary={image.customdata}
                    href="/{image.path}"
                    src={Config.cdnUrl(image.url_thumb)}
                />
            {/each}
            {/if}
        </Thumbnails>
    </section>
</SearchPage>