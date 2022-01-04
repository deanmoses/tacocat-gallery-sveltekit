<script context="module" lang="ts">
	export async function load({ params }) {
        const searchTerms = params.terms;
        return {
            props: {
                searchTerms,
                searchResults: AlbumStoreHelpers.getSearchResults(searchTerms)
            }
        }
    }
</script>

<script lang="ts">
    import SearchLoadingPage from "$lib/components/pages/search/SearchLoadingPage.svelte";
    import SearchResultsPage from "$lib/components/pages/search/SearchResultsPage.svelte";
    import AlbumStoreHelpers from "$lib/stores/AlbumStoreHelpers";

    export let searchTerms;
    export let searchResults;
</script>

{#await AlbumStoreHelpers.fetchSearchResults(searchTerms)}
    <SearchLoadingPage {searchTerms} />
{:then}
    <SearchResultsPage {searchTerms} {searchResults}/>
{:catch error}
    Error searching: <div>{error}</div>
{/await}