const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async register(data: { nome: string; email: string; telemovel: string; password: string }) {
    return this.request<{ success: boolean; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    const result = await this.request<{ success: boolean; token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  async logout() {
    this.setToken(null);
  }

  // Aulas
  async getAulas(params?: { estado?: string; professorId?: number; data?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/api/aulas${query ? `?${query}` : ''}`);
  }

  async createAula(data: { pedidodeaulaId: number; salaId: number; estadoaulaId?: number }) {
    return this.request<{ success: boolean; data: any }>('/api/aulas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmAula(id: number) {
    return this.request<{ success: boolean; data: any }>(`/api/aulas/${id}/confirm`, {
      method: 'POST',
    });
  }

  async cancelAula(id: number) {
    return this.request<{ success: boolean; data: any }>(`/api/aulas/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Eventos
  async getEventos() {
    return this.request<{ success: boolean; data: any[] }>('/api/eventos');
  }

  async createEvento(data: { titulo: string; descricao?: string; data: string; local?: string }) {
    return this.request<{ success: boolean; data: any }>('/api/eventos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async publishEvento(id: number) {
    return this.request<{ success: boolean; data: any }>(`/api/eventos/${id}/publish`, {
      method: 'POST',
    });
  }

  // Figurinos
  async getFigurinos(params?: { tipo?: number; tamanho?: number; genero?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/api/figurinos${query ? `?${query}` : ''}`);
  }

  async createFigurino(data: any) {
    return this.request<{ success: boolean; data: any }>('/api/figurinos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Turmas
  async getTurmas(params?: { professorId?: number; modalidadeId?: number; estado?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/api/turmas${query ? `?${query}` : ''}`);
  }

  async createTurma(data: { nome: string; descricao?: string; modalidadeId?: number; salaId?: number }) {
    return this.request<{ success: boolean; data: any }>('/api/turmas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async enrollAluno(turmaId: number, alunoId: number) {
    return this.request<{ success: boolean; data: any }>(`/api/turmas/${turmaId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ alunoId }),
    });
  }

  async closeTurma(id: number) {
    return this.request<{ success: boolean; data: any }>(`/api/turmas/${id}/close`, {
      method: 'POST',
    });
  }

  // Users
  async getUsers() {
    return this.request<{ success: boolean; data: any[] }>('/api/users');
  }

  async createUser(data: { nome: string; email: string; telemovel: string; password: string; role?: string }) {
    return this.request<{ success: boolean; data: any }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Salas
  async getSalas() {
    return this.request<{ success: boolean; data: any[] }>('/api/salas');
  }

  async createSala(data: { nomesala: string; capacidade: number; tiposalaidtiposala?: number }) {
    return this.request<{ success: boolean; data: any }>('/api/salas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSalaAvailability(id: number, data?: string) {
    const query = data ? `?data=${data}` : '';
    return this.request<{ success: boolean; data: any[] }>(`/api/salas/${id}/availability${query}`);
  }

  // Anuncios
  async getAnuncios(params?: { estado?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ success: boolean; data: any[] }>(`/api/anuncios${query ? `?${query}` : ''}`);
  }

  async createAnuncio(data: {
    valor: number;
    dataanuncio: string;
    datainicio: string;
    datafim: string;
    quantidade: number;
    figurinoidfigurino: number;
  }) {
    return this.request<{ success: boolean; data: any }>('/api/anuncios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveAnuncio(id: number) {
    return this.request<{ success: boolean; data: any }>(`/api/anuncios/${id}/approve`, {
      method: 'POST',
    });
  }

  async submitContact(data: { nome: string; email: string; telemovel: string; mensagem?: string }) {
    return this.request<{ success: boolean; message?: string }>('/api/contacto', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
export default api;