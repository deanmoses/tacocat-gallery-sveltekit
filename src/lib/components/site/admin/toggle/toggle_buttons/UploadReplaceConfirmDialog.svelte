<!--
  @component Dialog to ask user whether they want to overwrite files
-->
<script lang="ts">
    import CancelIcon from '$lib/components/site/icons/CancelIcon.svelte';
    import { createEventDispatcher } from 'svelte';
    import UploadIcon from '$lib/components/site/icons/UploadIcon.svelte';
    const dispatch = createEventDispatcher();

    let dialog: HTMLDialogElement;
    let filesAlreadyInAlbum: string[] = [];
    $: filesAlreadyInAlbum = filesAlreadyInAlbum;
    $: filez = filesAlreadyInAlbum.join(', ');

    export function show(f: string[]): void {
        filesAlreadyInAlbum = f;
        dialog.showModal();
    }

    async function onSubmit(): Promise<void> {
        dialog.close();
        filesAlreadyInAlbum = [];
        dispatch('dialogConfirm', {
            value: true,
        });
    }

    function onCancelButtonClick(): void {
        dialog.close();
        filesAlreadyInAlbum = [];
    }

    async function onKeyPress(event: KeyboardEvent): Promise<void> {
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                await onSubmit();
        }
    }
</script>

<dialog bind:this={dialog}>
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <form method="dialog" on:keydown={onKeyPress}>
        <p>Already in album: {filez}</p>
        <menu>
            <button on:click={onCancelButtonClick}><CancelIcon /> Cancel</button>
            <button on:click|preventDefault={onSubmit}><UploadIcon /> Overwrite</button>
        </menu>
    </form>
</dialog>

<style>
    dialog::backdrop {
        background-image: linear-gradient(45deg, magenta, rebeccapurple, dodgerblue, green);
        opacity: 0.75;
    }
    dialog {
        border: none;
        box-shadow: #00000029 2px 2px 5px 2px;
        border-radius: 8px;
        padding: 0.5em;
        background-color: rgb(143, 143, 143);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    p {
        text-align: center;
    }
    menu {
        display: flex;
        justify-content: flex-end;
    }
    button {
        margin-left: var(--default-padding);
    }
</style>
