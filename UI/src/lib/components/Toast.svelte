<script lang="ts">
  import { ui } from '../services/ui.svelte';
  import { fly } from 'svelte/transition';
</script>

{#if ui.toastState.length > 0}
  <div class="toast-container">
    {#each ui.toastState as toast (toast.id)}
      <div 
        class="toast-item {toast.type}" 
        in:fly={{ x: 100, duration: 300 }}
        out:fly={{ x: 100, duration: 200 }}
      >
        <div class="toast-icon">
          {#if toast.type === 'success'}
            <span>✓</span>
          {:else if toast.type === 'error'}
            <span>✕</span>
          {:else if toast.type === 'warning'}
            <span>!</span>
          {:else}
            <span>i</span>
          {/if}
        </div>
        <div class="toast-content">
          <p>{toast.message}</p>
        </div>
        <button class="toast-close" onclick={() => ui.dismissToast(toast.id)}>×</button>
      </div>
    {/each}
  </div>
{/if}

<style>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  min-width: 300px;
  border-left: 4px solid;
}

.toast-item.success { border-left-color: #10b981; }
.toast-item.error { border-left-color: #ef4444; }
.toast-item.warning { border-left-color: #f59e0b; }
.toast-item.info { border-left-color: #3b82f6; }

.toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.toast-icon span {
  color: white;
}

.toast-item.success .toast-icon { background: #10b981; }
.toast-item.error .toast-icon { background: #ef4444; }
.toast-item.warning .toast-icon { background: #f59e0b; }
.toast-item.info .toast-icon { background: #3b82f6; }

.toast-content {
  flex: 1;
}

.toast-content p {
  margin: 0;
  color: #1e293b;
  font-size: 0.95rem;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  color: #475569;
}

/* Responsive */
@media (max-width: 480px) {
  .toast-container {
    top: auto;
    bottom: 20px;
    right: 16px;
    left: 16px;
    max-width: none;
  }
  
  .toast-item {
    min-width: auto;
    width: 100%;
  }
}
</style>
