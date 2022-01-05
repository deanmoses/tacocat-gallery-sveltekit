<script lang="ts">
    import Header from "$lib/components/site/Header.svelte";
    import PhotoNav from "$lib/components/site/PhotoNav.svelte";
    import PageContent from "$lib/components/site/PageContent.svelte";
    import MainContent from "$lib/components/site/MainContent.svelte";
    import PrevButton from "$lib/components/site/buttons/PrevButton.svelte";
    import UpButton from "$lib/components/site/buttons/UpButton.svelte";
    import NextButton from "$lib/components/site/buttons/NextButton.svelte";
    import WaitingSpinner from "$lib/components/site/WaitingSpinner.svelte";
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