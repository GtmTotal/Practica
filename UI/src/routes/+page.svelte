<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { navService } from '$lib/services/navigation.svelte';
  import { adminService } from '$lib/services/admin.svelte';
  import { ui } from '$lib/services/ui.svelte';
  import { cuatrimestreService } from '$lib/services/cuatrimestre.svelte';
  import { formPersistenceService } from '$lib/services/form-persistence.svelte';
  import { formInitService } from '$lib/services/form-initialization.svelte';
  import { databaseService } from '$lib/services/database.svelte';
  import CrearCuadroElectricoModal from '$lib/components/admin/CrearCuadroElectricoModal.svelte';
  import type { InformeGuardado } from '$lib/types/informe.interface';

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

  function estadoDe(informe: InformeGuardado) {
    const prog = progresoDe(informe);
    if (prog >= 100) return 'completado';
    if (prog > 0) return 'en-progreso';
    return 'pendiente';
  }

  function progresoDe(informe: InformeGuardado): number {
    if (informe.progreso !== undefined) return informe.progreso;
    const secciones = informe.secciones;
    if (!secciones?.length) return 0;
    let total = 0, hechas = 0;
    for (const sec of secciones) {
      for (const t of sec.tareas || []) {
        total++;
        if (t.rev || t.ok || t.noOk) hechas++;
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

  function switchTab(tab: 'mantenimiento' | 'cuadros') {
    tabActual = tab;
    filtroCuadro = 'todos';
    filtroSeleccionado = 'todos';
    // Reset cuatrimestre selection when switching tabs
    if (tab === 'cuadros') {
      navService.cuatrimestreSeleccionado = '';
      navService.persist();
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
</svelte:head>

<div class="main-layout">
  <!-- Sidebar (desktop) -->
  <aside class="main-sidebar">
    <div class="sidebar-top">
      <img src="gtmCompleto.png" alt="GTM" class="brand-logo" />
      <h1 class="sidebar-title">Control total del mantenimiento.</h1>
      <p class="sidebar-subtitle">Seguimiento de centros, períodos y estados en un solo lugar.</p>
    </div>
    <button class="btn-admin-gear" onclick={toggleAdmin} title="Administración">
      <span>⚙</span>
    </button>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <!-- View 1: Panel de Selección (con pestañas) -->
    <div class="dash-view dash-panel-view" class:active={vistaPanel}>
      <div class="dash-panel-header">
        <button class="dash-admin-gear mobile-only" onclick={toggleAdmin} title="Administración">⚙</button>
        <h1 class="dash-panel-title">Control total del mantenimiento.</h1>
        <p class="dash-panel-subtitle">Seguimiento de centros, períodos y estados en un solo lugar.</p>

        <!-- Tab Switcher -->
        <div class="tab-switcher">
          <button
            class="tab-btn"
            class:active={tabActual === 'mantenimiento'}
            onclick={() => switchTab('mantenimiento')}>
            <span class="tab-icon">📋</span>
            <span class="tab-text">Mantenimiento</span>
          </button>
          <button
            class="tab-btn"
            class:active={tabActual === 'cuadros'}
            onclick={() => switchTab('cuadros')}>
            <span class="tab-icon">⚡</span>
            <span class="tab-text">Cuadro Eléctrico</span>
          </button>
        </div>
      </div>

      <div class="dash-panel-body">
        {#if tabActual === 'mantenimiento'}
          <!-- ===== TAB MANTENIMIENTO ===== -->
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
          <!-- ===== TAB CUADROS ELÉCTRICOS ===== -->
          <div class="cuadro-tab-metrics">
            <button class="cuadro-metric" class:active={filtroCuadro === 'todos'} onclick={() => filtroCuadro = 'todos'}>
              <span class="cuadro-metric-val">{ metricasCuadro.total }</span>
              <span class="cuadro-metric-lbl">TOTAL</span>
            </button>
            <button class="cuadro-metric cuadro-metric--green" class:active={filtroCuadro === 'completado'} onclick={() => filtroCuadro = 'completado'}>
              <span class="cuadro-metric-val">{ metricasCuadro.completados }</span>
              <span class="cuadro-metric-lbl">COMPLETADOS</span>
            </button>
            <button class="cuadro-metric cuadro-metric--orange" class:active={filtroCuadro === 'en-progreso'} onclick={() => filtroCuadro = 'en-progreso'}>
              <span class="cuadro-metric-val">{ metricasCuadro.enProgreso }</span>
              <span class="cuadro-metric-lbl">EN PROGRESO</span>
            </button>
            <button class="cuadro-metric cuadro-metric--red" class:active={filtroCuadro === 'pendiente'} onclick={() => filtroCuadro = 'pendiente'}>
              <span class="cuadro-metric-val">{ metricasCuadro.pendientes }</span>
              <span class="cuadro-metric-lbl">PENDIENTES</span>
            </button>
          </div>

          <div class="cuadro-tab-header-row">
            <div class="dash-section-label">CUADROS ({informesCuadroFiltrados.length})</div>
            <button class="btn-nuevo-cuadro" onclick={() => showCrearCuadroModal = true}>
              <span>＋</span> Nuevo Cuadro
            </button>
          </div>

          {#if informesCuadroFiltrados.length === 0}
            <div class="empty-state">
              <div style="font-size: 48px; margin-bottom: 12px;">⚡</div>
              <p>No hay informes de Cuadro Eléctrico{filtroCuadro !== 'todos' ? ` con estado "${filtroCuadro}"` : ''}.</p>
              {#if filtroCuadro === 'todos'}
                <button class="btn-nuevo-cuadro" onclick={() => showCrearCuadroModal = true}>
                  <span>＋</span> Crear Primer Informe
                </button>
              {/if}
            </div>
          {:else}
            <div class="cuadro-cards-grid">
              {#each informesCuadroFiltrados as inf (inf.id)}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="cuadro-card-tech"
                  style="--dot-color: {colorEstado(inf)}"
                  data-estado={estadoDe(inf)}
                  onclick={() => editarInformeCuadro(inf)}>
                  <div class="cuadro-card-tech-top">
                    <div class="cuadro-card-tech-icon" style="background: {progresoDe(inf) === 100 ? '#e6f4ea' : progresoDe(inf) > 0 ? '#fffbeb' : '#f1f5f9'}; color: {progresoDe(inf) === 100 ? '#059669' : progresoDe(inf) > 0 ? '#d97706' : '#64748b'}">
                      ⚡
                    </div>
                    <div class="cuadro-card-tech-info">
                      <h3>{ inf.nombreObra }</h3>
                      <div class="cuadro-card-tech-meta">
                        {#if inf.nOrdenCuadro}<span>Orden: {inf.nOrdenCuadro}</span>{/if}
                        {#if inf.nProy}<span>Proy: {inf.nProy}</span>{/if}
                      </div>
                    </div>
                    <span class="cuadro-card-tech-estado" style="color: {colorEstado(inf)}">{ labelEstado(inf) }</span>
                  </div>
                  <div class="cuadro-card-tech-bottom">
                    <div class="cuadro-card-tech-progress">
                      <div class="cuadro-progress-bar">
                        <div class="cuadro-progress-fill" style="width: {progresoDe(inf)}%; background: {colorEstado(inf)}"></div>
                      </div>
                      <span class="cuadro-progress-text">{progresoDe(inf)}%</span>
                    </div>
                    <span class="cuadro-card-tech-date">{ inf.ultimaModificacion || '—' }</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>

    <!-- View 2: Detalle de Cuatrimestre -->
    <div class="dash-view dash-cuatrimestre-view" class:active={!vistaPanel}>
      <div class="dash-cuatrimestre-header">
        <div class="dash-brand-row">
          <button class="dash-back-link" onclick={cerrarDetalle}>‹ Cuatrimestre</button>
          <img src="gtmCompleto.png" alt="GTM" class="dash-brand-logo mobile-only" />
        </div>
        <div class="dash-cuatri-row">
          <span class="dash-cuatri-title">{ grupoSeleccionado?.label || '' }</span>
        </div>
        <p class="dash-subtitle">Mercadona · informes de mantenimiento</p>
        <div class="dash-metrics">
          <button 
            class="mm-card" 
            class:active={filtroSeleccionado === 'todos'} 
            onclick={() => filtroSeleccionado = 'todos'}>
            <div class="mm-value">{ metricas.total }</div>
            <div class="mm-label">CENTROS</div>
          </button>
          <button 
            class="mm-card mm-green" 
            class:active={filtroSeleccionado === 'completado'} 
            onclick={() => filtroSeleccionado = 'completado'}>
            <div class="mm-value">{ metricas.completados }</div>
            <div class="mm-label">COMPLETADOS</div>
          </button>
          <button 
            class="mm-card mm-orange" 
            class:active={filtroSeleccionado === 'en-progreso'} 
            onclick={() => filtroSeleccionado = 'en-progreso'}>
            <div class="mm-value">{ metricas.enProgreso }</div>
            <div class="mm-label">EN PROGRESO</div>
          </button>
          <button 
            class="mm-card mm-red" 
            class:active={filtroSeleccionado === 'pendiente'} 
            onclick={() => filtroSeleccionado = 'pendiente'}>
            <div class="mm-value">{ metricas.pendientes }</div>
            <div class="mm-label">PENDIENTES</div>
          </button>
        </div>
      </div>

      <div class="dash-cuatrimestre-body">
        <div class="centros-label">CENTROS</div>
        <section class="centros-grid">
          {#each informesFiltrados as inf (inf.id)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="centro-card"
              style="--dot-color: {colorEstado(inf)}"
              data-estado={estadoDe(inf)}
              onclick={() => editarInforme(inf)}>
              <div class="card-header">
                <span class="centro-nombre">{ inf.nombreObra }</span>
                <span class="centro-estado">{ labelEstado(inf) }</span>
              </div>
              <div class="card-body">
                <div class="centro-progreso">
                  <span class="progreso-valor">{ progresoDe(inf) }% completado</span>
                </div>
                <div class="centro-fecha">{ inf.ultimaModificacion || '—' }</div>
              </div>
            </div>
          {/each}
        </section>
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
/* ===== LAYOUT ===== */
.main-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f5f0;
}

/* ===== SIDEBAR (DESKTOP ONLY) ===== */
.main-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: #1e3a5f;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 40px;
  color: #ffffff;
}

@media (max-width: 768px) {
  .main-sidebar {
    display: none;
  }
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
  color: rgba(255,255,255,0.55);
  margin: 0;
}

.btn-admin-gear {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  color: rgba(255,255,255,0.6);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-admin-gear:hover {
  border-color: rgba(255,255,255,0.5);
  color: #ffffff;
  background: rgba(255,255,255,0.08);
}

/* ===== MAIN CONTENT AREA ===== */
.main-content {
  flex: 1;
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* ===== DASHBOARD VIEWS (Common) ===== */
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
  .mobile-only {
    display: flex;
  }
}

/* Botón admin (engranaje) en header móvil */
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
  .dash-admin-gear.mobile-only {
    display: flex;
  }
}

/* Headers */
.dash-panel-header,
.dash-cuatrimestre-header {
  position: relative;
  background: #1e3a5f;
  padding: 32px 40px;
  flex-shrink: 0;
  color: #ffffff;
}

@media (max-width: 768px) {
  .dash-panel-header,
  .dash-cuatrimestre-header {
    padding: 24px 20px;
  }
  .dash-cuatrimestre-header {
    border-radius: 0 0 20px 20px;
  }
}

.dash-brand-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dash-brand-logo {
  width: 100px;
}

.dash-back-link {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  width: fit-content;
}

.dash-back-link:hover {
  background: rgba(255,255,255,0.15);
  transform: translateX(-4px);
}

/* Titles */
.dash-panel-title,
.dash-cuatri-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.dash-panel-subtitle,
.dash-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  margin: 0;
}

@media (max-width: 768px) {
  .dash-panel-title,
  .dash-cuatri-title { font-size: 24px; }
}

/* Metrics */
.dash-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 24px;
  max-width: 1000px;
}

.mm-card {
  background: rgba(255,255,255,0.08);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
  color: white;
  width: 100%;
}

.mm-card:hover {
  background: rgba(255,255,255,0.12);
  transform: translateY(-2px);
}

.mm-card.active {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.4);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.mm-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 6px;
}

.mm-orange .mm-value { color: #fbbf24; }
.mm-green .mm-value { color: #10b981; }
.mm-red .mm-value { color: #fca5a5; }

.mm-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .dash-metrics { 
    grid-template-columns: repeat(2, 1fr);
    gap: 10px; 
  }
  .mm-card { padding: 14px 10px; }
  .mm-value { font-size: 22px; }
}


.dash-cuatri-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

/* Body */
.dash-panel-body,
.dash-cuatrimestre-body {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .dash-panel-body,
  .dash-cuatrimestre-body { padding: 20px 16px; }
}

.dash-section-label,
.centros-label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 20px;
}

/* Cuatrimestres List (Grid on Desktop) */
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

/* Centros Grid (Desktop Optimization) */
.centros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

@media (max-width: 1024px) {
  .centros-grid {
    grid-template-columns: 1fr;
  }
}

.centro-card {
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 16px;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 4px 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.centro-card:hover {
  transform: scale(1.01);
  box-shadow: 0 12px 20px -5px rgba(0,0,0,0.08);
  border-color: #e2e8f0;
}

.centro-card::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--dot-color, #d1d5db);
  grid-row: 1 / 3;
  box-shadow: 0 0 0 4px rgba(var(--dot-rgb, 209, 213, 219), 0.1);
}

.centro-card::after {
  content: '›';
  color: #cbd5e1;
  font-size: 24px;
  grid-row: 1 / 3;
  transition: transform 0.2s;
}

.centro-card:hover::after {
  transform: translateX(4px);
  color: #1e3a5f;
}

.centro-nombre {
  grid-column: 2;
  grid-row: 1;
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.centro-progreso {
  grid-column: 2;
  grid-row: 2;
  font-size: 13px;
  color: #64748b;
}

.centro-estado {
  grid-column: 3;
  grid-row: 1;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 100px;
  background: #f1f5f9;
  color: #475569;
  white-space: nowrap;
}

.centro-card[data-estado="en-progreso"] .centro-estado {
  background: #fffbeb;
  color: #92400e;
}

.centro-card[data-estado="completado"] .centro-estado {
  background: #ecfdf5;
  color: #065f46;
}

.centro-fecha {
  grid-column: 3;
  grid-row: 2;
  font-size: 12px;
  color: #94a3b8;
  text-align: right;
}

@media (max-width: 768px) {
  .centro-card {
    padding: 14px 16px;
    border-radius: 12px;
    gap: 4px 12px;
  }
  .centro-nombre { font-size: 15px; }
  .centro-card::after { font-size: 18px; }
}

.empty-state {
  padding: 100px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 16px;
}

/* ===== TAB SWITCHER ===== */
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

.tab-icon {
  font-size: 1.1rem;
  line-height: 1;
}

/* ===== CUADRO ELÉCTRICO TAB ===== */
.cuadro-tab-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

@media (max-width: 768px) {
  .cuadro-tab-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}

.cuadro-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 12px;
  border: 2px solid transparent;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.cuadro-metric:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
}

.cuadro-metric.active {
  border-color: #1e3a5f;
  background: #f8fafc;
}

.cuadro-metric-val {
  font-size: 26px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}

.cuadro-metric-lbl {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.cuadro-metric--green .cuadro-metric-val { color: #059669; }
.cuadro-metric--orange .cuadro-metric-val { color: #d97706; }
.cuadro-metric--red .cuadro-metric-val { color: #ef4444; }

.cuadro-tab-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
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

.cuadro-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .cuadro-cards-grid {
    grid-template-columns: 1fr;
  }
}

.cuadro-card-tech {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 22px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cuadro-card-tech:hover {
  border-color: #cbd5e1;
  box-shadow: 0 12px 24px -6px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.cuadro-card-tech-top {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.cuadro-card-tech-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.cuadro-card-tech-info {
  flex: 1;
  min-width: 0;
}

.cuadro-card-tech-info h3 {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cuadro-card-tech-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.75rem;
  color: #64748b;
}

.cuadro-card-tech-meta span {
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
}

.cuadro-card-tech-estado {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 100px;
  background: #f1f5f9;
  white-space: nowrap;
}

.cuadro-card-tech-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
}

.cuadro-card-tech-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cuadro-progress-bar {
  flex: 1;
  height: 6px;
  background: #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
}

.cuadro-progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s ease;
}

.cuadro-progress-text {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  min-width: 36px;
  text-align: right;
}

.cuadro-card-tech-date {
  font-size: 0.75rem;
  color: #94a3b8;
  white-space: nowrap;
}
</style>
