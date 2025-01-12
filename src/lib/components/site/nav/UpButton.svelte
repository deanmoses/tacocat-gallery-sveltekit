<!--
  @component 
  
  Button that navigates to the parent item
-->
<script lang="ts">
    import Button from './Button.svelte';
    import HomeIcon from '../icons/HomeIcon.svelte';

    interface Props {
        href?: string;
        title?: string;
    }

    let { href = '', title = '' }: Props = $props();

    let a11yTitle: string = $derived(title ? title : 'Up');
</script>

<Button {href} title={a11yTitle}><HomeIcon /><span class="hidden-xs">{title}</span></Button>
