<!--
    @component Page containing gallery administration functionality
-->
<script>
    import ResetRedisButton from '$lib/components/site/admin/admin_controls/ResetRedisButton.svelte';
</script>

<section>
    <h2 style="display:none">Administer Gallery</h2>
    <ResetRedisButton />
</section>

<style>
    section {
        background-color: white;
        padding: var(--default-padding);
    }
</style>
