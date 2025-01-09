<!--
  @component A status message
-->
<script lang="ts">
    import { DraftStatus } from '$lib/models/draft';

  interface Props {
    status: DraftStatus | undefined;
  }

  let { status }: Props = $props();
</script>

{#if status === DraftStatus.SAVING}
    🔄 saving...
{:else if status === DraftStatus.SAVED}
    ✅ saved
{/if}
