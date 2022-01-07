<!--
  @component

  Layout of an image page.  
-->

<script lang="ts">
	import ImageNav from "$lib/components/site/ImageNav.svelte";
	import PageContent from "$lib/components/site/PageContent.svelte";
	import MainContent from "$lib/components/site/MainContent.svelte";
	import SiteLayout from "$lib/components/site/SiteLayout.svelte";

	export let year: string;
	export let title: string;
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<SiteLayout {year}>
	<svelte:fragment slot="editControls"><slot name="editControls"></slot></svelte:fragment>
	<slot name="header"></slot>
	<PageContent>
		<MainContent>
			<section>
				<h2 style="display:none">Caption</h2>
				<slot name="caption"></slot>
			</section>
			<div>
				<ImageNav>
					<slot name="nav"></slot>
				</ImageNav>
				<section>
					<h2 style="display:none">Photo</h2>
					<slot name="image"></slot>
				</section>
			</div>
		</MainContent>
	</PageContent>
</SiteLayout>
