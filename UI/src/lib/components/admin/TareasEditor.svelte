<script lang="ts">
  import { databaseService } from '$lib/services/api/database.svelte';
  import { formPersistenceService } from '$lib/services/domain/form-persistence.svelte';
  import { ui } from '$lib/services/stores/ui.svelte';
  import { fade } from 'svelte/transition';

  interface Tarea {
    descripcion: string;
    rev: boolean;
    ok: boolean;
    noOk: boolean;
    notaTarea: string;
  }

  interface Sistema {
    titulo: string;
    tipo: string;
    prefijo: number;
    observaciones: string;
    tareas: Tarea[];
  }

  let { 
    informes, 
    onClose 
  } = $props<{ 
    informes: any[], 
    onClose: () => void 
  }>();

  let selectedCenterId = $state<number | null>(null);
  let currentInforme = $state<any | null>(null);
  let loading = $state(false);
  let saving = $state(false);
  let showSelectInformes = $state(false);
  let selectedInformes = $state<Record<number, boolean>>({});
  let showApplyOptions = $state(false);

  let centrosUnicos = $derived.by(() => {
    const visto = new Set<string>();
    return informes.filter((inf: any) => {
      if (!inf.nombreObra || visto.has(inf.nombreObra)) return false;
      visto.add(inf.nombreObra);
      return true;
    });
  });

  let informesDelCentro = $derived(
    currentInforme 
      ? informes
          .filter((inf: any) => inf.nombreObra === currentInforme.nombreObra)
          .sort((a: any, b: any) => (a.cuatrimestre || '').localeCompare(b.cuatrimestre || ''))
      : []
  );

  async function selectCenter(nombreObra: string) {
    loading = true;
    try {
      const primerInf = informes.find((inf: any) => inf.nombreObra === nombreObra);
      if (!primerInf || !primerInf.id) {
        ui.error('No se encontró ningún informe para este centro');
        loading = false;
        return;
      }
      selectedCenterId = primerInf.id;
      const data = await databaseService.obtenerPorId(primerInf.id);
      if (!data) {
        ui.error('No se pudo cargar la información del centro');
        return;
      }
      data.secciones.forEach((s: any) => {
        if (!s.tareas) s.tareas = [];
      });
      currentInforme = data;
    } catch (e: any) {
      ui.error('Error al cargar el centro: ' + (e.message || 'Error desconocido'));
    } finally {
      loading = false;
    }
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
        
        return {
          ...nuevaTarea,
          ok: oldTarea.ok ?? false,
          noOk: oldTarea.noOk ?? false,
          notaTarea: oldTarea.notaTarea ?? ''
        };
      });
    });
    
    informe.secciones = nuevasSecciones;
  }

  function selectAllInformes() {
    informesDelCentro.forEach((inf: any) => {
      if (inf.id !== undefined && inf.id !== currentInforme.id) {
        selectedInformes[inf.id] = true;
      }
    });
  }

  function deselectAllInformes() {
    selectedInformes = {};
  }

  async function saveChanges() {
    if (!currentInforme) return;
    const tieneOtrosCuatrimestres = informes.some((inf: any) => 
      inf.nombreObra === currentInforme.nombreObra && 
      inf.id !== undefined && 
      inf.id !== currentInforme.id
    );
    if (!showApplyOptions && !showSelectInformes && tieneOtrosCuatrimestres) {
      showApplyOptions = true;
      return;
    }
    await finalGuardar();
  }

  function cancelSave() {
    showApplyOptions = false;
    showSelectInformes = false;
    onClose();
  }

  function aplicarATodos() {
    selectAllInformes();
    finalGuardar();
  }

  async function finalGuardar() {
    if (!currentInforme) return;
    saving = true;
    try {
      // Guardar el informe actual (que actúa como plantilla)
      await databaseService.guardar(currentInforme);
      
      const idsParaAplicar = Object.entries(selectedInformes)
        .filter(([_, checked]) => checked)
        .map(([id]) => Number(id));
        
      if (idsParaAplicar.length > 0) {
        for (const id of idsParaAplicar) {
          if (id === currentInforme.id) continue;
          const inf = await databaseService.obtenerPorId(id);
          if (inf) {
            aplicarNuevaPlantilla(inf, currentInforme);
            await databaseService.guardar(inf);
          }
        }
        ui.success(`Cambios guardados y aplicados a ${idsParaAplicar.length} cuatrimestre(s)`);
      } else {
        ui.success('Cambios guardados en el cuatrimestre seleccionado');
      }
      
      await formPersistenceService.cargarHistorial();
      onClose();
    } catch (e: any) {
      ui.error('Error al guardar los cambios: ' + (e.message || 'Error desconocido'));
    } finally {
      saving = false;
    }
  }

  function addTarea(sistemaIdx: number) {
    if (!currentInforme) return;
    currentInforme.secciones[sistemaIdx].tareas = [
      ...currentInforme.secciones[sistemaIdx].tareas,
      { descripcion: '', rev: false, ok: false, noOk: false, notaTarea: '' }
    ];
  }

  function removeTarea(sistemaIdx: number, tareaIdx: number) {
    if (!currentInforme) return;
    currentInforme.secciones[sistemaIdx].tareas.splice(tareaIdx, 1);
  }

  function addSeccion() {
    if (!currentInforme) return;
    const maxPrefijo = currentInforme.secciones.reduce((max: number, s: any) => Math.max(max, s.prefijo || 0), 0);
    currentInforme.secciones = [
      ...currentInforme.secciones,
      { titulo: 'Nueva sección', tipo: 'No especificado', prefijo: maxPrefijo + 1, observaciones: '', tareas: [] }
    ];
  }

  function removeSeccion(sistemaIdx: number) {
    if (!currentInforme) return;
    currentInforme.secciones.splice(sistemaIdx, 1);
  }

  function formatCuatrimestreLabel(cuatrimestre?: string): string {
    if (!cuatrimestre) return 'Sin cuatrimestre';
    const parts = cuatrimestre.split('-C');
    if (parts.length === 2) {
      return `Cuatrimestre ${parts[1]}º - ${parts[0]}`;
    }
    return cuatrimestre;
  }
