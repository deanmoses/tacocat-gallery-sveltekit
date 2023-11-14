<!--
  @component

  For displaying some big message or waiting spinner in the main content area of a page
-->

<div>
    <slot />
</div>

<style>
    div {
        text-align: center;

        padding-top: 5em;
        padding-bottom: 5em;

        background-color: white;
        color: var(--default-text-color);
    }

    :global(p) {
        margin-top: 1em;
        margin-bottom: 1em;
    }
</style>
