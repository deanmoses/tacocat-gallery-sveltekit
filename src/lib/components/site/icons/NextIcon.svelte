<!--
  @component 
  
  An icon representing the concept of "next"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    interface Props {
        title?: string;
    }

    let { title = undefined }: Props = $props();

    const d = 'M749 551l-551 551L0 904l353-353L0 198 198 0z';
    const viewBox = '0 0 749 1102';
</script>

<Icon {viewBox} {title} {d} />
