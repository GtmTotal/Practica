<script lang="ts">
  interface Props {
    level?: 1 | 2 | 3;
    class?: string;
  }

  let {
    level = 1,
    class: customClass = '',
    children,
  }: Props & { children?: any } = $props();

  const levelMap = {
    1: 'ds-h1',
    2: 'ds-h2',
    3: 'ds-h3',
  };

  const Tag = `h${level}` as any;
</script>

<svelte:element
  this={Tag}
  class="{levelMap[level]} {customClass}"
>
  {@render children?.()}
</svelte:element>

<style>
  /* Styles are defined in design-system.css */
</style>
