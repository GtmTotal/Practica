<script lang="ts">
  interface Props {
    variant?: 'primary' | 'success' | 'danger' | 'warning' | 'gray';
    class?: string;
  }

  let {
    variant = 'gray',
    class: customClass = '',
    children,
  }: Props & { children?: any } = $props();
</script>

<span class="ds-badge {variant} {customClass}">
  {@render children?.()}
</span>

<style>
  /* Styles are defined in design-system.css */
</style>
