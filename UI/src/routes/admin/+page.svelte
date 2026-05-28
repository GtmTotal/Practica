<script lang="ts">
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { adminService } from '$lib/services/stores/admin.svelte';
import { cuatrimestreService } from '$lib/services/stores/cuatrimestre.svelte';
import { formPersistenceService } from '$lib/services/domain/form-persistence.svelte';
import { formInitService } from '$lib/services/domain/form-initialization.svelte';
import { navService } from '$lib/services/stores/navigation.svelte';
import { ui } from '$lib/services/stores/ui.svelte';
import { databaseService } from '$lib/services/api/database.svelte';
import { CUADRO_ELECTRICO_TEMPLATE } from '$lib/templates/cuadroElectrico';
import type { InformeGuardado, GrupoCuatrimestre } from '$lib/types/informe.interface';
import { progresoDe, estadoDe, colorEstado, labelEstado } from '$lib/utils/informe-utils';
import TareasEditor from '$lib/components/admin/TareasEditor.svelte';
import TareasEditorCuadros from '$lib/components/admin/TareasEditorCuadros.svelte';
import CrearCuadroElectricoModal from '$lib/components/admin/CrearCuadroElectricoModal.svelte';
import ProgressBar from '$lib/components/ProgressBar.svelte';
import { DsMobileHeader } from '$lib/components/design-system';




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
    const ok = await ui.confirmDanger(
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

  // Search in admin dashboard
  let searchQueryAdmin = $state('');
  let showSearchResultsAdmin = $state(false);
  let resultadosBusquedaAdmin = $derived.by(() => {
    const q = (searchQueryAdmin || '').trim().toLowerCase();
    if (!q) return [];
    const source = menuPrincipal === 'cuadro_electrico'
      ? informesCuadro
      : menuPrincipal === 'mantenimiento_mercadona'
        ? informesMantenimiento
        : informesGuardados;
    const all = source || [];
    return all
      .filter(inf => {
        const name = (inf.nombreObra || '').toLowerCase();
        const cuat = (inf.cuatrimestre || '').toLowerCase();
        const ord = (inf.nOrdenCuadro || '')+'';
        return name.includes(q) || cuat.includes(q) || ord.toLowerCase().includes(q);
      })
      .slice(0, 12);
  });

  async function abrirDesdeBusquedaAdmin(inf: InformeGuardado) {
    searchQueryAdmin = '';
    showSearchResultsAdmin = false;
    if (inf.tipo === 'cuadro_electrico') {
      await editarInformeCuadro(inf);
    } else {
      await editarInforme(inf);
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
    const ok = await ui.confirmDanger(
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
  <meta name="description" content="Panel de administración de GTM Mantenimiento — edición de tareas, cuatrimestres, plantillas y control de informes.">
</svelte:head>

<div class="admin-layout" class:root-layout={menuPrincipal === 'raiz'}>
  {#if menuPrincipal === 'raiz'}
    <!-- Vista Principal de Bienvenida/Selección -->
    <div class="admin-root-menu">
      <div class="root-menu-container">
        <div class="mobile-only">
          <DsMobileHeader
            title="Administración"
            subtitle="Panel de Control GTM"
            showAdminButton={false}
          />
        </div>
        <header class="root-menu-header desktop-only">
          <img src="/gtmCompleto.png" alt="GTM" class="root-logo" style="width: 140px;">
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
          <button class="btn-root-logout" onclick={volverAlDashboard}>Ver panel técnicos</button>
        </div>
      </div>
    </div>
  {:else if menuPrincipal === 'cuadro_electrico'}
    <!-- Sidebar (desktop only) -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <img src="/gtmCompleto.png" alt="GTM" class="brand-logo" style="height: 40px;">
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
          <div class="nav-item-wrap">
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
            <button
              class="btn-sidebar-delete"
              onclick={() => eliminarInformeCuadro(inf)}
              title="Eliminar informe">
              🗑️
            </button>
          </div>
        {/each}
      </nav>

      <div class="sidebar-footer">
        <button class="btn-logout" onclick={volverAlDashboard} title="Ver panel técnicos">
          Ver panel técnicos
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
            <h2>{ selectedCuadro?.nombreObra || 'Cuadro Eléctrico' }</h2>
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
          <!-- Search (Cuadros) -->
          <div class="admin-search">
            <div class="search-input-wrapper">
              <input
                aria-label="Buscar cuadros"
                placeholder="Buscar obra, nº orden..."
                class="search-input"
                bind:value={searchQueryAdmin}
                oninput={() => showSearchResultsAdmin = !!searchQueryAdmin.trim()}
                onblur={() => setTimeout(() => showSearchResultsAdmin = false, 120)}
                onfocus={() => showSearchResultsAdmin = !!searchQueryAdmin.trim()}
              />
              <button class="search-clear" onclick={() => { searchQueryAdmin = ''; showSearchResultsAdmin = false; }} title="Borrar búsqueda">✕</button>
              <span class="search-icon" aria-hidden="true">🔍</span>
            </div>

            {#if showSearchResultsAdmin && resultadosBusquedaAdmin.length > 0}
              <div class="search-results">
                {#each resultadosBusquedaAdmin as r}
                  <button class="search-result-item" onclick={() => abrirDesdeBusquedaAdmin(r)}>
                    <div class="sr-title">{r.nombreObra}</div>
                    <div class="sr-meta">{r.cuatrimestre || 'Sin cuatrimestre'} {#if r.nOrdenCuadro}· Ord: {r.nOrdenCuadro}{/if}</div>
                  </button>
                {/each}
              </div>
            {:else if showSearchResultsAdmin}
              <div class="search-results empty">No se encontraron resultados</div>
            {/if}
          </div>
        </div>
      </header>

      <!-- ===== MOBILE: PANEL VIEW ===== -->
      <div class="mobile-view mobile-panel-view" class:active={selectedCuadroId === null}>
        <DsMobileHeader
          title="Cuadros Eléctricos"
          subtitle="Gestión de informes de cuadros eléctricos"
          backButton={{ label: '‹ Menú', onClick: () => { menuPrincipal = 'raiz'; selectedCuadroId = null; } }}
          showAdminButton={false}
        />
        
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
        
           <div class="admin-count">{informesCuadroFiltrados.length} cuadro{informesCuadroFiltrados.length !== 1 ? 's' : ''}</div>
           <!-- Cards -->
           <div class="admin-grid">
             {#each informesCuadroFiltrados as inf (inf.id)}
               <div class="admin-card" style="--accent: {colorEstado(inf)}" data-estado={estadoDe(inf)} role="button" tabindex="0" onclick={() => seleccionarCuadro(inf.id)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); seleccionarCuadro(inf.id); } }}>
                 <div class="admin-card-accent"></div>
                 <div class="admin-card-body">
                   <div class="admin-card-top">
                     <div class="admin-card-name-row">
                       <span class="admin-card-icon">⚡</span>
                       <span class="admin-card-name">{ inf.nombreObra }</span>
                     </div>
                     <span class="admin-card-badge" style="background: {colorEstado(inf) === '#059669' ? '#E1F5EE' : colorEstado(inf) === '#d97706' ? '#E6F1FB' : '#f1f5f9'}; color: {colorEstado(inf)}">{ labelEstado(inf) }</span>
                   </div>
                   <div class="admin-card-meta">
                     {#if inf.nOrdenCuadro}<span class="admin-card-tag">Ord: {inf.nOrdenCuadro}</span>{/if}
                     {#if inf.nProy}<span class="admin-card-tag">Proy: {inf.nProy}</span>{/if}
                   </div>
                   <div class="admin-card-progress-row">
                     <div class="admin-card-progress">
                       <div class="admin-card-progress-bar" style="width: {progresoDe(inf)}%; background: {colorEstado(inf)}"></div>
                     </div>
                     <span class="admin-card-pct">{progresoDe(inf)}%</span>
                   </div>
                   <span class="admin-card-date">{ inf.ultimaModificacion || '—' }</span>
                 </div>
               </div>
             {/each}
           </div>
         </div>
      </div>


      <!-- ===== MOBILE: DETAIL VIEW ===== -->
      <div class="mobile-view mobile-detail-view" class:active={selectedCuadroId !== null}>
        <DsMobileHeader
          title={ selectedCuadro?.nombreObra || 'Detalle de Cuadro' }
          subtitle="Cuadro Eléctrico · detalle de informe"
          backButton={{ label: '‹ Cuadros', onClick: () => { selectedCuadroId = null; } }}
          showAdminButton={false}
        />
        
        <div class="mobile-cuatrimestre-body">
          {#if selectedCuadro}
            <div style="padding: 12px 16px 0; display: flex; gap: 8px; flex-wrap: wrap;">
              {#if selectedCuadro.nProy}<span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 10px;border-radius:100px;">Proy: {selectedCuadro.nProy}</span>{/if}
              {#if selectedCuadro.nOrdenCuadro}<span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 10px;border-radius:100px;">Orden: {selectedCuadro.nOrdenCuadro}</span>{/if}
              {#if selectedCuadro.nOrdenInstalacion}<span style="font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 10px;border-radius:100px;">Inst: {selectedCuadro.nOrdenInstalacion}</span>{/if}
            </div>


            <div style="padding: 16px;">
              <div class="cuadro-progreso-row">
                <ProgressBar value={progresoDe(selectedCuadro)} height={8} />
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
              <ProgressBar value={progresoDe(selectedCuadro)} />
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
           <div class="admin-count">{informesCuadroFiltrados.length} cuadro{informesCuadroFiltrados.length !== 1 ? 's' : ''}</div>
          <!-- Cards -->
          <div class="admin-grid">
            {#each informesCuadroFiltrados as inf (inf.id)}
              <div class="admin-card" style="--accent: {colorEstado(inf)}" data-estado={estadoDe(inf)} role="button" tabindex="0" onclick={() => editarInformeCuadro(inf)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editarInformeCuadro(inf); } }}>
                <div class="admin-card-accent"></div>
                <div class="admin-card-body">
                  <div class="admin-card-top">
                    <div class="admin-card-name-row">
                      <span class="admin-card-icon">⚡</span>
                      <span class="admin-card-name">{ inf.nombreObra }</span>
                    </div>
                    <span class="admin-card-badge" style="background: {colorEstado(inf) === '#059669' ? '#E1F5EE' : colorEstado(inf) === '#d97706' ? '#E6F1FB' : '#f1f5f9'}; color: {colorEstado(inf)}">{ labelEstado(inf) }</span>
                  </div>
                  <div class="admin-card-meta">
                    {#if inf.nOrdenCuadro}<span class="admin-card-tag">Ord: {inf.nOrdenCuadro}</span>{/if}
                    {#if inf.nProy}<span class="admin-card-tag">Proy: {inf.nProy}</span>{/if}
                  </div>
                  <div class="admin-card-progress-row">
                    <div class="admin-card-progress">
                      <div class="admin-card-progress-bar" style="width: {progresoDe(inf)}%; background: {colorEstado(inf)}"></div>
                    </div>
                    <span class="admin-card-pct">{progresoDe(inf)}%</span>
                  </div>
                  <span class="admin-card-date">{ inf.ultimaModificacion || '—' }</span>
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
        <img src="/gtmCompleto.png" alt="GTM" class="brand-logo" style="height: 40px;">
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
        <button class="btn-logout" onclick={volverAlDashboard} title="Ver panel técnicos">
          Ver panel técnicos
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
          <!-- Search (Mantenimiento) -->
          <div class="admin-search">
            <div class="search-input-wrapper">
              <input
                aria-label="Buscar mantenimientos"
                placeholder="Buscar obra, cuatrimestre o nº orden..."
                class="search-input"
                bind:value={searchQueryAdmin}
                oninput={() => showSearchResultsAdmin = !!searchQueryAdmin.trim()}
                onblur={() => setTimeout(() => showSearchResultsAdmin = false, 120)}
                onfocus={() => showSearchResultsAdmin = !!searchQueryAdmin.trim()}
              />
              <button class="search-clear" onclick={() => { searchQueryAdmin = ''; showSearchResultsAdmin = false; }} title="Borrar búsqueda">✕</button>
              <span class="search-icon" aria-hidden="true">🔍</span>
            </div>

            {#if showSearchResultsAdmin && resultadosBusquedaAdmin.length > 0}
              <div class="search-results">
                {#each resultadosBusquedaAdmin as r}
                  <button class="search-result-item" onclick={() => abrirDesdeBusquedaAdmin(r)}>
                    <div class="sr-title">{r.nombreObra}</div>
                    <div class="sr-meta">{r.cuatrimestre || 'Sin cuatrimestre'} {#if r.nOrdenCuadro}· Ord: {r.nOrdenCuadro}{/if}</div>
                  </button>
                {/each}
              </div>
            {:else if showSearchResultsAdmin}
              <div class="search-results empty">No se encontraron resultados</div>
            {/if}
          </div>
        </div>
      </header>

      <!-- ===== MOBILE: PANEL VIEW ===== -->
      <div class="mobile-view mobile-panel-view" class:active={vistaPanel}>
        <DsMobileHeader
          title="Mantenimiento Mercadona"
          subtitle="Gestión de cuatrimestres y tareas"
          backButton={{ label: '‹ Menú', onClick: () => { menuPrincipal = 'raiz'; cuatrimestreSeleccionado = ''; } }}
          showAdminButton={false}
        />
        
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
              <div class="mac-title">Nuevo Cuatrimestre</div>
              <div class="mac-desc">Crear nuevo periodo de seguimiento</div>
            </button>
            <button class="mobile-action-card" onclick={() => showTareasEditor = true}>
              <div class="mac-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </div>
              <div class="mac-title">Editar Tareas</div>
              <div class="mac-desc">Configurar plantillas de tareas</div>
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
        <DsMobileHeader
          title={ grupoSeleccionado?.label || 'Cuatrimestre' }
          subtitle="Mercadona · informes de mantenimiento"
          backButton={{ label: '‹ Cuatrimestre', onClick: () => { vistaPanel = true; cuatrimestreSeleccionado = ''; } }}
          showAdminButton={false}
        />
        
        <div class="mobile-cuatrimestre-body">
           <div class="admin-count">{informesFiltrados.length} centro{informesFiltrados.length !== 1 ? 's' : ''}</div>
           <!-- Cards -->
           <div class="admin-grid">
             {#each informesFiltrados as inf (inf.id)}
               <div class="admin-card" style="--accent: {colorEstado(inf)}" data-estado={estadoDe(inf)} role="button" tabindex="0" onclick={() => editarInforme(inf)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editarInforme(inf); } }}>
                 <div class="admin-card-accent"></div>
                 <div class="admin-card-body">
                   <div class="admin-card-top">
                     <span class="admin-card-name">{ inf.nombreObra }</span>
                     <span class="admin-card-badge" style="background: {colorEstado(inf) === '#059669' ? '#E1F5EE' : colorEstado(inf) === '#d97706' ? '#E6F1FB' : '#f1f5f9'}; color: {colorEstado(inf)}">{ labelEstado(inf) }</span>
                   </div>
                   <div class="admin-card-progress-row">
                     <div class="admin-card-progress">
                       <div class="admin-card-progress-bar" style="width: {progresoDe(inf)}%; background: {colorEstado(inf)}"></div>
                     </div>
                     <span class="admin-card-pct">{progresoDe(inf)}%</span>
                   </div>
                   <span class="admin-card-date">{ inf.ultimaModificacion || '—' }</span>
                 </div>
               </div>
             {/each}
           </div>
         </div>
      </div>


      <!-- ===== DESKTOP CONTENT ===== -->
      <div class="desktop-content">
        {#if grupoSeleccionado}
          <!-- Metrics -->
          <div class="admin-metrics">
            <div class="admin-metric" class:admin-metric--active={filtroSeleccionado === 'todos'} onclick={() => filtroSeleccionado = 'todos'} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filtroSeleccionado = 'todos'; } }} role="button" tabindex="0">
              <span class="admin-metric-value">{ metricas.total }</span>
              <span class="admin-metric-label">Centros</span>
            </div>
            <div class="admin-metric admin-metric--green" class:admin-metric--active={filtroSeleccionado === 'completado'} onclick={() => filtroSeleccionado = 'completado'} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filtroSeleccionado = 'completado'; } }} role="button" tabindex="0">
              <span class="admin-metric-value">{ metricas.completados }</span>
              <span class="admin-metric-label">Completados</span>
            </div>
            <div class="admin-metric admin-metric--blue" class:admin-metric--active={filtroSeleccionado === 'en-progreso'} onclick={() => filtroSeleccionado = 'en-progreso'} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filtroSeleccionado = 'en-progreso'; } }} role="button" tabindex="0">
              <span class="admin-metric-value">{ metricas.enProgreso }</span>
              <span class="admin-metric-label">En progreso</span>
            </div>
            <div class="admin-metric admin-metric--amber" class:admin-metric--active={filtroSeleccionado === 'pendiente'} onclick={() => filtroSeleccionado = 'pendiente'} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filtroSeleccionado = 'pendiente'; } }} role="button" tabindex="0">
              <span class="admin-metric-value">{ metricas.pendientes }</span>
              <span class="admin-metric-label">Pendientes</span>
            </div>
          </div>

          <div class="admin-count">{informesFiltrados.length} centro{informesFiltrados.length !== 1 ? 's' : ''}</div>
          <!-- Cards -->
          <div class="admin-grid">
            {#each informesFiltrados as inf (inf.id)}
              <div class="admin-card" style="--accent: {colorEstado(inf)}" data-estado={estadoDe(inf)} role="button" tabindex="0" onclick={() => editarInforme(inf)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editarInforme(inf); } }}>
                <div class="admin-card-accent"></div>
                <div class="admin-card-body">
                  <div class="admin-card-top">
                    <span class="admin-card-name">{ inf.nombreObra }</span>
                    <span class="admin-card-badge" style="background: {colorEstado(inf) === '#059669' ? '#E1F5EE' : colorEstado(inf) === '#d97706' ? '#E6F1FB' : '#f1f5f9'}; color: {colorEstado(inf)}">{ labelEstado(inf) }</span>
                  </div>
                  <div class="admin-card-progress-row">
                    <div class="admin-card-progress">
                      <div class="admin-card-progress-bar" style="width: {progresoDe(inf)}%; background: {colorEstado(inf)}"></div>
                    </div>
                    <span class="admin-card-pct">{progresoDe(inf)}%</span>
                  </div>
                  <span class="admin-card-date">{ inf.ultimaModificacion || '—' }</span>
                </div>
              </div>
            {/each}
          </div>
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

<style>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-page-alt);
}

.admin-sidebar {
  width: 320px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.04);
  display: flex;
  flex-direction: column;
  background: #162d4a;
  color: #ffffff;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 40px;
}

