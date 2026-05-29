<script lang="ts">
  import type { SeccionState } from "$lib/services/domain/form-initialization.svelte";
  import type { Foto } from "$lib/types/foto.interface";
  import { progresoPorSeccion } from "$lib/utils/informe-utils";
  import ListaTareas from "./ListaTareas.svelte";
  import GaleriaFotos from "./GaleriaFotos.svelte";
  import { tecnicosService } from "$lib/services/stores/tecnicos";
 
  let {
    seccion,
    idxSeccion,
    colapsada,
    fotos,
    onToggle,
    onAgregarFoto,
    onEliminarFoto,
    onDescargarFoto,
    onActualizarDescripcion,
    tipoFormulario = 'mantenimiento'
  }: {
    seccion: SeccionState;
    idxSeccion: number;
    colapsada: boolean;
    fotos: Foto[];
    onToggle: () => void;
    onAgregarFoto: (event: Event) => void;
    onEliminarFoto: (fotoIdx: number) => void;
    onDescargarFoto: (foto: Foto) => void;
    onActualizarDescripcion: (fotoIdx: number, desc: string) => void;
    tipoFormulario?: string;
  } = $props();
 
  let fileInput: HTMLInputElement | null = $state(null);
  let cardRef: HTMLDivElement | null = $state(null);
  let wasColapsada = true;
 
  function asignarTecnicoSeccion(tecnico: string) {
    seccion.tareas.forEach(t => {
      t.tecnico = tecnico;
      if (t.subtareas && t.subtareas.length > 0) {
        t.subtareas.forEach(st => {
          st.tecnico = tecnico;
        });
      }
    });
  }
 
  $effect(() => {
    const c = colapsada;
    if (wasColapsada && !c && cardRef) {
      const y = cardRef.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    wasColapsada = c;
  });
 
  let parsed = $derived.by(() => {
    const match = seccion.titulo.match(/^(\d+)\s*[-.]?\s*(.+)$/);
    if (match) {
      return { numero: match[1], texto: match[2] };
    }
    return { numero: String(idxSeccion + 1), texto: seccion.titulo };
  });
 
  let numeroSeccion = $derived(parsed.numero);
  let textoSeccion = $derived(parsed.texto);
  let progSec = $derived(progresoPorSeccion(seccion));
</script>

<div class="seccion-card seccion-card--cuadro" id="seccion-{idxSeccion}" bind:this={cardRef}>
  <button type="button" class="seccion-titulo seccion-titulo--cuadro" onclick={onToggle}>
    <div class="seccion-titulo-left">
      <span class="seccion-texto seccion-texto--cuadro">{textoSeccion}</span>
    </div>
    <div class="seccion-header-right">
      {#if tipoFormulario === 'cuadro_electrico'}
        <div class="seccion-tecnico-assign">
          <select onchange={(e) => asignarTecnicoSeccion(e.currentTarget.value)} aria-label="Asignar técnico a toda la sección">
            <option value="">Asignar técnico a todos...</option>
            {#each tecnicosService.lista as tecnico}
              <option value={tecnico}>{tecnico}</option>
            {/each}
          </select>
        </div>
      {/if}
      <span class="seccion-progreso">{progSec.completadas}/{progSec.total}</span>
      <span class="icon-toggle" class:is-open={!colapsada}>{!colapsada ? '▼' : '▶'}</span>
    </div>
  </button>

  {#if !colapsada}
    <div class="seccion-contenido seccion-contenido--cuadro">
      <ListaTareas
        tareasArray={seccion.tareas}
        prefijo={seccion.prefijo}
        {idxSeccion}
        tipo={tipoFormulario}
      />

      <div class="fotos-seccion fotos-seccion--cuadro">
         <input
           type="file"
           accept="image/*"
           capture="environment"
           bind:this={fileInput}
           hidden
           onchange={onAgregarFoto}
           multiple
           aria-label="Añadir fotos"
         />
         <button
           type="button"
           class="btn-foto btn-foto--cuadro"
           onclick={() => fileInput?.click()}>
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Añadir Foto"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> Añadir fotos
         </button>

        <GaleriaFotos
          {fotos}
          {idxSeccion}
          {onEliminarFoto}
          {onDescargarFoto}
          {onActualizarDescripcion}
        />
      </div>
      <textarea
        bind:value={seccion.observaciones}
        placeholder="Observaciones generales de la sección..."
        class="obs-area"
      ></textarea>
    </div>
  {/if}
</div>

<style>
.seccion-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}

.seccion-card:hover {
  box-shadow: 0 8px 30px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}

/* Cuadro eléctrico: tarjeta plana y limpia */
.seccion-card--cuadro {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  margin-bottom: 12px;
  box-shadow: none;
  transition: none;
}
.seccion-card--cuadro:hover {
  box-shadow: none;
  transform: none;
}

.seccion-titulo {
  width: 100%;
  text-align: left;
  padding: 18px 24px;
  background: white;
  border: none;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.seccion-titulo--cuadro {
  padding: 14px 16px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid transparent;
}

@media (max-width: 480px) {
  .seccion-titulo--cuadro {
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
  }
}

.seccion-titulo-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.seccion-texto {
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--gray-800);
  line-height: 1.3;
  overflow-wrap: break-word;
}

.seccion-texto--cuadro {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.85rem;
  font-weight: 800;
  color: #1e293b;
  overflow-wrap: break-word;
}

.seccion-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .seccion-header-right {
    flex-wrap: wrap;
    width: 100%;
    justify-content: flex-end;
  }
}

.seccion-progreso {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 6px;
}

.icon-toggle {
  font-size: 0.9rem;
  font-weight: 900;
  color: var(--brand-accent);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
}

.icon-toggle.is-open {
  color: var(--primary);
}

.seccion-titulo--cuadro .icon-toggle.is-open {
  color: var(--primary);
}

.seccion-contenido {
  padding: 20px;
}

.seccion-contenido--cuadro {
  padding: 0;
  border-top: 1px solid #f1f5f9;
}

.obs-area {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.85rem;
  margin-top: 12px;
  resize: vertical;
  background: white;
}

.btn-foto {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 100px;
  font-weight: 600;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.btn-foto:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-md);
}

.btn-foto--cuadro {
  background: white;
  color: var(--primary, #1e3a5f);
  border: 1.5px solid var(--primary, #1e3a5f);
  border-radius: 10px;
  padding: 0;
  font-weight: 600;
  font-size: 0.8rem;
  box-shadow: none;
  width: 140px;
  height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
}

  .btn-foto--cuadro:hover {
    background: var(--primary, #1e3a5f);
    color: white;
    transform: none;
    box-shadow: none;
  }
 
  .fotos-seccion--cuadro {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px 0 8px;
    margin-top: 8px;
    border-top: 1px solid #f1f5f9;
  }
 
  .seccion-tecnico-assign {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }
 
  .seccion-tecnico-assign select {
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid var(--gray-300);
    background: white;
    color: var(--gray-600);
    outline: none;
    cursor: pointer;
    width: 100%;
    max-width: 160px;
  }
  
  .seccion-tecnico-assign select:hover {
    border-color: var(--primary);
  }
 
  @media (max-width: 600px) {
    .btn-foto--cuadro {
      width: 120px;
      height: 120px;
      font-size: 0.75rem;
    }
  }
</style>
