import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { Locator } from 'vitest/browser';
import Thumbnail from './Thumbnail.svelte';

/**
 * A play overlay is gated on the thumbnail image having fired `load`, so that it
 * is never drawn over a broken or not-yet-arrived image. Only a real browser
 * fetches an <img> and fires that event, and only a real browser runs the
 * `$effect` that resets the gate, which is why these run in the browser project.
 */
const LOADABLE_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const BROKEN_IMAGE = 'data:image/gif;base64,not-a-gif';

/** An overlay is absent before the image settles as well as after, so absence only means something once it has. */
async function settles(image: Locator): Promise<void> {
    const img = image.element() as HTMLImageElement;
    await vi.waitFor(() => expect(img.complete).toBe(true));
}

describe(Thumbnail, () => {
    it('shows a play overlay once a video thumbnail has loaded', async () => {
        const screen = await render(Thumbnail, { src: LOADABLE_IMAGE, isVideo: true });

        await expect.element(screen.getByTestId('play-overlay')).toBeVisible();
    });

    it('leaves the play overlay off a video whose thumbnail fails to load', async () => {
        const screen = await render(Thumbnail, { src: BROKEN_IMAGE, isVideo: true });

        await settles(screen.getByTestId('thumbnail-image'));

        await expect.element(screen.getByTestId('play-overlay')).not.toBeInTheDocument();
    });

    /**
     * Rendered as a video first, so the overlay coming up proves the image's
     * `load` handler has run before the flag flips. Rendered as a still from
     * the start, the overlay is absent before the image loads as well as after,
     * and `complete` turns true before the handler runs, so its absence would
     * prove nothing.
     */
    it('takes the play overlay down when the thumbnail stops being a video', async () => {
        const screen = await render(Thumbnail, { src: LOADABLE_IMAGE, isVideo: true });

        await expect.element(screen.getByTestId('play-overlay')).toBeVisible();

        await screen.rerender({ src: LOADABLE_IMAGE, isVideo: false });

        await expect.element(screen.getByTestId('play-overlay')).not.toBeInTheDocument();
    });

    /**
     * The replacement is a broken image on purpose. A loadable one would fire
     * `load` again, and the overlay could be back up before the assertion saw
     * it down, so the reset could not be told apart from the reload. Broken, the
     * only thing that can take the overlay down is the reset.
     */
    it('takes the play overlay back down when the thumbnail is replaced', async () => {
        const screen = await render(Thumbnail, { src: LOADABLE_IMAGE, isVideo: true });

        await expect.element(screen.getByTestId('play-overlay')).toBeVisible();

        await screen.rerender({ src: BROKEN_IMAGE, isVideo: true });

        await expect.element(screen.getByTestId('play-overlay')).not.toBeInTheDocument();
    });
});
