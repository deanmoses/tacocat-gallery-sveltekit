<!--
  @component 
  
  Make the passed-in plain text (not HTML) editable
-->
<script lang="ts">
    import { draftMachine } from '$lib/state/admin/DraftMachine.svelte';

    interface Props {
        /** The text content to be made editable */
        textContent?: string;
    }

    let { textContent = '' }: Props = $props();

    let div = $state() as HTMLElement;

    function onInput() {
        let editedText = div.innerText;
        // I'm having a problem with a /n being added at some point where I'm
        // then not able to remove it.  This is a blunt intstrument, but maybe
        // converting any whitespace to a regular space and then trimming it all.
        editedText = editedText.replace(/\s/g, ' ');
        editedText = editedText.trim();
        draftMachine.setTitle(editedText);
    }
</script>

<div contenteditable bind:this={div} oninput={onInput}>{textContent}</div>

<style>
    div[contenteditable] {
        min-width: 10em; /* make edit surface visible even when there's no text in it */
    }
</style>
