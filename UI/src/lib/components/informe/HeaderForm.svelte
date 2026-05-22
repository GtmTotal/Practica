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
  <div class="header-main-row">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="logo-container" onclick={onCerrar} style="cursor: pointer;">
      <img src="/logo3.webp" alt="Logo" class="logo-empresa">
    </div>
    <div class="header-info">
      <div class="header-title-row">
        <h1>{ centro }</h1>
        <button type="button" class="btn-back-minimal" onclick={onCerrar}>✕</button>
      </div>
      <div class="header-status-row">
        <div class="progreso-container-mini">
          <div class="progreso-bar-fill" style="width: {progreso}%"></div>
        </div>
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
      <span class="input-icon">👤</span>
      <input id="tecnico-input" type="text" bind:value={obraForm.tecnico} placeholder="Nombre completo del técnico">
    </div>
    <div class="input-field-inline">
      <span class="input-icon">📅</span>
      <input id="fecha-input" type="date" bind:value={obraForm.fecha}>
    </div>
  </div>
  {#if obraForm.tipo === 'cuadro_electrico'}
    <div class="header-inputs-inline cuadro-extra-fields">
      <div class="input-field-inline">
        <span class="input-icon">📋</span>
        <input type="text" bind:value={obraForm.nProy} placeholder="Nº Proyecto">
      </div>
      <div class="input-field-inline">
        <span class="input-icon">🔢</span>
        <input type="text" bind:value={obraForm.nOrdenCuadro} placeholder="Nº Orden Cuadro">
      </div>
      <div class="input-field-inline">
        <span class="input-icon">🔌</span>
        <input type="text" bind:value={obraForm.nOrdenInstalacion} placeholder="Nº Orden Instalación">
      </div>
    </div>
  {/if}
</header>
