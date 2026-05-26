<script lang="ts">
  import { fade } from 'svelte/transition';
  import { ui } from '$lib/services/ui.svelte';
  import { CUADRO_ELECTRICO_TEMPLATE } from '$lib/templates/cuadroElectrico';

  let {
    onClose
  }: {
    onClose: () => void;
  } = $props();

  // Load template sections
  let template = $state(JSON.parse(JSON.stringify(CUADRO_ELECTRICO_TEMPLATE)));
  let saving = $state(false);

  function addTarea(seccionIdx: number) {
    template.secciones[seccionIdx].tareas = [
      ...template.secciones[seccionIdx].tareas,
      { descripcion: '', rev: false, ok: false, noOk: false, notaTarea: '' }
    ];
  }

  function removeTarea(seccionIdx: number, tareaIdx: number) {
    template.secciones[seccionIdx].tareas.splice(tareaIdx, 1);
  }

  function addSeccion() {
    const maxPrefijo = template.secciones.reduce((max: number, s: any) => Math.max(max, s.prefijo || 0), 0);
    template.secciones = [
      ...template.secciones,
      { titulo: `${maxPrefijo + 1}. NUEVA SECCIÓN`, tipo: 'simple', prefijo: maxPrefijo + 1, tareas: [] }
    ];
  }

  function removeSeccion(seccionIdx: number) {
    template.secciones.splice(seccionIdx, 1);
  }

  async function saveChanges() {
    saving = true;
    try {
      // Para persistir la plantilla en Svelte de forma local entre sesiones del cliente,
      // la guardamos en el localStorage.
      localStorage.setItem('CUADRO_ELECTRICO_TEMPLATE_CUSTOM', JSON.stringify(template));
      ui.success('Plantilla de Cuadro Eléctrico actualizada. Afectará a los nuevos informes.');
      onClose();
    } catch (e: any) {
      ui.error('Error al guardar la plantilla: ' + e.message);
    } finally {
      saving = false;
    }
  }

  // Cargar plantilla personalizada si ya existe en localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('CUADRO_ELECTRICO_TEMPLATE_CUSTOM');
    if (saved) {
      try {
        template = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing custom template', e);
      }
    }
  }
</script>

<div class="tareas-editor-overlay" transition:fade>
  <div class="tareas-editor-card">
    <header class="editor-header">
      <div class="header-left">
        <h2>Editor de Plantilla (Cuadro Eléctrico)</h2>
        <p>Los cambios modificarán el modelo de los nuevos informes de cuadro eléctrico que se creen a partir de ahora. No afectará a los informes existentes.</p>
      </div>
      <button class="btn-close" onclick={onClose} title="Cerrar">✕</button>
    </header>

    <div class="editor-body">
      <div class="tasks-container">
        {#each template.secciones as seccion, sIdx}
          <div class="seccion-card">
            <div class="seccion-header">
              <div class="seccion-titulo">
                <input type="number" bind:value={seccion.prefijo} class="prefijo-input" min="0" />
                <input type="text" bind:value={seccion.titulo} class="titulo-input" />
                <span class="tipo-badge">{seccion.tipo}</span>
              </div>
              <button class="btn-delete-seccion" onclick={() => removeSeccion(sIdx)} title="Eliminar sección">✕</button>
            </div>

            {#each seccion.tareas as tarea, tIdx}
              <div class="tarea-row">
                <input type="text" bind:value={tarea.descripcion} placeholder="Descripción de la tarea" />
                <button class="btn-delete-task" onclick={() => removeTarea(sIdx, tIdx)} title="Eliminar tarea">✕</button>
              </div>
            {/each}

            <button class="btn-add-task" onclick={() => addTarea(sIdx)}>+ Añadir tarea</button>
          </div>
        {/each}

        <button class="btn-add-seccion" onclick={addSeccion}>+ Añadir sección</button>
      </div>
    </div>

    <footer class="editor-footer">
      <button class="btn-cancel" onclick={onClose}>Cancelar</button>
      <button class="btn-save" onclick={saveChanges} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar Plantilla'}
      </button>
    </footer>
  </div>
</div>

<style>
  .tareas-editor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(8px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .tareas-editor-card {
    background: white;
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .editor-header {
    padding: 24px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #0f172a;
  }

  .header-left p {
    margin: 4px 0 0;
    font-size: 0.85rem;
    color: #64748b;
    line-height: 1.4;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #94a3b8;
    padding: 4px 8px;
    border-radius: 6px;
    transition: color 0.2s;
  }

  .btn-close:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .editor-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }

  .seccion-card {
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
  }

  .seccion-header {
    padding: 12px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .seccion-titulo {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }

  .titulo-input {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 4px 8px;
    background: transparent;
    outline: none;
    flex: 1;
    transition: all 0.15s;
  }

  .titulo-input:hover {
    background: #fff;
    border-color: #e2e8f0;
  }

  .titulo-input:focus {
    background: #fff;
    border-color: #3b82f6;
  }

  .prefijo-input {
    width: 48px;
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 4px 6px;
    background: #e2e8f0;
    outline: none;
    text-align: center;
    transition: all 0.15s;
  }

  .prefijo-input:focus {
    background: #fff;
    border-color: #3b82f6;
    color: #1e293b;
  }

  .tipo-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 99px;
    font-weight: 600;
    white-space: nowrap;
  }

  .btn-delete-seccion {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    color: #94a3b8;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .btn-delete-seccion:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  .tarea-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-bottom: 1px solid #f1f5f9;
  }

  .tarea-row:last-child {
    border-bottom: none;
  }

  .tarea-row input[type="text"] {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
    background: transparent;
    transition: all 0.15s;
  }

  .tarea-row input[type="text"]:hover {
    background: #fafafa;
    border-color: #e2e8f0;
  }

  .tarea-row input[type="text"]:focus {
    background: #fff;
    border-color: #3b82f6;
  }

  .btn-delete-task {
    background: none;
    border: none;
    font-size: 0.85rem;
    cursor: pointer;
    color: #cbd5e1;
    padding: 4px 6px;
    border-radius: 4px;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .btn-delete-task:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  .btn-add-task {
    display: block;
    width: 100%;
    padding: 10px;
    border: none;
    border-top: 1px dashed #e2e8f0;
    background: transparent;
    color: #94a3b8;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-add-task:hover {
    background: #fafafa;
    color: #3b82f6;
  }

  .btn-add-seccion {
    display: block;
    width: 100%;
    padding: 14px;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    background: transparent;
    color: #9ca3af;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    margin-top: 4px;
  }

  .btn-add-seccion:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #f8faff;
  }

  .editor-footer {
    padding: 20px 24px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn-cancel {
    padding: 10px 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: white;
    color: #64748b;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .btn-save {
    padding: 10px 24px;
    border-radius: 12px;
    border: none;
    background: #1e3a5f;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-save:hover {
    background: #152942;
    transform: translateY(-1px);
  }

  .btn-save:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
</style>
