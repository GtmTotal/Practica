<script lang="ts">
  import type { FormState } from '$lib/services/form-initialization.svelte';
  import './informe-footer.css';

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
</script>

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
