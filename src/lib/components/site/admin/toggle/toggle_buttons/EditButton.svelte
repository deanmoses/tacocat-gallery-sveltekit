<!--
  @component 
  
  Button to go into edit mode for an album or image
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import EditIcon from '$lib/components/site/icons/EditIcon.svelte';
    import { editUrl } from '$lib/utils/path-utils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let path: string = $derived(page.url.pathname);
    let show: boolean = $derived(path !== '/'); // Show this button everywhere but root

    /**
     * The Edit button was clicked.
     * Go to edit version of this page.
     */
    function onEditButtonClick() {
        const url = editUrl(path);
        if (url) goto(url);
    }
</script>

{#if show}
    <ControlStripButton onclick={onEditButtonClick}><EditIcon />Edit</ControlStripButton>
{/if}
