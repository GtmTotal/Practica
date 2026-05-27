<script lang="ts">
  import type { FormState } from '$lib/services/domain/form-initialization.svelte';

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
      <input id="tecnico-input" type="text" bind:value={obraForm.tecnico} placeholder="Nombre completo del técnico" aria-label="Nombre completo del técnico">
    </div>
    <div class="input-field-inline">
      <span class="input-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Fecha"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </span>
      <input id="fecha-input" type="date" bind:value={obraForm.fecha} aria-label="Fecha de la inspección">
    </div>
  </div>
  {#if obraForm.tipo === 'cuadro_electrico'}
    <div class="header-inputs-inline cuadro-extra-fields">
       <div class="input-field-inline">
         <span class="input-icon">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Proyecto"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
         </span>
         <input type="text" bind:value={obraForm.nProy} placeholder="Nº Proyecto" aria-label="Número de proyecto">
       </div>
       <div class="input-field-inline">
         <span class="input-icon">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Orden Cuadro"><rect width="16" height="16" x="4" y="4" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
         </span>
         <input type="text" bind:value={obraForm.nOrdenCuadro} placeholder="Nº Orden Cuadro" aria-label="Número de orden del cuadro">
       </div>
       <div class="input-field-inline">
         <span class="input-icon">
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Instalación"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
         </span>
         <input type="text" bind:value={obraForm.nOrdenInstalacion} placeholder="Nº Orden Instalación" aria-label="Número de orden de instalación">
       </div>
    </div>
  {/if}
</header>

<style>
.form-header {
  background: white;
  padding: 24px 20px 12px;
  border-bottom: 1px solid var(--gray-200);
  width: 100%;
  margin-bottom: 20px;
}

.header-main-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 10px;
}

.logo-empresa {
  height: 36px;
  width: auto;
  display: block;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2px;
}

.header-info h1 {
  margin: 0;
  font-size: 1.3rem;
  line-height: 1;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

.btn-back-minimal {
  background: var(--gray-100);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  color: var(--gray-600);
  font-weight: bold;
  font-size: 1rem;
}

.btn-back-minimal:hover {
  background: var(--gray-200);
  transform: scale(1.05);
}

.progreso-container-mini {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: 7px;
  background: rgba(226, 232, 240, 0.9);
  z-index: 100;
  box-shadow: inset 0 -1px 0 rgba(15, 23, 42, 0.08);
}

.progreso-bar-fill {
  background: linear-gradient(90deg, var(--primary), var(--success), #34d399);
  height: 100%;
  width: 0%;
  transition: width 0.3s ease;
  border-radius: 0 999px 999px 0;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
}

.header-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.auto-save-status {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
  min-width: 120px;
}

.auto-save-status[data-status="ocioso"] {
  opacity: 0;
  pointer-events: none;
}

.auto-save-status[data-status="guardando"] {
  color: var(--primary);
  opacity: 1;
}

.auto-save-status[data-status="guardado"] {
  color: var(--success);
  opacity: 1;
}

.auto-save-status[data-status="error"] {
  color: var(--danger);
  opacity: 1;
}

.icon-spin {
  display: inline-block;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.header-inputs-inline {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--gray-100);
}

.input-field-inline {
  display: flex;
  align-items: center;
  background: var(--gray-50);
  border-radius: 8px;
  padding: 4px 12px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.input-field-inline:focus-within {
  background: white;
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(30, 60, 114, 0.08);
}

.input-icon {
  font-size: 14px;
  margin-right: 8px;
  opacity: 0.6;
}

.input-field-inline input {
  border: none;
  background: transparent;
  height: 32px;
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-800);
  outline: none;
  width: 100%;
}

.input-field-inline input::placeholder {
  color: var(--gray-400);
}

.input-field-inline input[type="date"] {
  font-family: inherit;
  color: var(--gray-700);
}

.cuadro-extra-fields {
  border-top: 1px dashed var(--gray-200);
  margin-top: 8px;
  padding-top: 12px;
}

@media (max-width: 600px) {
  .form-header {
    padding: 8px 12px;
  }

  .header-main-row {
    margin-bottom: 8px;
    gap: 8px;
  }

  .logo-empresa {
    height: 32px;
  }

  .header-info h1 {
    font-size: 1.1rem;
  }

  .progreso-container-mini {
    height: 8px;
  }

  .header-inputs-inline {
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
    padding-top: 8px;
  }

  .input-field-inline {
    width: 100%;
  }

  .header-status-row {
    margin-top: 2px;
  }

  .auto-save-status {
    font-size: 0.7rem;
    min-width: 100px;
  }
}
</style>
