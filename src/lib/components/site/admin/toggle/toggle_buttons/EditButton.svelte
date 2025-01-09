<!--
  @component Button to go into edit mode for an album or image
-->
<script lang="ts">
  import { run } from 'svelte/legacy';

    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import EditIcon from '$lib/components/site/icons/EditIcon.svelte';
    import { editUrl } from '$lib/utils/path-utils';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    let path: string = $derived($page.url.pathname);
    

    let show: boolean = $state(false);
    run(() => {
    show = path !== '/';
  }); // Show this button everywhere but root

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
    <ControlStripButton on:click|once={onEditButtonClick}><EditIcon />Edit</ControlStripButton>
{/if}
