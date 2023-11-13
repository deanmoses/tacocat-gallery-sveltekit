<!--
  @component

  WYSIWYG editor for HTML content
-->
<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import Quill from 'quill';

    const dispatch = createEventDispatcher<{ change: { html: string } }>();

    /**
     * The HTML content to be made editable
     */
    export let htmlContent = '';

    // Instance of the Quill rich text editor
    let quill: Quill;

    // Load the Quill.js WYSIWYG editor when the component is mounted,
    // so as to be able to pass the DOM node into Quill's constructor
    function createEditorOnMount(editorElement: HTMLDivElement /* The DOM node on which to mount the Quill editor */) {
        // Prevent Quill from adding target="_blank" and rel="noopener noreferrer" to links
        const Link = Quill.import('formats/link');
        class MyLink extends Link {
            static create(value) {
                let node = super.create(value);
                value = this.sanitize(value);
                node.setAttribute('href', value);
                node.removeAttribute('target');
                node.removeAttribute('rel');
                return node;
            }
        }
        Quill.register(MyLink);

        let editor: HTMLDivElement;
        quill = new Quill(editorElement, {
            // This theme pops up the toolbar when text is selected, rather than displaying it permanently
            theme: 'bubble',
            modules: {
                // Toolbar buttons
                toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link']],
            },
            // The formatting to allow in content, including pasted-in content
            formats: ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'],
        });

        quill.on('text-change', () => {
            dispatch('change', {
                html: quill.root.innerHTML,
            });
        });
    }

    // Use Svelte's $: reactive syntax to ensure when a new value is passed
    // in to the htmlContent property, it sets the contents of the editor.
    // We need to do it this way because when navigating from one photo to
    // the next while in edit mode, Svelte doesn't create a new rich text
    // editor component, but instead re-uses the existing one, which
    // contains the caption from the previous photo.
    $: {
        if (quill) {
            quill.setContents(
                quill.clipboard.convert(htmlContent ?? ''),
                'silent' /* Don't trigger a text-change event */,
            );
        }
    }
</script>

<div use:createEditorOnMount />

<style>
    @import 'https://cdn.quilljs.com/1.3.7/quill.bubble.css';

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
