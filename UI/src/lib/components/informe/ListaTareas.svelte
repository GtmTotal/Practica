<script lang="ts">
  import type { TareaState } from '$lib/services/form-initialization.svelte';
  import TareaItem from './TareaItem.svelte';

  let {
    tareasArray,
    prefijo,
    idxSeccion
  }: {
    tareasArray: TareaState[];
    prefijo: string;
    idxSeccion: number;
  } = $props();
</script>

<div>
  {#each tareasArray as tarea, idx}
    <TareaItem {tarea} idxTarea={idx} {prefijo} {idxSeccion} />
  {/each}
</div>
