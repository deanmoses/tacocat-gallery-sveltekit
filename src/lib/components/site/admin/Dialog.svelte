<!--
  @component Base dialog component that other components extend
-->
<script lang="ts">
    let dialog: HTMLDialogElement;

    export function show(): void {
        dialog.showModal();
    }

    export function close(): void {
        dialog.close();
    }

    /** Close dialog when user clicks outside it */
    function onClick(e: MouseEvent): void {
        if (e.target != dialog) return;
        const rect = dialog.getBoundingClientRect();
        const clickIsOutsideDialog =
            e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
        if (clickIsOutsideDialog) {
            dialog.close();
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog bind:this={dialog} on:click={onClick}>
    <form method="dialog" on:keydown>
        <p>
            <slot name="content" />
        </p>
        <menu>
            <slot name="buttons" />
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
</style>
