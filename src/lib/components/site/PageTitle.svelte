<!--
  @component

  Displays the page title
-->

<script lang="ts">
	import { editMode } from "$lib/stores/EditModeStore";
	import EditableText from "./EditableText.svelte";

	/** Normal length title of page.  Required. */
	export let title:string;

	/** Short title of page.  Optional.*/
	export let shortTitle:string = null;
</script>

<style>
  h1 {
    font-size: 28px;
    min-height: 1.5em; /* for when there's no h1 text */
  }
</style>

{#if $editMode}
	<h1><EditableText textContent={title} /></h1>
{:else if shortTitle}	
	<h1 class="hidden-xs">{title}</h1>
	<h1 class="visible-xs">{shortTitle}</h1>
{:else if title}
	<h1>{title}</h1>
{:else}
	<h1> </h1> <!-- Needed to prevent header from collapsing -->
{/if}