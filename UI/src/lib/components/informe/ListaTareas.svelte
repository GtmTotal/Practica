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

  // Agrupar tareas por campo 'grupo'
  let tareasAgrupadas = $derived(() => {
    const grupos: { titulo: string | null; tareas: TareaState[] }[] = [];
    let actual: { titulo: string | null; tareas: TareaState[] } | null = null;

    for (const t of tareasArray) {
      if (t.grupo) {
        if (!actual || actual.titulo !== t.grupo) {
          actual = { titulo: t.grupo, tareas: [] };
          grupos.push(actual);
        }
        actual.tareas.push(t);
      } else {
        if (!actual || actual.titulo !== null) {
          actual = { titulo: null, tareas: [] };
          grupos.push(actual);
        }
        actual.tareas.push(t);
      }
    }
    return grupos;
  });
</script>

<div>
  {#each tareasAgrupadas() as grupo}
    {#if grupo.titulo}
      {@const grupoNum = grupo.titulo.match(/^(\d+\.\d+)/)?.[1] ?? prefijo}
      <div class="grupo-subbloque">
        <div class="grupo-titulo">{grupo.titulo}</div>
        {#each grupo.tareas as tarea, idx}
          <TareaItem {tarea} idxTarea={idx} prefijo={grupoNum} {idxSeccion} />
        {/each}
      </div>
    {:else}
      {#each grupo.tareas as tarea, idx}
        <TareaItem {tarea} idxTarea={idx} {prefijo} {idxSeccion} />
      {/each}
    {/if}
  {/each}
</div>

<style>
  .grupo-subbloque {
    background: #f0f4f8;
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 16px;
    border-left: 4px solid #3b82f6;
  }
  .grupo-titulo {
    font-weight: 800;
    font-size: 0.95rem;
    color: #1e3a5f;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #bfdbfe;
  }
</style>
