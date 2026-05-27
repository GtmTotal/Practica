<script lang="ts">
  import '../app.css';
  import Toast from '$lib/components/Toast.svelte';
  import Dialog from '$lib/components/Dialog.svelte';
  import { navService } from '$lib/services/stores/navigation.svelte';

  let { children } = $props();

  $effect(() => {
    navService.persist();
  });
</script>

{@render children()}

<Toast />
<Dialog />
