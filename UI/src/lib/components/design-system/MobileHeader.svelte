<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
    showSearch?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchResults?: Array<{ title: string; meta: string }>;
    onSelectResult?: (index: number) => void;
    showSearchResults?: boolean;
    showAdminButton?: boolean;
    onAdminClick?: () => void;
    backButton?: {
      label: string;
      onClick: () => void;
    };
  }

  let {
    title,
    subtitle = '',
    showSearch = false,
    searchValue = '',
    onSearchChange = () => {},
    searchResults = [],
    onSelectResult = () => {},
    showSearchResults = false,
    showAdminButton = false,
    onAdminClick = () => {},
    backButton,
    children,
  }: Props & { children?: any } = $props();

  function handleSearchClear() {
    onSearchChange('');
  }

  function handleSearchBlur() {
    setTimeout(() => {
      // Keep results visible briefly, then hide
    }, 120);
  }
</script>

<header class="mobile-header-unified">
  {#if backButton}
    <div class="mobile-header-back-row">
      <button class="mobile-back-btn" onclick={backButton.onClick}>
        ‹ {backButton.label}
      </button>
    </div>
  {/if}

  <div class="mobile-header-content">
    <div class="mobile-header-title-row">
      <h1 class="mobile-header-title">{title}</h1>
      {#if showAdminButton}
        <button
          class="mobile-header-admin-btn"
          onclick={onAdminClick}
          title="Administración"
          aria-label="Administración"
        >
          ⚙️
        </button>
      {/if}
    </div>

    {#if subtitle}
      <p class="mobile-header-subtitle">{subtitle}</p>
    {/if}

    {#if showSearch}
      <div class="mobile-header-search">
        <div class="mobile-search-wrapper">
          <input
            type="text"
            value={searchValue}
            onchange={(e) => onSearchChange(e.currentTarget.value)}
            oninput={(e) => onSearchChange(e.currentTarget.value)}
            onblur={handleSearchBlur}
            onfocus={() => {}} 
            placeholder="Buscar obra, cuatrimestre o nº orden..."
            class="mobile-search-input"
            aria-label="Buscar"
          />
          <span class="mobile-search-icon">🔍</span>
          {#if searchValue}
            <button
              class="mobile-search-clear"
              onclick={handleSearchClear}
              title="Borrar búsqueda"
            >
              ✕
            </button>
          {/if}
        </div>

        {#if showSearchResults && searchResults.length > 0}
          <div class="mobile-search-results">
            {#each searchResults as result, idx}
              <button
                class="mobile-search-result-item"
                onclick={() => onSelectResult(idx)}
              >
                <div class="mobile-sr-title">{result.title}</div>
                <div class="mobile-sr-meta">{result.meta}</div>
              </button>
            {/each}
          </div>
        {:else if showSearchResults && searchValue}
          <div class="mobile-search-results empty">No se encontraron resultados</div>
        {/if}
      </div>
    {/if}
  </div>

  {#if children}
    <div class="mobile-header-extra">
      {@render children?.()}
    </div>
  {/if}
</header>

<style>
  .mobile-header-unified {
    background: var(--gradient-header);
    color: #ffffff;
    padding: 0;
    flex-shrink: 0;
    width: 100%;
  }

  .mobile-header-back-row {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .mobile-back-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 0;
    transition: all 0.2s ease;
  }

  .mobile-back-btn:active {
    transform: translateX(-3px);
    color: #ffffff;
  }

  .mobile-header-content {
    padding: 20px 16px;
  }

  .mobile-header-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .mobile-header-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    color: #ffffff;
    flex: 1;
    min-width: 0;
    line-height: 1.2;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .mobile-header-admin-btn {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .mobile-header-admin-btn:active {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  .mobile-header-subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 12px 0;
    line-height: 1.4;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .mobile-header-search {
    position: relative;
  }

  .mobile-search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .mobile-search-input {
    width: 100%;
    padding: 10px 36px 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    font-size: 13px;
    font-family: var(--font-family);
  }

  .mobile-search-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .mobile-search-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .mobile-search-icon {
    position: absolute;
    right: 12px;
    font-size: 14px;
    pointer-events: none;
    color: rgba(255, 255, 255, 0.6);
  }

  .mobile-search-clear {
    position: absolute;
    right: 32px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    padding: 4px 4px;
    font-size: 16px;
    transition: all 0.15s ease;
  }

  .mobile-search-clear:active {
    color: #ffffff;
    transform: scale(1.1);
  }

  .mobile-search-results {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    max-height: 280px;
    overflow-y: auto;
    z-index: 50;
  }

  .mobile-search-results.empty {
    padding: 16px 12px;
    text-align: center;
    color: #94a3b8;
    font-size: 13px;
  }

  .mobile-search-result-item {
    width: 100%;
    padding: 12px 12px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    transition: background 0.15s ease;
  }

  .mobile-search-result-item:last-child {
    border-bottom: none;
  }

  .mobile-search-result-item:active {
    background: #f1f5f9;
  }

  .mobile-sr-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 3px;
  }

  .mobile-sr-meta {
    font-size: 12px;
    color: #94a3b8;
  }

  .mobile-header-extra {
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
</style>
