<!--
  @component
  
  Button that navigates to the next item
-->
<script lang="ts">
    import Button from './Button.svelte';
    import NextIcon from '../icons/NextIcon.svelte';

    interface Props {
        href?: string;
        title?: string;
    }

    let { href = '', title = '' }: Props = $props();

    let a11yTitle: string = $derived(title ? title : 'Next');
</script>

<Button {href} title={a11yTitle}><span class="hidden-xs">{title}</span><NextIcon /></Button>
