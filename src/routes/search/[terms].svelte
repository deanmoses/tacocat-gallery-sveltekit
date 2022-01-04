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
    import SearchPage from "$lib/components/pages/search/SearchPage.svelte";
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
    <SearchPage {searchTerms}>
        Error searching: <div>{error}</div>
    </SearchPage>
{/await}