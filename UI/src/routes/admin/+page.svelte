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
  import type { InformeGuardado, GrupoCuatrimestre } from '$lib/types/informe.interface';

  import './admin-page.css';

  let isAdmin = $derived(adminService.isAdmin);
  let isSyncing = $state(false);
  let vistaPanel = $state(true);
  let cuatrimestreSeleccionado = $state('');

  let excelInput: HTMLInputElement;

  onMount(async () => {
    if (!isAdmin) {
      await goto('/');
      return;
    }

    if (typeof localStorage !== 'undefined') {
      vistaPanel = localStorage.getItem('adminVistaPanel') !== 'false';
      cuatrimestreSeleccionado = localStorage.getItem('adminCuatrimestreSeleccionado') || '';
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
  let cuatrimestres = $derived(cuatrimestreService.getInformesPorCuatrimestre(informesGuardados));

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

  function cerrarSesion() {
    adminService.setAdmin(false);
    goto('/');
  }
</script>

<svelte:head>
  <title>Administración | GTM Mantenimiento</title>
</svelte:head>

<div class="admin-layout">
  <!-- Sidebar (desktop only) -->
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <span class="brand-logo">GTM</span>
      <span class="brand-dot"></span>
      <span class="brand-text">Mantenimiento</span>
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
        <h1>{ grupoSeleccionado?.label || 'Administración' }</h1>
        <span class="header-subtitle">Informes de mantenimiento</span>
      </div>
      <div class="header-actions">
        <!-- Grupo Excel -->
        <div class="action-group">
          <input type="file" bind:this={excelInput} accept=".xlsx" hidden onchange={onSubirExcel} />
          <button class="btn-icon-label secondary" onclick={() => excelInput.click()} disabled={isSyncing} title="Subir archivo Excel">
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
          <div class="mobile-brand">
            <span class="mobile-brand-arrow">▶</span>
            <span class="mobile-brand-name">GTM</span>
          </div>
          <button class="mobile-logout-btn" onclick={cerrarSesion}>Salir</button>
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
          <button class="mobile-action-card" onclick={() => excelInput.click()}>
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
          <div class="mobile-brand">
            <span class="mobile-brand-arrow">▶</span>
            <span class="mobile-brand-name">GTM</span>
          </div>
          <button class="mobile-gear" onclick={() => vistaPanel = true} title="Volver al panel">⚙</button>
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
</div>
