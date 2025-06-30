<!--
  @component
  
  A dice (🎲) icon
-->
<script lang="ts">
    interface Props {
        title?: string;
        width?: string;
        height?: string;
        spinning?: boolean;
    }

    let { title = 'Dice', width = '1em', height = '1em', spinning = false }: Props = $props();
</script>

<span class="dice-icon" class:spinning style:width style:height {title}> 🎲 </span>

<style>
    .dice-icon {
        display: inline-block;
        font-size: inherit;
        line-height: 1;
        vertical-align: middle;
    }

    .spinning {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
