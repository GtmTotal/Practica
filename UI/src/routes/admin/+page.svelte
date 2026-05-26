<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { adminService } from '$lib/services/admin.svelte';
  import { cuatrimestreService } from '$lib/services/cuatrimestre.svelte';
  import { formPersistenceService } from '$lib/services/form-persistence.svelte';
  import { formInitService } from '$lib/services/form-initialization.svelte';
  import { navService } from '$lib/services/navigation.svelte';
  import { ui } from '$lib/services/ui.svelte';
import { configCentrosService } from '$lib/services/config-centros.svelte';
import { databaseService } from '$lib/services/database.svelte';
import { CUADRO_ELECTRICO_TEMPLATE } from '$lib/templates/cuadroElectrico';
import type { InformeGuardado, GrupoCuatrimestre } from '$lib/types/informe.interface';
import TareasEditor from '$lib/components/admin/TareasEditor.svelte';
import TareasEditorCuadros from '$lib/components/admin/TareasEditorCuadros.svelte';
import CrearCuadroElectricoModal from '$lib/components/admin/CrearCuadroElectricoModal.svelte';

  import './admin-page.css';

  let isAdmin = $derived(adminService.isAdmin);
  let isSyncing = $state(false);
  let vistaPanel = $state(true);
  let vistaActual = $state<'centros'>('centros');
  let showTareasEditor = $state(false);
  let cuatrimestreSeleccionado = $state('');
  let menuPrincipal = $state<'raiz' | 'mantenimiento_mercadona' | 'cuadro_electrico'>('raiz');

  let excelInput = $state<HTMLInputElement>();

  onMount(async () => {
    if (!isAdmin) {
      await goto('/');
      return;
    }

    if (typeof localStorage !== 'undefined') {
      vistaPanel = localStorage.getItem('adminVistaPanel') !== 'false';
      cuatrimestreSeleccionado = localStorage.getItem('adminCuatrimestreSeleccionado') || '';
    }

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const cParam = urlParams.get('c');
      const menuParam = urlParams.get('menu');
      if (menuParam === 'cuadro_electrico') {
        menuPrincipal = 'cuadro_electrico';
      } else if (cParam) {
        cuatrimestreSeleccionado = cParam;
        vistaPanel = false;
        menuPrincipal = 'mantenimiento_mercadona';
      }
    }

    await formPersistenceService.cargarHistorial();
  });

  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('adminCuatrimestreSeleccionado', cuatrimestreSeleccionado);
      localStorage.setItem('adminVistaPanel', String(vistaPanel));
    }
  });

  let informesGuardados = $derived(formPersistenceService.informesGuardados);
  let informesMantenimiento = $derived(informesGuardados.filter(i => i.tipo === 'mantenimiento' || !i.tipo));
  let informesCuadro = $derived(informesGuardados.filter(i => i.tipo === 'cuadro_electrico'));

  let cuatrimestres = $derived(cuatrimestreService.getInformesPorCuatrimestre(informesMantenimiento));

  $effect(() => {
    if (cuatrimestres.length > 0 && !cuatrimestreSeleccionado) {
      cuatrimestreSeleccionado = cuatrimestres[0].clave;
    }
  });

  let grupoSeleccionado = $derived.by(() => {
    return cuatrimestres.find(g => g.clave === cuatrimestreSeleccionado) || cuatrimestres[0];
  });

  let metricas = $derived.by(() => {
    if (!grupoSeleccionado) return { total: 0, completados: 0, enProgreso: 0, pendientes: 0 };
    const informes = grupoSeleccionado.informes;
    const total = informes.length;
    const completados = informes.filter(i => estadoDe(i) === 'completado').length;
    const enProgreso = informes.filter(i => estadoDe(i) === 'en-progreso').length;
    const pendientes = total - completados - enProgreso;
    return { total, completados, enProgreso, pendientes };
  });

  let filtroSeleccionado = $state('todos');
  let informesFiltrados = $derived.by(() => {
    if (filtroSeleccionado === 'todos') return grupoSeleccionado?.informes || [];
    return (grupoSeleccionado?.informes || []).filter(inf => estadoDe(inf) === filtroSeleccionado);
  });

  function seleccionarCuatrimestre(clave: string) {
    cuatrimestreSeleccionado = clave;
    vistaPanel = false;
    filtroSeleccionado = 'todos';
  }

  function estadoDe(informe: InformeGuardado) {
    const prog = progresoDe(informe);
    if (prog >= 100) return 'completado';
    if (prog > 0) return 'en-progreso';
    return 'pendiente';
  }

  function progresoDe(informe: InformeGuardado): number {
    if (informe.progreso !== undefined) return informe.progreso;
    return calcularProgreso(informe);
  }

  function calcularProgreso(informe: InformeGuardado): number {
    const secciones = informe.secciones;
    if (!secciones?.length) return 0;
    let total = 0, hechas = 0;
    for (const sec of secciones) {
      for (const t of sec.tareas || []) {
        total++;
        if (t.ok || t.noOk) hechas++;
      }
    }
    return total > 0 ? Math.round((hechas / total) * 100) : 0;
  }

  function colorEstado(informe: InformeGuardado): string {
    const estado = estadoDe(informe);
    if (estado === 'completado') return '#059669';
    if (estado === 'en-progreso') return '#d97706';
    return '#94a3b8';
  }

  function labelEstado(informe: InformeGuardado): string {
    const estado = estadoDe(informe);
    if (estado === 'completado') return 'COMPLETADO';
    if (estado === 'en-progreso') return 'EN PROGRESO';
    return 'PENDIENTE';
  }

  async function onSubirExcel(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    isSyncing = true;
    try {
      const res = await adminService.sincronizarExcelDesdeArchivo(file);
      const msg = res.message || 'Excel sincronizado correctamente';
      if (res.log) console.log('[Sync log]\n', res.log);
      ui.success(msg);

      configCentrosService.invalidateCache();
      await formPersistenceService.cargarHistorial();
    } catch (err: any) {
      ui.error('Error subiendo Excel: ' + (err.error?.detail || err.message));
    } finally {
      isSyncing = false;
      input.value = '';
    }
  }

  async function descargarExcel() {
    try {
      const blob = await adminService.descargarExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_GTM_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      ui.success('Excel descargado correctamente');
    } catch (err: any) {
      ui.error('Error descargando Excel: ' + (err.error?.detail || err.message));
    }
  }

  async function crearCuatrimestre() {
    await cuatrimestreService.crearCuatrimestreConUI(informesGuardados);
    await formPersistenceService.cargarHistorial();
  }

  let showCrearCuadroModal = $state(false);
  let showTareasEditorCuadros = $state(false);
  let selectedCuadroId = $state<number | null>(null);
  let selectedCuadro = $derived(informesCuadro.find(i => i.id === selectedCuadroId) || null);

  // Derivaciones para filtros y métricas en Cuadro Eléctrico
  let metricasCuadro = $derived.by(() => {
    const total = informesCuadro.length;
    const completados = informesCuadro.filter(i => estadoDe(i) === 'completado').length;
    const enProgreso = informesCuadro.filter(i => estadoDe(i) === 'en-progreso').length;
    const pendientes = total - completados - enProgreso;
    return { total, completados, enProgreso, pendientes };
  });

  let informesCuadroFiltrados = $derived.by(() => {
    if (filtroSeleccionado === 'todos') return informesCuadro;
    return informesCuadro.filter(inf => estadoDe(inf) === filtroSeleccionado);
  });

  // Reiniciar filtro al alternar entre secciones principales
  $effect(() => {
    const _ = menuPrincipal;
    filtroSeleccionado = 'todos';
  });

  function obtenerSeccionesDetalle(informe: InformeGuardado) {
    if (!informe.secciones) return [];
    return informe.secciones.map(sec => {
      const total = sec.tareas?.length || 0;
      const hechas = sec.tareas?.filter((t: any) => t.ok || t.noOk).length || 0;
      const progreso = total > 0 ? Math.round((hechas / total) * 100) : 0;
      return {
        titulo: sec.titulo || 'Sección',
        total,
        hechas,
        progreso
      };
    });
  }

  async function eliminarCuatrimestre(cuatrimestre: string) {
    const ok = await cuatrimestreService.eliminarCuatrimestreConUI(cuatrimestre);
    if (ok) {
      cuatrimestreSeleccionado = '';
      vistaPanel = true;
      navService.cuatrimestreSeleccionado = '';
      navService.persist();
      await formPersistenceService.cargarHistorial();
    }
  }

  async function editarInforme(inf: InformeGuardado) {
    const result = await formPersistenceService.editarInforme(inf);
    if (result) {
      formInitService.setFormData(
        result.obraForm,
        result.fotosPorSeccionBase64,
        result.seccionesColapsadas
      );
      await navService.irAFormulario(inf.cuatrimestre || '', inf.nombreObra, 'admin');
    }
  }

  function crearInformeCuadro() {
    showCrearCuadroModal = true;
  }

  async function editarInformeCuadro(inf: InformeGuardado) {
    const result = await formPersistenceService.editarInforme(inf);
    if (result) {
      formInitService.setFormData(
        result.obraForm,
        result.fotosPorSeccionBase64,
        result.seccionesColapsadas
      );
      await navService.irAFormulario(inf.cuatrimestre || '', inf.nombreObra, 'admin_cuadro');
    }
  }

  async function eliminarInformeCuadro(inf: InformeGuardado) {
    const ok = await ui.confirm(
      'Eliminar Informe',
      `¿Eliminar el informe "${inf.nombreObra}"? Esta acción no se puede deshacer.`,
      'Eliminar',
      'Cancelar'
    );
    if (!ok) return;
    try {
      if (inf.id) {
        await databaseService.eliminar(inf.id);
        await formPersistenceService.cargarHistorial();
        ui.success('Informe eliminado');
      }
    } catch (e: any) {
      ui.error('Error al eliminar: ' + (e.message || 'Error desconocido'));
    }
  }

  function cerrarSesion() {
    adminService.setAdmin(false);
    goto('/');
  }
