<script context="module" lang="ts">
	export async function load({ page }) {
        const year = page.params.year;
        return {props: {year}}
    }
</script>

<script lang="ts">
    import Header from "../../lib/site/Header.svelte";
    import Nav from "../../lib/site/Nav.svelte";
    import PageContent from "../../lib/site/PageContent.svelte";
    import Sidebar from "../../lib/site/Sidebar.svelte";
    import MainContent from "../../lib/site/MainContent.svelte";
    import Thumbnails from "../../lib/site/Thumbnails.svelte";
    import Thumbnail from "../../lib/site/Thumbnail.svelte";
    import PrevButton from "../../lib/site/PrevButton.svelte";
    import UpButton from "../../lib/site/UpButton.svelte";
    import NextButton from "../../lib/site/NextButton.svelte";

    export let year;
</script>

<style>
  :global(.months) {
    display: flex;
    flex-direction: column;
    gap: calc(var(--default-padding) * 2);
  }

  :global(.month) {
    display: flex;
    flex-direction: column;
    gap: calc(var(--default-padding) * 2);
  }

  :global(h3) {
    background-color: var(--header-color);
    font-weight: bold;
    font-size: 1.3em;
    line-height: 1.1;
    padding: 0.3em 0.4em;
    width: 100%;
  }
</style>

<svelte:head>
	<title>{year}</title>
</svelte:head>

<Header>
  <span slot="title">{year}</span>
</Header>
<Nav>
  <PrevButton title="2019" href="2019" />
  <UpButton title="All Years" href="../" />
  <NextButton disabled />
</Nav>
<PageContent>
  <Sidebar>
    <section>
      <h2 style="display:none">Year In Review</h2>
      The Year In Review
    </section>
  </Sidebar>
  <MainContent>

    <section class="months">
      <h2 style="display:none">Thumbnails</h2>

      <section class="month">
        <h3>December</h3>
        <Thumbnails>
          <Thumbnail
            title="Dec 31"
            href="2021/12-31"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
          <Thumbnail
            title="Dec 26"
            href="2021/12-26"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
          <Thumbnail
            title="Dec 20"
            href="2021/12-20"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
          <Thumbnail
            title="Dec 12"
            href="2021/12-12"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
          <Thumbnail
            title="Dec 4"
            href="2021/12-04"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
        </Thumbnails>
      </section>

      <section class="month">
        <h3>November</h3>
        <Thumbnails>
          <Thumbnail
            title="Nov 30"
            href="2021/11-30"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
          <Thumbnail
            title="Nov 20"
            href="2021/12-20"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
        </Thumbnails>
      </section>

      <section class="month">
        <h3>October</h3>
        <Thumbnails>
          <Thumbnail
            title="Oct 31"
            summary="Halloween"
            href="2021/10-31"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
          <Thumbnail
            title="Oct 22"
            href="2021/10-22"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
          <Thumbnail
            title="Oct 17"
            href="2021/10-17"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
        </Thumbnails>
      </section>

    </section>
  </MainContent>
</PageContent>