<!--
  @component 
  
  A cancel button
-->
<script lang="ts">
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import ControlStripButton from './ControlStripButton.svelte';

    interface Props {
        onclick?: (event: MouseEvent) => void;
    }

    let { onclick }: Props = $props();
</script>

<ControlStripButton {onclick}><CancelIcon /> Cancel</ControlStripButton>
