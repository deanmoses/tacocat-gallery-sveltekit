<!--
  @component

  For displaying some big message or waiting spinner in the main content area of a page
-->

<style>
	div {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: white;
		padding-top: 5em;
		padding-bottom: 5em;
	}
</style>

<div>
	<slot />
</div>