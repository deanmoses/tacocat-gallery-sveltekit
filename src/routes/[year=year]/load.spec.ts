import { describe, it, expect, vi } from 'vitest';
import { load } from './+page';
import { albumLoadMachine } from '$lib/stores/AlbumLoadMachine.svelte';

type LoadEvent = Parameters<typeof load>[0];

describe('year album page load', () => {
    it('fetches the album, and the root for prev/next', () => {
        const fetch = vi.spyOn(albumLoadMachine, 'fetch').mockReturnValue(undefined);

        const data = load({ params: { year: '2001' } } as LoadEvent);

        expect(data).toStrictEqual({ albumPath: '/2001/' });
        expect(fetch.mock.calls).toStrictEqual([['/2001/'], ['/']]);
    });
});
