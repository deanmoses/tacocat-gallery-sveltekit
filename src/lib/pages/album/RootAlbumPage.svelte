<script lang="ts">
    import Header from "$lib/site/Header.svelte";
    import PageContent from "$lib/site/PageContent.svelte";
    import Sidebar from "$lib/site/Sidebar.svelte";
    import MainContent from "$lib/site/MainContent.svelte";
    import Thumbnails from "$lib/site/Thumbnails.svelte";
    import Thumbnail from "$lib/site/Thumbnail.svelte";

    export let album = null;
</script>

<style>
  aside {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7em;
  }
  aside h2 {
      font-size: 16px;
      font-weight: bold;
      color: #333;
  }
</style>

<svelte:head>
	<title>Dean, Lucie, Felix and Milo Moses</title>
</svelte:head>

<Header>
  <span slot="title">Dean, Lucie, Felix and Milo Moses {$album.title}</span>
  <span slot="short-title">The Moses Family</span>
</Header>
<PageContent>
  <Sidebar>
    <aside>
      <h2>Latest Album</h2>
      <Thumbnail
        title="Dec 20"
        summary="Christmas"
        href="2021/12-20"
        src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
      />
    </aside>
  </Sidebar>
  <MainContent>
    <Thumbnails>
      <Thumbnail
        title="2021"
        href="2021"
        src="https://cdn.tacocat.com/zenphoto/cache/2015/10-26/portrait-seated4b_200_w200_h200_cw200_ch200_thumb.jpg?cached=1548530109"
      />
      <Thumbnail
        title="2020"
        href="2020"
        src="https://cdn.tacocat.com/zenphoto/cache/2015/10-26/portrait-seated4b_200_w200_h200_cw200_ch200_thumb.jpg?cached=1548530109"
      />
      <Thumbnail
        title="2019"
        href="2019"
        src="https://cdn.tacocat.com/zenphoto/cache/2015/10-26/portrait-seated4b_200_w200_h200_cw200_ch200_thumb.jpg?cached=1548530109"
      />
  </Thumbnails>
  </MainContent>
</PageContent>