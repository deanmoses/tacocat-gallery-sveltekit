import type { PageLoad } from './$types';
import { searchStore } from '$lib/stores/SearchStore';

export const load: PageLoad = ({ params, url }) => {
	const searchTerms = params.terms;
	const returnPath = url.searchParams.get('returnPath') ?? undefined;

	return {
		returnPath,
		searchTerms,
		search: searchStore.get(searchTerms)
	};
};
