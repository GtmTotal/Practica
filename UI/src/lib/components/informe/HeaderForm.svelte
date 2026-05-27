<script lang="ts">
  import type { FormState } from '$lib/services/form-initialization.svelte';
  import './header-form.css';

  let {
    centro,
    progreso,
    estadoAutoguardado,
    obraForm,
    onCerrar
  }: {
    centro: string;
    progreso: number;
    estadoAutoguardado: 'ocioso' | 'guardado' | 'guardando' | 'error';
    obraForm: FormState;
    onCerrar: () => void;
  } = $props();

</script>

<header class="form-header">
  <div class="progreso-container-mini">
    <div class="progreso-bar-fill" style="width: {progreso}%"></div>
  </div>
  <div class="header-main-row">
    <div
      class="logo-container"
      role="button"
      tabindex="0"
      onclick={onCerrar}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCerrar(); } }}
      style="cursor: pointer;">
      <img src="/logo3.webp" alt="Logo" class="logo-empresa">
    </div>
    <div class="header-info">
      <div class="header-title-row">
        <h1>{ centro }</h1>
        <button type="button" class="btn-back-minimal" onclick={onCerrar}>✕</button>
      </div>
      <div class="header-status-row">
        <div class="auto-save-status" data-status={estadoAutoguardado}>
          {#if estadoAutoguardado === 'guardando'}
            <span class="icon-spin">⌛</span> Guardando...
          {:else if estadoAutoguardado === 'guardado'}
            <span>✓ Cambios guardados</span>
          {:else if estadoAutoguardado === 'error'}
            <span>❌ Error al guardar</span>
          {/if}
        </div>
      </div>
    </div>
  </div>
  <div class="header-inputs-inline">
    <div class="input-field-inline">
      <span class="input-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Técnico"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </span>
      <input id="tecnico-input" type="text" bind:value={obraForm.tecnico} placeholder="Nombre completo del técnico">
    </div>
    <div class="input-field-inline">
      <span class="input-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Fecha"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </span>
      <input id="fecha-input" type="date" bind:value={obraForm.fecha}>
    </div>
  </div>
  {#if obraForm.tipo === 'cuadro_electrico'}
    <div class="header-inputs-inline cuadro-extra-fields">
       <div class="input-field-inline">
         <span class="input-icon">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Proyecto"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
         </span>
         <input type="text" bind:value={obraForm.nProy} placeholder="Nº Proyecto">
       </div>
       <div class="input-field-inline">
         <span class="input-icon">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Orden Cuadro"><rect width="16" height="16" x="4" y="4" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
         </span>
         <input type="text" bind:value={obraForm.nOrdenCuadro} placeholder="Nº Orden Cuadro">
       </div>
       <div class="input-field-inline">
         <span class="input-icon">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Instalación"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
         </span>
         <input type="text" bind:value={obraForm.nOrdenInstalacion} placeholder="Nº Orden Instalación">
       </div>
    </div>
  {/if}
</header>
