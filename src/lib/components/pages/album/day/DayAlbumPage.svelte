<!--
  @component

  Page showing a day album
-->

<script lang="ts">
  import Header from "$lib/components/site/Header.svelte";
  import Nav from "$lib/components/site/nav/Nav.svelte";
	import PrevButton from "$lib/components/site/nav/PrevButton.svelte";
  import UpButton from "$lib/components/site/nav/UpButton.svelte";
  import NextButton from "$lib/components/site/nav/NextButton.svelte";
  import PageContent from "$lib/components/site/PageContent.svelte";
  import MainContent from "$lib/components/site/MainContent.svelte";
  import Thumbnails from "$lib/components/site/Thumbnails.svelte";
  import Thumbnail from "$lib/components/site/Thumbnail.svelte";
  import EditableHtml from "$lib/components/site/EditableHtml.svelte";
	import SiteLayout from "$lib/components/site/SiteLayout.svelte";

	export let year:string;
  export let album;
</script>

<svelte:head>
	<title>{$album.pageTitle}</title>
</svelte:head>

<SiteLayout {year}>
	<Header>
		{$album.pageTitle}
	</Header>
	<Nav>
		<PrevButton
			href={$album.nextAlbumHref}
			title={$album.nextAlbumTitle}
		/>
		<UpButton
			href={$album.parentAlbumHref}
			title={$album.parentAlbumTitle}
		/>
		<NextButton 
			href={$album.prevAlbumHref}
			title={$album.prevAlbumTitle}
		/>
	</Nav>
	<PageContent>
		<MainContent>
			<section>
				<h2 style="display:none">Album Description</h2>
				<EditableHtml htmlContent={$album.desc}/>
			</section>

			<section>
				<h2 style="display:none">Thumbnails</h2>
				<Thumbnails>
					{#if $album.images}
					{#each $album.images as image (image.path)}
						<Thumbnail
							title="{image.title}"
							summary="{image.customdata}"
							href="/{image.path}"
							src="https://cdn.tacocat.com{image.url_thumb}"
						/>
					{/each}
					{/if}
				</Thumbnails>
			</section>
		</MainContent>
	</PageContent>
</SiteLayout>