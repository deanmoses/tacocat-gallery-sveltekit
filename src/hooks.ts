//
//
// Sveltekit hooks
// See https://kit.svelte.dev/docs#hooks-handle
//
//

/**
 * Disable server side rendering (SSR)
 *
 * The handle() function is a hook built into Sveltekit.
 * It runs every time SvelteKit receives a request  
 * — whether that happens while the app is running, or during prerendering — 
 * and determines the response. 
 * 
 * It receives the request object and a function called resolve.
 * The resolve function invokes SvelteKit's router and generates a response 
 * (rendering a page, or invoking an endpoint) accordingly. 
 * 
 * This allows you to modify response headers or bodies, 
 * or bypass SvelteKit entirely 
 * (for implementing endpoints programmatically, for example).
 */
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ request, resolve }): Promise<Response> {

	const response = await resolve(request, {
		ssr: false
	});
	
	return response;
}