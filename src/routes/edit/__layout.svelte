<script context="module" lang="ts">
  import type { LoadInput, LoadOutput } from '@sveltejs/kit';
	import { unEditUrl } from '$lib/utils/path-utils';

	/** @type {import('@sveltejs/kit').Load} */
  export async function load({ url }: LoadInput): Promise<LoadOutput> {
		// if user isn't authenticated
		if (!get(isAdmin)) {
			// redirect them to the non-edit version of this page
			return {
				status: 302,
				redirect: unEditUrl(url.pathname)
			};
		}
		else {
			return {};
		}
  }
</script>

<script>
	import { isAdmin } from "$lib/stores/SessionStore";
	import { get } from 'svelte/store';
</script>

<slot />
