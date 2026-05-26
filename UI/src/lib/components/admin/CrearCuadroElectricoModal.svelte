<script lang="ts">
  import { databaseService } from '$lib/services/database.svelte';
  import { formPersistenceService } from '$lib/services/form-persistence.svelte';
  import { ui } from '$lib/services/ui.svelte';
  import { CUADRO_ELECTRICO_TEMPLATE } from '$lib/templates/cuadroElectrico';
  import { fade } from 'svelte/transition';

  let {
    onClose,
    onCreated
  }: {
    onClose: () => void;
    onCreated: () => void;
  } = $props();

  let nombreObra = $state('');
  let nProy = $state('');
  let nOrdenCuadro = $state('');
  let nOrdenInstalacion = $state('');
  let creando = $state(false);

  async function crear() {
    if (!nombreObra.trim()) {
      ui.error('El nombre de la obra es obligatorio');
      return;
    }
    if (!nOrdenCuadro.trim()) {
      ui.error('El número de orden del cuadro es obligatorio');
      return;
    }
    creando = true;
    try {
      const id = Date.now();
      const hoy = new Date().toISOString().split('T')[0];

      let baseTemplate = CUADRO_ELECTRICO_TEMPLATE;
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('CUADRO_ELECTRICO_TEMPLATE_CUSTOM');
        if (saved) {
          try {
            baseTemplate = JSON.parse(saved);
          } catch (e) {
            console.error('Error parsing custom template', e);
          }
        }
      }

      const secciones = baseTemplate.secciones.map(sec => ({
        ...sec,
        tareas: sec.tareas.map(t => ({ ...t, ok: false, noOk: false, notaTarea: '' }))
      }));

      const informe = {
        id,
        tipo: 'cuadro_electrico',
        nombreObra: nombreObra.trim(),
        nProy: nProy.trim(),
        nOrdenCuadro: nOrdenCuadro.trim(),
        nOrdenInstalacion: nOrdenInstalacion.trim(),
        tecnico: '',
        fecha: hoy,
        cuatrimestre: '',
        protegido: true,
        secciones,
        conclusiones: '',
        ultimaModificacion: new Date().toLocaleString()
      };

      await databaseService.guardar(informe);
      await formPersistenceService.cargarHistorial();
      ui.success(`Informe "${nombreObra}" creado`);
      onCreated();
    } catch (e: any) {
      ui.error('Error al crear: ' + (e.message || 'Error desconocido'));
    } finally {
      creando = false;
    }
  }
</script>

<div class="modal-overlay" transition:fade onclick={onClose} role="presentation">
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div class="modal-card" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && onClose()} role="dialog" tabindex="0">
    <header class="modal-header">
      <h2>Nuevo Informe Cuadro Eléctrico</h2>
      <button class="btn-close" onclick={onClose}>✕</button>
    </header>

    <div class="modal-body">
      <div class="field-group">
        <label for="campo-nombre">Nombre obra <span class="req">*</span></label>
        <input id="campo-nombre" type="text" bind:value={nombreObra} placeholder="Ej: MERCADONA GRAN VIA - LPC" />
      </div>

      <div class="field-row">
        <div class="field-group">
          <label for="campo-proy">Nº de proyecto</label>
          <input id="campo-proy" type="text" bind:value={nProy} placeholder="Ej: PROY26/3" />
        </div>
        <div class="field-group">
          <label for="campo-orden">Nº orden cuadro <span class="req">*</span></label>
          <input id="campo-orden" type="text" bind:value={nOrdenCuadro} placeholder="Ej: 24361" />
        </div>
      </div>

      <div class="field-row">
        <div class="field-group">
          <label for="campo-inst">Nº orden instalación</label>
          <input id="campo-inst" type="text" bind:value={nOrdenInstalacion} placeholder="Opcional" />
        </div>
      </div>
    </div>

    <footer class="modal-footer">
      <button class="btn-cancel" onclick={onClose}>Cancelar</button>
      <button class="btn-create" onclick={crear} disabled={creando}>
        {creando ? 'Creando...' : 'Crear Informe'}
      </button>
    </footer>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(6px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-card {
    background: white;
    width: 100%;
    max-width: 520px;
    border-radius: 20px;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
    overflow: hidden;
  }

  .modal-header {
    padding: 20px 24px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.15rem;
    color: #0f172a;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.3rem;
    cursor: pointer;
    color: #94a3b8;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.15s;
  }

  .btn-close:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .field-row {
    display: flex;
    gap: 12px;
  }

  .field-row .field-group {
    flex: 1;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .field-group label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
    letter-spacing: 0.02em;
  }

  .req {
    color: #ef4444;
  }

  .field-group input {
    padding: 10px 12px;
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.15s;
  }

  .field-group input:focus {
    border-color: #3b82f6;
  }

  .modal-footer {
    padding: 16px 24px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .btn-cancel {
    padding: 10px 20px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: white;
    color: #64748b;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-cancel:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .btn-create {
    padding: 10px 24px;
    border-radius: 10px;
    border: none;
    background: #0f172a;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-create:hover {
    background: #1e293b;
    transform: translateY(-1px);
  }

  .btn-create:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    transform: none;
  }
</style>
