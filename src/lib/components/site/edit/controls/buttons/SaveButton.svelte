<!--
  @component A save button
-->
<script lang="ts">
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';
    import ControlStripButton from './ControlStripButton.svelte';

    export let hasUnsavedChanges: boolean;
</script>

<ControlStripButton on:click disabled={!hasUnsavedChanges}>
    {#if hasUnsavedChanges}
        <SaveIcon /> Save*
    {:else}
        <SaveIcon /> Save
    {/if}
</ControlStripButton>