.brand-logo {
  font-weight: 800;
  font-size: 18px;
  color: #ffffff;
  letter-spacing: -0.5px;
}

.brand-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
}

.brand-text {
  font-size: 12px;
  font-weight: 500;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 24px;
  overflow-y: auto;
}

.nav-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 12px;
  margin-bottom: 8px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 2px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
  position: relative;
}

.nav-item:hover {
  background: rgba(255,255,255,0.08);
}

.nav-item.active {
  background: #ffffff;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: #1e3a5f;
  border-radius: 0 2px 2px 0;
}

.nav-item-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  line-height: 1.4;
}

.nav-item.active .nav-item-title {
  color: #1e3a5f;
}

.nav-item-meta {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin-top: 2px;
}

.nav-item-wrap {
  display: flex;
  align-items: stretch;
  gap: 2px;
  margin-bottom: 2px;
}

.nav-item-wrap .nav-item {
  flex: 1;
  margin-bottom: 0;
}

.btn-sidebar-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  min-width: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: rgba(255,255,255,0.3);
  transition: all 0.15s;
  padding: 0;
}

.btn-sidebar-delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

.sidebar-footer {
  padding: 16px 24px;
}

.btn-logout {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  background: transparent;
  color: rgba(255,255,255,0.7);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s;
}

