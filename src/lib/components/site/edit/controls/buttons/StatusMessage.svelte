<!--
  @component

  A status message
-->

<script lang="ts">
	import { DraftStatus } from "$lib/models/draft";

	export let status: DraftStatus;
</script>

{#if status === DraftStatus.SAVING}
	🔄 saving...
{:else if status === DraftStatus.SAVED}
	✅ saved
{/if}