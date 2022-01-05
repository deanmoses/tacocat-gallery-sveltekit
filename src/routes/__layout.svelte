<style>
    /* defaults for years with no styling */
    .app-container {
      --body-color: #3f64ee; /* outermost part of screen */
      --header-color: #ffe793; /* page header, month headers */
      --sidebar-color: #ffd02d; /* sidebar */
      --button-color: #e2c1bf; /* buttons */
      --button-disabled-color: #f1d6d5; /* grayed-out buttons */
    }

    .app-container[data-year="2022"] {
      --body-color: #686aab;
      --header-color: #d2927f;
      --sidebar-color: #a0838f;
      --button-color: #e2c1bf;
      --button-disabled-color: #f1d6d5; /* Lucie would like #F1D6D5 for grayed-out header nav buttons */
    }

    .app-container[data-year="2021"] {
      --body-color: #94949c;
      --header-color: #f7de5a;
      --sidebar-color: #838470;
      --button-color: #cec68c;
    }
  
    .app-container {
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
  
  <div class="app-container" data-year="2022">
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
  