.btn-logout:hover {
  background: rgba(255,255,255,0.1);
  color: #ffffff;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  gap: 16px;
  background: var(--gradient-header);
}

.header-title h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
}

.header-subtitle {
  display: block;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* Admin search styles reuse */
.admin-search { position: relative; width: 360px; }
.admin-search .search-input-wrapper { position: relative; }
.admin-search .search-input { width: 100%; padding: 8px 36px 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.1); color: #ffffff; }
.admin-search .search-input::placeholder { color: rgba(255,255,255,0.5); }
.admin-search .search-icon { position: absolute; right: 8px; top: 8px; pointer-events: none; color: rgba(255,255,255,0.5); }
.admin-search .search-clear { position: absolute; right: 28px; top: 6px; background: transparent; border: none; color: rgba(255,255,255,0.6); cursor: pointer; }
.admin-search .search-results { position: absolute; top: 42px; left: 0; width: 100%; background: #fff; border-radius: 8px; box-shadow: 0 8px 30px rgba(2,6,23,0.08); max-height: 300px; overflow: auto; z-index: 60; }
.admin-search .search-result-item { width: 100%; text-align: left; padding: 10px 12px; border: none; background: none; display: block; cursor: pointer; }
.admin-search .search-result-item:hover { background: #f1f5f9; }
.admin-search .sr-title { font-weight: 700; }
.admin-search .sr-meta { font-size: 12px; color: #64748b; }

.action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 24px;
  border-left: 1px solid rgba(255,255,255,0.1);
}

.action-group:first-child {
  padding-left: 0;
  border-left: none;
}

.btn-icon-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.btn-icon-label .icon {
  font-size: 16px;
  line-height: 1;
}




.btn-icon-label.primary {
  background: #ffffff;
  color: #162d4a;
}

.btn-icon-label.primary:hover:not(:disabled) {
  background: #f1f5f9;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-icon-label.danger {
  background: #fff1f2;
  color: #e11d48;
}

.btn-icon-label.danger:hover:not(:disabled) {
  background: #ffe4e6;
  color: #be123c;
  transform: translateY(-1px);
}

.btn-icon-label:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.btn-icon-label:active:not(:disabled) {
  transform: translateY(0);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  color: #94a3b8;
  font-size: 14px;
}

.mobile-view {
  display: none;
}

.desktop-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 24px 32px;
  gap: 8px;
}


.cuadro-progreso-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 0 4px;
}

.cuadro-detail-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.cuadro-empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.cuadro-detail-header-premium {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.cuadro-detail-header-premium::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #0f172a 0%, #3b82f6 100%);
}

.cuadro-detail-icon-wrap {
  font-size: 30px;
  width: 56px;
  height: 56px;
  background: #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cuadro-detail-info-wrap {
  flex: 1;
  min-width: 0;
}

.cuadro-detail-info-wrap h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.cuadro-detail-meta-wrap {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cuadro-detail-meta-wrap span {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 4px 12px;
  border-radius: 100px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.cuadro-detail-status-pill {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 6px 14px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.cuadro-detail-stats-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.cuadro-detail-stats-panel .cuadro-progreso-row {
  margin-bottom: 20px;
  padding: 0;
}

.cuadro-sections-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 16px 4px;
}

.cuadro-sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
}

.section-progreso-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.section-progreso-card:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.06);
  background: #f8fafc;
}

