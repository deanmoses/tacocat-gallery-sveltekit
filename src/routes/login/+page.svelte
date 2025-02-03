<script lang="ts">
    import BlankSearchPageLayout from '$lib/components/pages/search/BlankSearchPageLayout.svelte';
    import LoginIcon from '$lib/components/site/icons/LoginIcon.svelte';
    import LogoutIcon from '$lib/components/site/icons/LogoutIcon.svelte';
    import { getLoginUrl, getLogoutUrl } from '$lib/utils/config';
    import { sessionStore } from '$lib/stores/SessionStore.svelte';

    let isAdmin = $derived(sessionStore.isAdmin);
</script>

<BlankSearchPageLayout searchTerms="" returnPath="/" title={isAdmin ? 'Logout' : 'Login'}>
    {#if isAdmin}
        <p>You're logged in</p>
        <p><a href={getLogoutUrl()}><LogoutIcon width="1.4em" height="1.3em" /> Logout</a></p>
    {:else}
        <p><a href={getLoginUrl()}><LoginIcon width="1.3em" height="1.3em" /> Login Here</a></p>
    {/if}
</BlankSearchPageLayout>
