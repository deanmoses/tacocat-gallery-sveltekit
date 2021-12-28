<div class="page-container">
  <slot>page</slot>
</div>

<style>
  .page-container {
    --default-padding: 0.5em;
    --default-border: solid black 1px;

    font-family: "Trebuchet MS", Verdana, Arial, Helvetica, sans-serif;
    font-size: 16px;

    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.7em;
    background-color: #94949c;
  }
</style>
