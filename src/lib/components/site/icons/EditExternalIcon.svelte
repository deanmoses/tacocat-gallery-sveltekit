<!--
  @component 
  
  An icon representing "edit in an external site"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    interface Props {
        width?: string;
        height?: string;
        title?: string;
    }

    let { width = '1.1em', height = '1.1em', title = undefined }: Props = $props();

    const d =
        'M15,15H2V6h2.595c0,0,0.689-0.896,2.17-2H1C0.447,4,0,4.449,0,5v11c0,0.553,0.447,1,1,1h15 c0.553,0,1-0.447,1-1v-3.746l-2,1.645V15z M13.361,8.05v3.551L20,6.4l-6.639-4.999v3.131C5.3,4.532,5.3,12.5,5.3,12.5 C7.582,8.752,8.986,8.05,13.361,8.05z';
    const viewBox = '0 0 20 20';
</script>

<Icon {width} {height} {viewBox} {title} {d} />
