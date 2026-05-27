import { getApiBaseUrl, getApiHeaders } from '../../api-config';
import type { DocumentDto, UpdateDocumentDto } from '$lib/types/document.interface';

class ServicioAdmin {
  private get apiBase() { return `${getApiBaseUrl()}/admin`; }
  private get docsBase() { return `${getApiBaseUrl()}/documents`; }
  private readonly tokenKey = 'gtm_admin_token';
  
  // Estado persistente en la sesión
  isAdmin = $state(false);
  documents = $state<DocumentDto[]>([]);
  loadingDocs = $state(false);

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

  // --- Métodos para Documentos ---

  async fetchDocuments() {
    this.loadingDocs = true;
    try {
      const res = await fetch(this.docsBase, {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al cargar documentos');
      this.documents = await res.json();
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      this.loadingDocs = false;
    }
  }

  async saveDocument(doc: DocumentDto) {
    const res = await fetch(this.docsBase, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(doc)
    });
    if (!res.ok) throw new Error('Error al guardar documento');
    await this.fetchDocuments();
  }

  async updateDocument(id: number, update: UpdateDocumentDto) {
    const res = await fetch(`${this.docsBase}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify(update)
    });
    if (!res.ok) throw new Error('Error al actualizar documento');
    await this.fetchDocuments();
  }

  async deleteDocument(id: number) {
    const res = await fetch(`${this.docsBase}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al eliminar documento');
    await this.fetchDocuments();
  }
}

export const adminService = new ServicioAdmin();
