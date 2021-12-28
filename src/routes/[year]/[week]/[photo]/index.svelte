<script context="module" lang="ts">
	export async function load({ page }) {
        const slug = page.params.photo;
        return {props: {slug}}
    }
</script>

<script lang="ts">
    import Page from "../../../../lib/site/Page.svelte";
    import Header from "../../../../lib/site/Header.svelte";
    import Footer from "../../../../lib/site/Footer.svelte";
    import Nav from "../../../../lib/site/Nav.svelte";
    import PageContent from "../../../../lib/site/PageContent.svelte";
    import MainContent from "../../../../lib/site/MainContent.svelte";
    import PrevButton from "../../../../lib/site/PrevButton.svelte";
    import UpButton from "../../../../lib/site/UpButton.svelte";
    import NextButton from "../../../../lib/site/NextButton.svelte";

    export let slug;
</script>

<svelte:head>
	<title>{slug}</title>
</svelte:head>

<Page>
    <Header>
      <span slot="title">{slug}</span>
    </Header>
    <PageContent>
      <MainContent>
        <section>
          <h2 style="display:none">Photo Description</h2>
          No animals were harmed in the making of this photo
        </section>
        <Nav>
            <PrevButton href="/2021/12-12/christmas" />
            <UpButton title="December 20, 2021" href="/2021/12-20" />
            <NextButton disabled />
          </Nav>
      </MainContent>
    </PageContent>
    <Footer />
  </Page>