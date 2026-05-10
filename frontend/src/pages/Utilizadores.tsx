import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { User, UserRole } from '../types';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Users, Search, ArrowLeft, Printer, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

export function Utilizadores() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [filtroRole, setFiltroRole] = useState<'TODOS' | UserRole>('TODOS');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ATIVOS' | 'INATIVOS'>('ATIVOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [encarregadoId, setEncarregadoId] = useState('');
  const [formData, setFormData] = useState({ nome: '', email: '', password: '', telemovel: '', role: '' });
  
  // Dinâmica de modalidades para professor
  const [modalidadesProfessor, setModalidadesProfessor] = useState<string[]>(['']);
  const [modalidadesDisponiveis, setModalidadesDisponiveis] = useState<{ id: number; nome: string }[]>([]);
  const MAX_MODALIDADES = 4;
  
  const handleModalidadeChange = (index: number, value: string) => {
    const novas = [...modalidadesProfessor];
    novas[index] = value;
    setModalidadesProfessor(novas);
  };
  
  const adicionarModalidade = () => {
    if (modalidadesProfessor.filter(m => m).length < MAX_MODALIDADES) {
      setModalidadesProfessor([...modalidadesProfessor, '']);
    }
  };
  
  const removerModalidade = (index: number) => {
    if (modalidadesProfessor.length > 1) {
      const novas = modalidadesProfessor.filter((_, i) => i !== index);
      setModalidadesProfessor(novas);
    }
  };

  const getModalidadesSelecionadas = () => {
    return modalidadesProfessor.filter(m => m.trim() !== '');
  };
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ nome: '', email: '', telemovel: '', role: '', encarregadoId: '' });
  const [editRole, setEditRole] = useState<string | string[]>('');
  const [editModalidades, setEditModalidades] = useState<string[]>(['']);
  const [editSelectedRoles, setEditSelectedRoles] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.password || !formData.role) {
      return;
    }

    setSubmitting(true);
    try {
      const userData: any = {
        nome: formData.nome,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        telemovel: formData.telemovel || null
      };

      if (formData.role === 'ALUNO' && encarregadoId) {
        userData.encarregadoId = encarregadoId;
      }

      if (formData.role === 'PROFESSOR') {
        const modalidades = getModalidadesSelecionadas();
        if (modalidades.length > 0) {
          userData.modalidades = modalidades;
        }
      }

      await api.createUser(userData);
      
      const result = await api.getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      }
      
      setShowNovoForm(false);
      setFormData({ nome: '', email: '', password: '', telemovel: '', role: '' });
      setSelectedRole('');
      setEncarregadoId('');
      setModalidadesProfessor(['']);
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, modalidadesRes] = await Promise.all([
          api.getUsers(),
          api.getModalidades(),
        ]);
        if (usersRes.success && usersRes.data) setUsers(usersRes.data);
        if (modalidadesRes.success && modalidadesRes.data) {
          setModalidadesDisponiveis(modalidadesRes.data.map((m: any) => ({ id: m.idmodalidade, nome: m.nome })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getUsersFiltrados = () => {
    let usersFiltrados = [...users];

    // Filtro por role
    if (filtroRole !== 'TODOS') {
      usersFiltrados = usersFiltrados.filter(u => u.role === filtroRole);
    }

    // Filtro por estado
    if (filtroEstado === 'ATIVOS') {
      usersFiltrados = usersFiltrados.filter(u => u.estado !== false);
    } else if (filtroEstado === 'INATIVOS') {
      usersFiltrados = usersFiltrados.filter(u => u.estado === false);
    }

    // Filtro por pesquisa
    if (searchTerm) {
      usersFiltrados = usersFiltrados.filter(u => 
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return usersFiltrados;
  };

  const getRoleBadge = (role: UserRole | UserRole[]) => {
    const roles = Array.isArray(role) ? role : [role];
    const styles: Record<string, string> = {
      DIRECAO: 'bg-[#c9a84c]/20 text-[#8a6d1e]',
      PROFESSOR: 'bg-[#e2f0ed] text-[#0d6b5e]',
      ENCARREGADO: 'bg-teal-100 text-teal-800',
      ALUNO: 'bg-orange-100 text-orange-800',
      UTILIZADOR: 'bg-gray-100 text-gray-800'
    };
    const labels: Record<string, string> = {
      DIRECAO: 'Direção',
      PROFESSOR: 'Professor',
      ENCARREGADO: 'Encarregado',
      ALUNO: 'Aluno',
      UTILIZADOR: 'Utilizador'
    };
    
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map(r => (
          <span key={r} className={`px-3 py-1 rounded-full text-sm ${styles[r] || styles.UTILIZADOR}`}>
            {labels[r] || r}
          </span>
        ))}
      </div>
    );
  };

  const getRoleCount = (role: string) => {
    return users.filter(u => {
      const uRole = u.role;
      if (Array.isArray(uRole)) return uRole.includes(role as UserRole);
      return uRole === role;
    }).length;
  };

  const handleInactivate = async (id: number) => {
    if (!confirm('Tem a certeza que deseja inativar este utilizador?')) return;
    try {
      await api.inactivateUser(id);
      const result = await api.getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error inactivating user:', error);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await api.activateUser(id);
      const result = await api.getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem a certeza que deseja eliminar este utilizador? Esta ação não pode ser desfeita.')) return;
    try {
      await api.deleteUser(id);
      const result = await api.getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const escapeHtml = (str: string | string[] | null | undefined): string => {
    if (str == null) return '';
    const s = Array.isArray(str) ? str.join(', ') : str;
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const handlePrint = () => {
    const usersToPrint = getUsersFiltrados();
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Listagem de Utilizadores - Ent'Artes</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #0a1a17; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f9f8; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .estado-ativo { color: green; }
          .estado-inativo { color: red; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Ent'Artes - Escola de Dança</h1>
        <h2>Listagem de Utilizadores</h2>
        <p>Data: ${new Date().toLocaleDateString('pt-PT')}</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Telemóvel</th>
              <th>Tipo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${usersToPrint.map((user, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(user.nome)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.telemovel) || '-'}</td>
                <td>${escapeHtml(String(user.role))}</td>
                <td class="${user.estado !== false ? 'estado-ativo' : 'estado-inativo'}">${user.estado !== false ? 'Ativo' : 'Inativo'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="footer">Total de registos: ${usersToPrint.length}</p>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleEditClick = async (user: any) => {
    setEditingUser(user);
    const roleVal = user.role;
    const roleArray = Array.isArray(roleVal) ? roleVal : [roleVal].filter(Boolean);
    setEditSelectedRoles(roleArray);
    setEditRole(Array.isArray(roleVal) ? roleVal[0] : roleVal);
    setEditFormData({
      nome: user.nome,
      email: user.email,
      telemovel: user.telemovel || '',
      role: Array.isArray(roleVal) ? roleVal[0] : roleVal,
      encarregadoId: user.encarregadoId || ''
    });

    if (user.role === 'PROFESSOR') {
      try {
        const userId = Number(user.id || user.iduser);
        const modRes = await api.getUserModalidades(userId);
        if (modRes.success && modRes.data && modRes.data.length > 0) {
          const modIds = modRes.data.map((m: any) => m.modalidadeidmodalidade.toString());
          setEditModalidades(modIds);
        } else {
          setEditModalidades(['']);
        }
      } catch (err) {
        console.error('Error fetching modalidades:', err);
        setEditModalidades(['']);
      }
    } else {
      setEditModalidades(['']);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setSubmitting(true);
    try {
      const sentRoles = editSelectedRoles.length > 0 ? editSelectedRoles : [String(editRole)];
      const updateData: any = {
        nome: editFormData.nome,
        email: editFormData.email,
        telemovel: editFormData.telemovel,
        role: sentRoles
      };

      if (sentRoles.includes('ALUNO')) {
        updateData.encarregadoId = editFormData.encarregadoId || null;
      }

      if (sentRoles.includes('PROFESSOR')) {
        const modalidades = editModalidades.filter(m => m.trim() !== '');
        if (modalidades.length > 0) {
          updateData.modalidades = modalidades;
        }
      }

      await api.updateUser(Number(editingUser.id), updateData);
      
      const usersResult = await api.getUsers();
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }
      
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      const message = error instanceof Error ? error.message : 'Tente novamente';
      toast.error('Erro ao guardar: ' + message);
    } finally {
      setSubmitting(false);
    }
  };

  const getEncarregadoNome = (encarregadoId?: string) => {
    if (!encarregadoId) return null;
    const encarregado = users.find(u => u.id === encarregadoId);
    return encarregado?.nome;
  };

  const getAlunosNomes = (alunosIds?: string[]) => {
    if (!alunosIds || alunosIds.length === 0) return [];
    return users
      .filter(u => alunosIds.includes(u.id))
      .map(u => u.nome);
  };

  const usersFiltrados = getUsersFiltrados();

  return (
    <div className="min-h-screen bg-[#f4f9f8]">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="bg-[#0a1a17] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-white/50">
            <Link to="/dashboard" className="hover:text-[#c9a84c] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-white/80">Utilizadores</span>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl text-white mb-1">Gestão de Utilizadores</h1>
              <p className="text-white/50 text-sm">
                Crie e gerencie contas de alunos, encarregados e professores
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a84c] text-[#0a1a17] rounded-lg hover:bg-[#e8c97a] transition-colors text-sm"
              style={{ fontWeight: 600 }}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Listagem</span>
              <span className="sm:hidden">Imprimir</span>
            </button>

            <button
              onClick={() => setShowNovoForm(!showNovoForm)}
              className="flex items-center gap-2 bg-[#c9a84c] text-[#0a1a17] px-5 py-2.5 rounded-lg hover:bg-[#e8c97a] transition-colors"
              style={{ fontWeight: 600 }}
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Novo Utilizador</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white/5 p-4 rounded-xl border border-[#c9a84c]/30">
              <div className="text-3xl text-[#c9a84c] mb-1">
                {getRoleCount('DIRECAO')}
              </div>
              <div className="text-sm text-white/50">Direção</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-3xl text-[#1a9885] mb-1">
                {getRoleCount('PROFESSOR')}
              </div>
              <div className="text-sm text-white/50">Professores</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-3xl text-teal-400 mb-1">
                {getRoleCount('ENCARREGADO')}
              </div>
              <div className="text-sm text-white/50">Encarregados</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-3xl text-orange-400 mb-1">
                {getRoleCount('ALUNO')}
              </div>
              <div className="text-sm text-white/50">Alunos</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-3xl text-white mb-1">
                {users.length}
              </div>
              <div className="text-sm text-white/50">Total</div>
            </div>
          </div>

          {/* Pesquisa e Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c]"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['ATIVOS', 'INATIVOS'] as const).map(estado => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    filtroEstado === estado
                      ? 'bg-[#c9a84c] text-[#0a1a17]'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {estado === 'ATIVOS' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['TODOS', 'DIRECAO', 'PROFESSOR', 'ENCARREGADO', 'ALUNO'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setFiltroRole(role)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    filtroRole === role
                      ? 'bg-[#c9a84c] text-[#0a1a17]'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {role === 'TODOS' ? 'Todos' : role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form Novo Utilizador */}
      {showNovoForm && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#0d6b5e]/10">
            <h2 className="text-xl mb-4 text-[#0a1a17]">Criar Novo Utilizador</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Nome Completo</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="Nome do utilizador"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="email@exemplo.pt"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Telemóvel <span className="text-[#0d6b5e]/40">(opcional)</span></label>
                  <input
                    type="tel"
                    name="telemovel"
                    value={formData.telemovel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="912 345 678"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Password Inicial</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Tipo de Utilizador</label>
                  <select 
                    name="role"
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]" 
                    required
                    value={formData.role}
                    onChange={(e) => { handleInputChange(e); setSelectedRole(e.target.value); }}
                  >
                    <option value="">Selecione...</option>
                    <option value="ALUNO">Aluno</option>
                    <option value="ENCARREGADO">Encarregado</option>
                    <option value="PROFESSOR">Professor</option>
                    <option value="DIRECAO">Direção</option>
                  </select>
                </div>

                {selectedRole === 'PROFESSOR' && (
                  <div className="mt-4 p-4 bg-[#e2f0ed] rounded-lg border border-[#0d6b5e]/20">
                    <label className="block text-sm mb-3 text-[#0d6b5e] font-semibold">Modalidade(s) do Professor</label>
                    {modalidadesProfessor.map((modalidade, index) => {
                      const jaSelecionadas: number[] = [];
                      modalidadesProfessor.forEach((m, idx) => {
                        if (idx !== index && m) jaSelecionadas.push(Number(m));
                      });
                      return (
                        <div key={index} className="flex gap-2 mb-2">
                          <select
                            value={modalidade}
                            onChange={(e) => handleModalidadeChange(index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-white focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                          >
                            <option value="">Selecione modalidade {index + 1}...</option>
                            {modalidadesDisponiveis
                              .filter(m => !jaSelecionadas.includes(m.id))
                              .map(m => (
                                <option key={m.id} value={m.id}>{m.nome}</option>
                              ))}
                          </select>
                          {modalidadesProfessor.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removerModalidade(index)}
                              className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {getModalidadesSelecionadas().length < MAX_MODALIDADES && (
                      <button
                        type="button"
                        onClick={adicionarModalidade}
                        className="mt-2 text-sm text-[#0d6b5e] hover:text-[#065147] transition-colors"
                      >
                        + Adicionar modalidade
                      </button>
                    )}
                  </div>
                )}

                {selectedRole === 'ALUNO' && (
                  <div>
                    <label className="block text-sm mb-2 text-[#4d7068]">Encarregado de Educação</label>
                    <select 
                      className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                      value={encarregadoId}
                      onChange={(e) => setEncarregadoId(e.target.value)}
                      required
                    >
                      <option value="">Selecione o encarregado...</option>
                      {users.filter(u => u.role === 'ENCARREGADO').map(enc => (
                        <option key={enc.id} value={enc.id}>{enc.nome} ({enc.email})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0d6b5e] text-white px-6 py-2 rounded-lg hover:bg-[#065147] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'A criar...' : 'Criar Utilizador'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNovoForm(false)}
                  className="bg-[#deecea] text-[#0d6b5e] px-6 py-2 rounded-lg hover:bg-[#c8e0dc] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Utilizadores */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {usersFiltrados.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-md text-center">
            <Users className="w-16 h-16 text-[#0d6b5e]/20 mx-auto mb-4" />
            <p className="text-[#4d7068]">Nenhum utilizador encontrado</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-[#0d6b5e]/5">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f4f9f8] border-b border-[#0d6b5e]/10">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm text-[#4d7068]">Nome</th>
                    <th className="text-left px-6 py-4 text-sm text-[#4d7068]">Email</th>
                    <th className="text-left px-6 py-4 text-sm text-[#4d7068]">Tipo</th>
                    <th className="text-left px-6 py-4 text-sm text-[#4d7068]">Relações</th>
                    <th className="text-left px-6 py-4 text-sm text-[#4d7068]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0d6b5e]/5">
                  {usersFiltrados.map(user => (
                    <tr key={user.id} className="hover:bg-[#f4f9f8] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-[#0a1a17]">{user.nome}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[#4d7068] text-sm">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          {((uRole: any) => {
                            const isAluno = Array.isArray(uRole) ? uRole.includes('ALUNO') : uRole === 'ALUNO';
                            return isAluno && user.encarregadoId;
                          })(user.role) && (
                            <div className="text-[#4d7068]">
                              Encarregado: <strong className="text-[#0a1a17]">{getEncarregadoNome(user.encarregadoId)}</strong>
                            </div>
                          )}
                          {((uRole: any) => {
                            const isEncarregado = Array.isArray(uRole) ? uRole.includes('ENCARREGADO') : uRole === 'ENCARREGADO';
                            return isEncarregado && user.alunosIds && user.alunosIds.length > 0;
                          })(user.role) && (
                            <div className="text-[#4d7068]">
                              Alunos: <strong className="text-[#0a1a17]">{getAlunosNomes(user.alunosIds).join(', ')}</strong>
                            </div>
                          )}
                          {!user.encarregadoId && (!user.alunosIds || user.alunosIds.length === 0) && (
                            <div className="text-[#4d7068]/40">-</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditClick(user)} 
                            className="text-[#0d6b5e] hover:text-[#065147] text-sm transition-colors"
                          >
                            Editar
                          </button>
                          {user.estado !== false ? (
                            <button 
                              onClick={() => handleInactivate(Number(user.id))} 
                              className="text-orange-600 hover:text-orange-700 text-sm transition-colors"
                            >
                              Inativar
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleActivate(Number(user.id))} 
                              className="text-green-600 hover:text-green-700 text-sm transition-colors"
                            >
                              Ativar
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(Number(user.id))} 
                            className="text-red-600 hover:text-red-700 text-sm transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>


      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl mb-4 text-[#0a1a17]">Editar Utilizador</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-[#4d7068]">Nome</label>
                <input
                  type="text"
                  value={editFormData.nome}
                  onChange={(e) => setEditFormData({...editFormData, nome: e.target.value})}
                  className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[#4d7068]">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-[#4d7068]">Telemóvel</label>
                <input
                  type="text"
                  value={editFormData.telemovel}
                  onChange={(e) => setEditFormData({...editFormData, telemovel: e.target.value})}
                  className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                />
              </div>
<div>
                <label className="block text-sm mb-2 text-[#4d7068]">Tipo de Utilizador</label>
                <div className="space-y-2">
                  {['ALUNO', 'ENCARREGADO', 'PROFESSOR', 'DIRECAO'].map(role => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editSelectedRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditSelectedRoles([...editSelectedRoles, role]);
                          } else {
                            setEditSelectedRoles(editSelectedRoles.filter(r => r !== role));
                          }
                        }}
                        className="w-4 h-4 text-[#0d6b5e] rounded border-[#0d6b5e]/30 focus:ring-[#0d6b5e]"
                      />
                      <span className="text-sm">
                        {role === 'ALUNO' && 'Aluno'}
                        {role === 'ENCARREGADO' && 'Encarregado'}
                        {role === 'PROFESSOR' && 'Professor'}
                        {role === 'DIRECAO' && 'Direção'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {editSelectedRoles.includes('ALUNO') && (
                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Encarregado de Educação</label>
                  <select 
                    value={editFormData.encarregadoId}
                    onChange={(e) => setEditFormData({...editFormData, encarregadoId: e.target.value})}
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  >
                    <option value="">Selecione o encarregado...</option>
                    {users.filter(u => u.role === 'ENCARREGADO').map(enc => (
                      <option key={enc.id} value={enc.id}>{enc.nome} ({enc.email})</option>
                    ))}
                  </select>
                </div>
              )}
              {editSelectedRoles.includes('PROFESSOR') && (
                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Modalidades</label>
                  {editModalidades.map((modalidade, index) => {
                    const jaSelecionadas: number[] = [];
                    editModalidades.forEach((m, idx) => {
                      if (idx !== index && m) jaSelecionadas.push(Number(m));
                    });
                    return (
                      <div key={index} className="flex gap-2 mb-2">
                        <select
                          value={modalidade}
                          onChange={(e) => {
                            const novas = [...editModalidades];
                            novas[index] = e.target.value;
                            setEditModalidades(novas);
                          }}
                          className="flex-1 px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-white focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                        >
                          <option value="">Selecione modalidade {index + 1}...</option>
                          {modalidadesDisponiveis
                            .filter(m => !jaSelecionadas.includes(m.id))
                            .map(m => (
                              <option key={m.id} value={m.id}>{m.nome}</option>
                            ))}
                        </select>
                        {editModalidades.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const novas = editModalidades.filter((_, i) => i !== index);
                              setEditModalidades(novas);
                            }}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {editModalidades.filter(m => m).length < MAX_MODALIDADES && (
                    <button
                      type="button"
                      onClick={() => setEditModalidades([...editModalidades, ''])}
                      className="mt-2 text-sm text-[#0d6b5e] hover:text-[#065147]"
                    >
                      + Adicionar modalidade
                    </button>
                  )}
                </div>
              )}
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#0d6b5e] text-white px-6 py-2 rounded-lg hover:bg-[#065147] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'A guardar...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="bg-[#deecea] text-[#0d6b5e] px-6 py-2 rounded-lg hover:bg-[#c8e0dc] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regra de Negócio */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-[#e2f0ed] border border-[#0d6b5e]/20 rounded-xl p-6">
          <h3 className="text-lg text-[#0a1a17] mb-3">
            <strong>Regra de Negócio - Centralização de Identidades</strong>
          </h3>
          <div className="space-y-2 text-[#0d6b5e]">
            <p>• A criação de qualquer conta de utilizador (Aluno, Encarregado ou Professor) é da exclusiva responsabilidade da Direção.</p>
            <p>• Um utilizador com a role ALUNO está obrigatoriamente vinculado a um ENCARREGADO.</p>
            <p>• O Aluno tem permissão de "Apenas Leitura" na agenda.</p>
            <p>• Um Encarregado apenas pode visualizar as agendas e dados dos Alunos que estão sob sua responsabilidade direta.</p>
          </div>
        </div>
      </div>
    </div>
  );
}