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
  <div class="header-inputs-grid">
    <div class="input-field">
      <label for="tecnico-input">Técnico</label>
      <input id="tecnico-input" type="text" bind:value={obraForm.tecnico} placeholder="Nombre completo">
    </div>
    <div class="input-field">
      <label for="fecha-input">Fecha</label>
      <input id="fecha-input" type="date" bind:value={obraForm.fecha}>
    </div>
  </div>
</header>
