<script>
    import PrevButton from "./PrevButton.svelte";
    import UpButton from "./UpButton.svelte";
    import NextButton from "./NextButton.svelte";
  </script>
  
  <style>
    nav {
        display: flex;
    }

    :global(.btn:nth-child(2)) {
        border-left: 1px solid #ccc;
        border-right: 1px solid #ccc;
    }
  </style>
  
  <nav role="navigation">
    <slot />
  </nav>