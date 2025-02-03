import { isAdmin } from '$lib/stores/SessionStore.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
    return {
        isAdmin: isAdmin,
    };
};
