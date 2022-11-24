<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	import SearchPage from "$lib/components/pages/search/SearchPage.svelte";
	
	export let returnPath: string = data.returnPath;
</script>

<SearchPage {returnPath} />