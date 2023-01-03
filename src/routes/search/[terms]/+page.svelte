<script lang="ts">
	import BlankSearchPageLayout from '$lib/components/pages/search/BlankSearchPageLayout.svelte';
	import SearchLoadingPage from '$lib/components/pages/search/SearchLoadingPage.svelte';
	import SearchResultsPage from '$lib/components/pages/search/SearchResultsPage.svelte';
	import { SearchLoadStatus } from '$lib/models/search';
	import type { PageData } from './$types';

	export let data: PageData;

	$: returnPath = data.returnPath;
	$: searchTerms = data.searchTerms;
	$: search = data.search;
	$: status = $search.status;
	$: searchResults = $search.results;
</script>

{#if SearchLoadStatus.NOT_LOADED == status || SearchLoadStatus.LOADING == status}
	<SearchLoadingPage {searchTerms} {returnPath} />
{:else if SearchLoadStatus.ERROR_LOADING == status}
	<BlankSearchPageLayout {searchTerms} {returnPath}>
		There was an error searching
	</BlankSearchPageLayout>
{:else if SearchLoadStatus.LOADED == status}
	<SearchResultsPage {searchTerms} {searchResults} {returnPath} />
{:else}
	<BlankSearchPageLayout {searchTerms} {returnPath}>
		Unhandled status: <div>{status}</div>
	</BlankSearchPageLayout>
{/if}
