<script context="module" lang="ts">
	export async function load({ params, url }) {
		const searchTerms = params.terms;
		const returnPath = url.searchParams.get('returnPath')
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
	import BlankSearchPageLayout from "$lib/components/pages/search/BlankSearchPageLayout.svelte";
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
	<BlankSearchPageLayout {searchTerms} {returnPath}>
			There was an error searching
	</BlankSearchPageLayout>
{:else if SearchLoadStatus.LOADED == status}
	<SearchResultsPage {searchTerms} searchResults={$searchResults.results} {returnPath} />
{:else}
	<BlankSearchPageLayout {searchTerms} {returnPath}>
		Unhandled status: <div>{status}</div>
	</BlankSearchPageLayout>
{/if}