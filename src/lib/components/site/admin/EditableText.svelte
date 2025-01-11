<!--
  @component 
  
  Make the passed-in plain text (not HTML) editable
-->
<script lang="ts">
    import DraftStore from '$lib/stores/DraftStore';

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
        DraftStore.setTitle(editedText);
    }
</script>

<div contenteditable bind:this={div} oninput={onInput}>{textContent}</div>
