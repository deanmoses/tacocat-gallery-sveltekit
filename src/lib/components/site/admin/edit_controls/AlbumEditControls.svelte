<!--
  @component

  Controls for editing albums
-->
<script lang="ts">
    import BaseEditControls from './BaseEditControls.svelte';
    import draftStore from '$lib/stores/DraftStore';

    /** Show the published checkbox.  Should only be shown on day albums, not year albums */
    export let showPublished: boolean = false;

    /** Whether album is published or not */
    export let published: boolean = false;

    /** Show the summary field.  Should only be shown on day albums, not year albums */
    export let showSummary: boolean = false;

    export let summary: string = '';

    function onSummaryChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        if (event.target) draftStore.setCustomData(event.currentTarget.value);
    }

    function onPublishedChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        if (event.target) draftStore.setPublished(event.currentTarget.checked);
    }
</script>

<BaseEditControls>
    <svelte:fragment slot="rightControls">
        {#if showSummary}
            <div>
                <input type="text" value={summary ?? ''} on:input={onSummaryChange} />
            </div>
        {/if}
        {#if showPublished}
            <div>
                <input type="checkbox" checked={published} on:change={onPublishedChange} /> published
            </div>
        {/if}
    </svelte:fragment>
</BaseEditControls>
