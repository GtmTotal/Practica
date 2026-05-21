<script lang="ts">
  import type { FormState } from '$lib/services/form-initialization.svelte';

  let {
    obraForm,
    seccionesColapsadas,
    progreso,
    onToggle
  }: {
    obraForm: FormState;
    seccionesColapsadas: boolean[];
    progreso: number;
    onToggle: (idx: number) => void;
  } = $props();

  function parseTituloCorto(tituloCompleto: string) {
    const partes = tituloCompleto.split('-');
    if (partes.length > 1) {
      const numero = partes[0].trim();
      const texto = partes[1].trim();
      const textoFormateado = texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
      return `${numero}. ${textoFormateado}`;
    }
    return tituloCompleto;
  }

  function sectionIsComplete(seccion: any) {
    if (!seccion || !seccion.tareas || seccion.tareas.length === 0) return false;
    for (const t of seccion.tareas) {
      if (!t.ok && !t.noOk) return false; 
    }
    return true;
  }

  function handleClick(idx: number) {
    if (seccionesColapsadas[idx]) {
      onToggle(idx);
    }
    // Scroll a la seccion
    const el = document.getElementById(`seccion-${idx}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
</script>

<aside class="sidebar-indice">
  <div class="sidebar-header">
    <h3>Índice</h3>
    <span class="progreso-texto">{progreso}% completado</span>
  </div>
  
  <div class="indice-lista">
    {#each obraForm.secciones as seccion, idx}
      <button 
        type="button" 
        class="indice-item" 
        class:activa={!seccionesColapsadas[idx]} 
        onclick={() => handleClick(idx)}>
        <span class="indice-texto">{parseTituloCorto(seccion.titulo)}</span>
        {#if sectionIsComplete(seccion)}
          <span class="indice-check">✅</span>
        {/if}
      </button>
    {/each}
  </div>
</aside>

<style>
  .sidebar-indice {
    position: sticky;
    top: 24px;
    background: white;
    border-radius: 12px;
    padding: 20px;
    width: 280px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    border: 1px solid var(--gray-200);
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    flex-shrink: 0;
    display: none;
  }

  @media (min-width: 992px) {
    .sidebar-indice {
      display: flex;
      flex-direction: column;
    }
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--gray-100);
  }

  .sidebar-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--gray-800);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .progreso-texto {
    font-size: 12px;
    font-weight: 600;
    color: var(--primary);
  }

  .indice-lista {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .indice-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: transparent;
    border: none;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
    color: var(--gray-600);
    font-size: 13px;
    font-weight: 500;
  }

  .indice-item:hover {
    background: var(--gray-50);
    color: var(--primary);
  }

  .indice-item.activa {
    background: #f1f5f9;
    color: var(--primary);
    font-weight: 600;
  }

  .indice-texto {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 190px;
  }

  .indice-check {
    font-size: 12px;
  }
</style>
