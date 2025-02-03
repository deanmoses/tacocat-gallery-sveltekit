<!--
  @component

  Controls for editing albums
-->
<script lang="ts">
    import { draftStore } from '$lib/stores/DraftStore.svelte';
    import BaseEditControls from './BaseEditControls.svelte';

    interface Props {
        /** Whether album is published or not */
        published?: boolean;

        /** Show the summary field.  Should only be shown on day albums, not year albums */
        showSummary?: boolean;

        summary?: string;
    }

    let { published = false, showSummary = false, summary = '' }: Props = $props();

    function onSummaryChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        if (event.target) draftStore.setSummary(event.currentTarget.value);
    }

    function onPublishedChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        if (event.target) draftStore.setPublished(event.currentTarget.checked);
    }
</script>

<BaseEditControls>
    {#snippet rightControls()}
        {#if showSummary}
            <div>
                <input type="text" name="text" value={summary ?? ''} oninput={onSummaryChange} />
            </div>
        {/if}
        <div>
            <input type="checkbox" name="check" checked={published} onchange={onPublishedChange} /> published
        </div>
    {/snippet}
</BaseEditControls>
