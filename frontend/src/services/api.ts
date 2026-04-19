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
      ...(options.headers as Record<string, string>),
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
      throw new Error(error.erro || error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  // ── Auth ────────────────────────────────────────────────
  async login(email: string, password: string) {
    const result = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.token) {
      this.setToken(result.token);
    }

    return result;
  }

  logout() {
    this.setToken(null);
  }

  async getProfile() {
    return this.request<any>('/api/profile');
  }

  // ── Aulas ───────────────────────────────────────────────
  async getAulas(params?: Record<string, string | number>) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<{ aulas: any[]; total: number }>(`/api/aulas${query}`);
  }

  async getSalasDisponiveis(data: string, horainicio: string, duracaoaula: number) {
    const query = `?data=${encodeURIComponent(data)}&horainicio=${encodeURIComponent(horainicio)}&duracaoaula=${duracaoaula}`;
    return this.request<{ salas: any[] }>(`/api/aulas/salas-disponiveis${query}`);
  }

  async associarSalaAula(idaula: number, idsala: number) {
    return this.request<{ mensagem: string; aula: any }>(`/api/aulas/${idaula}/associar-sala`, {
      method: 'PATCH',
      body: JSON.stringify({ idsala }),
    });
  }

  async concluirAula(idaula: number) {
    return this.request<{ mensagem: string; aula: any }>(`/api/aulas/${idaula}/concluir`, {
      method: 'PATCH',
    });
  }

  async comunicarAusencia(idaula: number, motivo: string) {
    return this.request<{ mensagem: string; aula: any }>(`/api/aulas/${idaula}/ausencia`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  }

  async substituirProfessor(idaula: number, novoProfessorutilizadoriduser: number) {
    return this.request<{ mensagem: string; aula: any }>(`/api/aulas/${idaula}/substituir-professor`, {
      method: 'PATCH',
      body: JSON.stringify({ novoProfessorutilizadoriduser }),
    });
  }

  async remarcarAula(
    idaula: number,
    data: string,
    horainicio: string,
    motivo: string,
    salaidsala?: number
  ) {
    return this.request<{ mensagem: string; aula: any }>(`/api/aulas/${idaula}/remarcar`, {
      method: 'PATCH',
      body: JSON.stringify({
        data,
        horainicio,
        motivo,
        ...(salaidsala ? { salaidsala } : {}),
      }),
    });
  }
}

export const api = new ApiService();
export default api;