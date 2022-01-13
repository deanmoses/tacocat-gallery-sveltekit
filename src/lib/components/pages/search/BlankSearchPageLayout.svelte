<!--
  @component

  Layout for search pages that don't have results, but display one big thing
-->

<script lang="ts">
  import SearchPage from "$lib/components/pages/search/SearchPage.svelte";
	import FullPageMessage from "$lib/components/site/FullPageMessage.svelte";

	export let searchTerms: string;
	export let returnPath: string;
</script>

<SearchPage {searchTerms} {returnPath}>
	<FullPageMessage>
    <slot />
	</FullPageMessage>
</SearchPage>