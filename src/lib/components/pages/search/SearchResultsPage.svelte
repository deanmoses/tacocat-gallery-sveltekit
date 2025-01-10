<!--
  @component Page that displays search results
-->
<script lang="ts">
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import Thumbnails from '$lib/components/site/Thumbnails.svelte';
    import SearchPage from '$lib/components/pages/search/SearchPage.svelte';
    import { SearchLoadStatus, type SearchQuery, type SearchResults } from '$lib/models/search';
    import FullPageMessage from '$lib/components/site/FullPageMessage.svelte';
    import { searchStore } from '$lib/stores/SearchStore';

    interface Props {
        returnPath: string | undefined;
        query: SearchQuery;
        status: SearchLoadStatus;
        results: SearchResults | undefined;
    }

    let { returnPath, query, status, results }: Props = $props();

    let searchTerms = $derived(query.terms);
    let oldestYear = $derived(query.oldestYear);
    let newestYear = $derived(query.newestYear);
    let oldestFirst = $derived(query.oldestFirst);
    let noResults = $derived(!results?.items);
    let moreResultsOnServer = $derived(results?.items?.length && results.items.length < results.total);
    let numResultsUnfetched = $derived(!results?.items?.length ? 0 : results.total - results.items.length);
    let loadingMore = $derived(SearchLoadStatus.LOADING_MORE_RESULTS == status);
    let errorLoadingMore = $derived(SearchLoadStatus.ERROR_LOADING_MORE_RESULTS == status);

    function getMoreResults() {
        const startAt = results?.items?.length ?? 0;
        searchStore.getMore(query, startAt);
    }
</script>

<SearchPage {searchTerms} {returnPath}>
    <section>
        <h2 style="display:none">Search Controls</h2>
        <label
            ><input
                class="yearInput"
                type="number"
                name="oldestYear"
                id="oldestYear"
                min="1964"
                max={new Date().getFullYear()}
                placeholder="oldest year"
                value={oldestYear}
            /></label
        >
        <label
            ><input
                class="yearInput"
                type="number"
                name="newestYear"
                id="newestYear"
                min="1964"
                max={new Date().getFullYear()}
                placeholder="newest year"
                value={newestYear}
            /></label
        >
        <label>Oldest first: <input type="checkbox" name="oldestFirst" id="oldestFirst" checked={oldestFirst} /></label>
    </section>
    <section class:noResults>
        <h2 style="display:none">Search Results</h2>
        <Thumbnails>
            {#if results?.items}
                {#each results.items as item (item.path)}
                    <Thumbnail href={item.href} src={item.thumbnailUrl} title={item.title} summary={item.summary} />
                {/each}
                {#if moreResultsOnServer}
                    {#if errorLoadingMore}
                        Error loading more results
                    {:else}
                        <button onclick={getMoreResults} disabled={loadingMore}>Get More</button>
                        {#if loadingMore}
                            Loading...
                        {:else}
                            ({numResultsUnfetched} results left)
                        {/if}
                    {/if}
                {/if}
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
    .yearInput {
        width: 8em;
    }
</style>
