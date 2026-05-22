<script lang="ts">
  import { onMount } from 'svelte';
  import { navService } from '$lib/services/navigation.svelte';
  import { formInitService, type FormState } from '$lib/services/form-initialization.svelte';
  import { formPersistenceService } from '$lib/services/form-persistence.svelte';
  import { fotoManagerService } from '$lib/services/foto-manager.svelte';
  import { ui } from '$lib/services/ui.svelte';
  import type { Foto } from '$lib/types/foto.interface';
  import type { InformeGuardado } from '$lib/types/informe.interface';

  import HeaderForm from './HeaderForm.svelte';
  import ListaSecciones from './ListaSecciones.svelte';
import InformeFooter from './InformeFooter.svelte';
   import Spinner from '../Spinner.svelte';

  // Props from route parameters
  let { cuatrimestre: cuatrimestreParam, centro: centroParam }: {
    cuatrimestre?: string;
    centro?: string;
  } = $props();

  // Local state
  let guardando = $state(false);
  let estadoAutoguardado = $state<'ocioso' | 'guardado' | 'guardando' | 'error'>('ocioso');
  let cargando = $state(true);
  let inicializado = $state(false);

  // Derived from services
  let obraForm = $derived(formInitService.obraForm);
  let fotosPorSeccionBase64 = $derived(formInitService.fotosPorSeccionBase64);
  let seccionesColapsadas = $derived(formInitService.seccionesColapsadas);
  let centroSeleccionado = $derived(navService.centroSeleccionado);

  let progreso = $derived.by(() => {
    const form = obraForm;
    if (!form?.secciones?.length) return 0;
    let total = 0;
    let completadas = 0;
    for (const sec of form.secciones) {
      for (const t of sec.tareas) {
        total++;
        if (t.ok || t.noOk) completadas++;
      }
    }
    return total === 0 ? 0 : Math.round((completadas / total) * 100);
  });

  // Auto-save timers
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let statusTimer: ReturnType<typeof setTimeout> | null = null;

  // Snapshot for deep comparison
  let lastSavedSnapshot = $state<string>('');

  function setEstadoStatus(nuevo: 'ocioso' | 'guardado' | 'guardando' | 'error') {
    if (statusTimer) clearTimeout(statusTimer);
    estadoAutoguardado = nuevo;
    if (nuevo === 'guardado') {
      statusTimer = setTimeout(() => {
        estadoAutoguardado = 'ocioso';
      }, 3000);
    }
  }

  async function performSmartSave() {
    const form = obraForm;
    if (!form || !form.id) return;

    const currentSnapshot = JSON.stringify({
      tecnico: form.tecnico,
      fecha: form.fecha,
      conclusiones: form.conclusiones,
      secciones: form.secciones.map(s => ({
        titulo: s.titulo,
        observaciones: s.observaciones,
        tareas: s.tareas.map(t => ({ ok: t.ok, noOk: t.noOk, rev: t.rev, notaTarea: t.notaTarea }))
      }))
    });

    if (currentSnapshot === lastSavedSnapshot) {
      estadoAutoguardado = 'ocioso';
      return;
    }

    setEstadoStatus('guardando');

    try {
      const last = lastSavedSnapshot ? JSON.parse(lastSavedSnapshot) : null;
      const current = JSON.parse(currentSnapshot);

      // Check metadata
      if (!last || last.tecnico !== current.tecnico || last.fecha !== current.fecha || last.conclusiones !== current.conclusiones) {
        await formPersistenceService.patchMetadata(form.id, form);
      }

      // Check sections and tasks
      for (let i = 0; i < form.secciones.length; i++) {
        const sec = form.secciones[i];
        const lastSec = last?.secciones[i];

        if (!lastSec || lastSec.titulo !== current.secciones[i].titulo || lastSec.observaciones !== current.secciones[i].observaciones) {
          await formPersistenceService.patchSeccion(form.id, sec);
        }

        for (let j = 0; j < sec.tareas.length; j++) {
          const tarea = sec.tareas[j];
          const lastTarea = lastSec?.tareas[j];
          const curTarea = current.secciones[i].tareas[j];

          if (!lastTarea || JSON.stringify(lastTarea) !== JSON.stringify(curTarea)) {
            await formPersistenceService.patchTarea(form.id, Number(sec.prefijo), j, tarea);
          }
        }
      }

      lastSavedSnapshot = currentSnapshot;
      setEstadoStatus('guardado');
    } catch (e) {
      console.error('Error en autoguardado inteligente:', e);
      setEstadoStatus('error');
    }
  }

  function scheduleAutoSave() {
    if (!inicializado) return;
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    
    // Si no hay ID todavía, usamos el guardado completo tradicional para crear el registro
    if (!obraForm?.id) {
      setEstadoStatus('guardando');
      autoSaveTimer = setTimeout(async () => {
        try {
          await formPersistenceService.soloGuardar(obraForm, fotosPorSeccionBase64);
          if (obraForm?.id) {
             // Inicializar snapshot después del primer guardado exitoso que asigna ID
             lastSavedSnapshot = JSON.stringify({
                tecnico: obraForm.tecnico,
                fecha: obraForm.fecha,
                conclusiones: obraForm.conclusiones,
                secciones: obraForm.secciones.map(s => ({
                  titulo: s.titulo,
                  observaciones: s.observaciones,
                  tareas: s.tareas.map(t => ({ ok: t.ok, noOk: t.noOk, rev: t.rev, notaTarea: t.notaTarea }))
                }))
              });
          }
          setEstadoStatus('guardado');
        } catch (e) {
          setEstadoStatus('error');
        }
      }, 2000);
      return;
    }

    // Si ya hay ID, usamos el parche inteligente debounced
    autoSaveTimer = setTimeout(performSmartSave, 2000);
  }

  // Watch form and photos for auto-save
  $effect(() => {
    // Deep dependency on form structure
    const form = obraForm;
    const fotos = fotosPorSeccionBase64;
    if (form && inicializado) {
      // Access deeply to establish reactivity
      JSON.stringify(form.secciones);
      JSON.stringify(fotos);
      scheduleAutoSave();
    }
  });

  async function volver() {
    await navService.volver();
  }

  async function agregarFotos(event: Event, secIdx: number) {
    const form = obraForm;
    if (!form) return;
    setEstadoStatus('guardando');
    await fotoManagerService.agregarFotosDesdeInput(
      event,
      fotosPorSeccionBase64[secIdx],
      (nuevas) => {
        formInitService.fotosPorSeccionBase64[secIdx] = nuevas;
      },
      async () => {
        await formPersistenceService.soloGuardar(form, fotosPorSeccionBase64);
        setEstadoStatus('guardado');
      }
    );
  }

  async function eliminarFoto(secIdx: number, fotoIdx: number) {
    const form = obraForm;
    if (!form) return;
    setEstadoStatus('guardando');
    await fotoManagerService.eliminarFoto(
      fotosPorSeccionBase64[secIdx],
      fotoIdx,
      (nuevas) => {
        formInitService.fotosPorSeccionBase64[secIdx] = nuevas;
      },
      async () => {
        await formPersistenceService.soloGuardar(form, fotosPorSeccionBase64);
        setEstadoStatus('guardado');
      }
    );
  }

  async function descargarFoto(foto: Foto) {
    await fotoManagerService.descargarFoto(foto);
  }

  function actualizarDescripcionFoto(secIdx: number, fotoIdx: number, descripcion: string) {
    const fotos = fotosPorSeccionBase64[secIdx];
    if (!fotos || fotoIdx < 0 || fotoIdx >= fotos.length) return;
    const actualizadas = [...fotos];
    actualizadas[fotoIdx] = { ...actualizadas[fotoIdx], descripcion };
    formInitService.fotosPorSeccionBase64[secIdx] = actualizadas;
  }

  async function generarPDF() {
    guardando = true;
    const form = obraForm;
    if (!form) return;
    try {
      await formPersistenceService.generarPDF(form, fotosPorSeccionBase64);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      ui.error('Error al generar el PDF');
    } finally {
      guardando = false;
    }
  }

  async function guardarYSalir() {
    const form = obraForm;
    if (form) {
      setEstadoStatus('guardando');
      await formPersistenceService.soloGuardar(form, fotosPorSeccionBase64);
      setEstadoStatus('guardado');
      await volver();
    }
  }

  function toggleSeccion(idx: number) {
    const cols = [...seccionesColapsadas];
    if (idx >= 0 && idx < cols.length) {
      cols[idx] = !cols[idx];
      formInitService.seccionesColapsadas = cols;
    }
  }

  async function seleccionarCentro(nombre: string, cuatrimestre?: string) {
    navService.centroSeleccionado = nombre;
    if (cuatrimestre) navService.cuatrimestreSeleccionado = cuatrimestre;
    navService.vistaActual = 'formulario';
    navService.persist();
    await formInitService.inicializarFormulario(nombre, cuatrimestre || null);
  }

  async function editarInforme(inf: InformeGuardado) {
    const result = await formPersistenceService.editarInforme(inf);
    if (result) {
      formInitService.setFormData(
        result.obraForm,
        result.fotosPorSeccionBase64,
        result.seccionesColapsadas
      );
    }
  }

  onMount(async () => {
    await formPersistenceService.cargarHistorial();

    if (cuatrimestreParam && centroParam) {
      navService.cuatrimestreSeleccionado = cuatrimestreParam;
      navService.centroSeleccionado = centroParam;
      navService.vistaActual = 'formulario';
      // Establecer vistaOrigen basado en los parámetros de búsqueda o URL
      const urlParams = new URLSearchParams(window.location.search);
      const fromParam = urlParams.get('from');
      navService.vistaOrigen = fromParam === 'admin' ? 'admin' : (window.location.pathname.startsWith('/admin') ? 'admin' : 'dashboard');
      navService.persist();

      try {
        const informes = formPersistenceService.informesGuardados;
        const informeExistente = informes.find(
          (inf: InformeGuardado) => inf.cuatrimestre === cuatrimestreParam && inf.nombreObra === centroParam
        );

        if (informeExistente) {
          await editarInforme(informeExistente);
        } else {
          await seleccionarCentro(centroParam, cuatrimestreParam);
        }
      } catch (error) {
        console.error('[ERROR] Fallo crítico al inicializar desde URL:', error);
        ui.error(`Error: El centro '${centroParam}' no existe o no se ha podido cargar.`);
        await navService.irASeleccion();
      }
    } else {
      const centroPersistido = navService.centroSeleccionado;
      if (centroPersistido && !obraForm) {
        await seleccionarCentro(centroPersistido);
      }
    }

    cargando = false;
    inicializado = true;
  });

  $effect(() => {
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      if (statusTimer) clearTimeout(statusTimer);
    };
  });
