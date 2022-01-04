<script context="module" lang="ts">
	export async function load({ params }) {
        const terms = params.terms;
        return {props: {terms}}
    }
</script>

<script lang="ts">
    import SearchResultsPage from "$lib/components/pages/search/SearchResultsPage.svelte";

    export let terms;
</script>

<SearchResultsPage {terms}/>