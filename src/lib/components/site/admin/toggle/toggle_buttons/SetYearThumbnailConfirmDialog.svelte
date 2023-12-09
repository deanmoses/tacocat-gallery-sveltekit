<!--
  @component Dialog to confirm setting year thumbnail
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Dialog from '../../Dialog.svelte';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import StarIcon from '$lib/components/site/icons/StarIcon.svelte';

    const dispatch = createEventDispatcher();

    let dialog: Dialog;

    export function show() {
        dialog.show();
    }

    function onSubmit(): void {
        dialog.close();
        dispatch('confirm', {
            value: true,
        });
    }

    function onCancelButtonClick(): void {
        dialog.close();
    }

    function onKeyPress(event: KeyboardEvent): void {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                onSubmit();
        }
    }
</script>

<Dialog bind:this={dialog} on:keydown={onKeyPress}>
    <svelte:fragment slot="content">Set as thumbnail for year?</svelte:fragment>
    <svelte:fragment slot="buttons">
        <button on:click={onCancelButtonClick}><CancelIcon /> Cancel</button>
        <button on:click|preventDefault={onSubmit}><StarIcon /> Set Year Thumb</button>
    </svelte:fragment>
</Dialog>
