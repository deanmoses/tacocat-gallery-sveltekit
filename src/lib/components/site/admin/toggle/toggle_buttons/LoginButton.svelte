<!--
  @component 
  
  Button to send the user to the login page
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import LoginIcon from '$lib/components/site/icons/LoginIcon.svelte';
    import ControlStripButton from '../../edit_controls/buttons/ControlStripButton.svelte';

    function onclick() {
        goto('/login');
    }
</script>

<ControlStripButton {onclick}><LoginIcon width=".9em" height=".9em" />Login</ControlStripButton>
