<script lang="ts">
    import Page from "../lib/site/Page.svelte";
    import Header from "../lib/site/Header.svelte";
    import Footer from "../lib/site/Footer.svelte";
    import Nav from "../lib/site/Nav.svelte";
    import PageContent from "../lib/site/PageContent.svelte";
    import Sidebar from "../lib/site/Sidebar.svelte";
    import MainContent from "../lib/site/MainContent.svelte";
    import Thumbnail from "../lib/site/Thumbnail.svelte";
    import PrevButton from "../lib/site/PrevButton.svelte";
    import UpButton from "../lib/site/UpButton.svelte";
    import NextButton from "../lib/site/NextButton.svelte";
</script>

<svelte:head>
	<title>Dean, Lucie, Felix and Milo Moses</title>
</svelte:head>

<Page>
    <Header>
      <span slot="title">Dean, Lucie, Felix and Milo Moses</span>
      <span slot="short-title">The Moses Family</span>
    </Header>
    <PageContent>
      <Sidebar>
        latest album
        <Thumbnail
        title="Dec 20"
        href="2021/12-20"
        src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
      />
      </Sidebar>
      <MainContent>
        <Thumbnail
          title="2021"
          href="2021"
          src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
        />
        <Thumbnail
          title="2020"
          href="2020"
          src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
        />
        <Thumbnail
          title="2019"
          href="2019"
          src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
        />
      </MainContent>
    </PageContent>
    <Footer />
  </Page>
  
