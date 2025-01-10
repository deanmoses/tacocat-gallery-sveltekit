<!--
  @component Button that navigates to the previous item
-->
<script lang="ts">
    import Button from './Button.svelte';
    import PrevIcon from '../icons/PrevIcon.svelte';

    interface Props {
        href?: string;
        title?: string;
    }

    let { href = '', title = '' }: Props = $props();

    let a11yTitle: string = $derived(title ? title : 'Previous');
</script>

<Button {href} title={a11yTitle}><PrevIcon /><span class="hidden-xs">{title}</span></Button>
