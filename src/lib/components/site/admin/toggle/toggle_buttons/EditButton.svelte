<!--
  @component 
  
  Button to go into edit mode for an album or image
-->
<script lang="ts">
    import { page } from '$app/state';
    import EditIcon from '$lib/components/site/icons/EditIcon.svelte';
    import { editModeMachine } from '$lib/stores/admin/EditModeMachine.svete';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let path: string = $derived(page.url.pathname);
    let show: boolean = $derived(path !== '/'); // Show this button everywhere but root

    function onEditButtonClick() {
        editModeMachine.turnOnEditMode();
    }
</script>

{#if show}
    <ControlStripButton onclick={onEditButtonClick}><EditIcon />Edit</ControlStripButton>
{/if}