.section-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-num {
  font-size: 11px;
  font-weight: 800;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-tasks {
  font-size: 11px;
  color: #64748b;
}

.section-percent {
  font-size: 11px;
  font-weight: 700;
}

.section-mini-progress {
  width: 100%;
  height: 4px;
  background: #f1f5f9;
  border-radius: 10px;
  overflow: hidden;
}

.section-mini-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
    min-height: 100vh;
  }

  .admin-sidebar {
    display: none;
  }

  .desktop-content {
    display: none;
  }

  .admin-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .main-header {
    display: none;
  }

  .mobile-view {
    display: none;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .mobile-view.active {
    display: flex;
  }

  .mobile-panel-view {
    background: var(--bg-page);
  }

  .mobile-cuatrimestre-view {
    background: var(--bg-page);
  }

  .mobile-panel-body {
    flex: 1;
    padding: 20px 16px;
    overflow-y: auto;
  }

  .mobile-section-label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 12px;
  }

  .mobile-actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }

  .mobile-action-card {
    background: #1e3a5f;
    border: none;
    border-radius: 12px;
    padding: 20px 16px;
    text-align: left;
    cursor: pointer;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .mac-icon {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fbbf24;
  }

  .mac-icon svg {
    max-width: 20px;
    max-height: 20px;
    width: auto;
    height: auto;
    display: block;
  }

  .mac-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .mac-desc {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  .mobile-cuatrimestres-list {
    display: flex;
    flex-direction: column;
  }

  .mobile-cuatrimestre-item {
    display: flex;
    align-items: stretch;
    gap: 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .mci-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    padding: 14px 0;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .btn-mci-delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 16px;
    color: #94a3b8;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .btn-mci-delete:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  .mci-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 2px;
  }

  .mci-meta {
    font-size: 12px;
    color: #64748b;
  }

  .mci-count {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }



  .mobile-cuatrimestre-body {
    flex: 1;
    padding: 20px 16px;
    overflow-y: auto;
  }

  .mobile-detail-view {
    background: var(--bg-page);
  }

  .mobile-detail-view .cuadro-progreso-row {
    padding: 0;
    margin-bottom: 16px;
  }

  .mobile-detail-view .cuadro-sections-title {
    margin: 0 0 12px 0;
    font-size: 13px;
  }

  .mobile-detail-view .section-progreso-card {
    padding: 14px;
  }

  .root-layout .root-menu-container {
    padding: 24px 16px;
    gap: 24px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
    flex: 1;
  }

  .root-layout .root-menu-header h1 {
    font-size: 22px;
  }

  .root-layout .root-menu-header p {
    font-size: 14px;
  }

  .root-layout .root-menu-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .root-layout .root-menu-card {
    padding: 24px 20px;
    gap: 16px;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-radius: 16px;
  }

  .root-layout .card-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    flex-shrink: 0;
    margin-bottom: 4px;
  }

  .root-layout .card-icon svg {
    width: 28px;
    height: 28px;
  }

  .root-layout .card-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .root-layout .card-info h2 {
    font-size: 18px;
    margin: 0;
    line-height: 1.2;
  }

  .root-layout .card-info p {
    display: block;
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
    max-width: 280px;
    margin: 0 auto;
  }

  .root-layout .card-arrow {
    display: none;
  }

  .admin-layout.root-layout {
    padding: 16px 12px;
    align-items: stretch;
    justify-content: flex-start;
    background: #f1f5f9;
  }

  .admin-root-menu {
    flex: 1;
  }
}

