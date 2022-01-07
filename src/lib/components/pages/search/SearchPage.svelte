<script lang="ts">
	import { goto } from '$app/navigation';
	import SiteLayout from '$lib/components/site/SiteLayout.svelte';

  export let searchTerms: string = null;
	export let returnPath: string = null;

  $: pageTitle = searchTerms ? `Search for ${searchTerms}` : "Search The Moses Family";

	function onSubmit(e) {
		const formData = new FormData(e.target);
		const searchTerms = formData.get("searchTerms");
		if (searchTerms) {
			goto(`/search/${searchTerms}?return=${returnPath}`);
		}
	}
</script>

<style>
	header {
		display: flex;
		align-items: center;

		padding: var(--default-padding);
		padding-left: calc(var(--default-padding) * 2);
		background-color: var(--header-color);
	}
  
	svg {
		font-size: 28px;
		min-height: 1.5em; /* for when there's no h1 text */
		color: var(--default-text-color);
	}

	form {
		margin-left: auto
	}

	button {
		background-color: var(--button-color);
	}
</style>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<SiteLayout hideFooter>
	<header>
		<a href={returnPath}>
			<svg style="width: 1em; height: 1em;" viewBox="0 0 1156 1156"><path style="fill: currentcolor;" d="M578 0q118 0 225 45.5t184.5 123 123 184.5 45.5 225-45.5 225-123 184.5-184.5 123-225 45.5-225-45.5-184.5-123T45.5 803 0 578t45.5-225 123-184.5T353 45.5 578 0zm-39 323L264 546q-16 13-16 32t16 32l275 223q16 13 27.5 8t11.5-26V678h275q10 0 17.5-7.5T878 653V503q0-10-7.5-17.5T853 478H578V341q0-21-11.5-26t-27.5 8z"></path></svg>
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