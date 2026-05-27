<script lang="ts">
import { onMount, untrack } from 'svelte';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { navService } from '$lib/services/stores/navigation.svelte';
import { adminService } from '$lib/services/stores/admin.svelte';
import { ui } from '$lib/services/stores/ui.svelte';
import { cuatrimestreService } from '$lib/services/stores/cuatrimestre.svelte';
import { formPersistenceService } from '$lib/services/domain/form-persistence.svelte';
import { formInitService } from '$lib/services/domain/form-initialization.svelte';
import { databaseService } from '$lib/services/api/database.svelte';
import CrearCuadroElectricoModal from '$lib/components/admin/CrearCuadroElectricoModal.svelte';
import ProgressBar from '$lib/components/ProgressBar.svelte';
import type { InformeGuardado } from '$lib/types/informe.interface';
import { progresoDe, estadoDe, colorEstado, labelEstado } from '$lib/utils/informe-utils';

  // Tab state
  let tabActual = $state<'mantenimiento' | 'cuadros'>('mantenimiento');

  // Derived state
  let isAdmin = $derived(adminService.isAdmin);
  let cuatrimestreSeleccionado = $derived(navService.cuatrimestreSeleccionado);
  let vistaPanel = $derived(cuatrimestreSeleccionado === '');

  let informesGuardados = $derived(formPersistenceService.informesGuardados);
  let informesMantenimiento = $derived(informesGuardados.filter(i => i.tipo === 'mantenimiento' || !i.tipo));
  let informesCuadro = $derived(informesGuardados.filter(i => i.tipo === 'cuadro_electrico'));
  let cuatrimestres = $derived(cuatrimestreService.getInformesPorCuatrimestre(informesMantenimiento));

  // Cuadro Eléctrico state
  let showCrearCuadroModal = $state(false);
  let filtroCuadro = $state('todos');
  let informesCuadroFiltrados = $derived.by(() => {
    if (filtroCuadro === 'todos') return informesCuadro;
    return informesCuadro.filter(inf => estadoDe(inf) === filtroCuadro);
  });
  let metricasCuadro = $derived.by(() => {
    const total = informesCuadro.length;
    const completados = informesCuadro.filter(i => estadoDe(i) === 'completado').length;
    const enProgreso = informesCuadro.filter(i => estadoDe(i) === 'en-progreso').length;
    const pendientes = total - completados - enProgreso;
    return { total, completados, enProgreso, pendientes };
  });

  let grupoSeleccionado = $derived(cuatrimestres.find(g => g.clave === cuatrimestreSeleccionado));
  let informesActuales = $derived(grupoSeleccionado?.informes || []);

  let filtroSeleccionado = $state('todos');
  let informesFiltrados = $derived.by(() => {
    if (filtroSeleccionado === 'todos') return informesActuales;
    return informesActuales.filter(inf => estadoDe(inf) === filtroSeleccionado);
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

  // Methods
  function seleccionarCuatrimestre(clave: string) {
    navService.cuatrimestreSeleccionado = clave;
    navService.persist();
  }

  function cerrarDetalle() {
    navService.cuatrimestreSeleccionado = '';
    navService.persist();
    filtroSeleccionado = 'todos';
    goto('/');
  }

  function switchTab(tab: 'mantenimiento' | 'cuadros') {
    tabActual = tab;
    filtroCuadro = 'todos';
    filtroSeleccionado = 'todos';
    if (tab === 'cuadros') {
      navService.cuatrimestreSeleccionado = '';
      navService.persist();
    }
  }

  async function toggleAdmin() {
    if (isAdmin) {
      await navService.irAAdmin();
    } else {
      const pass = await ui.prompt('Acceso Admin', 'Introduce la contraseña de administrador:', 'Contraseña', 'Aceptar', 'Cancelar', 'password');
      if (pass) {
        const ok = await adminService.login(pass);
        if (ok) {
          await navService.irAAdmin();
        } else {
          await ui.alert('Acceso Denegado', 'Contraseña incorrecta', 'error');
        }
      }
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
      await navService.irAFormulario(inf.cuatrimestre, inf.nombreObra);
    }
  }

  async function editarInformeCuadro(inf: InformeGuardado) {
    const result = await formPersistenceService.editarInforme(inf);
    if (result) {
      formInitService.setFormData(
        result.obraForm,
        result.fotosPorSeccionBase64,
        result.seccionesColapsadas
      );
      await navService.irAFormulario(inf.cuatrimestre || '', inf.nombreObra);
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

  onMount(async () => {
    await formPersistenceService.cargarHistorial();
  });

  $effect(() => {
    const c = $page.url.searchParams.get('c');
    if (c && c !== untrack(() => navService.cuatrimestreSeleccionado)) {
      navService.cuatrimestreSeleccionado = c;
      navService.persist();
    }
  });

</script>

<svelte:head>
  <title>Dashboard | GTM Mantenimiento</title>
  <meta name="description" content="Panel de control de GTM Mantenimiento — gestión de informes de obra, cuadros eléctricos y seguimiento de centros.">
</svelte:head>

<div class="main-layout">
  <!-- Sidebar (desktop only) -->
  <aside class="main-sidebar">
    <div class="sidebar-top">
      <img src="gtmCompleto.png" alt="GTM" class="brand-logo" />
      <h1 class="sidebar-title">Control total del mantenimiento.</h1>
      <p class="sidebar-subtitle">Seguimiento de centros, cuatrimestres y estados en un solo lugar.</p>
    </div>
    <button class="btn-admin-gear" onclick={toggleAdmin} title="Administración" aria-label="Administración">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <!-- ===== VIEW 1: PANEL (cuatrimestre list + tabs) ===== -->
    <div class="dash-view dash-panel-view" class:active={vistaPanel}>
      <div class="dash-panel-header">
        <button class="dash-admin-gear mobile-only" onclick={toggleAdmin} title="Administración" aria-label="Administración"><span aria-hidden="true">⚙</span></button>
        <h2 class="dash-panel-title">Control total del mantenimiento.</h2>
        <p class="dash-panel-subtitle">Seguimiento de centros, cuatrimestres y estados en un solo lugar.</p>

        <!-- Tab Switcher -->
        <div class="tab-switcher">
          <button
            class="tab-btn"
            class:active={tabActual === 'mantenimiento'}
            onclick={() => switchTab('mantenimiento')}>
            <span class="tab-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Mantenimiento"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
            </span>
            <span class="tab-text">Mantenimientos Mercadona</span>
          </button>
          <button
            class="tab-btn"
            class:active={tabActual === 'cuadros'}
            onclick={() => switchTab('cuadros')}>
            <span class="tab-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Cuadros Eléctricos"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </span>
            <span class="tab-text">Cuadros Eléctricos</span>
          </button>
        </div>
      </div>

      <div class="dash-panel-body">
        {#if tabActual === 'mantenimiento'}
          <!-- ===== MANTENIMIENTO: Cuatrimestre list ===== -->
          <div class="dash-section-label">CUATRIMESTRES</div>
          {#if cuatrimestres.length === 0}
            <div class="empty-state">No hay informes guardados.</div>
          {:else}
            <div class="dash-cuatrimestres-list">
              {#each cuatrimestres as grupo (grupo.clave)}
                <button class="dash-cuatrimestre-item" onclick={() => seleccionarCuatrimestre(grupo.clave)}>
                  <div class="dci-info">
                    <div class="dci-title">{ grupo.label }</div>
                    <div class="dci-meta">{ grupo.informes.length } centros</div>
                  </div>
                  <div class="dci-count">{ grupo.informes.length }</div>
                </button>
              {/each}
            </div>
          {/if}
        {:else}
          <!-- ===== CUADROS ELÉCTRICOS ===== -->
          <div class="dash-section-label">CUADROS ELÉCTRICOS</div>

          <!-- Metrics -->
          <div class="dcv-metrics" style="margin-bottom: 20px;">
            <div class="dcv-metric" class:dcv-metric--active={filtroCuadro === 'todos'} onclick={() => filtroCuadro = 'todos'} role="button" tabindex="0">
              <span class="dcv-metric-value">{ metricasCuadro.total }</span>
              <span class="dcv-metric-label">Cuadros</span>
            </div>
            <div class="dcv-metric dcv-metric--green" class:dcv-metric--active={filtroCuadro === 'completado'} onclick={() => filtroCuadro = 'completado'} role="button" tabindex="0">
              <span class="dcv-metric-value">{ metricasCuadro.completados }</span>
              <span class="dcv-metric-label">Completados</span>
            </div>
            <div class="dcv-metric dcv-metric--blue" class:dcv-metric--active={filtroCuadro === 'en-progreso'} onclick={() => filtroCuadro = 'en-progreso'} role="button" tabindex="0">
              <span class="dcv-metric-value">{ metricasCuadro.enProgreso }</span>
              <span class="dcv-metric-label">En progreso</span>
            </div>
            <div class="dcv-metric dcv-metric--amber" class:dcv-metric--active={filtroCuadro === 'pendiente'} onclick={() => filtroCuadro = 'pendiente'} role="button" tabindex="0">
              <span class="dcv-metric-value">{ metricasCuadro.pendientes }</span>
              <span class="dcv-metric-label">Pendientes</span>
            </div>
          </div>

          <!-- Filters -->
          <div class="dcv-pills">
            <button class="dcv-pill" class:active={filtroCuadro === 'todos'} onclick={() => filtroCuadro = 'todos'}>Todos</button>
            <button class="dcv-pill dcv-pill--green" class:active={filtroCuadro === 'completado'} onclick={() => filtroCuadro = 'completado'}>Completado</button>
            <button class="dcv-pill dcv-pill--blue" class:active={filtroCuadro === 'en-progreso'} onclick={() => filtroCuadro = 'en-progreso'}>En progreso</button>
            <button class="dcv-pill dcv-pill--amber" class:active={filtroCuadro === 'pendiente'} onclick={() => filtroCuadro = 'pendiente'}>Pendiente</button>
          </div>

          <!-- Header row -->
          <div class="ce-header-row">
            <span class="ce-count">{informesCuadroFiltrados.length} cuadro{informesCuadroFiltrados.length !== 1 ? 's' : ''}</span>
            <button class="btn-nuevo-cuadro" onclick={() => showCrearCuadroModal = true}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Añadir"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nuevo Cuadro
            </button>
          </div>

          <!-- Cards -->
          {#if informesCuadroFiltrados.length === 0}
            <div class="empty-state">No hay informes para este filtro.</div>
          {:else}
            <div class="dcv-grid">
              {#each informesCuadroFiltrados as inf (inf.id)}
                <div class="dcv-card" style="--accent: {colorEstado(inf)}" data-estado={estadoDe(inf)} role="button" tabindex="0" onclick={() => editarInformeCuadro(inf)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editarInformeCuadro(inf); } }}>
                  <div class="dcv-card-accent"></div>
                  <div class="dcv-card-body">
                    <div class="dcv-card-top">
                      <div class="dcv-card-name-row">
                        <span class="dcv-card-icon">⚡</span>
                        <span class="dcv-card-name">{ inf.nombreObra }</span>
                      </div>
                      <span class="dcv-card-badge" style="background: {colorEstado(inf) === '#059669' ? '#E1F5EE' : colorEstado(inf) === '#d97706' ? '#E6F1FB' : '#f1f5f9'}; color: {colorEstado(inf)}">{ labelEstado(inf) }</span>
                    </div>
                    <div class="dcv-card-meta">
                      {#if inf.nOrdenCuadro}<span class="dcv-card-tag">Ord: {inf.nOrdenCuadro}</span>{/if}
                      {#if inf.nProy}<span class="dcv-card-tag">Proy: {inf.nProy}</span>{/if}
                    </div>
                    <div class="dcv-card-progress-row">
                      <div class="dcv-card-progress">
                        <div class="dcv-card-progress-bar" style="width: {progresoDe(inf)}%; background: {colorEstado(inf)}"></div>
                      </div>
                      <span class="dcv-card-pct">{progresoDe(inf)}%</span>
                    </div>
                    <span class="dcv-card-date">{ inf.ultimaModificacion || '—' }</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>

    <!-- ===== VIEW 2: Cuatrimestre detail (centro cards) ===== -->
    <div class="dash-view dash-cuatrimestre-view" class:active={!vistaPanel}>
      <div class="dcv-header">
        <button class="dcv-back" onclick={cerrarDetalle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Volver"><path d="m15 18-6-6 6-6"/></svg> Cuatrimestre
        </button>
        <span class="dcv-sublabel">INFORMES DE MANTENIMIENTO</span>
        <h2 class="dcv-title">{ grupoSeleccionado?.label || '' }</h2>
        <div class="dcv-divider"></div>
      </div>

      <div class="dcv-body">
        <!-- Metrics -->
        <div class="dcv-metrics">
          <div class="dcv-metric" class:dcv-metric--active={filtroSeleccionado === 'todos'} onclick={() => filtroSeleccionado = 'todos'} role="button" tabindex="0">
            <span class="dcv-metric-value">{ metricas.total }</span>
            <span class="dcv-metric-label">Centros</span>
          </div>
          <div class="dcv-metric dcv-metric--green" class:dcv-metric--active={filtroSeleccionado === 'completado'} onclick={() => filtroSeleccionado = 'completado'} role="button" tabindex="0">
            <span class="dcv-metric-value">{ metricas.completados }</span>
            <span class="dcv-metric-label">Completados</span>
          </div>
          <div class="dcv-metric dcv-metric--blue" class:dcv-metric--active={filtroSeleccionado === 'en-progreso'} onclick={() => filtroSeleccionado = 'en-progreso'} role="button" tabindex="0">
            <span class="dcv-metric-value">{ metricas.enProgreso }</span>
            <span class="dcv-metric-label">En progreso</span>
          </div>
          <div class="dcv-metric dcv-metric--amber" class:dcv-metric--active={filtroSeleccionado === 'pendiente'} onclick={() => filtroSeleccionado = 'pendiente'} role="button" tabindex="0">
            <span class="dcv-metric-value">{ metricas.pendientes }</span>
            <span class="dcv-metric-label">Pendientes</span>
          </div>
        </div>

        <!-- Filter pills -->
        <div class="dcv-pills">
          <button class="dcv-pill" class:active={filtroSeleccionado === 'todos'} onclick={() => filtroSeleccionado = 'todos'}>Todos</button>
          <button class="dcv-pill dcv-pill--green" class:active={filtroSeleccionado === 'completado'} onclick={() => filtroSeleccionado = 'completado'}>Completado</button>
          <button class="dcv-pill dcv-pill--blue" class:active={filtroSeleccionado === 'en-progreso'} onclick={() => filtroSeleccionado = 'en-progreso'}>En progreso</button>
          <button class="dcv-pill dcv-pill--amber" class:active={filtroSeleccionado === 'pendiente'} onclick={() => filtroSeleccionado = 'pendiente'}>Pendiente</button>
        </div>

        <div class="dcv-count">{informesFiltrados.length} centro{informesFiltrados.length !== 1 ? 's' : ''}</div>

        <!-- Centro cards -->
        {#if informesFiltrados.length === 0}
          <div class="empty-state">No hay centros para este filtro.</div>
        {:else}
          <div class="dcv-grid">
            {#each informesFiltrados as inf (inf.id)}
              <div class="dcv-card" style="--accent: {colorEstado(inf)}" data-estado={estadoDe(inf)} role="button" tabindex="0" onclick={() => editarInforme(inf)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editarInforme(inf); } }}>
                <div class="dcv-card-accent"></div>
                <div class="dcv-card-body">
                  <div class="dcv-card-top">
                    <span class="dcv-card-name">{ inf.nombreObra }</span>
                    <span class="dcv-card-badge" style="background: {colorEstado(inf) === '#059669' ? '#E1F5EE' : colorEstado(inf) === '#d97706' ? '#E6F1FB' : '#f1f5f9'}; color: {colorEstado(inf)}">{ labelEstado(inf) }</span>
                  </div>
                  <div class="dcv-card-progress-row">
                    <div class="dcv-card-progress">
                      <div class="dcv-card-progress-bar" style="width: {progresoDe(inf)}%; background: {colorEstado(inf)}"></div>
                    </div>
                    <span class="dcv-card-pct">{progresoDe(inf)}%</span>
                  </div>
                  <span class="dcv-card-date">{ inf.ultimaModificacion || '—' }</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>

{#if showCrearCuadroModal}
  <CrearCuadroElectricoModal
    onClose={() => showCrearCuadroModal = false}
    onCreated={() => { showCrearCuadroModal = false; }}
  />
{/if}

<style>
/* ============================================================
   GLOBAL LAYOUT
   ============================================================ */
.main-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-page);
}

/* ============================================================
   SIDEBAR (desktop only)
   ============================================================ */
.main-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: #162d4a;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 40px;
  color: #ffffff;
  border-right: 1px solid rgba(255,255,255,0.04);
}

@media (max-width: 768px) {
  .main-sidebar { display: none; }
}

.brand-logo {
  width: 140px;
  margin-bottom: 48px;
}

.sidebar-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 16px 0;
  color: #ffffff;
}

.sidebar-subtitle {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255,255,255,0.75);
  margin: 0;
}

.btn-admin-gear {
  width: 40px;
  height: 40px;
  min-width: 40px;
  max-width: 40px;
  min-height: 40px;
  max-height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 auto;
  flex-shrink: 0;
  overflow: hidden;
}

.btn-admin-gear:hover {
  border-color: rgba(255,255,255,0.5);
  color: #ffffff;
  background: rgba(255,255,255,0.12);
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(0,0,0,0.2);
}

/* ============================================================
   MAIN CONTENT
   ============================================================ */
.main-content {
  flex: 1;
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
}

.dash-view {
  display: none;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.dash-view.active {
  display: flex;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .mobile-only { display: flex; }
}

/* ============================================================
   PANEL HEADER (cuatrimestre list + tabs)
   ============================================================ */
.dash-panel-header {
  position: relative;
  background: linear-gradient(135deg, #1e3a5f 0%, #234670 100%);
  padding: 32px 40px;
  flex-shrink: 0;
  color: #ffffff;
}

@media (max-width: 768px) {
  .dash-panel-header {
    padding: 24px 20px;
  }
}

.dash-panel-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.dash-panel-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  margin: 0;
}

@media (max-width: 768px) {
  .dash-panel-title { font-size: 24px; }
}

/* Admin gear in mobile header */
.dash-admin-gear {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.85);
  font-size: 20px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
}

@media (max-width: 768px) {
  .dash-admin-gear.mobile-only { display: flex; }
}

/* ============================================================
   TAB SWITCHER
   ============================================================ */
.tab-switcher {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  background: rgba(255,255,255,0.08);
  padding: 6px;
  border-radius: 14px;
  max-width: 480px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(255,255,255,0.6);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.85);
}

.tab-btn.active {
  background: #ffffff;
  color: #1e3a5f;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.tab-icon { font-size: 1.1rem; line-height: 1; }

/* ============================================================
   PANEL BODY (cuatrimestre list)
   ============================================================ */
.dash-panel-body {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .dash-panel-body { padding: 20px 16px; }
}

.dash-section-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 20px;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 15px;
}

/* Cuatrimestre cards */
.dash-cuatrimestres-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.dash-cuatrimestre-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.dash-cuatrimestre-item:hover {
  border-color: #1e3a5f;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.dci-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.dci-meta {
  font-size: 14px;
  color: #64748b;
}

.dci-count {
  font-size: 20px;
  font-weight: 800;
  color: #1e3a5f;
  background: #f1f5f9;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

@media (max-width: 768px) {
  .dash-cuatrimestres-list { grid-template-columns: 1fr; gap: 12px; }
  .dash-cuatrimestre-item { padding: 16px; border-radius: 12px; }
  .dci-title { font-size: 15px; }
}

/* ============================================================
   CUATRIMESTRE DETAIL VIEW — HEADER
   ============================================================ */
.dcv-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #234670 100%);
  padding: 24px 40px 20px;
  flex-shrink: 0;
  color: #ffffff;
}

@media (max-width: 768px) {
  .dcv-header {
    padding: 20px 20px 16px;
    border-radius: 0 0 20px 20px;
  }
}

.dcv-back {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  width: fit-content;
}

.dcv-back:hover {
  background: rgba(255,255,255,0.15);
  transform: translateX(-4px);
}

.dcv-sublabel {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 4px;
}

.dcv-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .dcv-title { font-size: 22px; }
}

.dcv-divider {
  height: 1px;
  background: rgba(255,255,255,0.12);
}

/* ============================================================
   CUATRIMESTRE DETAIL VIEW — BODY
   ============================================================ */
.dcv-body {
  flex: 1;
  padding: 24px 40px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .dcv-body { padding: 20px 16px; }
}

/* ============================================================
   METRICS CARDS
   2×2 in mobile, inline row in desktop
   ============================================================ */
.dcv-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (min-width: 900px) {
  .dcv-metrics {
    grid-template-columns: repeat(4, 1fr);
  }
}

.dcv-metric {
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

.dcv-metric:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.dcv-metric--active {
  border-color: #1e293b;
  background: #ffffff;
}

.dcv-metric-value {
  font-size: 24px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.1;
}

@media (min-width: 900px) {
  .dcv-metric-value { font-size: 28px; }
}

.dcv-metric-label {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Metric color variants */
.dcv-metric--green .dcv-metric-value { color: #1D9E75; }
.dcv-metric--blue .dcv-metric-value  { color: #185FA5; }
.dcv-metric--amber .dcv-metric-value { color: #b45309; }

/* ============================================================
   FILTER PILLS (scrollable horizontal)
   ============================================================ */
.dcv-pills {
  display: flex;
  gap: 8px;
  margin: 20px 0 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.dcv-pills::-webkit-scrollbar {
  display: none;
}

.dcv-pill {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 100px;
  border: 1.5px solid #d1d5db;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.dcv-pill:hover {
  border-color: #9ca3af;
  color: #374151;
}

.dcv-pill.active {
  background: #1e293b;
  border-color: #1e293b;
  color: #ffffff;
}

.dcv-count {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 16px;
}

/* ============================================================
   CENTRO / CUADRO CARDS GRID
   Mobile: 1 col, Tablet (>=600): 2 cols, Desktop (>=900): auto-fill
   ============================================================ */
.dcv-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 600px) {
  .dcv-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .dcv-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

/* Card with top accent border */
.dcv-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.dcv-card:hover {
  box-shadow: 0 8px 20px -6px rgba(0,0,0,0.08);
  transform: translateY(-2px);
  border-color: #cbd5e1;
}

.dcv-card-accent {
  height: 3px;
  background: var(--accent, #94a3b8);
  flex-shrink: 0;
}

.dcv-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 44px;
}

@media (min-width: 600px) {
  .dcv-card-body { padding: 18px; }
}

.dcv-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.dcv-card-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.dcv-card-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.dcv-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
  word-break: break-word;
}

.dcv-card-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 100px;
  white-space: nowrap;
  flex-shrink: 0;
}

.dcv-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dcv-card-tag {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
}

.dcv-card-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dcv-card-progress {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.dcv-card-progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.dcv-card-pct {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  min-width: 32px;
  text-align: right;
}

.dcv-card-date {
  font-size: 11px;
  color: #94a3b8;
}

/* ============================================================
   CUADRO ELÉCTRICO — header row
   ============================================================ */
.ce-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0;
}

.ce-count {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}

.btn-nuevo-cuadro {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  background: #1e3a5f;
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-nuevo-cuadro:hover {
  background: #152942;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(30,58,95,0.25);
}

/* ============================================================
   RESPONSIVE TWEAKS
   ============================================================ */
@media (max-width: 599px) {
  .dcv-metrics {
    gap: 10px;
  }

  .dcv-metric {
    padding: 14px 8px;
  }

  .dcv-metric-value {
    font-size: 22px;
  }

  .dcv-card-body {
    padding: 14px;
    gap: 8px;
  }

  .dcv-card-name {
    font-size: 13px;
  }
}
</style>
