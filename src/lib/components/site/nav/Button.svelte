<!--
  @component

  Base component for nav buttons
-->
<script lang="ts">
	export let href: string = '';
	export let title: string = null;

	let disabled: boolean;
	$: disabled = !href ? true : null;
</script>

<a {title} {href} {disabled}><span><slot /></span></a>

<style>
	a {
		flex: 1;
	}

	span {
		height: 100%;

		display: flex;
		justify-content: center;
		align-items: center;
		column-gap: 0.2em;

		background-color: var(--button-color);
		color: var(--default-text-color);
		border: 1px solid #ccc;
		text-decoration: none;
		padding: 6px 12px;
	}

	a[disabled] {
		background-color: white;
	}

	a[disabled] span {
		color: #ccc;
		cursor: not-allowed;
		opacity: 0.65;
	}
</style>
