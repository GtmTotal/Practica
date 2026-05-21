<script lang="ts">
  import type { TareaState } from '$lib/services/form-initialization.svelte';
  import DatosMotor from './DatosMotor.svelte';

  let {
    tarea,
    idxTarea,
    prefijo,
    idxSeccion
  }: {
    tarea: TareaState;
    idxTarea: number;
    prefijo: string;
    idxSeccion: number;
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

<div class="inspeccion-item">
  <div class="tarea-main-row">
    <span class="tarea-indice">{ prefijo }.{ idxTarea + 1 }</span>
    <p class="tarea-texto">{ tarea.descripcion }</p>
  </div>

  <div class="inspeccion-controles">
    <label class="check-inspeccion ok" class:checked={tarea.ok}>
      <input type="checkbox" bind:checked={tarea.ok} onchange={toggleOk}>
      <span class="box-icon">✓</span>
      <span class="box-label">OK</span>
    </label>
    <label class="check-inspeccion nook" class:checked={tarea.noOk}>
      <input type="checkbox" bind:checked={tarea.noOk} onchange={toggleNoOk}>
      <span class="box-icon">✕</span>
      <span class="box-label">NO OK</span>
    </label>
  </div>

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

  .tarea-texto {
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.4;
    font-weight: 500;
    margin: 0;
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
    display: none;
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

  .tarea-extra-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px dashed var(--gray-200, #e5e7eb);
  }

  .campos-medicion-inline {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .campo-mini {
    display: flex;
    align-items: center;
    gap: 4px;
    background: white;
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: 100px;
    padding: 4px 12px;
  }

  .campo-mini input {
    width: 55px;
    border: none;
    background: transparent;
    font-size: 0.85rem;
    font-weight: 500;
    text-align: center;
    outline: none;
  }

  .mini-sufijo {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--gray-600, #4b5563);
  }

  .input-nota-tarea {
    flex: 1;
    min-width: 150px;
    padding: 10px 16px;
    border: 1px solid transparent;
    background: var(--gray-100, #f3f4f6);
    border-radius: 8px;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .input-nota-tarea:focus {
    outline: none;
    background: white;
    border-color: var(--primary, #1e3a5f);
    box-shadow: 0 4px 12px rgba(30, 60, 114, 0.08);
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
