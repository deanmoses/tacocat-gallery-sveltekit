<!--
  @component

  Lays out the shell of the app
-->

<script lang="ts">
	import Footer from "./Footer.svelte";

  export let year: string = null;
	export let hideFooter = false;
</script>

<slot name="editControls"/>
<div class="site-container" data-year={year}>
  <div class="page-container">
    <slot />
  </div>
	{#if !hideFooter}<Footer />{/if}
</div>

<style>
  /* default colors for years with no styling of their own */
  .site-container, 
  /* colors for a specific year */
  .site-container[data-year="2022"] {
    --body-color: #686aab;
    --header-color: #d2927f;
    --sidebar-color: #a0838f;
    --button-color: #e2c1bf;
    --button-disabled-color: #f1d6d5;
  }

  .site-container[data-year="2021"] {
    --body-color: #94949c;
    --header-color: #f7de5a;
    --sidebar-color: #838470;
    --button-color: #cec68c;
  }

  .site-container[data-year="2020"] {
    --body-color: #144d7f;
    --header-color: #678ec4;
    --sidebar-color: #b6c7d3;
    --button-color: #beb7b3;
  }

  .site-container[data-year="2019"] {
    --body-color: #4a4843;
    --header-color: #d86b61;
    --sidebar-color: #a79b83;
    --button-color: #a65e68;
  }   

  .site-container {
    --default-padding: 0.5em;
    --default-border: solid black 1px;
    --default-text-color: #333;

    font-family: "Trebuchet MS", Verdana, Arial, Helvetica, sans-serif;
    font-size: 16px;

    min-height: 100%;
    background-color: var(--body-color);
    padding: 0.7em;
  }

  .page-container {
    border: var(--default-border);
  }
</style>