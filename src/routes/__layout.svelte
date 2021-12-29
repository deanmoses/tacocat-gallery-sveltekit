<style>
    .app-container[data-year="2021"] {
      --body-color: #94949c;
      --header-color: #f7de5a;
      --sidebar-color: #838470;
      --nav-color: #cec68c;
    }
  
    .app-container {
      --default-padding: 0.5em;
      --default-border: solid black 1px;
  
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
  
  <div class="app-container" data-year="2021">
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
  