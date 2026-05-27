<script lang="ts">
  import { ui } from '../services/ui.svelte';
  import { fade, scale } from 'svelte/transition';

  let inputVal = $state('');

  $effect(() => {
    if (ui.dialogState) {
      inputVal = '';
    }
  });

  function onOk() {
    const s = ui.dialogState;
    if (s?.type === 'prompt') {
      s.resolve?.(inputVal);
    } else {
      s?.resolve?.(true);
    }
  }

  function onCancel() {
    ui.dialogState?.resolve?.(null);
  }

  function resolveSave(action: 'save' | 'discard' | 'cancel') {
    ui.dialogState?.resolve?.(action);
  }

  function onOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      if (ui.dialogState?.type === 'save-confirm') {
        resolveSave('cancel');
      } else if (ui.dialogState?.type !== 'confirm' && ui.dialogState?.type !== 'prompt') {
        onOk();
      }
    }
  }

  function onKeyup(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      if (ui.dialogState?.type === 'save-confirm') {
        resolveSave('save');
      } else {
        onOk();
      }
    } else if (e.key === 'Escape') {
      if (ui.dialogState?.type === 'save-confirm') {
        resolveSave('cancel');
      } else {
        onCancel();
      }
    }
  }
</script>

{#if ui.dialogState}
  {@const d = ui.dialogState}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="dialog-overlay" onclick={onOverlayClick} in:fade={{ duration: 150 }} out:fade={{ duration: 150 }} onkeyup={onKeyup}>
    {#if d.type === 'save-confirm'}
      <div class="save-dialog" in:scale={{ duration: 250, start: 0.9 }}>
        <div class="save-dialog-body">
          <div class="save-icon-wrap">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Guardar">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </div>
          <p class="save-dialog-title">¿Guardar antes de salir?</p>
          <p class="save-dialog-desc">Los cambios no guardados se perderán definitivamente.</p>
        </div>
        <div class="save-dialog-actions">
          <button class="save-btn save-btn-discard" onclick={() => resolveSave('discard')}>Descartar</button>
          <button class="save-btn save-btn-cancel" onclick={() => resolveSave('cancel')}>Cancelar</button>
          <button class="save-btn save-btn-save" onclick={() => resolveSave('save')}>Guardar</button>
        </div>
      </div>
    {:else}
      <div class="dialog-card" in:scale={{ duration: 250, start: 0.9 }}>
        <div class="dialog-icon {d.type}">
          {#if d.type === 'success'}
            <span>✅</span>
          {:else if d.type === 'error'}
            <span>❌</span>
          {:else if d.type === 'warning'}
            <span>⚠️</span>
          {:else if d.type === 'confirm'}
            <span>❓</span>
          {:else if d.type === 'prompt'}
            <span>✏️</span>
          {:else}
            <span>ℹ️</span>
          {/if}
        </div>

        <div class="dialog-content">
          <h3>{d.title}</h3>
          <p>{d.message}</p>

          {#if d.type === 'prompt'}
            <div class="dialog-input">
              <input
                type={d.inputType || 'text'}
                placeholder={d.placeholder || ''}
                bind:value={inputVal}
                onkeyup={onKeyup}
              />
            </div>
          {/if}
        </div>

        <div class="dialog-footer">
          {#if d.type === 'confirm' || d.type === 'prompt'}
            <button class="btn-cancel" onclick={onCancel}>{d.cancelText || 'Cancelar'}</button>
          {/if}
          <button class="btn-ok {d.type}" onclick={onOk}>{d.okText || 'Aceptar'}</button>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.dialog-card {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  padding: 30px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.dialog-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.dialog-icon.success { background: #f0fdf4; }
.dialog-icon.error { background: #fef2f2; }
.dialog-icon.warning { background: #fffbeb; }
.dialog-icon.confirm { background: #eff6ff; }
.dialog-icon.prompt { background: #f3e8ff; }
.dialog-icon.info { background: #f1f5f9; }

.dialog-content h3 {
  margin: 0 0 10px;
  color: #0f172a;
  font-size: 1.4rem;
  font-weight: 700;
}

.dialog-content p {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
}

.dialog-input {
  margin-top: 20px;
}

.dialog-input input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 1rem;
  transition: border-color 0.2s;
  outline: none;
}

.dialog-input input:focus {
  border-color: #3b82f6;
}

.dialog-footer {
  margin-top: 30px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.dialog-footer button {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-cancel:hover { background: #e2e8f0; }

.btn-ok {
  background: #0f172a;
  color: white;
  flex: 1;
}

.btn-ok.success { background: #10b981; }
.btn-ok.error { background: #ef4444; }
.btn-ok.warning { background: #f59e0b; }
.btn-ok.confirm { background: #3b82f6; }

.btn-ok:hover { opacity: 0.9; transform: translateY(-1px); }

/* Save-Confirm Dialog */
.save-dialog {
  width: 100%;
  max-width: 340px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.save-dialog-body {
  padding: 32px 28px 24px;
  text-align: center;
}

.save-icon-wrap {
  width: 52px;
  height: 52px;
  margin: 0 auto 20px;
  border-radius: 14px;
  background: #fdf2e9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.save-dialog-title {
  font-size: 17px;
  font-weight: 500;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.3px;
}

.save-dialog-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.save-dialog-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-top: 0.5px solid #e2e8f0;
}

.save-btn {
  padding: 14px 0;
  font-size: 14px;
  font-weight: 400;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}

.save-btn + .save-btn {
  border-left: 0.5px solid #e2e8f0;
}

.save-btn-discard {
  color: #dc2626;
}

.save-btn-discard:hover {
  background: #fef2f2;
}

.save-btn-cancel {
  color: #64748b;
}

.save-btn-cancel:hover {
  background: #f1f5f9;
}

.save-btn-save {
  color: #d97706;
  font-weight: 500;
}

.save-btn-save:hover {
  background: #fdf2e9;
}

/* Mejoras accesibilidad - Focus visible */
.dialog-footer button:focus-visible,
.dialog-input input:focus-visible,
.save-btn:focus-visible {
  outline: 3px solid #3b82f6;
  outline-offset: -3px;
}

/* Responsive mejorado */
@media (max-width: 480px) {
  .dialog-card {
    max-width: 100%;
    margin: 16px;
    padding: 24px;
    border-radius: 20px;
  }

  .dialog-icon {
    width: 56px;
    height: 56px;
    font-size: 1.75rem;
  }

  .dialog-content h3 {
    font-size: 1.25rem;
  }

  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .dialog-footer button {
    width: 100%;
    padding: 14px 24px;
    min-height: 48px;
  }

  .save-dialog {
    max-width: 100%;
    margin: 16px;
  }
}
</style>
