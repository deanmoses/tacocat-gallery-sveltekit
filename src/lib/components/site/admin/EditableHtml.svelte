<!--
  @component 
  
  Make the passed-in HTML editable via a rich text editor
-->
<script lang="ts">
    import HtmlEditor from './HtmlEditor.svelte';
    import DraftStore from '$lib/stores/DraftStore';

    interface Props {
        /** The HTML content to be made editable */
        htmlContent?: string;
    }

    let { htmlContent = '' }: Props = $props();

    function handleChange(html: string) {
        if (html == null) {
            console.log('<EditableHtml>: html is null');
        } else {
            // TODO: this class should not know about DraftStore nor the specific field they represent ("description", "title")
            DraftStore.setDescription(html);
        }
    }
</script>

<HtmlEditor {htmlContent} onChange={handleChange} />
