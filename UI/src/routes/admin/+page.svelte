<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { adminService } from '$lib/services/admin.svelte';
  import { cuatrimestreService } from '$lib/services/cuatrimestre.svelte';
  import { formPersistenceService } from '$lib/services/form-persistence.svelte';
  import { formInitService } from '$lib/services/form-initialization.svelte';
  import { navService } from '$lib/services/navigation.svelte';
  import { ui } from '$lib/services/ui.svelte';
import { databaseService } from '$lib/services/database.svelte';
import { CUADRO_ELECTRICO_TEMPLATE } from '$lib/templates/cuadroElectrico';
import type { InformeGuardado, GrupoCuatrimestre } from '$lib/types/informe.interface';
import TareasEditor from '$lib/components/admin/TareasEditor.svelte';
import TareasEditorCuadros from '$lib/components/admin/TareasEditorCuadros.svelte';
import CrearCuadroElectricoModal from '$lib/components/admin/CrearCuadroElectricoModal.svelte';

  import './admin-page.css';

  let isAdmin = $derived(adminService.isAdmin);
  let vistaPanel = $state(true);
  let showTareasEditor = $state(false);
  let cuatrimestreSeleccionado = $state('');
  let menuPrincipal = $state<'raiz' | 'mantenimiento_mercadona' | 'cuadro_electrico'>('raiz');

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

  let grupoSeleccionado = $derived.by(() => {
    if (!cuatrimestreSeleccionado) return null;
    return cuatrimestres.find(g => g.clave === cuatrimestreSeleccionado) || null;
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

  async function eliminarInformeIndividual(inf: InformeGuardado) {
    const ok = await ui.confirm(
      'Eliminar informe',
      `¿Eliminar el informe de "${inf.nombreObra}"? Esta acción no se puede deshacer.`,
      'Eliminar',
      'Cancelar'
    );
    if (!ok || !inf.id) return;
    try {
      await databaseService.eliminar(inf.id);
      await formPersistenceService.cargarHistorial();
      ui.success('Informe eliminado');
    } catch (e: any) {
      ui.error('Error al eliminar: ' + (e.message || 'Error desconocido'));
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

  function seleccionarCuadro(id: number | undefined) {
    if (id !== undefined) selectedCuadroId = id;
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

  function volverAlDashboard() {
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
              <h2>Cuadros Eléctricos</h2>
              <p>Gestión de informes de procesos de cuadros eléctricos. Edición de tareas, creación y control de obras.</p>
            </div>
            <div class="card-arrow">➔</div>
          </button>
        </div>

        <div class="root-menu-footer">
          <button class="btn-root-logout" onclick={volverAlDashboard}>Volver al Dashboard</button>
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
          <span class="icon">←</span> Volver al panel de administración
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
        <button class="btn-logout" onclick={volverAlDashboard} title="Volver al dashboard de usuario">
          Volver al Dashboard
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

      <!-- ===== MOBILE: PANEL VIEW ===== -->
      <div class="mobile-view mobile-panel-view" class:active={selectedCuadroId === null}>
        <div class="mobile-panel-header">
          <div class="mobile-brand-row">
            <button class="admin-back-link" onclick={() => { menuPrincipal = 'raiz'; selectedCuadroId = null; }}>‹ Menú</button>
            <div class="mobile-brand">
              <span class="mobile-brand-arrow">▶</span>
              <span class="mobile-brand-name">GTM</span>
            </div>
          </div>
          <h1 class="mobile-panel-title">Cuadros Eléctrico</h1>
          <p class="mobile-panel-subtitle">Gestión de informes de cuadros eléctricos</p>
        </div>

        <div class="mobile-panel-body">
          <div class="mobile-section-label">ACCIONES</div>
          <div class="mobile-actions-grid">
            <button class="mobile-action-card" onclick={crearInformeCuadro}>
              <div class="mac-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div class="mac-title">Nuevo Informe</div>
              <div class="mac-desc">Crear nuevo informe de cuadro eléctrico</div>
            </button>
            <button class="mobile-action-card" onclick={() => showTareasEditorCuadros = true}>
              <div class="mac-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </div>
              <div class="mac-title">Editar Tareas</div>
              <div class="mac-desc">Editar plantilla de tareas predeterminada</div>
            </button>
          </div>

          <div class="mobile-section-label">MÉTRICAS</div>
          <div class="mobile-panel-metrics">
            <button class="pm-card" class:active={filtroSeleccionado === 'todos'} onclick={() => filtroSeleccionado = 'todos'}>
              <div class="pm-value">{ metricasCuadro.total }</div>
              <div class="pm-label">CUADROS</div>
            </button>
            <button class="pm-card pm-green" class:active={filtroSeleccionado === 'completado'} onclick={() => filtroSeleccionado = 'completado'}>
              <div class="pm-value">{ metricasCuadro.completados }</div>
              <div class="pm-label">COMPLETADOS</div>
            </button>
            <button class="pm-card pm-orange" class:active={filtroSeleccionado === 'en-progreso'} onclick={() => filtroSeleccionado = 'en-progreso'}>
              <div class="pm-value">{ metricasCuadro.enProgreso }</div>
              <div class="pm-label">PROGRESO</div>
            </button>
            <button class="pm-card pm-red" class:active={filtroSeleccionado === 'pendiente'} onclick={() => filtroSeleccionado = 'pendiente'}>
              <div class="pm-value">{ metricasCuadro.pendientes }</div>
              <div class="pm-label">PENDIENTES</div>
            </button>
          </div>

          <div class="mobile-section-label">INFORMES</div>
          <div class="mobile-cuatrimestres-list">
            {#each informesCuadroFiltrados as inf (inf.id)}
              <div class="mobile-cuatrimestre-item">
                <button class="mci-main" onclick={() => seleccionarCuadro(inf.id)}>
                  <div class="mci-info">
                    <div class="mci-title">{ inf.nombreObra }</div>
                    <div class="mci-meta">{ labelEstado(inf) } · {progresoDe(inf)}%</div>
                  </div>
                  <div class="mci-count">{ progresoDe(inf) }%</div>
                </button>
                <button
                  class="btn-mci-delete"
                  onclick={() => eliminarInformeCuadro(inf)}
                  title="Eliminar informe"
                >🗑️</button>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- ===== MOBILE: DETAIL VIEW ===== -->
      <div class="mobile-view mobile-detail-view" class:active={selectedCuadroId !== null}>
        <div class="mobile-cuatrimestre-header">
          <div class="mobile-brand-row">
            <button class="admin-back-link" onclick={() => { selectedCuadroId = null; }}>‹ Cuadros</button>
            <div class="mobile-brand">
              <span class="mobile-brand-arrow">▶</span>
              <span class="mobile-brand-name">GTM</span>
            </div>
          </div>
          <div class="mobile-cuatri-row">
            <span class="mobile-cuatri-title">{ selectedCuadro?.nombreObra || 'Cuadro Eléctrico' }</span>
          </div>
          <p class="mobile-subtitle">Cuadro Eléctrico · detalle de informe</p>
        </div>

        <div class="mobile-cuatrimestre-body">
          {#if selectedCuadro}
            <div style="padding: 12px 16px 0; display: flex; gap: 8px;">
              {#if selectedCuadro.nProy}<span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 10px;border-radius:100px;">Proy: {selectedCuadro.nProy}</span>{/if}
              {#if selectedCuadro.nOrdenCuadro}<span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 10px;border-radius:100px;">Orden: {selectedCuadro.nOrdenCuadro}</span>{/if}
              {#if selectedCuadro.nOrdenInstalacion}<span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 10px;border-radius:100px;">Inst: {selectedCuadro.nOrdenInstalacion}</span>{/if}
            </div>

            <div style="padding: 16px;">
              <div class="cuadro-progreso-row">
                <div class="cuadro-progreso-bar" style="height:8px;">
                  <div class="cuadro-progreso-fill" style="width:{progresoDe(selectedCuadro)}%"></div>
                </div>
                <span class="cuadro-progreso-texto">{progresoDe(selectedCuadro)}%</span>
              </div>

              <div style="display:flex;gap:8px;margin-bottom:20px;">
                <button class="btn-icon-label primary" onclick={() => editarInformeCuadro(selectedCuadro)} style="flex:1;justify-content:center;">
                  <span class="icon">✏️</span>
                  <span class="label">Editar</span>
                </button>
                <button class="btn-icon-label danger" onclick={() => eliminarInformeCuadro(selectedCuadro)} style="flex:1;justify-content:center;">
                  <span class="icon">🗑️</span>
                  <span class="label">Eliminar</span>
                </button>
              </div>

              <h3 class="cuadro-sections-title">Progreso por Fase</h3>
              <div style="display:flex;flex-direction:column;gap:10px;">
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
            </div>
          {/if}
        </div>
      </div>

      <!-- ===== DESKTOP CONTENT ===== -->
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
          <span class="icon">←</span> Volver al panel de administración
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-label">Cuatrimestre</div>
        {#each cuatrimestres as grupo (grupo.clave)}
          <div class="nav-item-wrap">
            <button
              class="nav-item"
              class:active={cuatrimestreSeleccionado === grupo.clave}
              onclick={() => seleccionarCuatrimestre(grupo.clave)}>
              <div class="nav-item-title">{ grupo.label }</div>
              <div class="nav-item-meta">{ grupo.informes.length } centros</div>
            </button>
            <button
              class="btn-sidebar-delete"
              onclick={() => eliminarCuatrimestre(grupo.clave)}
              title="Eliminar cuatrimestre"
            >🗑️</button>
          </div>
        {/each}
      </nav>

      <div class="sidebar-footer">
        <button class="btn-logout" onclick={volverAlDashboard} title="Volver al dashboard de usuario">
          Volver al Dashboard
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
      <!-- Desktop Top Bar -->
      <header class="main-header">
        <div class="header-title">
          <div>
            <h1>{ grupoSeleccionado?.label || 'Administración' }</h1>
            {#if grupoSeleccionado}
              <span class="header-subtitle">Informes de mantenimiento</span>
            {:else}
              <span class="header-subtitle">Selecciona un cuatrimestre en el panel lateral</span>
            {/if}
          </div>
        </div>
        <div class="header-actions">
          <!-- Grupo Gestión -->
          <div class="action-group">
            <button class="btn-icon-label primary" onclick={() => showTareasEditor = true} title="Editar tareas de centros">
              <span class="icon">🛠️</span>
              <span class="label">Editar Tareas</span>
            </button>
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
          <h1 class="mobile-panel-title">Mantenimiento Mercadona</h1>
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
          </div>

          <div class="mobile-section-label">CUATRIMESTRES</div>
          <div class="mobile-cuatrimestres-list">
            {#each cuatrimestres as grupo (grupo.clave)}
              <div class="mobile-cuatrimestre-item">
                <button class="mci-main" onclick={() => seleccionarCuatrimestre(grupo.clave)}>
                  <div class="mci-info">
                    <div class="mci-title">{ grupo.label }</div>
                    <div class="mci-meta">{ grupo.informes.length } centros</div>
                  </div>
                  <div class="mci-count">{ grupo.informes.length }</div>
                </button>
                <button
                  class="btn-mci-delete"
                  onclick={() => eliminarCuatrimestre(grupo.clave)}
                  title="Eliminar cuatrimestre"
                >🗑️</button>
              </div>
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
        </div>

        <div class="mobile-cuatrimestre-body">
          <div class="mobile-metrics" style="padding: 16px 16px 0;">
            <button class="pm-card" class:active={filtroSeleccionado === 'todos'} onclick={() => filtroSeleccionado = 'todos'}>
              <div class="pm-value">{ metricas.total }</div>
              <div class="pm-label">CENTROS</div>
            </button>
            <button class="pm-card pm-green" class:active={filtroSeleccionado === 'completado'} onclick={() => filtroSeleccionado = 'completado'}>
              <div class="pm-value">{ metricas.completados }</div>
              <div class="pm-label">COMPLETADOS</div>
            </button>
            <button class="pm-card pm-orange" class:active={filtroSeleccionado === 'en-progreso'} onclick={() => filtroSeleccionado = 'en-progreso'}>
              <div class="pm-value">{ metricas.enProgreso }</div>
              <div class="pm-label">PROGRESO</div>
            </button>
            <button class="pm-card pm-red" class:active={filtroSeleccionado === 'pendiente'} onclick={() => filtroSeleccionado = 'pendiente'}>
              <div class="pm-value">{ metricas.pendientes }</div>
              <div class="pm-label">PENDIENTES</div>
            </button>
          </div>
          <div class="centros-label" style="padding-top: 12px;">CENTROS ({informesFiltrados.length})</div>
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
        {:else if cuatrimestres.length > 0}
          <div class="empty-state">
            Selecciona un cuatrimestre en el panel lateral para ver sus centros.
          </div>
        {:else}
          <div class="empty-state">
            No hay cuatrimestres registrados. Crea uno nuevo con el botón "Nuevo Cuatrimestre".
          </div>
        {/if}
      </div>
    </main>

    {#if showTareasEditor}
      <TareasEditor 
        informes={informesMantenimiento} 
        onClose={() => showTareasEditor = false} 
      />
    {/if}
  {/if}
</div>

