<!--
  @component

  WYSIWYG editor for HTML content
-->
<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * The HTML content to be made editable
	 */
	export let htmlContent = '';

	/**
	 * The edited content.
	 * Don't pass in anything to this; instead, do a bind:newHtmlContent to get the value
	 */
	export let newHtmlContent: string = null;

	let editor;

	// The buttons to show in Quill's toolbar
	const toolbar = [
		['bold', 'italic', 'underline'],
		[{ list: 'ordered' }, { list: 'bullet' }],
		['link']
	];

	// What formatting the Quill.js editor allows, whether via the toolbar
	// or via keystroke commands (or pasting content in?)
	const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'];

	onMount(async () => {
		// Load the Quill.js WYSIWYG editor async
		// TODO: confirm this is actually prevents the bits from being included in the initial bundle
		const { default: Quill } = await import('quill');

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

		let quill = new Quill(editor, {
			theme: 'bubble', // The "bubble" theme pops up the toolbar when text is selected, rather than it being there permanently
			modules: {
				toolbar: toolbar
			},
			formats: formats
		});

		// Every time the text in Quill changes, update my public newHtmlContent property
		// so that my parent component can listen to it changing via Svelte's bind: syntax.
		quill.on('text-change', (delta, oldDelta, source) => {
			newHtmlContent = quill.root.innerHTML;
		});
	});
</script>

<!--
	I wrapped the htmlContent in a <p> to work around a Svelte issue
	where it'd complain about an undefined parent node when updating
	after a save.
-->
<div bind:this={editor}>
	{#if htmlContent}
		<p>{@html htmlContent}</p>
	{/if}
</div>

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
