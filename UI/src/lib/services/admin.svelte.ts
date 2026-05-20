import { getApiBaseUrl, getApiHeaders } from '../api-config';

class ServicioAdmin {
  private get apiBase() { return `${getApiBaseUrl()}/admin`; }
  private readonly tokenKey = 'gtm_admin_token';
  
  // Estado persistente en la sesión
  isAdmin = $state(false);

  constructor() {
    if (typeof sessionStorage !== 'undefined') {
      this.isAdmin = !!sessionStorage.getItem(this.tokenKey);
    }
  }

  setAdmin(val: boolean) {
    this.isAdmin = val;
    if (typeof sessionStorage !== 'undefined') {
      if (!val) sessionStorage.removeItem(this.tokenKey);
    }
  }

  getAuthHeaders(): Record<string, string> {
    if (typeof sessionStorage === 'undefined') return {};
    const token = sessionStorage.getItem(this.tokenKey);
    const headers: Record<string, string> = { ...getApiHeaders() };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async login(password: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBase}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders()
        },
        body: JSON.stringify({ password })
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.success && data.token) {
        sessionStorage.setItem(this.tokenKey, data.token);
        this.setAdmin(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async sincronizarExcel(): Promise<any> {
    const res = await fetch(`${this.apiBase}/sync`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return res.json();
  }

  async sincronizarExcelDesdeArchivo(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.apiBase}/sync/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });
    return res.json();
  }

  async descargarExcel(): Promise<Blob> {
    const res = await fetch(`${this.apiBase}/export`, {
      headers: this.getAuthHeaders()
    });
    return res.blob();
  }
}

export const adminService = new ServicioAdmin();
