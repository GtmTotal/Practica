<script lang="ts">
  import { page } from '$app/stores';
  import InformePage from '$lib/components/informe/InformePage.svelte';

  let cuatrimestre = $derived($page.params.cuatrimestre);
  let centro = $derived($page.params.centro);
</script>

<InformePage {cuatrimestre} {centro} />
