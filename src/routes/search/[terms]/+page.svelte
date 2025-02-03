<script lang="ts">
    import type { PageProps } from './$types';
    import BlankSearchPageLayout from '$lib/components/pages/search/BlankSearchPageLayout.svelte';
    import SearchLoadingPage from '$lib/components/pages/search/SearchLoadingPage.svelte';
    import SearchResultsPage from '$lib/components/pages/search/SearchResultsPage.svelte';
    import { SearchLoadStatus, type Search, type SearchResults } from '$lib/models/search';
    import { searchStore } from '$lib/stores/SearchStore.svelte';

    let { data }: PageProps = $props();
    let returnPath = $derived(data.returnPath);
    let query = $derived(data.query);
    let searchTerms = $derived(data.query.terms);
    let search: Search | undefined = $derived(searchStore.searches.get(query));
    let status: SearchLoadStatus | undefined = $derived(search?.status);
    let results: SearchResults | undefined = $derived(search?.results);
</script>

{#if SearchLoadStatus.NOT_LOADED === status}
    <SearchLoadingPage {searchTerms} {returnPath} />
{:else if SearchLoadStatus.LOADING === status}
    <SearchLoadingPage {searchTerms} {returnPath} />
{:else if SearchLoadStatus.ERROR_LOADING === status}
    <BlankSearchPageLayout {searchTerms} {returnPath}>There was an error searching</BlankSearchPageLayout>
{:else if SearchLoadStatus.LOADED === status || SearchLoadStatus.LOADING_MORE_RESULTS === status || SearchLoadStatus.ERROR_LOADING_MORE_RESULTS === status}
    <SearchResultsPage {returnPath} {query} {status} {results} />
{:else}
    <BlankSearchPageLayout {searchTerms} {returnPath}>
        Unhandled status: <div>{status}</div>
    </BlankSearchPageLayout>
{/if}
