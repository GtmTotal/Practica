<script lang="ts">
  import type { TareaState } from '$lib/services/form-initialization.svelte';
  import TareaItem from './TareaItem.svelte';
  import TareaPadreItem from './TareaPadreItem.svelte';

  let {
    tareasArray,
    prefijo,
    idxSeccion,
    tipo
  }: {
    tareasArray: TareaState[];
    prefijo: string;
    idxSeccion: number;
    tipo: string;
  } = $props();
</script>

<div>
  {#each tareasArray as tarea, idx}
    {#if tarea.subtareas?.length}
      <TareaPadreItem 
        bind:tarea={tareasArray[idx]}
        idxTarea={idx} 
        {prefijo} 
        {idxSeccion} 
        {tipo} 
        mostrarTitulo={!!tarea.titulo && (idx === 0 || tareasArray[idx - 1].titulo !== tarea.titulo)} 
      />
    {:else}
      <TareaItem 
        bind:tarea={tareasArray[idx]}
        idxTarea={idx} 
        {prefijo} 
        {idxSeccion} 
        tipo={tipo} 
        mostrarTitulo={!!tarea.titulo && (idx === 0 || tareasArray[idx - 1].titulo !== tarea.titulo)} 
      />
    {/if}
  {/each}
</div>
