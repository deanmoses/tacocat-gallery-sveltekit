<script lang="ts">
  import Header from "$lib/site/Header.svelte";
  import Nav from "$lib/site/Nav.svelte";
  import PageContent from "$lib/site/PageContent.svelte";
  import MainContent from "$lib/site/MainContent.svelte";
  import Thumbnails from "$lib/site/Thumbnails.svelte";
  import Thumbnail from "$lib/site/Thumbnail.svelte";
  import PrevButton from "$lib/site/PrevButton.svelte";
  import UpButton from "$lib/site/UpButton.svelte";
  import NextButton from "$lib/site/NextButton.svelte";

  export let album;
</script>

<svelte:head>
	<title>{$album.title}</title>
</svelte:head>

<Header>
  <span slot="title">{$album.title}</span>
</Header>
<Nav>
  <PrevButton title="Dec 12" href="/2021/12-12" />
  <UpButton title="2021" href="/2021" />
  <NextButton disabled />
</Nav>
<PageContent>
  <MainContent>
    <section>
      <h2 style="display:none">Album Description</h2>
      This week, we flew to the moon on Elon Musk's shuttle service.
    </section>

    <section>
      <h2 style="display:none">Thumbnails</h2>
      <Thumbnails>
        <Thumbnail
          title="Brothers"
          href="/2021/12-20/brothers"
          src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
        />
        <Thumbnail
          title="Fancy Dinner"
          href="/2021/12-20/fancy_dinner"
          src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
        />
        <Thumbnail
          title="Christmas"
          href="/2021/12-20/christmas"
          src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
        />
        <Thumbnail
          title="Christmas"
          href="/2021/12-20/christmas"
          src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
        />
      </Thumbnails>
    </section>
  </MainContent>
</PageContent>