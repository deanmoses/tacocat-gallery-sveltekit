<!--
  @component

  Layout for search pages that don't have results, but display one big thing
-->
<script lang="ts">
    import SearchPage from '$lib/components/pages/search/SearchPage.svelte';
    import FullPageMessage from '$lib/components/site/FullPageMessage.svelte';

    export let title: string | undefined = undefined;
    export let searchTerms: string;
    export let returnPath: string | undefined;
</script>

<SearchPage {searchTerms} {returnPath} {title}>
    <FullPageMessage>
        <slot />
    </FullPageMessage>
</SearchPage>
