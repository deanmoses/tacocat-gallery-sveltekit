<!--
  @component

  Page showing a week album
-->

<script lang="ts">
  import Header from "$lib/components/site/Header.svelte";
  import Nav from "$lib/components/site/Nav.svelte";
  import PageContent from "$lib/components/site/PageContent.svelte";
  import MainContent from "$lib/components/site/MainContent.svelte";
  import Thumbnails from "$lib/components/site/Thumbnails.svelte";
  import Thumbnail from "$lib/components/site/Thumbnail.svelte";
  import PrevButton from "$lib/components/site/buttons/PrevButton.svelte";
  import UpButton from "$lib/components/site/buttons/UpButton.svelte";
  import NextButton from "$lib/components/site/buttons/NextButton.svelte";

  export let album;
</script>

<svelte:head>
	<title>{$album.pageTitle}</title>
</svelte:head>

<Header>
  <span slot="title">{$album.pageTitle}</span>
  <span slot="short-title">{$album.pageTitle}</span>
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
    {#if $album.desc}
    <section class="caption">
      <h2 style="display:none">Album Description</h2>
      {@html $album.desc}
    </section>
    {/if}

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