<script lang="ts">
  interface Props {
    label: string;
    value: string | number;
    class?: string;
  }

  let {
    label,
    value,
    class: customClass = '',
  }: Props = $props();
</script>

<div class="ds-metric {customClass}">
  <div class="ds-metric-label">{label}</div>
  <div class="ds-metric-value">{value}</div>
</div>

<style>
  /* Styles are defined in design-system.css */
</style>
