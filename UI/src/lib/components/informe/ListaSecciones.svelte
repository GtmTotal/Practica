<script lang="ts">
  import type { FormState } from '$lib/services/form-initialization.svelte';
  import type { Foto } from '$lib/types/foto.interface';
  import SeccionItem from './SeccionItem.svelte';

  let {
    obraForm,
    seccionesColapsadas,
    fotosPorSeccionBase64,
    toggle,
    agregarFoto,
    eliminarFoto,
    descargarFoto,
    actualizarDescripcion,
    tipo
  }: {
    obraForm: FormState;
    seccionesColapsadas: boolean[];
    fotosPorSeccionBase64: Foto[][];
    toggle: (idx: number) => void;
    agregarFoto: (event: Event, secIdx: number) => void;
    eliminarFoto: (secIdx: number, fotoIdx: number) => void;
    descargarFoto: (foto: Foto) => void;
    actualizarDescripcion: (secIdx: number, fotoIdx: number, descripcion: string) => void;
    tipo: string;
  } = $props();

</script>

<div class="secciones-container">
  {#if obraForm.secciones.length}
    {#each obraForm.secciones as seccion, idx (idx)}
      <SeccionItem
        {seccion}
        idxSeccion={idx}
        colapsada={seccionesColapsadas[idx]}
        fotos={fotosPorSeccionBase64[idx]}
        onToggle={() => toggle(idx)}
        onAgregarFoto={(event) => agregarFoto(event, idx)}
        onEliminarFoto={(fotoIdx) => eliminarFoto(idx, fotoIdx)}
        onDescargarFoto={descargarFoto}
        onActualizarDescripcion={(fotoIdx, desc) => actualizarDescripcion(idx, fotoIdx, desc)}
        tipoFormulario={tipo}
      />
    {/each}
  {/if}
</div>
