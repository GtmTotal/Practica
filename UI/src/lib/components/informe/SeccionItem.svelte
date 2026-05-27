<script lang="ts">
  import type { SeccionState } from "$lib/services/domain/form-initialization.svelte";
  import type { Foto } from "$lib/types/foto.interface";
  import ListaTareas from "./ListaTareas.svelte";
  import GaleriaFotos from "./GaleriaFotos.svelte";


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

  let parsed = $derived.by(() => {
    // Intenta formato: "1 - Titulo" o "1. Titulo" o "1 Titulo"
    const match = seccion.titulo.match(/^(\d+)\s*[-.]?\s*(.+)$/);
    if (match) {
      return { numero: match[1], texto: match[2] };
    }
    return { numero: String(idxSeccion + 1), texto: seccion.titulo };
  });

  let numeroSeccion = $derived(parsed.numero);
  let textoSeccion = $derived(parsed.texto);
</script>

<div class="seccion-card" id="seccion-{idxSeccion}">
  <button type="button" class="seccion-titulo" onclick={onToggle}>
    <div class="seccion-titulo-left">
      {#if numeroSeccion}
        <span class="seccion-numero">{numeroSeccion}</span>
      {/if}
      <span class="seccion-texto">{textoSeccion}</span>
    </div>
    <span class="icon-toggle" class:is-open={!colapsada}>▶</span>
  </button>

  {#if !colapsada}
    <div class="seccion-contenido">
      <ListaTareas
        tareasArray={seccion.tareas}
        prefijo={seccion.prefijo}
        {idxSeccion}
        tipo={tipoFormulario}
      />

      <div class="fotos-seccion">
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
           class="btn-foto"
           onclick={() => fileInput?.click()}>
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Añadir Foto"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> Añadir Fotos
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

.seccion-titulo-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.seccion-numero {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(30, 60, 114, 0.3);
}

.seccion-texto {
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--gray-800);
  line-height: 1.3;
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
  transform: rotate(90deg);
}

.seccion-contenido {
  padding: 20px;
}

.obs-area,
.input-obs {
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

.btn-foto,
.btn-foto-add {
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

.btn-foto:hover,
.btn-foto-add:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-md);
}
</style>
