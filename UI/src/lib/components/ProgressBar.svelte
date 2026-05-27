<script lang="ts">
  let {
    value = 0,
    height = 6,
    color
  }: {
    value: number;
    height?: number;
    color?: string;
  } = $props();
</script>

<div class="progress-track" style="height: {height}px;">
  <div class="progress-fill" style="width: {Math.min(100, Math.max(0, value))}%; {color ? `background: ${color};` : ''}"></div>
</div>

<style>
  .progress-track {
    flex: 1;
    background: #e2e8f0;
    border-radius: 99px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--primary, #1e3a5f);
    border-radius: 99px;
    transition: width 0.4s ease;
  }
</style>
