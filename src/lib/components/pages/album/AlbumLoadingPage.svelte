<!--
  @component

  A blank "Album is Loading" stencil page to show while waiting for an album to load
-->

<script lang="ts">
    import Header from "$lib/components/site/Header.svelte";
    import Nav from "$lib/components/site/Nav.svelte";
    import PrevButton from "$lib/components/site/PrevButton.svelte";
    import UpButton from "$lib/components/site/UpButton.svelte";
    import NextButton from "$lib/components/site/NextButton.svelte";
    import WaitingSpinner from "$lib/components/site/WaitingSpinner.svelte"
</script>

<style>
    div {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: white;
        padding-top: 5em;
        padding-bottom: 5em;
    }
</style>

<Header/>
<Nav>
    <PrevButton />
    <UpButton />
    <NextButton />
</Nav>
<div>
    <WaitingSpinner />
</div>