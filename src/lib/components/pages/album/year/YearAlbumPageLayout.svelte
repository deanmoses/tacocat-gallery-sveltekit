<!--
  @component

  Layout for year album pages
-->

<script lang="ts">
	import SiteLayout from "$lib/components/site/SiteLayout.svelte";
	import Header from "$lib/components/site/Header.svelte";
	import Nav from "$lib/components/site/Nav.svelte";
	import PageContent from "$lib/components/site/PageContent.svelte";
	import Sidebar from "$lib/components/site/Sidebar.svelte";
	import MainContent from "$lib/components/site/MainContent.svelte";

	export let year: string;
</script>

<style>
  h2 {
    display: none;
  }
	
  .months {
    display: flex;
    flex-direction: column;
    gap: calc(var(--default-padding) * 2);
  }
</style>

<svelte:head>
	<title>{year}</title>
</svelte:head>

<SiteLayout {year}>
	<svelte:fragment slot="editControls"><slot name="editControls" /></svelte:fragment>
	<Header title={year} />
	<Nav>
		<slot name="nav" />
	</Nav>
	<PageContent>
		<Sidebar>
			<section>
				<h2>Year In Review</h2>
				<slot name="caption" />
			</section>
		</Sidebar>
		<MainContent>
			<section class="months">
				<h2>Thumbnails</h2>
				<slot name="thumbnails" />
			</section>
		</MainContent>
	</PageContent>
</SiteLayout>
