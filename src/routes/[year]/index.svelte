<script context="module" lang="ts">
	export async function load({ page }) {
        const year = page.params.year;
        return {props: {year}}
    }
</script>

<script lang="ts">
    import Page from "../../lib/site/Page.svelte";
    import Header from "../../lib/site/Header.svelte";
    import Footer from "../../lib/site/Footer.svelte";
    import Nav from "../../lib/site/Nav.svelte";
    import PageContent from "../../lib/site/PageContent.svelte";
    import Sidebar from "../../lib/site/Sidebar.svelte";
    import MainContent from "../../lib/site/MainContent.svelte";
    import Thumbnail from "../../lib/site/Thumbnail.svelte";
    import PrevButton from "../../lib/site/PrevButton.svelte";
    import UpButton from "../../lib/site/UpButton.svelte";
    import NextButton from "../../lib/site/NextButton.svelte";

    export let year;
</script>

<svelte:head>
	<title>{year}</title>
</svelte:head>

<Page>
    <Header>
      <span slot="title">{year}</span>
    </Header>
    <Nav>
      <PrevButton title="2020" href="#2020" />
      <UpButton title="All Years" href="#" />
      <NextButton disabled />
    </Nav>
    <PageContent>
      <Sidebar>sidebar</Sidebar>
      <MainContent>
        <Thumbnail
          title="Dec 20"
          href="2021/12-20"
          src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
        />
        <Thumbnail
          title="Dec 20"
          href="2021/12-20"
          src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
        />
        <Thumbnail
          title="Dec 20"
          href="2021/12-20"
          src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
        />
       
      </MainContent>
    </PageContent>
    <Footer />
  </Page>