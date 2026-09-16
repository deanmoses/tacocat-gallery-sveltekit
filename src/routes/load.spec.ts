import { describe, it, expect, afterEach, vi } from 'vitest';
import { load } from './+page';
import { albumLoadMachine } from '$lib/stores/AlbumLoadMachine.svelte';

type LoadEvent = Parameters<typeof load>[0];

describe('root album page load', () => {
    afterEach(() => vi.useRealTimers());

    // The current year is fetched as well: the latest-album thumbnail is its newest child
    it('fetches the root album and the current year', () => {
        vi.useFakeTimers({ now: new Date(2001, 5, 15) });
        const fetch = vi.spyOn(albumLoadMachine, 'fetch').mockReturnValue(undefined);

        const data = load({} as LoadEvent);

        expect(data).toStrictEqual({ pathToRootAlbum: '/' });
        expect(fetch.mock.calls).toStrictEqual([['/'], ['/2001/']]);
    });
});
