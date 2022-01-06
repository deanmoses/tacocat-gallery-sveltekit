<!--
  @component

  Lays out the shell of the app.  Sveltekit applies this layout to every route
-->

<script lang="ts">
  import { page } from "$app/stores";
  import EditControls from "$lib/components/site/EditControls.svelte";

  let year: string;
  $: year = $page.params ? $page.params.year : ""; // make the year reactive, so that the DOM always gets updated
</script>

<style>
  /* defaults for years with no styling */
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

  footer {
    flex: 0 0 1.7em;
    padding-top: calc(var(--default-padding) * 2);
  }
</style>

<EditControls />
<div class="site-container" data-year={year}>
  <div class="page-container">
    <slot></slot>
  </div>
  <footer class="hidden-sm">
      <picture>
        <source srcset="/images/tacocat-logo.webp">
        <source srcset="/images/tacocat-logo.png">
        <img src="/images/tacocat-logo.png" width="102px" height="19px" alt="Tacocat Logo"/>
      </picture>
  </footer>
</div>