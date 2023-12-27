import { isAdmin } from '$lib/stores/SessionStore';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
    return {
        isAdmin: isAdmin,
    };
};
