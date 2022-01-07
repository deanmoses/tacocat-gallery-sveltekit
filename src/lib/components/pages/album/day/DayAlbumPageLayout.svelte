<!--
  @component

  Layout for pages showing a day album
-->

<script lang="ts">
	import SiteLayout from "$lib/components/site/SiteLayout.svelte";
  import Header from "$lib/components/site/Header.svelte";
  import Nav from "$lib/components/site/nav/Nav.svelte";
  import PageContent from "$lib/components/site/PageContent.svelte";
  import MainContent from "$lib/components/site/MainContent.svelte";

	export let year:string;
  export let title:string;
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<slot name="editControls" />
<SiteLayout {year}>
	<Header>
		<slot name="title" />
	</Header>
	<Nav>
		<slot name="nav" />
	</Nav>
	<PageContent>
		<MainContent>
			<section>
				<h2 style="display:none">Album Description</h2>
				<slot name="caption" />
			</section>

			<section>
				<h2 style="display:none">Thumbnails</h2>
				<slot name="thumbnails" />
			</section>
		</MainContent>
	</PageContent>
</SiteLayout>