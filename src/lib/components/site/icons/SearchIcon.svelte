<!--
  @component 
  
  An icon representing the concept of "search"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    interface Props {
        title?: string;
    }

    let { title = undefined }: Props = $props();

    const d =
        'M491 0q100 0 191 39t156.5 104.5T943 300t39 191l-1 2 1 5q0 141-78 262l275 274q23 26 22.5 44.5T1179 1121l-59 58q-26 20-46.5 20t-39.5-20L759 905q-119 77-261 77l-5-1-2 1q-100 0-191-39T143.5 838.5 39 682 0 491t39-191 104.5-156.5T300 39 491 0zm0 169q-88 0-162 43T212 329t-43 162 43 162 117 117 162 43 162-43 117-117 43-162-43-162-117-117-162-43z';
    const viewBox = '0 0 1201.8333740234375 1199';
</script>

<Icon {viewBox} {title} {d} />
