<script lang="ts">
  import type { SeccionState } from '$lib/services/domain/form-initialization.svelte';
  import { progresoPorSeccion } from '$lib/utils/informe-utils';

  let {
    secciones,
    seccionActiva,
    onSeleccionar
  }: {
    secciones: SeccionState[];
    seccionActiva: number;
    onSeleccionar: (idx: number) => void;
  } = $props();

  function estadoSeccion(sec: SeccionState): 'completa' | 'pendiente' {
    const { total, completadas } = progresoPorSeccion(sec);
    if (total > 0 && completadas === total) return 'completa';
    return 'pendiente';
  }

  function handleSelectChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onSeleccionar(Number(target.value));
  }
</script>

<!-- Mobile: horizontal chip bar -->
<div class="stepper-bar stepper-bar--mobile" role="tablist" aria-label="Secciones del cuadro eléctrico">
  {#each secciones as seccion, idx}
    {@const estado = estadoSeccion(seccion)}
    {@const isActiva = idx === seccionActiva}
    <button
      type="button"
      class="step-chip"
      class:step-chip--completa={estado === 'completa'}
      class:step-chip--activa={isActiva}
      class:step-chip--pendiente={estado === 'pendiente' && !isActiva}
      onclick={() => onSeleccionar(idx)}
      role="tab"
      aria-selected={isActiva}
      title={seccion.titulo}
    >
      {#if estado === 'completa'}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      {/if}
      <span class="step-chip-text">{seccion.titulo}</span>
    </button>
  {/each}
</div>

<!-- Desktop: dropdown select -->
<div class="stepper-dropdown stepper-dropdown--desktop">
  <label for="seccion-select" class="dropdown-label">Sección:</label>
  <div class="dropdown-wrap">
    <select
      id="seccion-select"
      class="dropdown-select"
      value={seccionActiva}
      onchange={handleSelectChange}
    >
      {#each secciones as seccion, idx}
        {@const estado = estadoSeccion(seccion)}
        <option value={idx}>
          {estado === 'completa' ? '✓ ' : ''}{seccion.titulo}
        </option>
      {/each}
    </select>
    <span class="dropdown-arrow" aria-hidden="true">▼</span>
  </div>
</div>

<style>
  /* Mobile chip bar */
  .stepper-bar {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 10px 16px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    scrollbar-width: none;
    -ms-overflow-style: none;
    flex-wrap: nowrap;
  }
  .stepper-bar::-webkit-scrollbar {
    display: none;
  }

  .step-chip {
    height: 32px;
    min-width: 60px;
    max-width: 220px;
    border-radius: 999px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0 14px;
    line-height: 1;
  }

  .step-chip-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }

  .step-chip:hover {
    border-color: #cbd5e1;
    background: #f1f5f9;
    color: #0f172a;
  }

  .step-chip--activa {
    background: #1e3a5f;
    border-color: #1e3a5f;
    color: #ffffff;
  }

  .step-chip--activa:hover {
    background: #162d4a;
    color: #ffffff;
  }

  .step-chip--completa {
    background: #334155;
    border-color: #334155;
    color: white;
  }

  .step-chip--completa:hover {
    background: #1e293b;
    color: white;
  }

  .step-chip--pendiente {
    background: #f8fafc;
  }

  /* Desktop dropdown */
  .stepper-dropdown {
    display: none;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
  }

  .dropdown-label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
  }

  .dropdown-wrap {
    position: relative;
    flex: 1;
    max-width: 480px;
  }

  .dropdown-select {
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 32px 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
    transition: border-color 0.2s ease;
  }

  .dropdown-select:focus {
    outline: none;
    border-color: #1e3a5f;
    box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.08);
  }

  .dropdown-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    color: #64748b;
    pointer-events: none;
  }

  @media (min-width: 769px) {
    .stepper-bar--mobile {
      display: none;
    }
    .stepper-dropdown--desktop {
      display: flex;
    }
  }
</style>
