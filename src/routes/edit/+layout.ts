import type { LayoutLoad } from './$types';
import { unEditUrl } from '$lib/utils/path-utils';
import { isAdmin } from '$lib/stores/SessionStore';
import { get } from 'svelte/store';

export const load: LayoutLoad = ({ url }) => {
    // if user isn't authenticated
    if (!get(isAdmin)) {
        // redirect them to the non-edit version of this page
        return {
            status: 302,
            redirect: unEditUrl(url.pathname),
        };
    } else {
        return {};
    }
};