</script>

<svelte:head>
  <title>{centroSeleccionado || ''} | {obraForm?.tipo === 'cuadro_electrico' ? 'Cuadro Eléctrico' : 'Informe'} | GTM</title>
</svelte:head>

{#if cargando}
  <div class="loading-container">
    <Spinner size="large" />
    <p>Cargando informe...</p>
  </div>
{:else if obraForm}
  <div class="informe-wrapper">
    <HeaderForm
      centro={centroSeleccionado}
      {progreso}
      {estadoAutoguardado}
      {obraForm}
      onCerrar={volver}
    />

    <div class="layout-columns">
       <main class="informe-main">
         <ListaSecciones
           {obraForm}
           {seccionesColapsadas}
           {fotosPorSeccionBase64}
           toggle={toggleSeccion}
           agregarFoto={agregarFotos}
           {eliminarFoto}
           {descargarFoto}
           actualizarDescripcion={actualizarDescripcionFoto}
         />
       </main>
     </div>

    <InformeFooter
      {obraForm}
      {guardando}
      {generarPDF}
      {guardarYSalir}
    />
  </div>
{:else}
  <div class="loading-container">
    <p>No hay informe activo. Redirigiendo...</p>
  </div>
{/if}

<style>
  .informe-wrapper {
    min-height: 100vh;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
  }

  .layout-columns {
    display: flex;
    gap: 24px;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 0 24px 100px;
    align-items: flex-start;
  }

  .informe-main {
    flex: 1;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 16px;
    color: #64748b;
  }
</style>
