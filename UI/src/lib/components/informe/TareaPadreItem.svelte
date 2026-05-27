<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { TareaState } from '$lib/services/form-initialization.svelte';
  import SubTareaItem from './SubTareaItem.svelte';
  import './tarea-shared.css';

  let {
    tarea,
    idxTarea,
    prefijo,
    idxSeccion,
    tipo,
    mostrarTitulo = true
  }: {
    tarea: TareaState;
    idxTarea: number;
    prefijo: string;
    idxSeccion: number;
    tipo: string;
    mostrarTitulo?: boolean;
  } = $props();

  let expanded = $state(true);

  function toggleExpand() {
    expanded = !expanded;
  }

  function progresoSubtareas(t: TareaState): number {
    const sts = t.subtareas || [];
    if (sts.length === 0) return 0;
    const hechas = sts.filter(st => st.ok || st.noOk).length;
    return Math.round((hechas / sts.length) * 100);
  }

  function toggleOk() {
    if (tarea.ok) {
      tarea.noOk = false;
    }
  }

  function toggleNoOk() {
    if (tarea.noOk) {
      tarea.ok = false;
    }
  }
</script>

<div class="tarea-padre-item" class:notice-item={!tarea.indice && tarea.sinCheck}>
  {#if tarea.titulo && mostrarTitulo}
    <div class="tarea-header-titulo">{ tarea.titulo }</div>
  {/if}
  <div class="padre-header" onclick={toggleExpand} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(); } }}>
    <span class="chevron" class:chevron-open={expanded}>▶</span>
    {#if tarea.indice}
      <span class="padre-indice">{ tarea.indice }</span>
    {/if}
    <p class="padre-descripcion">{ tarea.descripcion }</p>
    


    <div class="padre-progress-dots">
      {#each tarea.subtareas || [] as st}
        <span
          class="progress-dot"
          class:dot-ok={st.ok}
          class:dot-revisar={st.noOk}
          class:dot-pending={!st.ok && !st.noOk}
          title="{st.descripcion}: {st.ok ? 'OK' : st.noOk ? 'REVISAR' : 'Pendiente'}"
        ></span>
      {/each}
    </div>
    <span class="padre-progress-pct">{ progresoSubtareas(tarea) }%</span>
  </div>

  {#if expanded && tarea.subtareas?.length}
    <div class="subtareas-container" transition:slide>
      {#each tarea.subtareas as st, stIdx}
        <SubTareaItem
          bind:subtarea={tarea.subtareas[stIdx]}
          indiceCompleto={tarea.indice ? `${tarea.indice}.${stIdx + 1}` : `${prefijo}.${idxTarea + 1}.${stIdx + 1}`}
        />
      {/each}
    </div>
  {/if}

  <div class="tarea-extra-row">
    <input type="text" bind:value={tarea.notaTarea} placeholder="Notas/Observaciones..." class="input-nota-tarea">
  </div>
</div>

{#if tarea.campos?.length}
  <div class="tarea-extra-row">
    {#each tarea.campos as campo}
      <div class="campo-mini">
        <input type="number" bind:value={campo.valor} placeholder={campo.sufijo}>
        <span class="mini-sufijo">{ campo.sufijo }</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .tarea-padre-item {
    background: #f9fafb;
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 16px;
    border: 1px solid #e5e7eb;
  }

  .tarea-padre-item:hover {
    background: white;
    border-color: #d1d5db;
  }

  .tarea-padre-item.notice-item {
    background: #f1f5f9;
    border-left: 4px solid var(--primary, #1e3a5f);
  }


  .padre-header {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    flex-wrap: wrap;
  }

  .chevron {
    font-size: 0.7rem;
    color: #94a3b8;
    transition: transform 0.2s;
    flex-shrink: 0;
    width: 16px;
    text-align: center;
  }

  .chevron-open {
    transform: rotate(90deg);
  }

  .padre-indice {
    font-weight: 800;
    color: #1e3a5f;
    background: rgba(30, 60, 114, 0.1);
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 0.8rem;
    min-width: 48px;
    text-align: center;
    flex-shrink: 0;
  }

  .padre-descripcion {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
    line-height: 1.4;
    min-width: 150px;
  }



  .padre-progress-dots {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-shrink: 0;
  }

  .progress-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    transition: all 0.2s;
  }

  .dot-ok {
    background: #059669;
  }

  .dot-revisar {
    background: #d97706;
  }

  .dot-pending {
    background: #cbd5e1;
  }

  .padre-progress-pct {
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    flex-shrink: 0;
    min-width: 36px;
    text-align: right;
  }

  .subtareas-container {
    margin-top: 12px;
    padding-top: 4px;
  }





</style>