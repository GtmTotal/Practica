<script lang="ts">
  import type { SubTareaState } from '$lib/services/form-initialization.svelte';

  let {
    subtarea,
    indiceCompleto
  }: {
    subtarea: SubTareaState;
    indiceCompleto: string;
  } = $props();

  function toggleOk() {
    if (subtarea.ok) {
      subtarea.ok = false;
    } else {
      subtarea.ok = true;
      subtarea.noOk = false;
    }
  }

  function toggleNoOk() {
    if (subtarea.noOk) {
      subtarea.noOk = false;
    } else {
      subtarea.noOk = true;
      subtarea.ok = false;
    }
  }
</script>

<div class="subtarea-item">
  <div class="subtarea-main">
    <span class="subtarea-indice">{ indiceCompleto }</span>
    <p class="subtarea-descripcion">{ subtarea.descripcion }</p>
    
    {#if !subtarea.sinCheck}
      <div class="subtarea-controles">
        <button class="sub-btn sub-btn-ok" class:checked={subtarea.ok} onclick={toggleOk}>
          ✓ OK
        </button>
        <button class="sub-btn sub-btn-revisar" class:checked={subtarea.noOk} onclick={toggleNoOk}>
          ⚠ REVISAR
        </button>
      </div>
    {/if}
  </div>

  <div class="subtarea-notes-row">
    <input type="text" bind:value={subtarea.notaTarea} placeholder="Notas / Observaciones..." class="subtarea-notas" />
  </div>
</div>

<style>
  .subtarea-item {
    padding: 10px 14px;
    margin-left: 20px;
    border-left: 3px solid #3b82f6;
    margin-bottom: 8px;
    background: #ffffff;
    border-radius: 0 10px 10px 0;
  }

  .subtarea-main {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .subtarea-indice {
    font-weight: 700;
    font-size: 0.75rem;
    color: #1e3a5f;
    background: rgba(30, 60, 95, 0.1);
    padding: 2px 8px;
    border-radius: 20px;
    min-width: 48px;
    text-align: center;
    flex-shrink: 0;
  }

  .subtarea-descripcion {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1e293b;
    margin: 0;
    line-height: 1.3;
    min-width: 150px;
  }

  .subtarea-controles {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }



  .sub-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    border-radius: 100px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
  }

  .sub-btn:hover {
    background: #f1f5f9;
  }

  .sub-btn-ok.checked {
    background: #059669;
    color: white;
    border-color: #059669;
  }

  .sub-btn-revisar.checked {
    background: #d97706;
    color: white;
    border-color: #d97706;
  }

  .subtarea-notes-row {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #e2e8f0;
  }

  .subtarea-notas {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.8rem;
    background: #f8fafc;
    outline: none;
    box-sizing: border-box;
    transition: all 0.15s;
  }

  .subtarea-notas:focus {
    border-color: #3b82f6;
    background: white;
  }
</style>