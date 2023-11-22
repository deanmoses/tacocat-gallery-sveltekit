<!--
  @component A cancel button
-->
<script lang="ts">
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import ControlStripButton from './ControlStripButton.svelte';
</script>

<ControlStripButton on:click><CancelIcon /> Cancel</ControlStripButton>
