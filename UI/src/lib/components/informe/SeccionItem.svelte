<script lang="ts">
  import type { SeccionState } from "$lib/services/form-initialization.svelte";
  import type { Foto } from "$lib/types/foto.interface";
  import ListaTareas from "./ListaTareas.svelte";
  import GaleriaFotos from "./GaleriaFotos.svelte";
  import "./seccion-item.css";

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
