/**
 * Svelte action that moves an element to be a direct child of <body>.
 * Useful for dialogs/modals that need to escape parent CSS like display:none.
 */
export function portal(node: HTMLElement) {
    // Move this element from where it is in the DOM to be a child of <body>
    document.body.appendChild(node);

    return {
        destroy() {
            // When the Svelte component is destroyed, clean up the DOM node
            node.remove();
        },
    };
}
