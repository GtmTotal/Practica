<script lang="ts">
  import type { DocumentDto } from '$lib/types/document.interface';
  import { adminService } from '$lib/services/admin.svelte';
  import { ui } from '$lib/services/ui.svelte';

  let { documents } = $props<{ documents: DocumentDto[] }>();

  // Local state for editing
  let editingId: number | null = null;
  let editData: any = {};

  function startEdit(doc: DocumentDto) {
    editingId = doc.Id;
    editData = { ...doc };
  }

  async function saveEdit() {
    if (editingId === null) return;
    try {
      await adminService.updateDocument(editingId, editData);
      editingId = null;
      ui.success('Documento actualizado correctamente');
    } catch (e: any) {
      ui.error(e.message || 'Error al actualizar');
    }
  }

  function cancelEdit() {
    editingId = null;
    editData = {};
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
    try {
      await adminService.deleteDocument(id);
      ui.success('Documento eliminado');
    } catch (e: any) {
      ui.error(e.message || 'Error al eliminar');
    }
  }


</script>

<div class="table-container">
  <table class="editable-table">
    <thead>
      <tr>
        <th>Nombre Obra</th>
        <th>Técnico</th>
        <th>Fecha</th>
        <th>Cuatrimestre</th>
        <th>Protegido</th>
        <th>Conclusiones</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      {#each documents as doc}
        <tr class:editing={editingId === doc.Id}>
          <td>{doc.NombreObra}</td>
          
          <td>
            {#if editingId === doc.Id}
              <input bind:value={editData.Tecnico} />
            {:else}
              {doc.Tecnico}
            {/if}
          </td>
          
          <td>
            {#if editingId === doc.Id}
              <input type="date" bind:value={editData.Fecha} />
            {:else}
              {doc.Fecha}
            {/if}
          </td>
          
          <td>
            {#if editingId === doc.Id}
              <input bind:value={editData.Cuatrimestre} />
            {:else}
              {doc.Cuatrimestre}
            {/if}
          </td>
          
          <td>
            {#if editingId === doc.Id}
              <input type="checkbox" bind:checked={editData.Protegido} />
            {:else}
              {doc.Protegido ? 'Sí' : 'No'}
            {/if}
          </td>
          
          <td>
            {#if editingId === doc.Id}
              <input bind:value={editData.Conclusiones} />
            {:else}
              {doc.Conclusiones}
            {/if}
          </td>
          
          <td class="actions">
            {#if editingId === doc.Id}
              <button class="btn-save" onclick={saveEdit}>💾</button>
              <button class="btn-cancel" onclick={cancelEdit}>❌</button>
            {:else}
              <button class="btn-edit" onclick={() => startEdit(doc)}>✏️</button>
              <button class="btn-delete" onclick={() => handleDelete(doc.Id)}>🗑️</button>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-container {
    overflow-x: auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid var(--gray-200);
    margin-top: 20px;
  }

  .editable-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
  }

  .editable-table th {
    background: #f8fafc;
    padding: 12px 16px;
    font-weight: 600;
    color: var(--gray-600);
    border-bottom: 2px solid var(--gray-100);
  }

  .editable-table td {
    padding: 10px 16px;
    border-bottom: 1px solid var(--gray-50);
    color: var(--gray-800);
    vertical-align: middle;
  }

  tr.editing {
    background: #f1f5f9;
  }

  input {
    padding: 6px 8px;
    border: 1px solid var(--gray-300);
    border-radius: 6px;
    width: 100%;
    font-size: 12px;
  }

  .actions {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-size: 16px;
    padding: 4px;
    transition: transform 0.1s;
  }

  button:hover {
    transform: scale(1.2);
  }

  .btn-save { color: green; }
  .btn-cancel { color: gray; }
  .btn-edit { color: var(--primary); }
  .btn-delete { color: red; }
</style>