</script>

<svelte:head>
  <title>Administración | GTM Mantenimiento</title>
</svelte:head>

<div class="admin-layout" class:root-layout={menuPrincipal === 'raiz'}>
  {#if menuPrincipal === 'raiz'}
    <!-- Vista Principal de Bienvenida/Selección -->
    <div class="admin-root-menu">
      <div class="root-menu-container">
        <header class="root-menu-header">
          <div class="root-logo">GTM</div>
          <h1>Panel de Administración</h1>
          <p>Selecciona un módulo de trabajo para continuar</p>
        </header>

        <div class="root-menu-grid">
          <!-- Card Mantenimiento Mercadona -->
          <button class="root-menu-card" onclick={() => menuPrincipal = 'mantenimiento_mercadona'}>
            <div class="card-icon icon-maint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                <path d="M9 14h6"></path>
                <path d="M9 18h6"></path>
                <path d="M9 10h6"></path>
              </svg>
            </div>
            <div class="card-info">
              <h2>Mantenimiento Mercadona</h2>
              <p>Edición de tareas, cuatrimestres, carga de planillas Excel y control de informes de obras.</p>
            </div>
            <div class="card-arrow">➔</div>
          </button>

          <!-- Card Cuadro Eléctrico -->
          <button class="root-menu-card" onclick={() => menuPrincipal = 'cuadro_electrico'}>
            <div class="card-icon icon-electrical">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </div>
            <div class="card-info">
              <h2>Cuadro Eléctrico</h2>
              <p>Gestión de informes de procesos de cuadros eléctricos. Edición de tareas, creación y control de obras.</p>
            </div>
            <div class="card-arrow">➔</div>
          </button>
        </div>

        <div class="root-menu-footer">
          <button class="btn-root-logout" onclick={cerrarSesion}>Cerrar Sesión</button>
        </div>
      </div>
    </div>
  {:else if menuPrincipal === 'cuadro_electrico'}
    <!-- Sidebar (desktop only) -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <span class="brand-logo">GTM</span>
        <span class="brand-dot"></span>
        <span class="brand-text">Cuadro Eléctrico</span>
      </div>

      <div class="sidebar-nav-back">
        <button class="btn-back-to-menu" onclick={() => { menuPrincipal = 'raiz'; selectedCuadroId = null; }}>
          <span class="icon">←</span> Volver al Menú
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-label">Informes</div>
        {#each informesCuadro as inf (inf.id)}
          <button
            class="nav-item"
            class:active={selectedCuadroId === inf.id}
            onclick={() => editarInformeCuadro(inf)}>
            <div class="nav-item-title">{ inf.nombreObra }</div>
            <div class="nav-item-meta">
              {#if inf.nOrdenCuadro}
                Orden: {inf.nOrdenCuadro}
              {:else}
                {progresoDe(inf)}%
              {/if}
            </div>
          </button>
        {/each}
      </nav>

      <div class="sidebar-footer">
        <button class="btn-logout" onclick={cerrarSesion} title="Cerrar sesión">
          Salir
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
      <header class="main-header">
        <div class="header-title">
          {#if selectedCuadroId !== null}
            <button class="btn-back-proyectos" onclick={() => { selectedCuadroId = null; }} title="Volver al Listado de Proyectos">
              <span class="icon">←</span> Volver a Proyectos
            </button>
          {/if}
          <div>
            <h1>{ selectedCuadro?.nombreObra || 'Cuadro Eléctrico' }</h1>
            <span class="header-subtitle">Gestión de informes de cuadros eléctricos</span>
          </div>
        </div>
        <div class="header-actions">
          <div class="action-group">
            <button class="btn-icon-label primary" onclick={() => showTareasEditorCuadros = true} title="Editar plantilla predeterminada de tareas para futuros cuadros">
              <span class="icon">🛠️</span>
              <span class="label">Editar Tareas Plantilla</span>
            </button>
            <button class="btn-icon-label primary" onclick={crearInformeCuadro} title="Nuevo informe">
              <span class="icon">➕</span>
              <span class="label">Nuevo Informe</span>
            </button>
          </div>
        </div>
      </header>

      <div class="desktop-content">
        {#if selectedCuadro}
          <div class="cuadro-detail-header-premium">
            <div class="cuadro-detail-icon-wrap">⚡</div>
            <div class="cuadro-detail-info-wrap">
              <h2>{ selectedCuadro.nombreObra }</h2>
              <div class="cuadro-detail-meta-wrap">
                {#if selectedCuadro.nProy}<span>Proy: {selectedCuadro.nProy}</span>{/if}
                {#if selectedCuadro.nOrdenCuadro}<span>Orden: {selectedCuadro.nOrdenCuadro}</span>{/if}
                {#if selectedCuadro.nOrdenInstalacion}<span>Inst: {selectedCuadro.nOrdenInstalacion}</span>{/if}
              </div>
            </div>
            <div class="cuadro-detail-right">
              <div class="cuadro-detail-status-pill" style="border-left: 4px solid {colorEstado(selectedCuadro)}; color: {colorEstado(selectedCuadro)}">
                { labelEstado(selectedCuadro) }
              </div>
            </div>
          </div>

          <div class="cuadro-detail-stats-panel">
            <div class="cuadro-progreso-row">
              <div class="cuadro-progreso-bar">
                <div class="cuadro-progreso-fill" style="width: {progresoDe(selectedCuadro)}%"></div>
              </div>
              <span class="cuadro-progreso-texto">{progresoDe(selectedCuadro)}% completado</span>
            </div>
            
            <div class="cuadro-detail-actions">
              <button class="btn-icon-label danger" onclick={() => eliminarInformeCuadro(selectedCuadro)}>
                <span class="icon">🗑️</span>
                <span class="label">Eliminar</span>
              </button>
            </div>
          </div>

          <h3 class="cuadro-sections-title">Progreso Desglosado por Fase</h3>
          <div class="cuadro-sections-grid">
            {#each obtenerSeccionesDetalle(selectedCuadro) as sec, index}
              <div class="section-progreso-card" role="button" tabindex="0" onclick={() => editarInformeCuadro(selectedCuadro)} onkeydown={(e) => e.key === 'Enter' && editarInformeCuadro(selectedCuadro)}>
                <div class="section-card-header">
                  <span class="section-num" style="background: {sec.progreso === 100 ? '#e6f4ea' : sec.progreso > 0 ? '#fef3c7' : '#f1f5f9'}; color: {sec.progreso === 100 ? '#137333' : sec.progreso > 0 ? '#b06000' : '#475569'}">{index}</span>
                  <span class="section-title">{sec.titulo.replace(/^\d+\.\s*/, '')}</span>
                </div>
                <div class="section-card-body">
                  <div class="section-stats">
                    <span class="section-tasks">{sec.hechas} / {sec.total} tareas</span>
                    <span class="section-percent" style="color: {sec.progreso === 100 ? '#137333' : sec.progreso > 0 ? '#b06000' : '#64748b'}">{sec.progreso}%</span>
                  </div>
                  <div class="section-mini-progress">
                    <div class="section-mini-fill" style="width: {sec.progreso}%; background: {sec.progreso === 100 ? '#059669' : sec.progreso > 0 ? '#d97706' : '#cbd5e1'}"></div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else if informesCuadro.length > 0}
          <!-- Métricas e Interacción de Cuadros -->
          <section class="metrics-row">
            <button class="metric-card" class:active={filtroSeleccionado === 'todos'} onclick={() => filtroSeleccionado = 'todos'}>
              <div class="metric-value">{ metricasCuadro.total }</div>
              <div class="metric-label">CUADROS</div>
            </button>
            <button class="metric-card metric-green" class:active={filtroSeleccionado === 'completado'} onclick={() => filtroSeleccionado = 'completado'}>
              <div class="metric-value">{ metricasCuadro.completados }</div>
              <div class="metric-label">COMPLETADOS</div>
            </button>
            <button class="metric-card metric-orange" class:active={filtroSeleccionado === 'en-progreso'} onclick={() => filtroSeleccionado = 'en-progreso'}>
              <div class="metric-value">{ metricasCuadro.enProgreso }</div>
              <div class="metric-label">EN PROGRESO</div>
            </button>
            <button class="metric-card metric-red" class:active={filtroSeleccionado === 'pendiente'} onclick={() => filtroSeleccionado = 'pendiente'}>
              <div class="metric-value">{ metricasCuadro.pendientes }</div>
              <div class="metric-label">PENDIENTES</div>
            </button>
          </section>

          <div class="centros-label">CUADROS ({informesCuadroFiltrados.length})</div>

          <div class="cuadro-grid">
            {#each informesCuadroFiltrados as inf (inf.id)}
                <div class="cuadro-card" role="button" tabindex="0" onclick={() => editarInformeCuadro(inf)} onkeydown={(e) => e.key === 'Enter' && editarInformeCuadro(inf)}>
                <div class="cuadro-card-header">
                  <div class="cuadro-card-icon" style="background: {progresoDe(inf) === 100 ? '#e6f4ea' : progresoDe(inf) > 0 ? '#fffbeb' : '#f1f5f9'}; color: {progresoDe(inf) === 100 ? '#059669' : progresoDe(inf) > 0 ? '#d97706' : '#64748b'}">⚡</div>
                  <div class="cuadro-card-info">
                    <h3 class="cuadro-card-title">{ inf.nombreObra }</h3>
                    {#if inf.nProy}
                      <span class="cuadro-card-meta">Proy: {inf.nProy}</span>
                    {/if}
                    {#if inf.nOrdenCuadro}
                      <span class="cuadro-card-meta">Orden: {inf.nOrdenCuadro}</span>
                    {/if}
                  </div>
                  <div class="cuadro-card-estado" style="color: {colorEstado(inf)}">
                    { labelEstado(inf) }
                  </div>
                </div>
                <div class="cuadro-card-body">
                  <div class="cuadro-progreso">
                    <div class="cuadro-progreso-bar">
                      <div class="cuadro-progreso-fill" style="width: {progresoDe(inf)}%; background: {colorEstado(inf)}"></div>
                    </div>
                    <span class="cuadro-progreso-texto">{progresoDe(inf)}%</span>
                  </div>
                  <div class="cuadro-card-meta-row">
                    <span>Modificado: {inf.ultimaModificacion || '—'}</span>
                  </div>
                  <!-- Acciones Rápidas al pasar el cursor (Hover) -->
                  <div class="cuadro-card-actions">
                    <button class="btn-card-action delete" onclick={(e) => { e.stopPropagation(); eliminarInformeCuadro(inf); }} title="Eliminar">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-state">
            <div class="cuadro-empty-icon" style="font-size: 48px; margin-bottom: 12px;">⚡</div>
            <h2 style="margin: 0 0 8px; font-size: 18px;">No hay informes de Cuadro Eléctrico</h2>
            <p style="margin: 0 0 20px; color: #64748b;">Crea un nuevo informe para comenzar.</p>
            <button class="btn-icon-label primary" onclick={crearInformeCuadro}>
              <span class="icon">➕</span>
              <span class="label">Crear Primer Informe</span>
            </button>
          </div>
        {/if}
      </div>
    </main>

    {#if showCrearCuadroModal}
      <CrearCuadroElectricoModal
        onClose={() => showCrearCuadroModal = false}
        onCreated={() => { showCrearCuadroModal = false; selectedCuadroId = null; }}
      />
    {/if}

    {#if showTareasEditorCuadros}
      <TareasEditorCuadros
        onClose={() => showTareasEditorCuadros = false}
      />
    {/if}
  {:else if menuPrincipal === 'mantenimiento_mercadona'}
    <!-- Sidebar (desktop only) -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <span class="brand-logo">GTM</span>
        <span class="brand-dot"></span>
        <span class="brand-text">Mantenimiento</span>
      </div>

      <div class="sidebar-nav-back">
        <button class="btn-back-to-menu" onclick={() => { menuPrincipal = 'raiz'; cuatrimestreSeleccionado = ''; }}>
          <span class="icon">←</span> Volver al Menú
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-label">Cuatrimestre</div>
        {#each cuatrimestres as grupo (grupo.clave)}
          <button
            class="nav-item"
            class:active={cuatrimestreSeleccionado === grupo.clave}
            onclick={() => seleccionarCuatrimestre(grupo.clave)}>
            <div class="nav-item-title">{ grupo.label }</div>
            <div class="nav-item-meta">{ grupo.informes.length } centros</div>
          </button>
        {/each}
      </nav>

      <div class="sidebar-footer">
        <button class="btn-logout" onclick={cerrarSesion} title="Cerrar sesión">
          Salir
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
      <!-- Desktop Top Bar -->
      <header class="main-header">
        <div class="header-title">
          <button class="btn-back-header" onclick={() => { menuPrincipal = 'raiz'; cuatrimestreSeleccionado = ''; }} title="Volver al Menú Principal">←</button>
          <div>
            <h1>{ grupoSeleccionado?.label || 'Administración' }</h1>
            <span class="header-subtitle">Informes de mantenimiento</span>
          </div>
        </div>
        <div class="header-actions">
          <!-- Selector de Vista -->
          <div class="action-group">
            <span class="btn-view-toggle active">Centros</span>
          </div>

          <!-- Grupo Excel -->
          <div class="action-group">
            <input type="file" bind:this={excelInput} accept=".xlsx" hidden onchange={onSubirExcel} />
            <button class="btn-icon-label secondary" onclick={() => excelInput!.click()} disabled={isSyncing} title="Subir archivo Excel">
              <span class="icon">📤</span>
              <span class="label">{ isSyncing ? 'Subiendo...' : 'Subir Excel' }</span>
            </button>
            <button class="btn-icon-label secondary" onclick={descargarExcel} title="Descargar último Excel">
              <span class="icon">📥</span>
              <span class="label">Descargar</span>
            </button>
          </div>

          <!-- Grupo Gestión -->
          <div class="action-group">
            <button class="btn-icon-label primary" onclick={() => showTareasEditor = true} title="Editar tareas de centros">
              <span class="icon">🛠️</span>
              <span class="label">Editar Tareas</span>
            </button>
            {#if cuatrimestreSeleccionado}
              <button class="btn-icon-label danger" onclick={() => eliminarCuatrimestre(cuatrimestreSeleccionado)} title="Eliminar este cuatrimestre">
                <span class="icon">🗑️</span>
                <span class="label">Eliminar</span>
              </button>
            {/if}
            <button class="btn-icon-label primary" onclick={crearCuatrimestre} title="Crear nuevo cuatrimestre">
              <span class="icon">➕</span>
              <span class="label">Nuevo Cuatrimestre</span>
            </button>
          </div>
        </div>
      </header>

      <!-- ===== MOBILE: PANEL VIEW ===== -->
      <div class="mobile-view mobile-panel-view" class:active={vistaPanel}>
        <div class="mobile-panel-header">
          <div class="mobile-brand-row">
            <button class="admin-back-link" onclick={() => { menuPrincipal = 'raiz'; cuatrimestreSeleccionado = ''; }}>‹ Menú</button>
            <div class="mobile-brand">
              <span class="mobile-brand-arrow">▶</span>
              <span class="mobile-brand-name">GTM</span>
            </div>
          </div>
          <h1 class="mobile-panel-title">Panel de administración</h1>
          <p class="mobile-panel-subtitle">Gestiona datos base y estructura de cuatrimestres</p>
        </div>
        
        <div class="mobile-panel-body">
          <div class="mobile-section-label">ACCIONES</div>
          <div class="mobile-actions-grid">
            <button class="mobile-action-card" onclick={crearCuatrimestre}>
              <div class="mac-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="9" y1="13" x2="15" y2="13"/>
                  <line x1="9" y1="17" x2="15" y2="17"/>
                </svg>
              </div>
              <div class="mac-title">Crear cuatrimestre</div>
              <div class="mac-desc">Nuevo cuatrimestre de seguimiento</div>
            </button>
            <button class="mobile-action-card" onclick={() => excelInput!.click()}>
              <div class="mac-icon">
                <div class="excel-icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2289.75 2130">
                    <path fill="#185C37" d="M1437.75 1011.75 532.5 852v1180.393c0 53.907 43.7 97.607 97.607 97.607h1562.036c53.907 0 97.607-43.7 97.607-97.607V1597.5z"/>
                    <path fill="#21A366" d="M1437.75 0H630.107C576.2 0 532.5 43.7 532.5 97.607V532.5L1437.75 1065 1917 1224.75 2289.75 1065V532.5z"/>
                    <path fill="#107C41" d="M532.5 532.5h905.25V1065H532.5z"/>
                    <path fill="#33C481" d="M2192.143 0H1437.75v532.5h852V97.607C2289.75 43.7 2246.05 0 2192.143 0z"/>
                    <path fill="#107C41" d="M1437.75 1065h852v532.5h-852z"/>
                    <path fill="#fff" d="m302.3 1382.264 205.332-318.169L319.5 747.683h151.336l102.666 202.35c9.479 19.223 15.975 33.494 19.49 42.919h1.331c6.745-15.336 13.845-30.228 21.3-44.677L725.371 747.79H864.3l-192.925 314.548L869.2 1382.263H721.378L602.79 1160.158c-5.586-9.45-10.326-19.376-14.164-29.66h-1.757c-3.474 10.075-8.083 19.722-13.739 28.755L451.028 1382.264Z"/>
                  </svg>
                </div>
              </div>
              <div class="mac-title">Subir Excel</div>
              <div class="mac-desc">Importar datos de centros</div>
            </button>
            <button class="mobile-action-card" onclick={descargarExcel}>
              <div class="mac-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <div class="mac-title">Descargar Excel</div>
              <div class="mac-desc">Descargar último archivo</div>
            </button>
          </div>

          <div class="mobile-section-label">CUATRIMESTRES</div>
          <div class="mobile-cuatrimestres-list">
            {#each cuatrimestres as grupo (grupo.clave)}
              <button class="mobile-cuatrimestre-item" onclick={() => seleccionarCuatrimestre(grupo.clave)}>
                <div class="mci-info">
                  <div class="mci-title">{ grupo.label }</div>
                  <div class="mci-meta">{ grupo.informes.length } centros</div>
                </div>
                <div class="mci-count">{ grupo.informes.length }</div>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- ===== MOBILE: CUATRIMESTRE VIEW ===== -->
      <div class="mobile-view mobile-cuatrimestre-view" class:active={!vistaPanel}>
        <div class="mobile-cuatrimestre-header">
          <div class="mobile-brand-row">
            <button class="admin-back-link" onclick={() => { vistaPanel = true; cuatrimestreSeleccionado = ''; }}>‹ Cuatrimestre</button>
            <div class="mobile-brand">
              <span class="mobile-brand-arrow">▶</span>
              <span class="mobile-brand-name">GTM</span>
            </div>
          </div>
          <div class="mobile-cuatri-row">
            <span class="mobile-cuatri-title">{ grupoSeleccionado?.label }</span>
          </div>
          <p class="mobile-subtitle">Mercadona · informes de mantenimiento</p>
          <div class="mobile-metrics">
            <button class="mm-card" class:active={filtroSeleccionado === 'todos'} onclick={() => filtroSeleccionado = 'todos'}>
              <div class="mm-value">{ metricas.total }</div>
              <div class="mm-label">CENTROS</div>
            </button>
            <button class="mm-card mm-green" class:active={filtroSeleccionado === 'completado'} onclick={() => filtroSeleccionado = 'completado'}>
              <div class="mm-value">{ metricas.completados }</div>
              <div class="mm-label">COMPLETADOS</div>
            </button>
            <button class="mm-card mm-orange" class:active={filtroSeleccionado === 'en-progreso'} onclick={() => filtroSeleccionado = 'en-progreso'}>
              <div class="mm-value">{ metricas.enProgreso }</div>
              <div class="mm-label">PROGRESO</div>
            </button>
            <button class="mm-card mm-red" class:active={filtroSeleccionado === 'pendiente'} onclick={() => filtroSeleccionado = 'pendiente'}>
              <div class="mm-value">{ metricas.pendientes }</div>
              <div class="mm-label">PENDIENTES</div>
            </button>
          </div>
        </div>

        <div class="mobile-cuatrimestre-body">
          <div class="centros-label">CENTROS ({informesFiltrados.length})</div>
          <section class="centros-grid">
            {#each informesFiltrados as inf (inf.id)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="centro-card"
                style="border-left-color: {colorEstado(inf)}; --dot-color: {colorEstado(inf)}"
                data-estado={estadoDe(inf)}
                onclick={() => editarInforme(inf)}>
                <div class="card-header">
                  <span class="centro-nombre">{ inf.nombreObra }</span>
                  <span class="centro-estado" style="color: {colorEstado(inf)}">
                    { labelEstado(inf) }
                  </span>
                </div>
                <div class="card-body">
                  <div class="centro-progreso">
                    <span class="progreso-valor">{ progresoDe(inf) }% completado</span>
                  </div>
                  <div class="centro-fecha">
                    { inf.ultimaModificacion || '—' }
                  </div>
                </div>
              </div>
            {/each}
          </section>

          {#if cuatrimestreSeleccionado}
            <button class="mobile-delete-cuatrimestre" onclick={() => eliminarCuatrimestre(cuatrimestreSeleccionado)}>
              <span class="mdi">🗑</span> Eliminar cuatrimestre
            </button>
          {/if}
        </div>
      </div>

      <!-- ===== DESKTOP CONTENT ===== -->
      <div class="desktop-content">
        {#if grupoSeleccionado}
          <!-- Métricas -->
          <section class="metrics-row">
            <button class="metric-card" class:active={filtroSeleccionado === 'todos'} onclick={() => filtroSeleccionado = 'todos'}>
              <div class="metric-value">{ metricas.total }</div>
              <div class="metric-label">CENTROS</div>
            </button>
            <button class="metric-card metric-green" class:active={filtroSeleccionado === 'completado'} onclick={() => filtroSeleccionado = 'completado'}>
              <div class="metric-value">{ metricas.completados }</div>
              <div class="metric-label">COMPLETADOS</div>
            </button>
            <button class="metric-card metric-orange" class:active={filtroSeleccionado === 'en-progreso'} onclick={() => filtroSeleccionado = 'en-progreso'}>
              <div class="metric-value">{ metricas.enProgreso }</div>
              <div class="metric-label">EN PROGRESO</div>
            </button>
            <button class="metric-card metric-red" class:active={filtroSeleccionado === 'pendiente'} onclick={() => filtroSeleccionado = 'pendiente'}>
              <div class="metric-value">{ metricas.pendientes }</div>
              <div class="metric-label">PENDIENTES</div>
            </button>
          </section>

          <div class="centros-label">CENTROS ({informesFiltrados.length})</div>
          <section class="centros-grid">
            {#each informesFiltrados as inf (inf.id)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="centro-card"
                style="border-left-color: {colorEstado(inf)}; --dot-color: {colorEstado(inf)}"
                data-estado={estadoDe(inf)}
                onclick={() => editarInforme(inf)}>
                <div class="card-header">
                  <span class="centro-nombre">{ inf.nombreObra }</span>
                  <span class="centro-estado" style="color: {colorEstado(inf)}">
                    { labelEstado(inf) }
                  </span>
                </div>
                <div class="card-body">
                  <div class="centro-progreso">
                    <span class="progreso-valor">{ progresoDe(inf) }% completado</span>
                  </div>
                  <div class="centro-fecha">
                    { inf.ultimaModificacion || '—' }
                  </div>
                </div>
              </div>
            {/each}
          </section>
        {:else}
          <div class="empty-state">
            No hay cuatrimestres registrados.
          </div>
        {/if}
      </div>
    </main>

    {#if showTareasEditor}
      <TareasEditor 
        informes={informesFiltrados} 
        onClose={() => showTareasEditor = false} 
      />
    {/if}
  {/if}
</div>

