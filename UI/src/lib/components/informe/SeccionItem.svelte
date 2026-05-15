<script lang="ts">
  import type { SeccionState } from '$lib/services/form-initialization.svelte';
  import type { Foto } from '$lib/types/foto.interface';
  import ListaTareas from './ListaTareas.svelte';
  import GaleriaFotos from './GaleriaFotos.svelte';
  import './seccion-item.css';

  let {
    seccion,
    idxSeccion,
    colapsada,
    fotos,
    onToggle,
    onAgregarFoto,
    onEliminarFoto,
    onDescargarFoto,
    onActualizarDescripcion
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

</script>

<div class="seccion-card">
  <button type="button" class="seccion-titulo" onclick={onToggle}>
    <span>{ seccion.titulo }</span>
    <span class="icon-toggle" class:is-open={!colapsada}>{ colapsada ? '▶' : '◀' }</span>
  </button>

  {#if !colapsada}
    <div class="seccion-contenido">
      <ListaTareas
        tareasArray={seccion.tareas}
        prefijo={seccion.prefijo}
        {idxSeccion}
      />

      <div class="fotos-seccion">
        <input type="file" bind:this={fileInput} hidden onchange={onAgregarFoto} multiple />
        <button type="button" class="btn-foto" onclick={() => fileInput?.click()}>📸 Añadir Fotos</button>
        
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
