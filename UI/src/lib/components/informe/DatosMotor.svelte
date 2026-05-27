<script lang="ts">
  import type { BombaState } from '$lib/services/domain/form-initialization.svelte';

  let {
    bombas
  }: {
    bombas: BombaState[];
  } = $props();

  function getCamposBomba(bomba: BombaState): { clave: string; sufijo: string }[] {
    const claves = Object.keys(bomba).filter(k => k !== 'nombre');
    const sufijosMap: Record<string, string> = {
      amperios: 'A',
      porcentaje: '%',
      caudal: 'l/h',
      hz: 'Hz',
      bar: 'Bar'
    };
    return claves.map(clave => ({ clave, sufijo: sufijosMap[clave] || clave }));
  }
</script>

<div class="bombas-container">
  {#each bombas as bomba, idx (idx)}
    <div class="bomba-item">
      <span class="bomba-nombre">{ bomba.nombre }</span>
      <div class="bomba-campos">
        {#each getCamposBomba(bomba) as campo (campo.clave)}
          <label class="campo-bomba">
            <span>{ campo.sufijo }</span>
            <input
              type="number"
              step="any"
              bind:value={bomba[campo.clave]}
              placeholder={campo.sufijo}
            />
          </label>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .bombas-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
    padding: 12px;
    background: rgba(30, 60, 114, 0.04);
    border-radius: 8px;
    border: 1px dashed rgba(30, 60, 114, 0.15);
  }

  .bomba-item {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .bomba-nombre {
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--primary, #1e3a5f);
    min-width: 100px;
  }

  .bomba-campos {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .campo-bomba {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .campo-bomba span {
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--gray-500, #6b7280);
    text-transform: uppercase;
  }

  .campo-bomba input {
    width: 60px;
    padding: 4px 6px;
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: 6px;
    font-size: 0.8rem;
    text-align: center;
    background: white;
  }

  .campo-bomba input:focus {
    outline: none;
    border-color: var(--primary, #1e3a5f);
  }
</style>
