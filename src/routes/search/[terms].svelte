<script context="module" lang="ts">
	export async function load({ params, url }) {
		const searchTerms = params.terms;
		const returnPath = url.searchParams.get('return')
		return {
			props: {
				returnPath: returnPath,
				searchTerms,
				searchResults: searchStore.get(searchTerms)
			}
		}
	}
</script>

<script lang="ts">
	import SearchPage from "$lib/components/pages/search/SearchPage.svelte";
	import SearchLoadingPage from "$lib/components/pages/search/SearchLoadingPage.svelte";
	import SearchResultsPage from "$lib/components/pages/search/SearchResultsPage.svelte";
	import { searchStore } from "$lib/stores/SearchStore";
	import { Search, SearchLoadStatus } from "$lib/models/search";
	import type { Readable } from "svelte/store";

	export let returnPath: string;
	export let searchTerms: string;
	export let searchResults: Readable<Search>;

	let status: SearchLoadStatus;
	$: status = $searchResults.status;
</script>

{#if SearchLoadStatus.NOT_LOADED == status || SearchLoadStatus.LOADING == status}
	<SearchLoadingPage {searchTerms} {returnPath} />
{:else if SearchLoadStatus.ERROR_LOADING == status}
	<SearchPage {searchTerms}>
		There was an error searching
	</SearchPage>
{:else if SearchLoadStatus.LOADED == status}
	<SearchResultsPage {searchTerms} searchResults={$searchResults.results} {returnPath} />
{:else}
	<SearchPage {searchTerms}>
		Unhandled status: <div>{status}</div>
	</SearchPage>
{/if}