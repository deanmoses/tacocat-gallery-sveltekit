import { describe, it, expect } from 'vitest';
import { albumUrl, searchUrl } from './config';

/**
 * The API is reached on the site's own domain, so every API URL is a path.
 * A host here would make the API cross-origin, with CORS and credentials to
 * get right, and would bypass the edge cache in front of /api/.
 */
describe('API URLs', () => {
    it.each([
        { url: albumUrl('/'), path: '/api/album/' },
        { url: albumUrl('/2001/12-31/'), path: '/api/album/2001/12-31' },
        { url: searchUrl({ terms: 'cat' }, 0, 10), path: '/api/search/cat' },
    ])('$path is on this origin', ({ url, path }) => {
        expect(url.startsWith(path)).toBe(true);
    });
});
