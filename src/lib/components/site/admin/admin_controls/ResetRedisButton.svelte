<!--
    @component 
    
    Button to reset the Redis search engine
-->
<script lang="ts">
    import { redisResetUrl } from '$lib/utils/config';
    import { toast } from '@zerodevx/svelte-toast';
    import ResetIcon from '../../icons/ResetIcon.svelte';

    let resetStatus = $state('');
    $effect(() => {
        resetStatus;
    });
    let title = $derived(resetStatus || 'Reset Redis');

    let disabled = $state(false);
    $effect(() => {
        disabled = resetStatus !== '';
    });

    async function onClick() {
        resetStatus = 'Resetting...';
        try {
            const response = await fetch(redisResetUrl(), {
                method: 'POST',
                credentials: 'include',
            });
            if (!response.ok) {
                const msg = (await response.json()).errorMessage || response.statusText;
                toast.push(msg);
                throw msg;
            } else {
                toast.push('Redis reset');
            }
        } finally {
            resetStatus = '';
        }
    }
</script>

<label>
    <button {title} type="button" onclick={onClick} {disabled}><ResetIcon /> {title}</button>
    Reset the Redis search engine
</label>
