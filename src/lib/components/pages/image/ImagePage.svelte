<script lang="ts">
	import Header from "$lib/components/site/Header.svelte";
	import ImageNav from "$lib/components/site/ImageNav.svelte";
	import PageContent from "$lib/components/site/PageContent.svelte";
	import MainContent from "$lib/components/site/MainContent.svelte";
	import PrevButton from "$lib/components/site/buttons/PrevButton.svelte";
	import UpButton from "$lib/components/site/buttons/UpButton.svelte";
	import NextButton from "$lib/components/site/buttons/NextButton.svelte";
	import EditableHtml from "$lib/components/site/EditableHtml.svelte";

	export let album;
	export let image;
</script>

<svelte:head>
	<title>{image.title}</title>
</svelte:head>

<Header title="{image.title}" hideSiteTitle/>
<PageContent>
  <MainContent>
    <section>
      <h2 style="display:none">Caption</h2>
      <EditableHtml htmlContent={image.desc}/>
    </section>
    <div>
      <ImageNav>
        <PrevButton href={image.prevImageHref} />
        <UpButton href={$album.href} title={$album.pageTitle}/>
        <NextButton href={image.nextImageHref}  />
      </ImageNav>
      <section>
        <h2 style="display:none">Photo</h2>
        <a href="https://tacocat.com{image.url_full}" target="zen"><img src="https://cdn.tacocat.com{image.url_sized}" style="object-fit: contain; width: 100%; height: 100%; max-width: 4032px; max-height: 3024px;" alt="{image.title}"></a>
      </section>
    </div>
  </MainContent>
</PageContent>