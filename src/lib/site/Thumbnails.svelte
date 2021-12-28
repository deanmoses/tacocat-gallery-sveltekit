<section class="thumbnails">
    <h2 style="display:none">Thumbnails</h2>
    <slot>thumbnails</slot>
</section>
  
  <style>
    .thumbnails {
        display: flex;
        flex-wrap: wrap;
        gap: calc(var(--default-padding) * 2);
    }
  </style>
  