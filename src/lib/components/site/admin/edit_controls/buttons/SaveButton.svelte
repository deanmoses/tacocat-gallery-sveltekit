<!--
  @component 
  
  A save button
-->
<script lang="ts">
    import SaveIcon from '$lib/components/site/icons/SaveIcon.svelte';
    import ControlStripButton from './ControlStripButton.svelte';

    interface Props {
        hasUnsavedChanges: boolean;
        onclick?: (event: MouseEvent) => void;
    }

    let { hasUnsavedChanges, onclick }: Props = $props();
</script>

<ControlStripButton {onclick} disabled={!hasUnsavedChanges}>
    {#if hasUnsavedChanges}
        <SaveIcon /> Save*
    {:else}
        <SaveIcon /> Save
    {/if}
</ControlStripButton>
