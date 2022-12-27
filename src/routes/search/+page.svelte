<script lang="ts">
	import SearchPage from '$lib/components/pages/search/SearchPage.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: returnPath = data.returnPath;
</script>

<SearchPage {returnPath} />
