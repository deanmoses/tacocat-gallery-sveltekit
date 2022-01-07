<script lang="ts">
  import SearchPage from "$lib/components/pages/search/SearchPage.svelte";
	import FullPageMessage from "$lib/components/site/FullPageMessage.svelte";
	import WaitingSpinner from "$lib/components/site/WaitingSpinner.svelte";

	export let searchTerms: string;
	export let returnPath: string;
</script>

<SearchPage {searchTerms} {returnPath}>
	<FullPageMessage>
		Searching for {searchTerms}...

    <WaitingSpinner />
	</FullPageMessage>
</SearchPage>