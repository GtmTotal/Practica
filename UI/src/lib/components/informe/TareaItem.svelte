<script lang="ts">
  import type { TareaState } from '$lib/services/domain/form-initialization.svelte';
  import DatosMotor from './DatosMotor.svelte';
  import { tecnicosService } from '$lib/services/stores/tecnicos';
 
  let {
    tarea = $bindable(),
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

<div class="inspeccion-item inspeccion-item--cuadro" class:notice-item={!tarea.indice && tarea.sinCheck}>
  {#if tarea.titulo && mostrarTitulo}
    <div class="tarea-header-titulo tarea-header-titulo--cuadro">{ tarea.titulo }</div>
  {/if}
  <div class="tarea-main-row tarea-main-row--cuadro">
    {#if tarea.indice}
      <span class="tarea-indice tarea-indice--cuadro">{ tarea.indice }</span>
    {/if}
    <div class="tarea-texto-wrapper">
      {#if tarea.titulo && mostrarTitulo}
        <p class="tarea-subtitulo tarea-subtitulo--cuadro">{ tarea.descripcion }</p>
      {:else}
        <p class="tarea-texto tarea-texto--cuadro" class:is-notice={!tarea.indice && tarea.sinCheck}>{ tarea.descripcion }</p>
      {/if}
    </div>
  </div>

  {#if !tarea.sinCheck}
   <div class="inspeccion-controles inspeccion-controles--cuadro">
        <div class="tecnico-selector">
          <select bind:value={tarea.tecnico} aria-label="Asignar técnico">
            <option value="">Técnico...</option>
            {#each tecnicosService.lista as tecnico}
              <option value={tecnico}>{tecnico}</option>
            {/each}
          </select>
        </div>
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

  <div class="tarea-extra-row tarea-extra-row--cuadro">
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

  .inspeccion-item--cuadro {
    background: transparent;
    border: none;
    border-bottom: 1px solid #f1f5f9;
    border-radius: 0;
    padding: 12px 16px;
    margin-bottom: 0;
  }
  .inspeccion-item--cuadro:hover {
    background: transparent;
    border-color: #e2e8f0;
  }

  .inspeccion-item.notice-item {
    background: #f1f5f9;
    border-left: 4px solid var(--primary, #1e3a5f);
  }

  .inspeccion-item--cuadro.notice-item {
    background: #f8fafc;
    border-left: 3px solid #1e293b;
    border-bottom: 1px solid #f1f5f9;
  }

  .tarea-main-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .tarea-main-row--cuadro {
    align-items: center;
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

  .tarea-indice--cuadro {
    background: transparent;
    color: #94a3b8;
    padding: 0;
    min-width: auto;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .tarea-texto-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    overflow-wrap: break-word;
  }

  .tarea-subtitulo {
    font-size: 0.85rem;
    line-height: 1.3;
    font-weight: 400;
    margin: 0;
    color: #475569;
    overflow-wrap: break-word;
  }

  .tarea-subtitulo--cuadro {
    font-size: 0.85rem;
    color: #334155;
  }

  .tarea-texto {
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.4;
    font-weight: 400;
    margin: 0;
    overflow-wrap: break-word;
  }

  .tarea-texto--cuadro {
    font-size: 0.85rem;
    color: #334155;
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

  .inspeccion-controles--cuadro {
    margin-top: 8px;
    margin-bottom: 0;
    justify-content: flex-end;
    gap: 12px;
  }

  .tecnico-selector {
    display: flex;
    align-items: center;
    margin-right: 8px;
  }

  .tecnico-selector select {
    font-size: 0.75rem;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid var(--gray-200);
    background: white;
    color: var(--gray-600);
    outline: none;
    cursor: pointer;
  }

  .tecnico-selector select:focus {
    border-color: var(--primary);
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

    .inspeccion-controles--cuadro {
      justify-content: flex-end;
    }

    .inspeccion-item--cuadro {
      padding: 10px 12px;
    }

    .check-inspeccion {
      padding: 6px 12px;
    }
  }

  .tarea-header-titulo {
    font-size: 0.85rem;
    font-weight: 700;
    color: #1e293b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .tarea-header-titulo--cuadro {
    margin-bottom: 4px;
    font-size: 0.8rem;
    color: #64748b;
  }

  .tarea-extra-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--gray-200, #e5e7eb);
  }

  .tarea-extra-row--cuadro {
    margin-top: 8px;
    padding-top: 8px;
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
</style>
