<!--
  @component 
  
  An icon repepresenting the concept of "edit"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    interface Props {
        title?: string;
    }

    let { title = undefined }: Props = $props();

    const d =
        'M1027 0q19 0 33 13l153 153q13 14 13 33t-13 33l-99 92-214-214 95-96q13-14 32-14zm2 410l-615 614-214-214 614-614zm-696 704L0 1226l110-335z';
    const viewBox = '0 -320 1600 1600';
</script>

<Icon {viewBox} {title} {d} />
