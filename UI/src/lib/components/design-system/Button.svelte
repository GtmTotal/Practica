<script lang="ts">
  import { tokens } from '$lib/design-tokens';

  interface Props {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'small' | 'base' | 'large';
    disabled?: boolean;
    class?: string;
    onclick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    ariaLabel?: string;
  }

  let {
    variant = 'primary',
    size = 'base',
    disabled = false,
    class: customClass = '',
    onclick,
    type = 'button',
    ariaLabel,
    children,
  }: Props & { children?: any } = $props();

  const sizeMap = {
    small: 'small',
    base: '',
    large: 'large',
  };

  const sizeClass = sizeMap[size] ? ` ${sizeMap[size]}` : '';
</script>

<button
  {type}
  {disabled}
  {onclick}
  aria-label={ariaLabel}
  class="ds-button {variant}{sizeClass} {customClass}"
>
  {@render children?.()}
</button>

<style>
  /* Styles are defined in design-system.css */
</style>
