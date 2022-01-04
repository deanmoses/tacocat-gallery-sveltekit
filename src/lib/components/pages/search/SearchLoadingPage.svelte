<script lang="ts">
    import SearchPage from "$lib/components/pages/search/SearchPage.svelte";

    export let searchTerms;
</script>

<SearchPage {searchTerms}>
    Searching for {searchTerms}...
</SearchPage>