<script lang="ts">
    import Header from "$lib/site/Header.svelte";
    import PhotoNav from "$lib/site/PhotoNav.svelte";
    import PageContent from "$lib/site/PageContent.svelte";
    import MainContent from "$lib/site/MainContent.svelte";
    import PrevButton from "$lib/site/PrevButton.svelte";
    import UpButton from "$lib/site/UpButton.svelte";
    import NextButton from "$lib/site/NextButton.svelte";
    import type {Image} from "$lib/models/models";

    export let album;
    export let photoPath;

    const photo = $album.getImage(photoPath) as Image;
    console.log(`album.getImage(${photoPath}):`, photo)
    console.log(`photo.title:`, photo.title)
</script>

<svelte:head>
	<title>{photo.title}</title>
</svelte:head>

<Header>
  <span slot="title">{photo.title}</span>
</Header>
<PageContent>
  <MainContent>
    {#if photo.desc}
    <section>
      <h2 style="display:none">Caption</h2>
      {@html photo.desc}
    </section>
    {/if}
    <div>
      <PhotoNav>
        <PrevButton href={photo.prevImageHref} />
        <UpButton href={$album.href} title={$album.pageTitle}/>
        <NextButton href={photo.nextImageHref}  />
      </PhotoNav>
      <section>
        <h2 style="display:none">Photo</h2>
        <a href="https://tacocat.com{photo.url_full}" target="zen"><img src="https://cdn.tacocat.com{photo.url_sized}" style="object-fit: contain; width: 100%; height: 100%; max-width: 4032px; max-height: 3024px;" alt="{photo.title}"></a>
      </section>
    </div>
  </MainContent>
</PageContent>