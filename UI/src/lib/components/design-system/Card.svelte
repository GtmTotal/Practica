<script lang="ts">
  interface Props {
    variant?: 'default' | 'elevated';
    hoverable?: boolean;
    class?: string;
  }

  let {
    variant = 'default',
    hoverable = false,
    class: customClass = '',
    children,
  }: Props & { children?: any } = $props();

  const hoverableClass = hoverable ? ' hoverable' : '';
</script>

<div class="ds-card {variant}{hoverableClass} {customClass}">
  {@render children?.()}
</div>

<style>
  /* Styles are defined in design-system.css */
</style>
