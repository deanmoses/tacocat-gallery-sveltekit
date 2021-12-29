<style>
  .page-container[data-year="2021"] {
    --body-color: #94949c;
    --header-color: #f7de5a;
    --sidebar-color: #838470;
    --nav-color: #cec68c;
  }

  .page-container {
    --default-padding: 0.5em;
    --default-border: solid black 1px;

    font-family: "Trebuchet MS", Verdana, Arial, Helvetica, sans-serif;
    font-size: 16px;

    height: 100%;
    background-color: var(--body-color);
    padding: 0.7em;
  }
</style>

<div class="page-container" data-year="2021">
  <slot>page</slot>
</div>
