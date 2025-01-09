<!--
  @component A "Searching..." page
-->
<script lang="ts">
    import WaitingSpinner from '$lib/components/site/WaitingSpinner.svelte';
    import BlankSearchPageLayout from './BlankSearchPageLayout.svelte';

  interface Props {
    searchTerms: string;
    returnPath: string | undefined;
  }

  let { searchTerms, returnPath }: Props = $props();
</script>

<BlankSearchPageLayout {searchTerms} {returnPath}>
    <WaitingSpinner />
</BlankSearchPageLayout>
