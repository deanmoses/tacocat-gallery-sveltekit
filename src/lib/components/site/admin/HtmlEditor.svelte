<!--
  @component
  
  WYSIWYG editor for HTML content
-->
<script lang="ts">
    import Quill from 'quill';
    import { QuillLink } from './QuillLink';

    interface Props {
        /** The HTML content to be made editable */
        htmlContent?: string;

        /** Callback to be called every time the content changes */
        onChange?: (newHtml: string) => void;
    }

    let { htmlContent = '', onChange }: Props = $props();

    // Instance of the Quill.js WYSIWYG rich text editor
    let quill: Quill | undefined = $state();

    // Load the Quill editor when the component is mounted,
    // so as to be able to pass the DOM node into Quill's constructor
    function createEditorOnMount(editorElement: HTMLDivElement /* The DOM node on which to mount the Quill editor */) {
        // Prevent Quill from adding target="_blank" and rel="noopener noreferrer" to links
        Quill.register(QuillLink);

        quill = new Quill(editorElement, {
            // This theme pops up the toolbar when text is selected, rather than displaying it permanently
            theme: 'bubble',
            modules: {
                // Toolbar buttons
                toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link']],
            },
            // The formatting to allow in content, including pasted-in content
            formats: ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'link'],
        });

        quill.on('text-change', () => {
            if (quill && onChange) {
                onChange(quill.getSemanticHTML());
            }
        });
    }

    // Use Svelte's $effect to ensure that when a new value is passed
    // in to the htmlContent property, it sets the contents of the editor.
    // We need to do it this way because when navigating from one photo to
    // the next while in edit mode, Svelte doesn't create a new rich text
    // editor component, but instead re-uses the existing one, which
    // contains the caption from the previous photo.
    $effect(() => {
        quill?.setContents(
            quill.clipboard.convert({ html: htmlContent ?? '' }),
            'silent' /* Don't trigger a text-change event */,
        );
    });
</script>

<div use:createEditorOnMount></div>

<style>
    @import 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.bubble.css';

    /* Undo styling added by Quill's style sheet */
    :global(.ql-container) {
        font-family: unset;
        font-size: unset;
    }
    :global(.ql-editor) {
        line-height: unset;
        padding: unset;
    }
    :global(.ql-tooltip) {
        z-index: 3;
    }
</style>
