<script lang="ts">
    import Header from "$lib/site/Header.svelte";
    import PhotoNav from "$lib/site/PhotoNav.svelte";
    import PageContent from "$lib/site/PageContent.svelte";
    import MainContent from "$lib/site/MainContent.svelte";
    import PrevButton from "$lib/site/PrevButton.svelte";
    import UpButton from "$lib/site/UpButton.svelte";
    import NextButton from "$lib/site/NextButton.svelte";
    import WaitingSpinner from "$lib/site/WaitingSpinner.svelte";
</script>

<style>
    .waiting {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: white;
        padding-top: 5em;
        padding-bottom: 5em;
    }
</style>

<Header/>
<PageContent>
  <MainContent>
    <section>
      <h2 style="display:none">Caption</h2>
    </section>
    <div>
      <PhotoNav>
        <PrevButton />
        <UpButton />
        <NextButton />
      </PhotoNav>
      <section class="waiting">
        <h2 style="display:none">Photo</h2>
        <WaitingSpinner />
      </section>
    </div>
  </MainContent>
</PageContent>