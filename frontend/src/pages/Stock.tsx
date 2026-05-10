import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { mockUsers } from '../data/mockData';
import { Figurino, FigurinoStatus } from '../types';
import api from '../services/api';
import { Package, ArrowLeft, Plus, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

export function Stock() {
  const [figurinos, setFigurinos] = useState<Figurino[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | FigurinoStatus>('TODOS');
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [novoFigurino, setNovoFigurino] = useState({
    nome: '',
    descricao: '',
    tamanho: '',
    imagem: '',
    localArmazenamento: ''
  });
  const [showAluguelForm, setShowAluguelForm] = useState<string | null>(null);
  const [dadosAluguel, setDadosAluguel] = useState({
    usuarioId: '',
    dataInicio: '',
    dataFim: ''
  });

  useEffect(() => {
    const fetchFigurinos = async () => {
      try {
        const result = await api.getFigurinos();
        if (result.success && result.data) {
          setFigurinos(result.data.filter((f: any) => f.tipo === 'ESCOLA'));
        }
      } catch (error) {
        console.error('Error fetching figurinos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFigurinos();
  }, []);

  const getFigurinosFiltrados = () => {
    if (filtroStatus === 'TODOS') return figurinos;
    return figurinos.filter(f => f.status === filtroStatus);
  };

  const handleAdicionarFigurino = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novoFigurino.nome || !novoFigurino.descricao || !novoFigurino.tamanho || !novoFigurino.imagem || !novoFigurino.localArmazenamento) {
      toast.error('Preencha todos os campos');
      return;
    }

    const novo: Figurino = {
      id: `fig-${Date.now()}`,
      nome: novoFigurino.nome,
      descricao: novoFigurino.descricao,
      tamanho: novoFigurino.tamanho,
      imagem: novoFigurino.imagem,
      localArmazenamento: novoFigurino.localArmazenamento,
      status: 'DISPONIVEL',
      tipo: 'ESCOLA'
    };

    setFigurinos([novo, ...figurinos]);
    setNovoFigurino({ nome: '', descricao: '', tamanho: '', imagem: '', localArmazenamento: '' });
    setShowNovoForm(false);
    toast.success('Figurino adicionado ao stock com sucesso!');
  };

  const handleMarcarAlugado = (figurinoId: string) => {
    if (!dadosAluguel.usuarioId || !dadosAluguel.dataInicio || !dadosAluguel.dataFim) {
      toast.error('Preencha todos os campos do aluguel');
      return;
    }

    const usuario = mockUsers.find(u => u.id === dadosAluguel.usuarioId);
    if (!usuario) {
      toast.error('Usuário não encontrado');
      return;
    }

    setFigurinos(figurinos.map(f => 
      f.id === figurinoId 
        ? { 
            ...f, 
            status: 'ALUGADO',
            alugadoPor: usuario.nome,
            alugadoEm: dadosAluguel.dataInicio,
            alugadoAte: dadosAluguel.dataFim
          } 
        : f
    ));

    setShowAluguelForm(null);
    setDadosAluguel({ usuarioId: '', dataInicio: '', dataFim: '' });
    toast.success(`Figurino alugado para ${usuario.nome}`);
  };

  const handleAlterarStatus = (figurinoId: string, novoStatus: FigurinoStatus) => {
    setFigurinos(figurinos.map(f => 
      f.id === figurinoId ? { ...f, status: novoStatus, alugadoPor: undefined, alugadoEm: undefined, alugadoAte: undefined } : f
    ));
    toast.success('Status atualizado com sucesso!');
  };

  const getStatusBadge = (status: FigurinoStatus) => {
    const styles = {
      DISPONIVEL: 'bg-green-100 text-green-800',
      ALUGADO: 'bg-blue-100 text-blue-800',
      VENDIDO: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      DISPONIVEL: 'Disponível',
      ALUGADO: 'Alugado',
      VENDIDO: 'Vendido'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getStatusCount = (status: FigurinoStatus) => {
    return figurinos.filter(f => f.status === status).length;
  };

  const figurinosFiltrados = getFigurinosFiltrados();
  const todosUsuarios = mockUsers.filter(u => u.role !== 'DIRECAO');

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
            <span className="text-white/80">Stock</span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl text-white mb-1">Stock de Figurinos</h1>
              <p className="text-white/50 text-sm">
                Gestão do inventário da escola
              </p>
            </div>

            <button
              onClick={() => setShowNovoForm(!showNovoForm)}
              className="flex items-center gap-2 bg-[#c9a84c] text-[#0a1a17] px-5 py-2.5 rounded-lg hover:bg-[#e8c97a] transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-5 h-5" />
              Adicionar Figurino
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-3xl text-[#1a9885] mb-1">
                {getStatusCount('DISPONIVEL')}
              </div>
              <div className="text-sm text-white/50">Disponíveis</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-3xl text-[#c9a84c] mb-1">
                {getStatusCount('ALUGADO')}
              </div>
              <div className="text-sm text-white/50">Alugados</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-[#c9a84c]/30">
              <div className="text-3xl text-[#c9a84c] mb-1">
                {figurinos.length}
              </div>
              <div className="text-sm text-white/50">Total</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-white/50">Filtrar:</span>
            {(['TODOS', 'DISPONIVEL', 'ALUGADO'] as const).map(status => {
              const labels = {
                TODOS: 'Todos',
                DISPONIVEL: 'Disponível',
                ALUGADO: 'Alugado'
              };

              return (
                <button
                  key={status}
                  onClick={() => setFiltroStatus(status)}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                    filtroStatus === status
                      ? 'bg-[#c9a84c] text-[#0a1a17]'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {labels[status]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Adicionar Figurino */}
      {showNovoForm && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#0d6b5e]/10">
            <h2 className="text-xl mb-4 text-[#0a1a17]">Adicionar Novo Figurino ao Stock</h2>
            <form onSubmit={handleAdicionarFigurino} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Nome *</label>
                  <input
                    type="text"
                    value={novoFigurino.nome}
                    onChange={(e) => setNovoFigurino({...novoFigurino, nome: e.target.value})}
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="Ex: Tutu Clássico Azul"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Tamanho *</label>
                  <select
                    value={novoFigurino.tamanho}
                    onChange={(e) => setNovoFigurino({...novoFigurino, tamanho: e.target.value})}
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    required
                  >
                    <option value="">Selecione o tamanho</option>
                    <option value="PP">PP</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2 text-[#4d7068]">Local de Armazenamento *</label>
                  <input
                    type="text"
                    value={novoFigurino.localArmazenamento}
                    onChange={(e) => setNovoFigurino({...novoFigurino, localArmazenamento: e.target.value})}
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="Ex: Armário A - Prateleira 2"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2 text-[#4d7068]">Descrição *</label>
                  <textarea
                    value={novoFigurino.descricao}
                    onChange={(e) => setNovoFigurino({...novoFigurino, descricao: e.target.value})}
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    rows={3}
                    placeholder="Descreva o figurino..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2 text-[#4d7068]">URL da Imagem *</label>
                  <input
                    type="url"
                    value={novoFigurino.imagem}
                    onChange={(e) => setNovoFigurino({...novoFigurino, imagem: e.target.value})}
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-[#0d6b5e] text-white px-6 py-2 rounded-lg hover:bg-[#065147] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  Adicionar ao Stock
                </button>
                <button
                  type="button"
                  onClick={() => setShowNovoForm(false)}
                  className="bg-[#deecea] text-[#0d6b5e] px-6 py-2 rounded-lg hover:bg-[#c8e0dc] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Figurinos */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {figurinosFiltrados.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-md text-center">
            <Package className="w-16 h-16 text-[#0d6b5e]/20 mx-auto mb-4" />
            <p className="text-[#4d7068]">Nenhum figurino encontrado</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {figurinosFiltrados.map(figurino => (
              <div key={figurino.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 border border-[#0d6b5e]/5">
                <div className="relative">
                  <img
                    src={figurino.imagem}
                    alt={figurino.nome}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(figurino.status)}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg mb-2 text-[#0a1a17]">{figurino.nome}</h3>
                  <p className="text-[#4d7068] text-sm mb-4 line-clamp-2">{figurino.descricao}</p>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[#4d7068]">Tamanho:</span>
                      <span className="text-[#0a1a17]"><strong>{figurino.tamanho}</strong></span>
                    </div>

                    {figurino.localArmazenamento && (
                      <div className="flex items-start gap-2 p-2 bg-[#f4f9f8] rounded-lg border border-[#0d6b5e]/10">
                        <MapPin className="w-4 h-4 text-[#0d6b5e] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-[#4d7068]">Local:</p>
                          <p className="text-xs text-[#0a1a17]" style={{ fontWeight: 600 }}>
                            {figurino.localArmazenamento}
                          </p>
                        </div>
                      </div>
                    )}

                    {figurino.status === 'ALUGADO' && figurino.alugadoPor && (
                      <>
                        <div className="pt-2 border-t border-[#0d6b5e]/10">
                          <p className="text-xs text-[#4d7068] mb-1">Alugado por:</p>
                          <p className="text-sm text-[#0a1a17]" style={{ fontWeight: 600 }}>{figurino.alugadoPor}</p>
                        </div>
                        {figurino.alugadoEm && figurino.alugadoAte && (
                          <div className="text-xs text-[#4d7068]">
                            <p>De: {new Date(figurino.alugadoEm).toLocaleDateString('pt-PT')}</p>
                            <p>Até: {new Date(figurino.alugadoAte).toLocaleDateString('pt-PT')}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="pt-4 border-t border-[#0d6b5e]/10 space-y-2">
                    {figurino.status === 'DISPONIVEL' && (
                      <>
                        {showAluguelForm === figurino.id ? (
                          <div className="space-y-2 p-3 bg-[#f4f9f8] rounded-lg">
                            <select
                              value={dadosAluguel.usuarioId}
                              onChange={(e) => setDadosAluguel({...dadosAluguel, usuarioId: e.target.value})}
                              className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg text-[#0a1a17]"
                            >
                              <option value="">Selecione o usuário</option>
                              {todosUsuarios.map(u => (
                                <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={dadosAluguel.dataInicio}
                              onChange={(e) => setDadosAluguel({...dadosAluguel, dataInicio: e.target.value})}
                              className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg"
                              placeholder="Data início"
                              min={new Date().toISOString().split('T')[0]}
                            />
                            <input
                              type="date"
                              value={dadosAluguel.dataFim}
                              onChange={(e) => setDadosAluguel({...dadosAluguel, dataFim: e.target.value})}
                              className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg"
                              placeholder="Data fim"
                              min={dadosAluguel.dataInicio || new Date().toISOString().split('T')[0]}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleMarcarAlugado(figurino.id)}
                                className="flex-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-xs"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => {
                                  setShowAluguelForm(null);
                                  setDadosAluguel({ usuarioId: '', dataInicio: '', dataFim: '' });
                                }}
                                className="flex-1 bg-[#deecea] text-[#0d6b5e] px-3 py-2 rounded-lg hover:bg-[#c8e0dc] transition-colors text-xs"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAluguelForm(figurino.id)}
                            className="w-full bg-[#c9a84c] text-[#0a1a17] px-3 py-2 rounded-lg hover:bg-[#e8c97a] transition-colors text-sm"
                            style={{ fontWeight: 600 }}
                          >
                            Marcar como Alugado
                          </button>
                        )}
                      </>
                    )}

                    <select
                      value={figurino.status}
                      onChange={(e) => handleAlterarStatus(figurino.id, e.target.value as FigurinoStatus)}
                      className="w-full px-3 py-2 border border-[#0d6b5e]/20 rounded-lg text-sm bg-[#f4f9f8] text-[#0a1a17] focus:outline-none focus:border-[#0d6b5e]"
                    >
                      <option value="DISPONIVEL">Marcar como Disponível</option>
                      <option value="ALUGADO" disabled={figurino.status !== 'ALUGADO'}>Alugado</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nota Informativa */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-[#e2f0ed] border border-[#0d6b5e]/20 rounded-xl p-6">
          <h3 className="text-lg text-[#0a1a17] mb-3">
            <strong>Regra de Negócio - Reserva de Inventário</strong>
          </h3>
          <p className="text-[#0d6b5e]">
            Figurinos marcados como <strong>ALUGADO</strong> ficam automaticamente bloqueados no sistema 
            e não podem ser reservados até que o estado seja atualizado para DISPONÍVEL.
          </p>
        </div>
      </div>
    </div>
  );
}