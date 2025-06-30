<!--
  @component
  
  "I'm Feeling Lucky" button
-->
<script lang="ts">
    import { feelingLuckyMachine } from '$lib/state/FeelingLuckyMachine.svelte';
    import DiceIcon from './icons/DiceIcon.svelte';

    const title = "I'm Feeling Lucky";
    let requestId = $state<number | undefined>();
    let fetching = $derived(requestId !== undefined && feelingLuckyMachine.ongoingRequests.has(requestId));
    let disabled = $derived(fetching);
    let spinning = $derived(fetching);

    function handleClick() {
        requestId = feelingLuckyMachine.start();
    }
</script>

<button onclick={handleClick} {disabled} {title}><DiceIcon {spinning} /> {title}</button>
