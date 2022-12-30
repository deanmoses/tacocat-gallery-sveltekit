<!--
  @component

  Page that displays search results
-->
<script lang="ts">
	import Thumbnail from '$lib/components/site/Thumbnail.svelte';
	import Thumbnails from '$lib/components/site/Thumbnails.svelte';
	import SearchPage from '$lib/components/pages/search/SearchPage.svelte';
	import Config from '$lib/utils/config';
	import type { SearchResults } from '$lib/models/search';
	import FullPageMessage from '$lib/components/site/FullPageMessage.svelte';

	export let searchTerms: string;
	export let searchResults: SearchResults;
	export let returnPath: string;

	let noResults: boolean;
	$: noResults = !searchResults.images && !searchResults.albums;
</script>

<SearchPage {searchTerms} {returnPath}>
	<section class:noResults>
		<h2 style="display:none">Search Results</h2>
		<Thumbnails>
			{#if searchResults.albums}
				{#each searchResults.albums as album (album.path)}
					<Thumbnail
						title={album.title}
						summary={album.customdata}
						href="/{album.path}"
						src={Config.cdnUrl(album.url_thumb)}
					/>
				{/each}
			{/if}

			{#if searchResults.images}
				{#each searchResults.images as image (image.path)}
					<Thumbnail
						title={image.title}
						summary={image.customdata}
						href="/{image.path}"
						src={Config.cdnUrl(image.url_thumb)}
					/>
				{/each}
			{/if}

			{#if !searchResults.images && !searchResults.albums}
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
</style>
