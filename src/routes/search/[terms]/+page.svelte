<script lang="ts">
    import type { PageData } from './$types';
	export let data: PageData;

    import BlankSearchPageLayout from "$lib/components/pages/search/BlankSearchPageLayout.svelte";
	import SearchLoadingPage from "$lib/components/pages/search/SearchLoadingPage.svelte";
	import SearchResultsPage from "$lib/components/pages/search/SearchResultsPage.svelte";
    import type { Search } from "$lib/models/search";
	import { SearchLoadStatus } from "$lib/models/search";
	import type { Readable } from "svelte/store";

	export let returnPath: string = data.returnPath;
	export let searchTerms: string = data.searchTerms;
	export let search: Readable<Search> = data.search;

	let status: SearchLoadStatus;
	$: status = $search.status;
</script>

{#if SearchLoadStatus.NOT_LOADED == status || SearchLoadStatus.LOADING == status}
	<SearchLoadingPage {searchTerms} {returnPath} />
{:else if SearchLoadStatus.ERROR_LOADING == status}
	<BlankSearchPageLayout {searchTerms} {returnPath}>
			There was an error searching
	</BlankSearchPageLayout>
{:else if SearchLoadStatus.LOADED == status}
	<SearchResultsPage {searchTerms} searchResults={$search.results} {returnPath} />
{:else}
	<BlankSearchPageLayout {searchTerms} {returnPath}>
		Unhandled status: <div>{status}</div>
	</BlankSearchPageLayout>
{/if}