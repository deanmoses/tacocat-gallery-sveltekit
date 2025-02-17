<!--
  @component 
  
  Dialog to confirm setting year thumbnail
-->
<script lang="ts">
    import Dialog from '../../Dialog.svelte';
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import StarIcon from '$lib/components/site/icons/StarIcon.svelte';

    interface Props {
        /** Callback to be called when the user confirms */
        onConfirm?: () => void;
    }

    let { onConfirm }: Props = $props();

    let dialog = $state() as Dialog;

    export function show() {
        dialog.show();
    }

    function onSubmit(e?: Event): void {
        e?.preventDefault();
        dialog.close();
        if (onConfirm) onConfirm();
    }

    function onCancelButtonClick(): void {
        dialog.close();
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
        <button onclick={onSubmit}><StarIcon /> Set Year Thumb</button>
    {/snippet}
</Dialog>
