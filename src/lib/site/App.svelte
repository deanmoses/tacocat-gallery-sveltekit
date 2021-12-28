<script lang="ts">
  import Page from "./Page.svelte";
  import Header from "./Header.svelte";
  import Footer from "./Footer.svelte";
  import Nav from "./Nav.svelte";
  import PageContent from "./PageContent.svelte";
  import Sidebar from "./Sidebar.svelte";
  import MainContent from "./MainContent.svelte";
  import Thumbnail from "./Thumbnail.svelte";
  import PrevButton from "./PrevButton.svelte";
  import UpButton from "./UpButton.svelte";
  import NextButton from "./NextButton.svelte";
</script>

<Page>
  <Header>
    <span slot="title">Dean, Lucie, Felix and Milo Moses</span>
    <span slot="short-title">The Moses Family</span>
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
        href="#2021/12-20"
        src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
      />
      <Thumbnail
        title="Dec 20"
        href="#2021/12-20"
        src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
      />
      <Thumbnail
        title="Dec 20"
        href="#2021/12-20"
        src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
      />
      <Thumbnail
        title="Dec 20"
        href="#2021/12-20"
        src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
      />
      <Thumbnail
        title="Dec 20"
        href="#2021/12-20"
        src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
      />
      <Thumbnail
        title="Dec 20"
        href="#2021/12-20"
        src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
      />
      <Thumbnail
        title="Dec 20"
        href="#2021/12-20"
        src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
      />
      <Thumbnail
        title="Dec 20"
        href="#2021/12-20"
        src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
      />
    </MainContent>
  </PageContent>
  <Footer />
</Page>
