<script context="module" lang="ts">
	export async function load({ page }) {
        const week = page.params.week;
        const year = page.params.year;
        return {props: {week, year}}
    }
</script>

<script lang="ts">
    import Header from "../../../lib/site/Header.svelte";
    import Nav from "../../../lib/site/Nav.svelte";
    import PageContent from "../../../lib/site/PageContent.svelte";
    import MainContent from "../../../lib/site/MainContent.svelte";
    import Section from "../../../lib/site/Section.svelte";
    import Thumbnails from "../../../lib/site/Thumbnails.svelte";
    import Thumbnail from "../../../lib/site/Thumbnail.svelte";
    import PrevButton from "../../../lib/site/PrevButton.svelte";
    import UpButton from "../../../lib/site/UpButton.svelte";
    import NextButton from "../../../lib/site/NextButton.svelte";

    export let week;
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
	<title>{week}-{year}</title>
</svelte:head>

<Header>
  <span slot="title">{week}-{year}</span>
</Header>
<Nav>
  <PrevButton title="Dec 12" href="/2021/12-12" />
  <UpButton title="2021" href="/2021" />
  <NextButton disabled />
</Nav>
<PageContent>
  <MainContent>
    <Section>
      <span slot="title">Album Description</span>
      This week, we flew to the moon on Elon Musk's shuttle service.
    </Section>

    <Section class="months">
      <span slot="title">Thumbnails</span>

      <Section class="month">
        <h3>December</h3>
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
      </Section>

      <Section class="month">
        <h3>December</h3>
        <Thumbnails>
          <Thumbnail
            title="Brothers"
            href="/2021/12-20/brothers"
            src="https://cdn.tacocat.com/zenphoto/cache/2021/12-20/xmas_restaurant2_200_w200_h200_cw200_ch200_thumb.jpg?cached=1640062642"
          />
        </Thumbnails>
      </Section>

      <Section class="month">
        <h3>December</h3>
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
        </Thumbnails>
      </Section>

    </Section>


  </MainContent>
</PageContent>