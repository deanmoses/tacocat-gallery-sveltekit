<!--
  @component Layout for search pages that don't have results, but display one big thing
-->
<script lang="ts">
    import SearchPage from '$lib/components/pages/search/SearchPage.svelte';
    import FullPageMessage from '$lib/components/site/FullPageMessage.svelte';

  interface Props {
    title?: string | undefined;
    searchTerms: string;
    returnPath: string | undefined;
    children?: import('svelte').Snippet;
  }

  let {
    title = undefined,
    searchTerms,
    returnPath,
    children
  }: Props = $props();
</script>

<SearchPage {searchTerms} {returnPath} {title}>
    <FullPageMessage>
        {@render children?.()}
    </FullPageMessage>
</SearchPage>
