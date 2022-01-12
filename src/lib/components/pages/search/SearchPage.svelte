<!--
  @component

  Page that displays a blank search input
-->

<script lang="ts">
	import { goto } from '$app/navigation';
	import SiteLayout from '$lib/components/site/SiteLayout.svelte';
	import ReturnIcon from '$lib/components/site/icons/ReturnIcon.svelte';

  export let searchTerms: string = null;
	export let returnPath: string = null;

  $: pageTitle = searchTerms ? `Search for ${searchTerms}` : "Search The Moses Family";

	function onSubmit(e) {
		const formData = new FormData(e.target);
		const searchTerms = formData.get("searchTerms");
		if (searchTerms) {
			goto(`/search/${searchTerms}?returnPath=${returnPath}`);
		}
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<SiteLayout hideFooter>
	<header>
		<a href={returnPath}>
			<ReturnIcon />
		</a>
		<form on:submit|preventDefault={onSubmit}>
			<input
				name="searchTerms"
				type="text"
				placeholder="search"
				value="{searchTerms}"
				autofocus
			/>
			<button type="submit" class="btn">
				Search
			</button>
		</form>
	</header>
	
	<slot/>
</SiteLayout>

<style>
	header {
		display: flex;
		align-items: center;

		padding: var(--default-padding);
		padding-left: calc(var(--default-padding) * 2);
		background-color: var(--header-color);
	}
  
	a {
		color: var(--default-text-color);
		font-size: 28px;
		min-height: 1.5em; /* for when there's no h1 text */
	}

	form {
		margin-left: auto
	}

	button {
		background-color: var(--button-color);
	}
</style>