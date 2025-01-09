<script lang="ts">
    import AdminPage from '$lib/components/pages/admin/AdminPage.svelte';
    import AdminPageLayout from '$lib/components/pages/admin/AdminPageLayout.svelte';
    import LoginIcon from '$lib/components/site/icons/LoginIcon.svelte';
    import { getLoginUrl } from '$lib/utils/config';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();
    let isAdmin = $derived(data.isAdmin);
</script>

<AdminPageLayout>
    {#if $isAdmin}
        <AdminPage />
    {:else}
        <p><a href={getLoginUrl()}><LoginIcon width="1.3em" height="1.3em" /> Login Here</a></p>
    {/if}
</AdminPageLayout>
