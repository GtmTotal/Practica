<script lang="ts">
  import type { FormState } from '$lib/services/domain/form-initialization.svelte';

  let {
    obraForm,
    guardando,
    generarPDF,
    guardarYSalir
  }: {
    obraForm: FormState;
    guardando: boolean;
    generarPDF: () => void;
    guardarYSalir: () => void;
  } = $props();

  let isCuadro = $derived(obraForm.tipo === 'cuadro_electrico');
</script>

{#if isCuadro}
<footer class="form-footer form-footer--cuadro">
  <button type="button" class="btn-submit btn-submit--cuadro" onclick={generarPDF} disabled={guardando}>
    { guardando ? '⌛ Generando...' : 'Guardar y generar informe' }
  </button>
</footer>
{:else}
<footer class="form-footer">
  <textarea bind:value={obraForm.conclusiones} placeholder="Conclusiones finales..."></textarea>
  <div class="footer-actions">
    <button type="button" class="btn-save-exit" onclick={guardarYSalir} disabled={guardando}>
      💾 GUARDAR Y SALIR
    </button>
    <button type="button" class="btn-submit" onclick={generarPDF} disabled={guardando}>
      { guardando ? '⌛ Generando...' : '📄 FINALIZAR Y GENERAR PDF' }
    </button>
  </div>
</footer>
{/if}

<style>
.form-footer {
  background: white;
  padding: 40px 20px 60px;
  border-top: 1px solid var(--gray-200);
  margin-top: 40px;
}

.form-footer--cuadro {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px 24px;
  border-top: 1px solid #e2e8f0;
  margin-top: 0;
  z-index: 50;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.04);
}

.form-footer textarea {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
  margin-bottom: 20px;
}

.footer-actions {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 12px;
}

.btn-save-exit {
  background: white;
  color: var(--gray-700);
  border: 2px solid var(--gray-200);
  width: 100%;
  padding: 14px;
  border-radius: 100px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition);
}

.btn-save-exit:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
  transform: translateY(-1px);
}

.btn-submit {
  background: linear-gradient(135deg, var(--success), var(--success-dark));
  color: white;
  border: none;
  width: 100%;
  padding: 14px;
  border-radius: 100px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-md);
}

.btn-submit:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

.btn-submit:active {
  transform: translateY(1px);
}

.btn-submit--cuadro {
  background: linear-gradient(135deg, #1e293b, #334155);
  border-radius: 12px;
  padding: 14px;
  font-size: 0.95rem;
  width: 100%;
}

.btn-submit--cuadro:hover {
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

@media (max-width: 600px) {
  .form-footer {
    padding: 10px 12px 20px;
  }

  .form-footer--cuadro {
    padding: 10px 12px 16px;
  }

  .form-footer textarea {
    height: 45px;
  }

  .footer-actions {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .btn-save-exit,
  .btn-submit {
    padding: 10px;
    font-size: 0.85rem;
  }

  .btn-submit--cuadro {
    padding: 12px;
    font-size: 0.9rem;
  }
}
</style>
