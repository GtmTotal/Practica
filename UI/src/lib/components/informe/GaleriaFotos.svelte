<script lang="ts">
  import type { Foto } from '$lib/types/foto.interface';

  let {
    fotos,
    idxSeccion,
    onEliminarFoto,
    onDescargarFoto,
    onActualizarDescripcion
  }: {
    fotos: Foto[];
    idxSeccion: number;
    onEliminarFoto: (fotoIdx: number) => void;
    onDescargarFoto: (foto: Foto) => void;
    onActualizarDescripcion: (fotoIdx: number, descripcion: string) => void;
  } = $props();
</script>

<div class="fotos-previa">
  {#each fotos as foto, idx (idx)}
    <div class="foto-thumb">
      <img src={foto.preview || foto.url || foto.base64} alt={foto.descripcion || foto.nombre || 'Foto'}>
      <button type="button" class="btn-del-foto" onclick={() => onEliminarFoto(idx)}>✕</button>
      <button type="button" class="btn-download-foto" onclick={() => onDescargarFoto(foto)}>⬇️</button>
      <input
        type="text"
        class="foto-desc-input"
        placeholder="Descripción..."
        value={foto.descripcion || ''}
        oninput={(e) => onActualizarDescripcion(idx, e.currentTarget.value)}
      />
    </div>
  {/each}
</div>

<style>
  .fotos-previa {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
  }

  .foto-thumb {
    position: relative;
    width: 140px;
    height: 140px;
    border-radius: var(--radius-md, 12px);
    box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
    background: var(--gray-100, #f3f4f6);
    overflow: hidden;
    transition: transform 0.2s ease;
  }

  .foto-thumb:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-md, 0 4px 6px rgba(0,0,0,0.1));
  }

  .foto-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-md, 12px);
  }

  .btn-del-foto {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(220, 38, 38, 0.9);
    color: white;
    border: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 10;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .btn-del-foto:hover {
    transform: scale(1.1);
    background: #dc2626;
  }

  .btn-download-foto {
    position: absolute;
    bottom: 2px;
    left: 2px;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-download-foto:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.05);
  }

  .foto-desc-input {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    padding: 4px 6px;
    border: none;
    border-top: 1px solid var(--gray-200, #e5e7eb);
    background: rgba(255, 255, 255, 0.95);
    font-size: 0.7rem;
    color: var(--gray-700, #374151);
    outline: none;
    z-index: 5;
  }

  .foto-desc-input::placeholder {
    color: var(--gray-400, #9ca3af);
  }

  .foto-desc-input:focus {
    background: white;
    border-top-color: var(--primary, #1e3a5f);
  }
</style>
