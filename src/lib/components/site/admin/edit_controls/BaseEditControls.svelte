<!--
  @component

  The base editing controls shared by both images and albums
-->

<script lang="ts">
    import EditControlsLayout from './EditControlsLayout.svelte';
    import CancelButton from './buttons/CancelButton.svelte';
    import SaveButton from './buttons/SaveButton.svelte';
    import StatusMessage from './buttons/StatusMessage.svelte';
    import draftStore from '$lib/stores/DraftStore';
    import { DraftStatus } from '$lib/models/draft';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { unEditUrl } from '$lib/utils/path-utils';
    import { isValidImagePath } from '$lib/utils/galleryPathUtils';

    const status = draftStore.getStatus();

    let path: string | undefined = unEditUrl($page.url.pathname);
    $: path = unEditUrl($page.url.pathname);
    $: handleNavigation(path);

    let hasUnsavedChanges: boolean;
    $: hasUnsavedChanges = $status == DraftStatus.UNSAVED_CHANGES;

    function handleNavigation(path: string | undefined): void {
        // Cancel the draft when any navigation happens
        // TODO: there's no reason to do it here, the draft store
        // could subscribe to $page.url.pathname itself.
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

<EditControlsLayout>
    <svelte:fragment slot="leftControls">
        <CancelButton on:click|once={onCancelButtonClick} />
    </svelte:fragment>

    <svelte:fragment slot="status">
        <StatusMessage status={$status} />
    </svelte:fragment>

    <svelte:fragment slot="rightControls">
        <slot name="rightControls" />
        <SaveButton on:click={onSaveButtonClick} {hasUnsavedChanges} />
    </svelte:fragment>
</EditControlsLayout>
