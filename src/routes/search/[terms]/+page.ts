import type { PageLoad } from './$types';
import { searchStore } from "$lib/stores/SearchStore";

export const load: PageLoad = ({ params, url }) => {
	const searchTerms: string = params.terms;
	const returnPath : string = url.searchParams.get('returnPath');

	return {
		returnPath: returnPath,
		searchTerms,
		search: searchStore.get(searchTerms)
	};
}
