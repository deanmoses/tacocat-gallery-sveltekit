<!--
  @component 
  
  An icon representing the concept of "go back to the last thing"
-->
<script lang="ts">
    import Icon from './Icon.svelte';

    interface Props {
        title?: string;
    }

    let { title = undefined }: Props = $props();

    const d =
        'M578 0q118 0 225 45.5t184.5 123 123 184.5 45.5 225-45.5 225-123 184.5-184.5 123-225 45.5-225-45.5-184.5-123T45.5 803 0 578t45.5-225 123-184.5T353 45.5 578 0zm-39 323L264 546q-16 13-16 32t16 32l275 223q16 13 27.5 8t11.5-26V678h275q10 0 17.5-7.5T878 653V503q0-10-7.5-17.5T853 478H578V341q0-21-11.5-26t-27.5 8z';
    const viewBox = '0 0 1156 1156';
</script>

<Icon {viewBox} {title} {d} />