</script>

<div class="tareas-editor-overlay" transition:fade>
  <div class="tareas-editor-card">
    <header class="editor-header">
      <div class="header-left">
        <h2>Editor de Centros</h2>
        <p>Los cambios se aplican solo al cuatrimestre seleccionado</p>
      </div>
      <button class="btn-close" onclick={onClose} title="Cerrar">✕</button>
    </header>

    <div class="editor-body">
      {#if !selectedCenterId}
        <div class="center-selector">
          <label for="center-select">Selecciona un centro para editar sus tareas:</label>
          <select id="center-select" onchange={(e) => selectCenter(e.currentTarget.value)}>
            <option value="">-- Elegir Centro --</option>
            {#each centrosUnicos as centro}
              <option value={centro.nombreObra}>{centro.nombreObra}</option>
            {/each}
          </select>
        </div>
      {:else if loading}
        <div class="editor-loading">
          <div class="spinner"></div>
          <p>Cargando secciones y tareas...</p>
        </div>
      {:else if showApplyOptions}
        <div class="apply-options-view" transition:fade>
          <h3>¿Aplicar cambios a los cuatrimestres de {currentInforme.nombreObra}?</h3>
          <p class="select-info">Has modificado la estructura de tareas. ¿A qué cuatrimestres deseas aplicar estos cambios?</p>
          
          <div class="apply-options-buttons">
            <button class="btn-apply-option" onclick={aplicarATodos}>
              <span class="option-icon">✓✓</span>
              <span class="option-text">
                <strong>Aplicar a todos</strong>
                <small>Actualizar los {informesDelCentro.length} cuatrimestres (incluyendo el actual)</small>
              </span>
            </button>
            <button class="btn-apply-option" onclick={() => { showApplyOptions = false; showSelectInformes = true; }}>
              <span class="option-icon">☐☐</span>
              <span class="option-text">
                <strong>Seleccionar cuáles</strong>
                <small>Elegir manualmente los cuatrimestres a actualizar</small>
              </span>
            </button>
            <button class="btn-apply-option cancel" onclick={cancelSave}>
              <span class="option-icon">✕</span>
              <span class="option-text">
                <strong>Cancelar</strong>
                <small>No guardar los cambios y salir</small>
              </span>
            </button>
          </div>
        </div>
      {:else if showSelectInformes}
        <div class="select-informes-view" transition:fade>
          <h3>Selecciona los cuatrimestres de {currentInforme.nombreObra} a actualizar</h3>
          <p class="select-info">Conservaremos sus estados de check y notas donde coincidan.</p>
          
          <div class="selection-actions">
            <button class="btn-action-small" onclick={selectAllInformes}>Seleccionar Todos</button>
            <button class="btn-action-small" onclick={deselectAllInformes}>Ninguno</button>
          </div>

          <div class="informes-list">
            {#each informesDelCentro as inf}
              {#if inf.id !== undefined}
                <label class="informe-item-checkbox">
                  <input type="checkbox" bind:checked={selectedInformes[inf.id]} />
                  <span class="custom-chk"></span>
                  <span class="inf-name">{formatCuatrimestreLabel(inf.cuatrimestre)}</span>
                </label>
              {/if}
            {/each}
          </div>
        </div>
      {:else if currentInforme}
        <div class="tasks-container">
          <div class="selected-center-info">
            <strong>Centro:</strong> {currentInforme.nombreObra}
            <button class="btn-change-center" onclick={() => { selectedCenterId = null; currentInforme = null; showSelectInformes = false; showApplyOptions = false; }}>Cambiar centro</button>
          </div>
 
          {#each currentInforme.secciones as seccion, sIdx}
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
      {/if}
    </div>

    {#if selectedCenterId && currentInforme}
      <footer class="editor-footer">
        {#if showSelectInformes}
          <button class="btn-cancel" onclick={() => { showSelectInformes = false; showApplyOptions = true; }}>Atrás</button>
          <button class="btn-save" onclick={finalGuardar} disabled={saving}>
            {saving ? 'Guardando...' : 'Aplicar y Guardar'}
          </button>
        {:else if showApplyOptions}
          <!-- Opciones en el cuerpo, no se necesita footer -->
        {:else}
          <button class="btn-cancel" onclick={onClose}>Cancelar</button>
          <button class="btn-save" onclick={saveChanges} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        {/if}
      </footer>
    {/if}
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
    font-size: 1.5rem;
    color: #0f172a;
  }

  .header-left p {
    margin: 4px 0 0;
    font-size: 0.85rem;
    color: #64748b;
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

  .center-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 400px;
    margin: 0 auto;
    text-align: center;
    padding: 40px 0;
  }

  .center-selector label {
    font-weight: 600;
    color: #475569;
  }

  .center-selector select {
    padding: 12px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .center-selector select:focus {
    border-color: #3b82f6;
  }

  .editor-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: #64748b;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .selected-center-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f1f5f9;
    border-radius: 12px;
    margin-bottom: 24px;
    font-size: 0.95rem;
    color: #334155;
  }

  .btn-change-center {
    background: none;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: underline;
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
    background: #0f172a;
    border-color: #0f172a;
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

  .apply-options-view {
    padding: 40px 20px;
    max-width: 500px;
    margin: 0 auto;
    text-align: center;
  }

  .apply-options-view h3 {
    font-size: 1.25rem;
    color: #0f172a;
    margin: 0 0 8px 0;
  }

  .apply-options-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
  }

  .btn-apply-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .btn-apply-option:hover {
    border-color: #3b82f6;
    background: #f8faff;
    transform: translateY(-1px);
  }

  .btn-apply-option.cancel:hover {
    border-color: #ef4444;
    background: #fef2f2;
  }

  .option-icon {
    font-size: 1.3rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .option-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .option-text strong {
    font-size: 0.95rem;
    color: #0f172a;
  }

  .option-text small {
    font-size: 0.8rem;
    color: #64748b;
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
    background: #dbeafe;
    color: #1e40af;
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
    background: #0f172a;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-save:hover {
    background: #1e293b;
    transform: translateY(-1px);
  }

  .btn-save:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
</style>
