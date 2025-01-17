<!--
  @component

  The base editing controls shared by both images and albums
-->
<script lang="ts">
    import type { Snippet } from 'svelte';
    import EditControlsLayout from './EditControlsLayout.svelte';
    import CancelButton from './buttons/CancelButton.svelte';
    import SaveButton from './buttons/SaveButton.svelte';
    import StatusMessage from './buttons/StatusMessage.svelte';
    import draftStore from '$lib/stores/DraftStore';
    import { DraftStatus } from '$lib/models/draft';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { unEditUrl } from '$lib/utils/path-utils';
    import { isValidImagePath } from '$lib/utils/galleryPathUtils';

    interface Props {
        rightControls?: Snippet;
    }

    let { rightControls }: Props = $props();

    let path: string | undefined = $derived(unEditUrl(page.url.pathname));

    let draftStoreStatus = draftStore.getStatus();
    let status: DraftStatus | undefined = $derived($draftStoreStatus);
    let hasUnsavedChanges: boolean = $derived(status == DraftStatus.UNSAVED_CHANGES);

    // Navigate to new path whenever it changes
    $effect(() => {
        handleNavigation(path);
    });

    const rightControls_render = $derived(rightControls);

    function handleNavigation(path: string | undefined): void {
        // Cancel the draft when any navigation happens
        // TODO: there's no reason to do it here, the draft store
        // could subscribe to page.url.pathname itself.
        // I guess the only reason to do it here is that when you're
        // NOT in edit mode, there's no need to listen to it.
        if (path === undefined) throw new Error(`path is undefined`);
        const backEndPath = isValidImagePath(path) ? path : path + '/';
        draftStore.init(backEndPath);
    }

    function onCancelButtonClick() {
        draftStore.cancel();
        if (path === undefined) throw new Error(`path is undefined`);
        goto(path);
    }

    async function onSaveButtonClick() {
        await draftStore.save();
    }
</script>

<!-- 
    This snippet is necessary because trying to execute <StatusMessage {status} />  
    directly within <EditControlsLayout>'s {#snippet status()} would create a conflict 
    between the EditControlsLayout.status property and this component's status
    property, which are of two different datatypes. 
-->
{#snippet statusMessage()}
    <StatusMessage {status} />
{/snippet}

<EditControlsLayout>
    {#snippet leftControls()}
        <CancelButton onclick={onCancelButtonClick} />
    {/snippet}

    {#snippet status()}
        {@render statusMessage()}
    {/snippet}

    {#snippet rightControls()}
        {@render rightControls_render?.()}
        <SaveButton onclick={onSaveButtonClick} {hasUnsavedChanges} />
    {/snippet}
</EditControlsLayout>
