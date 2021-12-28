<script context="module" lang="ts">
	export async function load({ page }) {
        const terms = page.params.terms;
        return {props: {terms}}
    }
</script>
<script lang="ts">
    export let terms;
</script>
<svelte:head>
	<title>Search For {terms}</title>
</svelte:head>
<div>search terms: {terms}</div>