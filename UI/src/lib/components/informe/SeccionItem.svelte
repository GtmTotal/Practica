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
        />
        <button
          type="button"
          class="btn-foto"
          onclick={() => fileInput?.click()}>📸 Añadir Fotos</button
        >

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
