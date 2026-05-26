<script lang="ts">
  import { fade } from 'svelte/transition';
  import { ui } from '$lib/services/ui.svelte';
  import { CUADRO_ELECTRICO_TEMPLATE } from '$lib/templates/cuadroElectrico';
  import { formPersistenceService } from '$lib/services/form-persistence.svelte';
  import { databaseService } from '$lib/services/database.svelte';

  let {
    onClose
  }: {
    onClose: () => void;
  } = $props();

  // Load template sections
  let template = $state(JSON.parse(JSON.stringify(CUADRO_ELECTRICO_TEMPLATE)));
  let saving = $state(false);
  let showSelectInformes = $state(false);
  let selectedInformes = $state<Record<number, boolean>>({});

  let informesCuadro = $derived(formPersistenceService.informesGuardados.filter(i => i.tipo === 'cuadro_electrico'));

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

  function addTarea(seccionIdx: number) {
    template.secciones[seccionIdx].tareas = [
      ...template.secciones[seccionIdx].tareas,
      { descripcion: '', ok: false, noOk: false, notaTarea: '', indice: '', sinCheck: false, subtareas: [] }
    ];
  }

  function removeTarea(seccionIdx: number, tareaIdx: number) {
    template.secciones[seccionIdx].tareas.splice(tareaIdx, 1);
  }

  function addSubtarea(seccionIdx: number, tareaIdx: number) {
    const tarea = template.secciones[seccionIdx].tareas[tareaIdx];
    if (!tarea.subtareas) {
      tarea.subtareas = [];
    }
    tarea.subtareas = [
      ...tarea.subtareas,
      { descripcion: '', ok: false, noOk: false, notaTarea: '' }
    ];
  }

  function removeSubtarea(seccionIdx: number, tareaIdx: number, subIdx: number) {
    template.secciones[seccionIdx].tareas[tareaIdx].subtareas.splice(subIdx, 1);
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

  function aplicarNuevaPlantilla(informe: any, template: any) {
    const nuevasSecciones = JSON.parse(JSON.stringify(template.secciones));
    
    nuevasSecciones.forEach((nuevaSec: any) => {
      const oldSec = informe.secciones?.find((s: any) => s.prefijo === nuevaSec.prefijo || s.titulo === nuevaSec.titulo);
      if (!oldSec) return;
      
      nuevaSec.tareas = nuevaSec.tareas.map((nuevaTarea: any) => {
        const oldTarea = oldSec.tareas?.find((t: any) => 
          (nuevaTarea.indice && t.indice === nuevaTarea.indice) || 
          (nuevaTarea.descripcion && t.descripcion === nuevaTarea.descripcion)
        );
        if (!oldTarea) return nuevaTarea;
        
        const mergedTarea = {
          ...nuevaTarea,
          ok: oldTarea.ok ?? false,
          noOk: oldTarea.noOk ?? false,
          notaTarea: oldTarea.notaTarea ?? '',
          campos: nuevaTarea.campos?.map((nc: any) => {
            const oc = oldTarea.campos?.find((c: any) => c.sufijo === nc.sufijo);
            return oc ? { ...nc, valor: oc.valor } : nc;
          }) ?? []
        };
        
        if (nuevaTarea.subtareas && oldTarea.subtareas) {
          mergedTarea.subtareas = nuevaTarea.subtareas.map((nuevaSub: any) => {
            const oldSub = oldTarea.subtareas.find((st: any) => st.descripcion === nuevaSub.descripcion);
            if (!oldSub) return nuevaSub;
            return {
              ...nuevaSub,
              ok: oldSub.ok ?? false,
              noOk: oldSub.noOk ?? false,
              notaTarea: oldSub.notaTarea ?? ''
            };
          });
        }
        
        return mergedTarea;
      });
    });
    
    informe.secciones = nuevasSecciones;
  }

  function selectAllInformes() {
    informesCuadro.forEach(inf => {
      if (inf.id !== undefined) {
        selectedInformes[inf.id] = true;
      }
    });
  }

  function deselectAllInformes() {
    selectedInformes = {};
  }

  async function saveChanges() {
    if (informesCuadro.length > 0 && !showSelectInformes) {
      showSelectInformes = true;
      return;
    }
    await finalGuardar();
  }

  async function finalGuardar() {
    saving = true;
    try {
      localStorage.setItem('CUADRO_ELECTRICO_TEMPLATE_CUSTOM', JSON.stringify(template));
      
      const idsParaAplicar = Object.entries(selectedInformes)
        .filter(([_, checked]) => checked)
        .map(([id]) => Number(id));
        
      if (idsParaAplicar.length > 0) {
        for (const id of idsParaAplicar) {
          const inf = await databaseService.obtenerPorId(id);
          if (inf) {
            aplicarNuevaPlantilla(inf, template);
            await databaseService.guardar(inf);
          }
        }
        await formPersistenceService.cargarHistorial();
        ui.success(`Plantilla guardada y aplicada a ${idsParaAplicar.length} informe(s)`);
      } else {
        ui.success('Plantilla de Cuadro Eléctrico guardada para nuevos informes');
      }
      onClose();
    } catch (e: any) {
      ui.error('Error al guardar la plantilla: ' + e.message);
    } finally {
      saving = false;
    }
  }
</script>

<div class="tareas-editor-overlay" transition:fade>
  <div class="tareas-editor-card">
    <header class="editor-header">
      <div class="header-left">
        <h2>Editor de Plantilla (Cuadro Eléctrico)</h2>
        <p>Gestiona la estructura de tareas predeterminadas. Puedes habilitar índices, subtareas y si no requiere checks.</p>
      </div>
      <button class="btn-close" onclick={onClose} title="Cerrar">✕</button>
    </header>

    <div class="editor-body">
      {#if showSelectInformes}
        <div class="select-informes-view" transition:fade>
          <h3>¿Deseas aplicar esta nueva plantilla a los informes actuales?</h3>
          <p class="select-info">Marca los informes que deseas actualizar. Conservaremos sus observaciones, campos numéricos y casillas marcadas que coincidan.</p>
          
          <div class="selection-actions">
            <button class="btn-action-small" onclick={selectAllInformes}>Seleccionar Todos</button>
            <button class="btn-action-small" onclick={deselectAllInformes}>Ninguno</button>
          </div>

          <div class="informes-list">
            {#each informesCuadro as inf}
              {#if inf.id !== undefined}
                <label class="informe-item-checkbox">
                  <input type="checkbox" bind:checked={selectedInformes[inf.id]} />
                  <span class="custom-chk"></span>
                  <span class="inf-name">{inf.nombreObra}</span>
                  {#if inf.nOrdenCuadro}<span class="inf-ord">Ord: {inf.nOrdenCuadro}</span>{/if}
                </label>
              {/if}
            {/each}
          </div>
        </div>
      {:else}
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

              <div class="tareas-list">
                {#each seccion.tareas as tarea, tIdx}
                  <div class="tarea-container-block">
                    <div class="tarea-row">
                      <input type="text" bind:value={tarea.indice} placeholder="Índice" class="tarea-indice-input" />
                      <input type="text" bind:value={tarea.descripcion} placeholder="Descripción de la tarea" class="tarea-desc-input" />
                      
                      <label class="check-toggle-label">
                        <input type="checkbox" bind:checked={tarea.sinCheck} />
                        <span class="chk-lbl">Sin Check</span>
                      </label>

                      <button class="btn-delete-task" onclick={() => removeTarea(sIdx, tIdx)} title="Eliminar tarea">✕</button>
                    </div>

                    <!-- Subtareas -->
                    <div class="subtareas-editor-box">
                      {#each tarea.subtareas || [] as sub, subIdx}
                        <div class="subtarea-row-item">
                          <span class="subtarea-icon-dash">└─</span>
                          <input type="text" bind:value={sub.descripcion} placeholder="Descripción de la subtarea" class="subtarea-desc-input" />
                          <button class="btn-delete-subtask" onclick={() => removeSubtarea(sIdx, tIdx, subIdx)} title="Eliminar subtarea">✕</button>
                        </div>
                      {/each}
                      <button class="btn-add-subtask" onclick={() => addSubtarea(sIdx, tIdx)}>+ Añadir Subtarea</button>
                    </div>
                  </div>
                {/each}
              </div>

              <button class="btn-add-task" onclick={() => addTarea(sIdx)}>+ Añadir tarea</button>
            </div>
          {/each}

          <button class="btn-add-seccion" onclick={addSeccion}>+ Añadir sección</button>
        </div>
      {/if}
    </div>

    <footer class="editor-footer">
      {#if showSelectInformes}
        <button class="btn-cancel" onclick={() => showSelectInformes = false}>Atrás</button>
        <button class="btn-cancel" onclick={finalGuardar} disabled={saving}>Solo para nuevos</button>
        <button class="btn-save" onclick={finalGuardar} disabled={saving}>
          {saving ? 'Guardando...' : 'Aplicar y Guardar'}
        </button>
      {:else}
        <button class="btn-cancel" onclick={onClose}>Cancelar</button>
        <button class="btn-save" onclick={saveChanges} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Plantilla'}
        </button>
      {/if}
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
    max-width: 850px;
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
    background: #fafbfc;
  }

  .tasks-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .seccion-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  .seccion-header {
    padding: 14px 20px;
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
    gap: 12px;
    flex: 1;
  }

  .titulo-input {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 6px 10px;
    background: transparent;
    outline: none;
    flex: 1;
    transition: all 0.15s;
  }

  .titulo-input:hover {
    background: #fff;
    border-color: #cbd5e1;
  }

  .titulo-input:focus {
    background: #fff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .prefijo-input {
    width: 52px;
    font-size: 0.9rem;
    font-weight: 700;
    color: #64748b;
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 6px;
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
    padding: 4px 10px;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 99px;
    font-weight: 600;
    white-space: nowrap;
  }

  .btn-delete-seccion {
    background: none;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    color: #94a3b8;
    padding: 6px 10px;
    border-radius: 8px;
    transition: all 0.15s;
  }

  .btn-delete-seccion:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  .tareas-list {
    display: flex;
    flex-direction: column;
  }

  .tarea-container-block {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
  }

  .tarea-container-block:last-child {
    border-bottom: none;
  }

  .tarea-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .tarea-indice-input {
    width: 60px;
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    text-align: center;
    outline: none;
    background: #f8fafc;
  }

  .tarea-indice-input:focus {
    background: white;
    border-color: #3b82f6;
  }

  .tarea-desc-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
    background: transparent;
    transition: all 0.15s;
  }

  .tarea-desc-input:hover {
    background: #fafafa;
    border-color: #cbd5e1;
  }

  .tarea-desc-input:focus {
    background: #fff;
    border-color: #3b82f6;
  }

  .check-toggle-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #4b5563;
    cursor: pointer;
    background: #f3f4f6;
    padding: 6px 12px;
    border-radius: 20px;
    user-select: none;
    white-space: nowrap;
  }

  .check-toggle-label input {
    cursor: pointer;
  }

  .btn-delete-task {
    background: none;
    border: none;
    font-size: 0.9rem;
    cursor: pointer;
    color: #cbd5e1;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .btn-delete-task:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  .subtareas-editor-box {
    margin-left: 72px;
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .subtarea-row-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .subtarea-icon-dash {
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .subtarea-desc-input {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 0.85rem;
    outline: none;
    background: transparent;
    transition: all 0.15s;
  }

  .subtarea-desc-input:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .subtarea-desc-input:focus {
    background: white;
    border-color: #3b82f6;
  }

  .btn-delete-subtask {
    background: none;
    border: none;
    font-size: 0.8rem;
    cursor: pointer;
    color: #cbd5e1;
    padding: 4px;
    border-radius: 4px;
  }

  .btn-delete-subtask:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  .btn-add-subtask {
    align-self: flex-start;
    background: none;
    border: none;
    color: #3b82f6;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    margin-left: 20px;
  }

  .btn-add-subtask:hover {
    background: #eff6ff;
  }

  .btn-add-task {
    display: block;
    width: 100%;
    padding: 12px;
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
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    background: transparent;
    color: #94a3b8;
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

  .select-informes-view {
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
  }

  .select-informes-view h3 {
    font-size: 1.2rem;
    color: #0f172a;
    margin: 0 0 10px 0;
  }

  .select-info {
    font-size: 0.9rem;
    color: #64748b;
    line-height: 1.5;
    margin-bottom: 16px;
  }

  .selection-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    justify-content: flex-end;
  }

  .btn-action-small {
    padding: 4px 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-action-small:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .informes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 350px;
    overflow-y: auto;
    background: white;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
  }

  .informe-item-checkbox {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .informe-item-checkbox:hover {
    background: #f1f5f9;
  }

  .informe-item-checkbox input {
    display: none;
  }

  .custom-chk {
    width: 20px;
    height: 20px;
    border: 2px solid #cbd5e1;
    border-radius: 6px;
    display: inline-block;
    position: relative;
    transition: all 0.15s;
  }

  .informe-item-checkbox input:checked + .custom-chk {
    background: #1e3a5f;
    border-color: #1e3a5f;
  }

  .informe-item-checkbox input:checked + .custom-chk::after {
    content: "✓";
    color: white;
    font-size: 0.8rem;
    font-weight: bold;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .inf-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1e293b;
    flex: 1;
  }

  .inf-ord {
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 10px;
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
