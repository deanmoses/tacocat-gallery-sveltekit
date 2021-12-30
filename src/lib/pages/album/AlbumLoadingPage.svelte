<script lang="ts">
    import Header from "$lib/site/Header.svelte";
    import Nav from "$lib/site/Nav.svelte";
    import PrevButton from "$lib/site/PrevButton.svelte";
    import UpButton from "$lib/site/UpButton.svelte";
    import NextButton from "$lib/site/NextButton.svelte";
    import WaitingSpinner from "$lib/site/WaitingSpinner.svelte"
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
    <PrevButton disabled/>
    <UpButton disabled/>
    <NextButton disabled/>
</Nav>
<div>
    <WaitingSpinner />
</div>