<script context="module" lang="ts">
	export async function load({ page }) {
    const slug = page.params.photo;
    return {props: {slug}}
  }
</script>

<script lang="ts">
    import Header from "$lib/site/Header.svelte";
    import PhotoNav from "$lib/site/PhotoNav.svelte";
    import PageContent from "$lib/site/PageContent.svelte";
    import MainContent from "$lib/site/MainContent.svelte";
    import PrevButton from "$lib/site/PrevButton.svelte";
    import UpButton from "$lib/site/UpButton.svelte";
    import NextButton from "$lib/site/NextButton.svelte";

    export let slug;
</script>

<svelte:head>
	<title>{slug}</title>
</svelte:head>

<Header>
  <span slot="title">{slug}</span>
</Header>
<PageContent>
  <MainContent>
    <section>
      <h2 style="display:none">Caption</h2>
      No animals were harmed in the making of this photo
    </section>
    <div>
      <PhotoNav>
        <PrevButton href="/2021/12-12/christmas" />
        <UpButton title="December 20, 2021" href="/2021/12-20" />
        <NextButton disabled />
      </PhotoNav>
      <section>
        <h2 style="display:none">Photo</h2>
        <a href="https://tacocat.com/zenphoto/albums/2021/12-26/butcher.jpg" target="zen"><img src="https://cdn.tacocat.com/zenphoto/cache/2021/12-26/butcher_1024.jpg?cached=1640635409" style="object-fit: contain; width: 100%; height: 100%; max-width: 4032px; max-height: 3024px;"  alt="Holiday Meat"></a>
      </section>
    </div>
  </MainContent>
</PageContent>