<!--
  @component

  A thumbnail of an album or image
-->

<script lang="ts">
  export let src: string = "";
  export let href: string = "";
  export let title: string = "";
  export let summary: string = "";
</script>

<div class="thumbnail">
  <a {href}><img {src} alt={title} /></a><a {href}>{title}</a>
	<slot name="selectionControls" />
  {#if summary}
		<div class="summary">{summary}</div>
	{/if}
</div>

<style>
  .thumbnail {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative; /* to support the absolute positioning of my child star, if any */
  }

  a {
    text-decoration: none;
    color: black;
  }
	
  a:nth-of-type(1) {
    width: 200px;
    height: 200px;
  }

  a:nth-of-type(2) {
    margin-top: 0.3em;
  }

  img {
    width: 200px;
    height: 200px;
    border: var(--default-border);
  }

  .summary {
    color: var(--default-text-color);
  }
</style>