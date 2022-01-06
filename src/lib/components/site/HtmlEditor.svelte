<!--
  @component

  WYSIWYG editor for HTML content
-->

<script lang="ts">
	import { onMount } from "svelte";

	/** The HTML content to be made editable */
	export let htmlContent = "";

	let editor;

	// The buttons to show in Quill's toolbar
	const toolbar = [
		['bold', 'italic', 'underline'],
		[{ list: 'ordered' }, { list: 'bullet' }],
		['link']
	];

	// What formatting the Quill.js editor allows, whether via the toolbar
	// or via keystroke commands (or pasting content in?)
	const formats = [
		'header',
		'bold',
		'italic',
		'underline',
		'strike',
		'list',
		'bullet',
		'link'
	];

	onMount(async () => {
		// Load the Quill.js WYSIWYG editor async
		// TODO: confirm this is actually prevents the bits from being included in the initial bundle
		const { default: Quill } = await import("quill");

		const quill = new Quill(editor, {
			theme: "bubble", // The "bubble" theme pops up the toolbar when text is selected, rather than it being there permanently
			modules: {
					toolbar: toolbar
			},
			formats: formats
		});
	});
</script>

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

<div bind:this={editor}>{@html htmlContent}</div>