@media (max-height: 480px) {
  .admin-layout.root-layout {
    min-height: auto;
    padding: 20px 12px;
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.root-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-page);
  padding: 40px 20px;
  box-sizing: border-box;
  overflow-x: hidden;
}

.admin-root-menu {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.root-menu-container {
  width: 100%;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 40px;
  animation: fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

.root-menu-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.root-logo {
  display: block;
  margin: 0 auto;
}

.root-menu-header h1 {
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  margin: 8px 0 0 0;
  letter-spacing: -0.5px;
}

.root-menu-header p {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.root-menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
}

.root-menu-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 32px 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  box-sizing: border-box;
}

.root-menu-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: transparent;
  transition: background 0.3s;
}

.root-menu-card:hover {
  transform: translateY(-6px);
  border-color: #cbd5e1;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.root-menu-card:hover::before {
  background: linear-gradient(90deg, #1e3a5f, #3b82f6);
}

.root-menu-card:active {
  transform: translateY(-2px);
}

.card-icon {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
}

.card-icon svg {
  width: 26px;
  height: 26px;
}

.icon-maint {
  background: #eff6ff;
  color: #1e3a5f;
}

.root-menu-card:hover .icon-maint {
  background: #1e3a5f;
  color: #ffffff;
  transform: scale(1.05);
}

.icon-electrical {
  background: #fffbeb;
  color: #d97706;
}

.root-menu-card:hover .icon-electrical {
  background: #d97706;
  color: #ffffff;
  transform: scale(1.05);
}

.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-info h2 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.2px;
}

