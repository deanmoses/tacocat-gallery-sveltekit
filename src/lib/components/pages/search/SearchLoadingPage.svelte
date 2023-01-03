<!--
  @component

  A "Searching..." page
-->
<script lang="ts">
	import WaitingSpinner from '$lib/components/site/WaitingSpinner.svelte';
	import BlankSearchPageLayout from './BlankSearchPageLayout.svelte';

	export let searchTerms: string;
	export let returnPath: string | undefined;
</script>

<BlankSearchPageLayout {searchTerms} {returnPath}>
	<WaitingSpinner />
</BlankSearchPageLayout>
