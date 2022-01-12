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
	import FullPageMessage from "$lib/components/site/FullPageMessage.svelte";
	
	export let year:string = null;
	export let title: string;
	export let hideFooter = false;
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<SiteLayout {year} {hideFooter}>
	<Header/>
	<Nav>
		<PrevButton />
		<UpButton />
		<NextButton />
	</Nav>
	<FullPageMessage>
		<slot/>
	</FullPageMessage>
</SiteLayout>