.card-info p {
  font-size: 13.5px;
  line-height: 1.5;
  color: #64748b;
  margin: 0;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.card-arrow {
  font-size: 18px;
  color: #94a3b8;
  align-self: center;
  transition: all 0.3s;
}

.root-menu-card:hover .card-arrow {
  color: #0f172a;
  transform: translateX(6px);
}

.root-menu-footer {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.btn-root-logout {
  padding: 10px 24px;
  background: transparent;
  border: 1px solid #cbd5e1;
  border-radius: 100px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-root-logout:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.sidebar-nav-back {
  padding: 12px 24px;
}

.btn-back-to-menu {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  color: rgba(255,255,255,0.75);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back-to-menu:hover {
  background: rgba(255,255,255,0.1);
  color: #ffffff;
  border-color: rgba(255,255,255,0.3);
}

.btn-back-to-menu .icon {
  display: inline-block;
  transition: transform 0.2s;
}

.btn-back-to-menu:hover .icon {
  transform: translateX(-2px);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* ============================================================
   Admin Metrics (2x2 grid mobile, 4 inline desktop)
   ============================================================ */
.admin-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (min-width: 900px) {
  .admin-metrics {
    grid-template-columns: repeat(4, 1fr);
  }
}

.admin-metric {
  background: var(--gray-100, #f3f4f6);
  border-radius: 12px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  user-select: none;
  text-align: center;
}

.admin-metric:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.admin-metric--active {
  border-color: #1e293b;
  background: #ffffff;
}

.admin-metric-value {
  font-size: 24px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.1;
}

@media (min-width: 900px) {
  .admin-metric-value { font-size: 28px; }
}

.admin-metric-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.admin-metric--green .admin-metric-value { color: #1D9E75; }
.admin-metric--blue .admin-metric-value  { color: #185FA5; }
.admin-metric--amber .admin-metric-value { color: #b45309; }

/* ============================================================
   Admin Count
   ============================================================ */
.admin-count {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 16px;
}

/* ============================================================
   Admin Cards Grid
   ============================================================ */
.admin-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 600px) {
  .admin-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .admin-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

.admin-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.admin-card:hover {
  box-shadow: 0 8px 20px -6px rgba(0,0,0,0.08);
  transform: translateY(-2px);
  border-color: #cbd5e1;
}

.admin-card-accent {
  height: 3px;
  background: var(--accent, #94a3b8);
  flex-shrink: 0;
}

.admin-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 44px;
}

@media (min-width: 600px) {
  .admin-card-body { padding: 18px; }
}

.admin-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.admin-card-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.admin-card-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.admin-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
  word-break: break-word;
}

.admin-card-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 100px;
  white-space: nowrap;
  flex-shrink: 0;
}

.admin-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.admin-card-tag {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
}

.admin-card-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-card-progress {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.admin-card-progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.admin-card-pct {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  min-width: 32px;
  text-align: right;
}

.admin-card-date {
  font-size: 11px;
  color: #94a3b8;
}
</style>

