import { redirect } from '@sveltejs/kit';

/**
 * If passed in a legacy hashtag-based URL like '#2001/12-31/felix.jpg', send
 * a Sveltekit redirect to the correct URL.  If passed in an empty / null
 * string, do nothing.
 *
 * @param hashLocation a legacy hashtag-based URL, like: #2001/12-31/felix.jpg
 */
export function redirectIfLegacyUrl(hashLocation: string) {
	if (hashLocation) {
		let newUrl = hashLocation.substring(1); // remove the '#'
		if (!newUrl.startsWith('/')) {
			newUrl = '/' + newUrl;
		}
		throw redirect(301, newUrl);
	}
}

// href="#2001 or #2001/12-31 or #2001/12-31/felix.jpg -- it's just matching the #2001 and assuming the rest is a valid path
const oldUrlFormat = /(href\s*=\s*["']\s*)#(\d{4})/gi;

/**
 * Process an album's text or photo's caption.  This can do
 * things like rewrite legacy URL formats (like #2001/12-31)
 * to the current URL format (like /2001/12-31).
 *
 * @param caption An album's text, or the caption of a photo
 * @returns processed caption
 */
export function processCaption(caption: string | undefined): string {
	return caption ? caption.replaceAll(oldUrlFormat, '$1/$2') : '';

	/**
	 * TODO: handle <a href="http://tacocat.com/pix/2002/06/03/html/jasper1.htm"
	 */
}
