<!--
  @component

  Layout of an album page for displaying waiting or error.
	For use when you don't actually have an image to display.
-->

<script lang="ts">
	import SiteLayout from "$lib/components/site/SiteLayout.svelte";
	import Header from "$lib/components/site/Header.svelte";
	import Nav from "$lib/components/site/nav/Nav.svelte";
	import PrevButton from "$lib/components/site/nav/PrevButton.svelte";
	import UpButton from "$lib/components/site/nav/UpButton.svelte";
	import NextButton from "$lib/components/site/nav/NextButton.svelte";
	
	export let year:string = null;
</script>

<SiteLayout {year}>
	<Header/>
	<Nav>
		<PrevButton />
		<UpButton />
		<NextButton />
	</Nav>
	<div>
		<slot/>
	</div>
</SiteLayout>

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