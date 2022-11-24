/** @type {import('@sveltejs/kit').ParamMatcher} */
export function match(param) {
	return /^\d\d-\d\d$/.test(param);
}
