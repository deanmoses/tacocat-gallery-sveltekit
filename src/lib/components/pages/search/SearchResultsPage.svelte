<!--
  @component
  
  Page that displays search results
-->
<script lang="ts">
    import Thumbnail from '$lib/components/site/Thumbnail.svelte';
    import Thumbnails from '$lib/components/site/Thumbnails.svelte';
    import SearchPage from '$lib/components/pages/search/SearchPage.svelte';
    import { SearchLoadStatus, type SearchQuery, type SearchResults } from '$lib/models/search';
    import FullPageMessage from '$lib/components/site/FullPageMessage.svelte';
    import InfiniteScrollSentinel from '$lib/components/site/InfiniteScrollSentinel.svelte';
    import { searchStore } from '$lib/stores/SearchStore.svelte';

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
    // Use nextStartAt to determine if more results exist (handles duplicate filtering correctly)
    let moreResultsOnServer = $derived(results?.nextStartAt !== undefined && results.nextStartAt < results.total);
    let loadingMore = $derived(SearchLoadStatus.LOADING_MORE_RESULTS == status);
    let errorLoadingMore = $derived(SearchLoadStatus.ERROR_LOADING_MORE_RESULTS == status);

    // Debouncing to prevent rapid-fire requests
    let lastRequestTime = 0;
    const MIN_REQUEST_INTERVAL = 500; // ms

    function getMoreResults() {
        const now = Date.now();
        if (now - lastRequestTime < MIN_REQUEST_INTERVAL) return;
        lastRequestTime = now;

        // Use nextStartAt (based on server response) to avoid infinite loop when duplicates are filtered
        const startAt = results?.nextStartAt ?? results?.items?.length ?? 0;
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
        {#if results?.total}
            <span class="result-count">({results.total} results)</span>
        {/if}
    </section>
    <section class:noResults>
        <h2 style="display:none">Search Results</h2>
        <Thumbnails>
            {#if results?.items}
                {#each results.items as item (item.path)}
                    <Thumbnail
                        href={item.href}
                        thumbnailUrlInfo={item.thumbnailUrlInfo}
                        title={item.title}
                        summary={item.summary}
                    />
                {/each}
                {#if moreResultsOnServer || loadingMore}
                    {#if errorLoadingMore}
                        <div class="load-status">Error loading more results</div>
                    {:else}
                        <InfiniteScrollSentinel onIntersect={getMoreResults} disabled={loadingMore} />
                        {#if loadingMore}
                            <div class="load-status">Loading...</div>
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
    .result-count {
        color: var(--muted-text-color, #666);
    }
    .load-status {
        width: 100%;
        text-align: center;
        padding: 1em;
        color: var(--muted-text-color, #666);
    }
</style>
