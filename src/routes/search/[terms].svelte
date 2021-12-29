<script context="module" lang="ts">
	export async function load({ page }) {
        const terms = page.params.terms;
        return {props: {terms}}
    }
</script>

<script lang="ts">
    import SearchResultsPage from "$lib/pages/search/SearchResultsPage.svelte";

    export let terms;
</script>

<SearchResultsPage {terms}/>