<!--
  @component
  
  "I'm Feeling Lucky" button
-->
<script lang="ts">
    import { FeelingLuckyMachine, FeelingLuckyStatus } from '$lib/state/FeelingLuckyMachine.svelte';
    import DiceIcon from './icons/DiceIcon.svelte';

    const title = "I'm Feeling Lucky";

    let luckyMachine = $state<FeelingLuckyMachine | undefined>();
    let fetching = $derived(luckyMachine?.status === FeelingLuckyStatus.IN_PROGRESS);
    let disabled = $derived(fetching);
    let spinning = $derived(fetching);

    function handleClick() {
        luckyMachine = new FeelingLuckyMachine();
    }
</script>

<button onclick={handleClick} {disabled} {title}><DiceIcon {spinning} /> {title}</button>
