<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { databaseService } from '$lib/services/api/database.svelte';
  import { formPersistenceService } from '$lib/services/domain/form-persistence.svelte';
  import { obtenerTemplateCuadroElectrico } from '$lib/services/domain/template-service';
  import type { CuadroSeccionTemplate, CuadroTareaTemplate } from '$lib/services/domain/template-service';
  import { ui } from '$lib/services/stores/ui.svelte';
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

  let modalCard: HTMLDivElement;
  let previousActiveElement: Element | null = null;

  onMount(() => {
    previousActiveElement = document.activeElement;
  });

  function focusTrap(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = modalCard.querySelectorAll<HTMLElement>(
        'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function closeModal() {
    onClose();
    tick().then(() => {
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    });
  }

  async function crear() {
    if (!nombreObra.trim()) {
      ui.error('El nombre de la obra es obligatorio');
      return;
    }
    if (!nOrdenCuadro.trim()) {
      ui.error('El número de orden del cuadro es obligatorio');
      return;
    }

    // Validate uniqueness before creating
    const informes = formPersistenceService.informesGuardados;
    const nProyTrim = nProy.trim();
    const nOrdenCuadroTrim = nOrdenCuadro.trim();
    const nOrdenInstalacionTrim = nOrdenInstalacion.trim();

    const duplicado = informes.find(inf => {
      if (inf.tipo !== 'cuadro_electrico') return false;
      if (nProyTrim && inf.nProy?.trim() === nProyTrim) return true;
      if (nOrdenCuadroTrim && inf.nOrdenCuadro?.trim() === nOrdenCuadroTrim) return true;
      if (nOrdenInstalacionTrim && inf.nOrdenInstalacion?.trim() === nOrdenInstalacionTrim) return true;
      return false;
    });

    if (duplicado) {
      let campo = '';
      if (nProyTrim && duplicado.nProy?.trim() === nProyTrim) campo = 'el Nº de proyecto';
      else if (nOrdenCuadroTrim && duplicado.nOrdenCuadro?.trim() === nOrdenCuadroTrim) campo = 'el Nº de orden del cuadro';
      else if (nOrdenInstalacionTrim && duplicado.nOrdenInstalacion?.trim() === nOrdenInstalacionTrim) campo = 'el Nº de orden de instalación';
      
      ui.error(`Ya existe un informe de cuadro eléctrico con ${campo} "${campo === 'el Nº de proyecto' ? nProyTrim : campo === 'el Nº de orden del cuadro' ? nOrdenCuadroTrim : nOrdenInstalacionTrim}" (Obra: ${duplicado.nombreObra})`);
      return;
    }

    creando = true;
    try {
      const id = Date.now();
      const hoy = new Date().toISOString().split('T')[0];

      let baseTemplate = obtenerTemplateCuadroElectrico();

      const secciones = baseTemplate.secciones.map((sec: CuadroSeccionTemplate) => ({
        ...sec,
        tareas: sec.tareas.map((t: CuadroTareaTemplate) => ({ ...t, ok: false, noOk: false, notaTarea: '' }))
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

<div class="modal-overlay" transition:fade onclick={closeModal} role="presentation">
  <div class="modal-card" bind:this={modalCard} onkeydown={focusTrap} onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
    <header class="modal-header">
      <h2>Nuevo Informe Cuadro Eléctrico</h2>
      <button class="btn-close" onclick={closeModal}>✕</button>
    </header>

    <div class="modal-body">
      <div class="field-group">
        <label for="campo-nombre">Nombre obra <span class="req">*</span></label>
        <input id="campo-nombre" type="text" bind:value={nombreObra} placeholder="Ej: MERCADONA GRAN VIA - LPC" autofocus />
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
      <button class="btn-cancel" onclick={closeModal}>Cancelar</button>
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
