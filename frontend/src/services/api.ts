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

  async createUser(data: { nome: string; email: string; telemovel: string; password: string; role?: string; modalidades?: string[]; encarregadoId?: string }) {
    return this.request<{ success: boolean; data: any }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: { nome?: string; email?: string; telemovel?: string; role?: string; encarregadoId?: string | null }) {
    return this.request<{ success: boolean; data: any }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number) {
    return this.request<{ success: boolean; data: any }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  async inactivateUser(id: number) {
    return this.request<{ success: boolean; data: any }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado: false }),
    });
  }

  async activateUser(id: number) {
    return this.request<{ success: boolean; data: any }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado: true }),
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

  async submitContact(data: { nome: string; email: string; telemovel?: string; mensagem?: string }) {
    return this.request<{ success: boolean; message?: string }>('/api/contacto', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPedidosAula() {
    return this.request<{ success: boolean; data: any[] }>('/api/pedidosaula');
  }

  async getMyPedidosAula() {
    return this.request<{ success: boolean; data: any[] }>('/api/pedidosaula/my');
  }

  async getPedidosPendentes() {
    return this.request<{ success: boolean; data: any[] }>('/api/pedidosaula/pendentes');
  }

  async createPedidoAula(data: {
    data: string;
    horainicio: string;
    duracaoaula?: string;
    maxparticipantes?: number;
    privacidade?: boolean;
    disponibilidadeiddisponibilidade: number;
    grupoidgrupo?: number;
    salaidsala: number;
  }) {
    return this.request<{ success: boolean; data: any; message?: string }>('/api/pedidosaula', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approvePedidoAula(id: number) {
    return this.request<{ success: boolean; data: any; message?: string }>(`/api/pedidosaula/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectPedidoAula(id: number, motivo?: string) {
    return this.request<{ success: boolean; data: any; message?: string }>(`/api/pedidosaula/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  }

  async deletePedidoAula(id: number) {
    return this.request<{ success: boolean; message?: string }>(`/api/pedidosaula/${id}`, {
      method: 'DELETE',
    });
  }

  async getAluguerTransacoes() {
    return this.request<{ success: boolean; data: any[] }>('/api/aluguer');
  }

  async getAluguerEstados() {
    return this.request<{ success: boolean; data: any[] }>('/api/aluguer/estados');
  }

  async getAluguerDisponibilidade(anuncioId: number) {
    return this.request<{ success: boolean; data: any }>(`/api/aluguer/anuncio/${anuncioId}/disponibilidade`);
  }

  async getMyReservas() {
    return this.request<{ success: boolean; data: any[] }>('/api/aluguer/user/reservas');
  }

  async criarReserva(data: {
    quantidade: number;
    datatransacao: string;
    anuncioidanuncio: number;
    itemfigurinoiditem: number;
  }) {
    return this.request<{ success: boolean; data: any }>('/api/aluguer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async atualizarReservaEstado(id: number, estadoidestado: number) {
    return this.request<{ success: boolean; data: any }>(`/api/aluguer/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ estadoidestado }),
    });
  }

  async deleteReserva(id: number) {
    return this.request<{ success: boolean }>(`/api/aluguer/${id}`, {
      method: 'DELETE',
    });
  }

  async rejectAnuncio(id: number) {
    return this.request<{ success: boolean; data: any }>(`/api/anuncios/${id}/reject`, {
      method: 'PUT',
    });
  }

  async sugerirNovaDataAula(id: number, novaData: string) {
    return this.request<{ success: boolean; data: any }>(`/api/aulas/${id}/sugerir-nova-data`, {
      method: 'PUT',
      body: JSON.stringify({ novaData }),
    });
  }

  async getNotificacoes() {
    return this.request<{ success: boolean; data: any[] }>('/api/notificacoes');
  }

  async getNotificacoesNaoLidas() {
    return this.request<{ success: boolean; data: any[] }>('/api/notificacoes/nao-lidas');
  }

  async marcarNotificacaoLida(id: number) {
    return this.request<{ success: boolean }>(`/api/notificacoes/${id}/read`, {
      method: 'POST',
    });
  }

  async marcarTodasNotificacoesLidas() {
    return this.request<{ success: boolean }>('/api/notificacoes/read-all', {
      method: 'POST',
    });
  }

  async deleteNotificacao(id: number) {
    return this.request<{ success: boolean }>(`/api/notificacoes/${id}`, {
      method: 'DELETE',
    });
  }

  // Professor Disponibilidades
  async getProfessorDisponibilidades() {
    return this.request<{ success: boolean; data: any[] }>('/api/professor/disponibilidades');
  }

  async getProfessorModalidades() {
    return this.request<{ success: boolean; data: any[] }>('/api/professor/modalidades');
  }

  async getProfessorAulas() {
    return this.request<{ success: boolean; data: any[] }>('/api/professor/aulas');
  }

  async createProfessorDisponibilidade(data: {
    modalidadesprofessoridmodalidadeprofessor: number;
    diadasemana: number;
    horainicio: string;
    horafim: string;
  }) {
    return this.request<{ success: boolean; data: any }>('/api/professor/disponibilidades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfessorDisponibilidade(id: number, data: {
    modalidadesprofessoridmodalidadeprofessor?: number;
    diadasemana?: number;
    horainicio?: string;
    horafim?: string;
    ativo?: boolean;
  }) {
    return this.request<{ success: boolean; data: any }>(`/api/professor/disponibilidades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProfessorDisponibilidade(id: number) {
    return this.request<{ success: boolean }>(`/api/professor/disponibilidades/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserModalidades(userId: number | string) {
    return this.request<{ success: boolean; data: any[] }>(`/api/users/${Number(userId)}/modalidades`);
  }
}

export const api = new ApiService();
export default api;