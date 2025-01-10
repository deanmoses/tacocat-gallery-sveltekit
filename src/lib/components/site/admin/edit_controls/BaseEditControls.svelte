<!--
  @component

  The base editing controls shared by both images and albums
-->

<script lang="ts">
    import type { Snippet } from 'svelte';
    import { run } from 'svelte/legacy';
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

    let status: DraftStatus | undefined = undefined; //draftStore.getStatus(); TODO fix, I uncommented just to get the migration to Svelte 5 running

    let path: string | undefined = $state(unEditUrl(page.url.pathname));

    let hasUnsavedChanges: boolean = $derived(status == DraftStatus.UNSAVED_CHANGES);

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
    run(() => {
        path = unEditUrl(page.url.pathname);
    });
    run(() => {
        handleNavigation(path);
    });

    const rightControls_render = $derived(rightControls);
</script>

<EditControlsLayout>
    {#snippet leftControls()}
        <CancelButton on:click|once={onCancelButtonClick} />
    {/snippet}

    {#snippet status()}
        <!--StatusMessage {status} /-->
        <!-- TODO fix I commented out just to get the migration to Svelte 5 working -->
        <StatusMessage />
    {/snippet}

    {#snippet rightControls()}
        {@render rightControls_render?.()}
        <SaveButton on:click={onSaveButtonClick} {hasUnsavedChanges} />
    {/snippet}
</EditControlsLayout>
