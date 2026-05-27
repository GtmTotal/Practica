<script lang="ts">
  import type { TareaState } from '$lib/services/form-initialization.svelte';
  import DatosMotor from './DatosMotor.svelte';
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

<div class="inspeccion-item" class:notice-item={!tarea.indice && tarea.sinCheck}>
  {#if tarea.titulo && mostrarTitulo}
    <div class="tarea-header-titulo">{ tarea.titulo }</div>
  {/if}
  <div class="tarea-main-row">
    {#if tarea.indice}
      <span class="tarea-indice">{ tarea.indice }</span>
    {/if}
    <div class="tarea-texto-wrapper">
      {#if tarea.titulo && mostrarTitulo}
        <p class="tarea-subtitulo">{ tarea.descripcion }</p>
      {:else}
        <p class="tarea-texto" class:is-notice={!tarea.indice && tarea.sinCheck}>{ tarea.descripcion }</p>
      {/if}
    </div>
  </div>

  {#if !tarea.sinCheck}
    <div class="inspeccion-controles">
       <label class="check-inspeccion ok" class:checked={tarea.ok}>
         <input type="checkbox" bind:checked={tarea.ok} onchange={toggleOk} aria-label="OK">
         <span class="box-icon">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Check"><polyline points="20 6 9 17 4 12"/></svg>
         </span>
         <span class="box-label">OK</span>
       </label>
       <label class="check-inspeccion nook" class:checked={tarea.noOk}>
         <input type="checkbox" bind:checked={tarea.noOk} onchange={toggleNoOk} aria-label="NO OK">
         <span class="box-icon">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Warning"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
         </span>
         <span class="box-label">{#if tipo === 'cuadro_electrico'}REVISAR{:else}NO OK{/if}</span>
       </label>
    </div>
  {/if}

  <div class="tarea-extra-row">
    <div class="campos-medicion-inline">
      {#each tarea.campos as campo, idx (idx)}
        <div class="campo-mini">
          <input type="number" bind:value={campo.valor} placeholder={campo.sufijo}>
          <span class="mini-sufijo">{ campo.sufijo }</span>
        </div>
      {/each}
    </div>
    <input type="text" bind:value={tarea.notaTarea} placeholder="Notas/Observaciones..." class="input-nota-tarea">
  </div>

  {#if tarea.bombasQuimicas && tarea.bombasQuimicas.length > 0}
    <DatosMotor bombas={tarea.bombasQuimicas} />
  {/if}
</div>

<style>
  .inspeccion-item {
    background: var(--gray-50, #f9fafb);
    border-radius: var(--radius-md, 12px);
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid var(--gray-200, #e5e7eb);
  }

  .inspeccion-item:hover {
    background: white;
    border-color: var(--gray-300, #d1d5db);
  }

  .inspeccion-item.notice-item {
    background: #f1f5f9;
    border-left: 4px solid var(--primary, #1e3a5f);
  }

  .tarea-main-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .tarea-indice {
    font-weight: 800;
    color: var(--primary, #1e3a5f);
    background: rgba(30, 60, 114, 0.1);
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 0.8rem;
    min-width: 48px;
    text-align: center;
  }

  .tarea-texto-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }


  .tarea-subtitulo {
    font-size: 0.85rem;
    line-height: 1.3;
    font-weight: 400;
    margin: 0;
    color: #475569;
  }

  .tarea-texto {
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.4;
    font-weight: 400;
    margin: 0;
  }

  .tarea-texto.is-notice {
    font-weight: 700;
    color: var(--primary, #1e3a5f);
    font-size: 0.85rem;
  }

  .inspeccion-controles {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 10px;
    margin-bottom: 10px;
  }



  .check-inspeccion {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    background: var(--gray-100, #f3f4f6);
    padding: 8px 16px;
    border-radius: 100px;
    border: 1px solid transparent;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--gray-600);
  }

  .check-inspeccion:hover {
    background: var(--gray-200);
  }

  .check-inspeccion input {
    opacity: 0;
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .box-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .box-icon {
    font-weight: 800;
  }

  .check-inspeccion.ok.checked {
    background: var(--success, #059669);
    color: white;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
  }

  .check-inspeccion.nook.checked {
    background: var(--danger, #dc2626);
    color: white;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
  }


  .campos-medicion-inline {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }



  @media (max-width: 600px) {
    .tarea-main-row {
      flex-direction: row;
      align-items: center;
    }

    .inspeccion-controles {
      justify-content: center;
      margin-top: 12px;
      margin-bottom: 8px;
    }
  }
</style>
