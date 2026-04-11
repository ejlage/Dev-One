import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router';
import api from '../services/api';
import { Plus, Mail, CheckCircle, XCircle, Clock, ArrowLeft, Tag, ShoppingBag, Filter, Calendar, Search, Music2, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

// Modalidades disponíveis
const MODALIDADES = ['Ballet', 'Hip-Hop', 'Jazz', 'Contemporâneo', 'Dança Urbana', 'Teatro Dança'];

// Opções de ordenação
type SortOption = 'recent' | 'oldest' | 'az' | 'za';

export function Marketplace() {
  const { user } = useAuth();
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [figurinos, setFigurinos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroMeus, setFiltroMeus] = useState(false);
  const [filtroEspetaculo, setFiltroEspetaculo] = useState<string>('');
  const [filtroModalidade, setFiltroModalidade] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showReservaForm, setShowReservaForm] = useState<string | null>(null);
  const [reservaData, setReservaData] = useState({ dataInicio: '', dataFim: '' });
  const [viewMode, setViewMode] = useState<'anuncios' | 'reservas'>('anuncios');
  const [reservas, setReservas] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [anunciosRes, figurinosRes] = await Promise.all([
          api.getAnuncios(),
          api.getFigurinos()
        ]);
        if (anunciosRes.success) setAnuncios(anunciosRes.data);
        if (figurinosRes.success) setFigurinos(figurinosRes.data);
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!user) return null;

  const getAnunciosFiltrados = () => {
    let anunciosFiltrados = [...anuncios];

    // Encarregados veem seus anúncios + todos aprovados
    if (user.role === 'ENCARREGADO') {
      anunciosFiltrados = anunciosFiltrados.filter(
        a => a.vendedorId === user.id || a.status === 'APROVADO'
      );
    }

    // Professores e Alunos veem apenas aprovados
    if (user.role === 'PROFESSOR' || user.role === 'ALUNO') {
      anunciosFiltrados = anunciosFiltrados.filter(a => a.status === 'APROVADO');
    }

    // Filtro: Meus anúncios
    if (filtroMeus && user.role !== 'DIRECAO') {
      anunciosFiltrados = anunciosFiltrados.filter(a => a.vendedorId === user.id);
    }

    // Filtro por tipo de transação
    if (filtroTipo !== 'TODOS') {
      anunciosFiltrados = anunciosFiltrados.filter(a => a.tipoTransacao === filtroTipo);
    }

    // Filtro por espetáculo (apenas alugueres)
    if (filtroEspetaculo) {
      anunciosFiltrados = anunciosFiltrados.filter(
        a => a.tipoTransacao === 'ALUGUER' && a.espetaculoNome?.includes(filtroEspetaculo)
      );
    }

    // Filtro por modalidade
    if (filtroModalidade !== 'TODAS') {
      anunciosFiltrados = anunciosFiltrados.filter(a => 
        a.titulo.toLowerCase().includes(filtroModalidade.toLowerCase()) ||
        a.descricao.toLowerCase().includes(filtroModalidade.toLowerCase())
      );
    }

    // Filtro por pesquisa
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      anunciosFiltrados = anunciosFiltrados.filter(a =>
        a.titulo.toLowerCase().includes(query) ||
        a.descricao.toLowerCase().includes(query) ||
        a.vendedorNome.toLowerCase().includes(query)
      );
    }

    // Ordenação
    switch (sortBy) {
      case 'recent':
        anunciosFiltrados.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
        break;
      case 'oldest':
        anunciosFiltrados.sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime());
        break;
      case 'az':
        anunciosFiltrados.sort((a, b) => a.titulo.localeCompare(b.titulo));
        break;
      case 'za':
        anunciosFiltrados.sort((a, b) => b.titulo.localeCompare(a.titulo));
        break;
    }

    return anunciosFiltrados;
  };

  const handleAprovar = (anuncioId: string) => {
    setAnuncios(anuncios.map(a =>
      a.id === anuncioId ? { ...a, status: 'APROVADO' as AnuncioStatus } : a
    ));
    toast.success('Anúncio aprovado com sucesso!');
  };

  const handleRejeitar = (anuncioId: string) => {
    if (confirm('Tem a certeza que deseja rejeitar este anúncio?')) {
      setAnuncios(anuncios.map(a =>
        a.id === anuncioId ? { ...a, status: 'REJEITADO' as AnuncioStatus } : a
      ));
      toast.info('Anúncio rejeitado.');
    }
  };

  const handleSolicitarAluguer = (anuncioId: string) => {
    if (!reservaData.dataInicio || !reservaData.dataFim) {
      toast.error('Preencha as datas de início e fim do aluguer');
      return;
    }

    const anuncio = anuncios.find(a => a.id === anuncioId);
    if (!anuncio) return;

    const novaReserva: ReservaFigurino = {
      id: `res-${Date.now()}`,
      anuncioId,
      anuncioTitulo: anuncio.titulo,
      usuarioId: user.id,
      usuarioNome: user.nome,
      dataInicio: reservaData.dataInicio,
      dataFim: reservaData.dataFim,
      status: 'PENDENTE',
      criadoEm: new Date().toISOString()
    };

    setReservas([novaReserva, ...reservas]);
    setShowReservaForm(null);
    setReservaData({ dataInicio: '', dataFim: '' });
    toast.success('Pedido de aluguer enviado! Aguarde aprovação da direção.');
  };

  const handleAprovarReserva = (reservaId: string) => {
    setReservas(reservas.map(r =>
      r.id === reservaId ? { ...r, status: 'APROVADA' } : r
    ));
    toast.success('Reserva aprovada!');
  };

  const handleRejeitarReserva = (reservaId: string) => {
    const motivo = prompt('Motivo da rejeição:');
    if (motivo) {
      setReservas(reservas.map(r =>
        r.id === reservaId ? { ...r, status: 'REJEITADA', motivoRejeicao: motivo } : r
      ));
      toast.info('Reserva rejeitada.');
    }
  };

  const anunciosFiltrados = getAnunciosFiltrados();
  const reservasPendentes = reservas.filter(r => r.status === 'PENDENTE');

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
            <span className="text-white/80">Marketplace</span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl text-white mb-1">Marketplace</h1>
              <p className="text-white/50 text-sm">
                {user.role === 'ENCARREGADO' && 'Compre e venda artigos de dança'}
                {user.role === 'DIRECAO' && 'Modere os anúncios e crie alugueres da escola'}
                {(user.role === 'PROFESSOR' || user.role === 'ALUNO') && 'Compre ou alugue artigos de dança'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {user.role === 'DIRECAO' && reservasPendentes.length > 0 && (
                <button
                  onClick={() => setViewMode(viewMode === 'anuncios' ? 'reservas' : 'anuncios')}
                  className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-lg hover:bg-orange-700 transition-colors relative"
                  style={{ fontWeight: 600 }}
                >
                  <Calendar className="w-5 h-5" />
                  {viewMode === 'anuncios' ? 'Ver Reservas' : 'Ver Anúncios'}
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {reservasPendentes.length}
                  </span>
                </button>
              )}

              {(user.role === 'ENCARREGADO' || user.role === 'DIRECAO') && (
                <button
                  onClick={() => setShowNovoForm(!showNovoForm)}
                  className="flex items-center gap-2 bg-[#c9a84c] text-[#0a1a17] px-5 py-2.5 rounded-lg hover:bg-[#e8c97a] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  <Plus className="w-5 h-5" />
                  {user.role === 'DIRECAO' ? 'Novo Aluguer' : 'Novo Anúncio'}
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          {viewMode === 'anuncios' && (
            <div className="space-y-3">
              {/* Barra de pesquisa */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="w-4 h-4 text-white/50" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg text-sm bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:outline-none focus:border-[#c9a84c] transition-colors"
                  placeholder="Pesquisar por título, descrição ou vendedor..."
                />
              </div>

              {/* Filtros em linha */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-white/50" />
                  <span className="text-sm text-white/50">Tipo:</span>
                </div>
                {(['TODOS', 'VENDA', 'ALUGUER'] as const).map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTipo(tipo)}
                    className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                      filtroTipo === tipo
                        ? 'bg-[#c9a84c] text-[#0a1a17]'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {tipo === 'TODOS' ? 'Todos' : tipo}
                  </button>
                ))}

                <div className="h-5 w-px bg-white/20" />

                <div className="flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-white/50" />
                  <span className="text-sm text-white/50">Modalidade:</span>
                </div>
                <select
                  value={filtroModalidade}
                  onChange={(e) => setFiltroModalidade(e.target.value)}
                  className="px-4 py-1.5 rounded-lg text-sm bg-white/10 text-white border border-white/20 focus:outline-none focus:border-[#c9a84c] transition-colors"
                >
                  <option value="TODAS" className="bg-[#0a1a17]">Todas</option>
                  {MODALIDADES.map(modalidade => (
                    <option key={modalidade} value={modalidade} className="bg-[#0a1a17]">{modalidade}</option>
                  ))}
                </select>

                <div className="h-5 w-px bg-white/20" />

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-white/50" />
                  <span className="text-sm text-white/50">Ordenar:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-1.5 rounded-lg text-sm bg-white/10 text-white border border-white/20 focus:outline-none focus:border-[#c9a84c] transition-colors"
                >
                  <option value="recent" className="bg-[#0a1a17]">Mais recentes</option>
                  <option value="oldest" className="bg-[#0a1a17]">Mais antigos</option>
                  <option value="az" className="bg-[#0a1a17]">A-Z</option>
                  <option value="za" className="bg-[#0a1a17]">Z-A</option>
                </select>
              </div>

              {user.role !== 'DIRECAO' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFiltroMeus(!filtroMeus)}
                    className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                      filtroMeus
                        ? 'bg-[#c9a84c] text-[#0a1a17]'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {filtroMeus ? 'Mostrar Todos' : 'Meus Anúncios'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Form Novo Anúncio */}
      {showNovoForm && user.role === 'ENCARREGADO' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#0d6b5e]/10">
            <h2 className="text-xl mb-5 text-[#0a1a17]" style={{ fontWeight: 600 }}>Criar Novo Anúncio</h2>
            <form className="space-y-4">
              {/* Linha 1: Selecionar figurino + Criar Figurino */}
              <div>
                <label className="block text-sm mb-1.5 text-[#4d7068]">Selecionar figurino:</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <select
                      className="w-full appearance-none px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17] pr-10"
                    >
                      <option value=""></option>
                      <option value="sapatilhas">Sapatilhas de Ballet Rosa — Tam. 38</option>
                      <option value="collants">Collants Pretos — Vários Tamanhos</option>
                      <option value="sapatos">Sapatos de Sapateado — Tam. 40</option>
                      <option value="tutu">Tutu Clássico Branco — Tam. M</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4d7068]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="bg-[#0d6b5e] text-white px-5 py-2.5 rounded-lg hover:bg-[#065147] transition-colors whitespace-nowrap text-sm"
                    style={{ fontWeight: 600 }}
                  >
                    Criar Figurino
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm mb-1.5 text-[#4d7068]">Descrição</label>
                <textarea
                  className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] resize-none text-[#0a1a17]"
                  rows={4}
                  placeholder="Descreva o item com detalhes..."
                />
              </div>

              {/* Email + URL Imagem */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1.5 text-[#4d7068]">Email de Contacto</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    placeholder="seuemail@exemplo.pt"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5 text-[#4d7068]">Imagem URL</label>
                  <input
                    type="url"
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="bg-[#0d6b5e] text-white px-6 py-2.5 rounded-lg hover:bg-[#065147] transition-colors text-sm"
                  style={{ fontWeight: 600 }}
                >
                  Publicar Anúncio
                </button>
                <button
                  type="button"
                  onClick={() => setShowNovoForm(false)}
                  className="px-6 py-2.5 rounded-lg border border-[#0d6b5e]/30 text-[#0d6b5e] hover:bg-[#e2f0ed] transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>

            {/* Nota */}
            <div className="mt-4 p-3.5 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Nota:</strong> O seu anúncio ficará pendente de aprovação pela direção.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Novo Aluguer - Direção */}
      {showNovoForm && user.role === 'DIRECAO' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#0d6b5e]/10">
            <h2 className="text-xl mb-4 text-[#0a1a17]">Criar Novo Aluguer</h2>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Associar ao Stock</label>
                  <select className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]">
                    <option value="">Selecione um figurino do stock</option>
                    {figurinos.filter(f => f.tipo === 'ESCOLA').map(fig => (
                      <option key={fig.id} value={fig.id}>
                        {fig.nome} - {fig.tamanho} ({fig.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Espetáculo (opcional)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="Ex: Espetáculo de Fim de Ano"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2 text-[#4d7068]">Título</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="Ex: Tutu Clássico Profissional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-2 text-[#4d7068]">Descrição</label>
                  <textarea
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    rows={4}
                    placeholder="Descreva o item disponível para aluguer..."
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Email de Contacto</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8]"
                    value="figurinos@entartes.pt"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]">Imagem URL</label>
                  <input
                    type="url"
                    className="w-full px-4 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-[#0d6b5e] text-white px-6 py-2 rounded-lg hover:bg-[#065147] transition-colors"
                >
                  Publicar Aluguer
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

            <div className="mt-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-sm text-teal-800">
                <strong>Nota:</strong> Os alugueres criados pela direção são automaticamente aprovados e disponibilizados imediatamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* View de Reservas Pendentes (Direção) */}
      {viewMode === 'reservas' && user.role === 'DIRECAO' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#0d6b5e]/10">
            <h2 className="text-2xl mb-6 text-[#0a1a17]">Aprovação de Reservas de Figurinos</h2>
            
            {reservas.length === 0 ? (
              <p className="text-center text-[#4d7068] py-8">Nenhuma reserva encontrada</p>
            ) : (
              <div className="space-y-4">
                {reservas.map(reserva => {
                  const anuncio = anuncios.find(a => a.id === reserva.anuncioId);
                  return (
                    <div key={reserva.id} className="p-4 border border-[#0d6b5e]/10 rounded-xl hover:border-[#0d6b5e]/30 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg text-[#0a1a17] mb-1">{reserva.anuncioTitulo}</h3>
                          <p className="text-sm text-[#4d7068]">Solicitado por: <strong>{reserva.usuarioNome}</strong></p>
                          <p className="text-sm text-[#4d7068]">
                            Período: {new Date(reserva.dataInicio).toLocaleDateString('pt-PT')} até {new Date(reserva.dataFim).toLocaleDateString('pt-PT')}
                          </p>
                          {anuncio?.espetaculoNome && (
                            <p className="text-sm text-[#0d6b5e] mt-1">
                              Espetáculo: {anuncio.espetaculoNome}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {reserva.status === 'PENDENTE' ? (
                            <>
                              <button
                                onClick={() => handleAprovarReserva(reserva.id)}
                                className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleRejeitarReserva(reserva.id)}
                                className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeitar
                              </button>
                            </>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              reserva.status === 'APROVADA' ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {reserva.status === 'APROVADA' ? 'Aprovada' : 'Rejeitada'}
                            </span>
                          )}
                        </div>
                      </div>

                      {reserva.motivoRejeicao && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-700">
                            <strong>Motivo da rejeição:</strong> {reserva.motivoRejeicao}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de Anúncios */}
      {viewMode === 'anuncios' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {anunciosFiltrados.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-md text-center">
              <ShoppingBag className="w-16 h-16 text-[#0d6b5e]/20 mx-auto mb-4" />
              <p className="text-[#4d7068]">Nenhum anúncio encontrado</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {anunciosFiltrados.map(anuncio => (
                <div key={anuncio.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 border border-[#0d6b5e]/5">
                  <div className="relative">
                    <img
                      src={anuncio.imagem}
                      alt={anuncio.titulo}
                      className="w-full h-52 object-cover"
                    />
                    {/* Badge Tipo */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs backdrop-blur-sm ${
                        anuncio.tipoTransacao === 'VENDA'
                          ? 'bg-[#0d6b5e]/90 text-white'
                          : 'bg-[#c9a84c]/90 text-[#0a1a17]'
                      }`} style={{ fontWeight: 600 }}>
                        {anuncio.tipoTransacao === 'VENDA' ? (
                          <><ShoppingBag className="w-3 h-3" /> Venda</>
                        ) : (
                          <><Tag className="w-3 h-3" /> Aluguer</>
                        )}
                      </span>
                    </div>
                    {/* Badge Status - Apenas para Direção e dono do anúncio */}
                    {(user.role === 'DIRECAO' || anuncio.vendedorId === user.id) && anuncio.status === 'PENDENTE' && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
                          Pendente
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg mb-2 text-[#0a1a17]">{anuncio.titulo}</h3>
                    <p className="text-[#4d7068] text-sm mb-4 line-clamp-2">{anuncio.descricao}</p>

                    {anuncio.espetaculoNome && (
                      <div className="mb-3 p-2 bg-[#e2f0ed] rounded-lg">
                        <p className="text-xs text-[#0d6b5e]">
                          <strong>Espetáculo:</strong> {anuncio.espetaculoNome}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-[#0d6b5e]/10 pt-4 space-y-2">
                      <p className="text-sm text-[#4d7068]">
                        <strong className="text-[#0a1a17]">{anuncio.tipoTransacao === 'VENDA' ? 'Vendedor' : 'Escola'}:</strong>{' '}
                        {anuncio.vendedorNome}
                      </p>

                      {anuncio.status === 'APROVADO' && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[#0d6b5e]" />
                          <a
                            href={`mailto:${anuncio.vendedorEmail}`}
                            className="text-sm text-[#0d6b5e] hover:text-[#065147] hover:underline transition-colors"
                          >
                            {anuncio.vendedorEmail}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Botão para solicitar aluguer */}
                    {anuncio.tipoTransacao === 'ALUGUER' && anuncio.status === 'APROVADO' && user.role !== 'DIRECAO' && (
                      <div className="mt-4">
                        {showReservaForm === anuncio.id ? (
                          <div className="space-y-3 p-3 bg-[#f4f9f8] rounded-lg">
                            <div>
                              <label className="block text-xs text-[#4d7068] mb-1">Data Início</label>
                              <input
                                type="date"
                                value={reservaData.dataInicio}
                                onChange={(e) => setReservaData({...reservaData, dataInicio: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg"
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[#4d7068] mb-1">Data Fim</label>
                              <input
                                type="date"
                                value={reservaData.dataFim}
                                onChange={(e) => setReservaData({...reservaData, dataFim: e.target.value})}
                                className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg"
                                min={reservaData.dataInicio || new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSolicitarAluguer(anuncio.id)}
                                className="flex-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => {
                                  setShowReservaForm(null);
                                  setReservaData({ dataInicio: '', dataFim: '' });
                                }}
                                className="flex-1 bg-[#deecea] text-[#0d6b5e] px-3 py-2 rounded-lg hover:bg-[#c8e0dc] transition-colors text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowReservaForm(anuncio.id)}
                            className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] text-[#0a1a17] px-4 py-2 rounded-lg hover:bg-[#e8c97a] transition-colors text-sm"
                            style={{ fontWeight: 600 }}
                          >
                            <Calendar className="w-4 h-4" />
                            Solicitar Aluguer
                          </button>
                        )}
                      </div>
                    )}

                    {/* Ações para Direção */}
                    {user.role === 'DIRECAO' && anuncio.status === 'PENDENTE' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleAprovar(anuncio.id)}
                          className="flex-1 flex items-center justify-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleRejeitar(anuncio.id)}
                          className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    )}

                    {/* Status para Encarregado */}
                    {user.role === 'ENCARREGADO' && anuncio.vendedorId === user.id && anuncio.status === 'PENDENTE' && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <Clock className="w-4 h-4" />
                        <span>Aguardando aprovação da direção</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}