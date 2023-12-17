import { redirect } from '@sveltejs/kit';

/**
 * If passed in a legacy hashtag-based URL like '#2001/12-31/felix.jpg', send
 * a Sveltekit redirect to the correct URL.  If passed in an empty string or
 * something falsey / nullish, do nothing.
 *
 * @param hashLocation a legacy hashtag-based URL, like: #2001/12-31/felix.jpg
 */
export function redirectIfLegacyUrl(hashLocation: string) {
    if (hashLocation) {
        let newUrl = hashLocation.substring(1); // remove the '#'
        if (!newUrl.startsWith('/')) {
            newUrl = '/' + newUrl;
        }
        redirect(301, newUrl);
    }
}
