<!--
  @component Page that displays search results
-->
<script lang="ts">
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import Thumbnails from '$lib/components/site/Thumbnails.svelte';
    import SearchPage from '$lib/components/pages/search/SearchPage.svelte';
    import type { SearchResults } from '$lib/models/search';
    import FullPageMessage from '$lib/components/site/FullPageMessage.svelte';

    export let searchTerms: string;
    export let searchResults: SearchResults | undefined;
    export let returnPath: string | undefined;
    export let oldestYear: number | undefined;
    export let newestYear: number | undefined;
    export let oldestFirst: boolean;
    let noResults: boolean;
    $: noResults = !searchResults?.items;
</script>

<SearchPage {searchTerms} {returnPath}>
    <section>
        <h2 style="display:none">Search Controls</h2>
        <label
            ><input
                type="number"
                name="oldestYear"
                id="oldestYear"
                min="1964"
                max="2024"
                placeholder="oldest year"
                value={oldestYear}
            /></label
        >
        <label
            ><input
                type="number"
                name="newestYear"
                id="newestYear"
                min="1964"
                max="2024"
                placeholder="newest year"
                value={newestYear}
            /></label
        >
        <label>Oldest first: <input type="checkbox" name="oldestFirst" id="oldestFirst" checked={oldestFirst} /></label>
    </section>
    <section class:noResults>
        <h2 style="display:none">Search Results</h2>
        <Thumbnails>
            {#if searchResults?.items}
                {#each searchResults.items as item (item.path)}
                    <Thumbnail href={item.href} src={item.thumbnailUrl} title={item.title} summary={item.summary} />
                {/each}
            {:else}
                <FullPageMessage>No results</FullPageMessage>
            {/if}
        </Thumbnails>
    </section>
</SearchPage>

<style>
    section {
        background-color: white;
        padding: var(--default-padding);
    }

    section.noResults {
        display: flex;
        justify-content: center;
    }

    label {
        white-space: nowrap;
    }
</style>
