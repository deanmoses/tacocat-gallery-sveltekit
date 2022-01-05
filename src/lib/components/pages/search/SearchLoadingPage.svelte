<script lang="ts">
    import SearchPage from "$lib/components/pages/search/SearchPage.svelte";
    import WaitingSpinner from "$lib/components/site/WaitingSpinner.svelte";

    export let searchTerms: string;
    export let returnUrl: string;
</script>

<SearchPage {searchTerms} {returnUrl}>
    Searching for {searchTerms}...

    <WaitingSpinner />
</SearchPage>