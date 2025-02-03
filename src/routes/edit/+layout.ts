import type { LayoutLoad } from './$types';
import { unEditUrl } from '$lib/utils/path-utils';
import { sessionStore } from '$lib/stores/SessionStore.svelte';

export const load: LayoutLoad = ({ url }) => {
    // if user isn't authenticated
    if (!sessionStore.isAdmin) {
        // redirect them to the non-edit version of this page
        return {
            status: 302,
            redirect: unEditUrl(url.pathname),
        };
    } else {
        return {};
    }
};
