<!--
  @component 
  
  Make the passed-in HTML editable via a rich text editor
-->
<script lang="ts">
    import { draftMachine } from '$lib/stores/admin/DraftMachine.svelte';
    import HtmlEditor from './HtmlEditor.svelte';

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
            draftMachine.setDescription(html);
        }
    }
</script>

<HtmlEditor {htmlContent} onChange={handleChange} />
