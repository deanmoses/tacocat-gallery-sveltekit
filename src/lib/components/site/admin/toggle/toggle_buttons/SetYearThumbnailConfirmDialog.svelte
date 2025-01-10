<!--
  @component 
  
  Dialog to confirm setting year thumbnail
-->
<script lang="ts">
    import { preventDefault } from 'svelte/legacy';

    import { createEventDispatcher } from 'svelte';
    import Dialog from '../../Dialog.svelte';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import StarIcon from '$lib/components/site/icons/StarIcon.svelte';

    const dispatch = createEventDispatcher();

    let dialog: Dialog | undefined = $state();

    export function show() {
        dialog?.show();
    }

    function onSubmit(): void {
        dialog?.close();
        dispatch('confirm', {
            value: true,
        });
    }

    function onCancelButtonClick(): void {
        dialog?.close();
    }

    function onkeydown(event: KeyboardEvent): void {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                onSubmit();
        }
    }
</script>

<Dialog bind:this={dialog} {onkeydown}>
    {#snippet content()}
        Set as thumbnail for year?
    {/snippet}
    {#snippet buttons()}
        <button onclick={onCancelButtonClick}><CancelIcon /> Cancel</button>
        <button onclick={preventDefault(onSubmit)}><StarIcon /> Set Year Thumb</button>
    {/snippet}
</Dialog>
