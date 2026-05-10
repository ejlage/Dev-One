import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useSearchParams } from 'react-router';
import { AnuncioMarketplace, AnuncioStatus, TipoTransacao, ReservaFigurino } from '../types';
import api from '../services/api';
import { Plus, Mail, CheckCircle, XCircle, Clock, ArrowLeft, Tag, ShoppingBag, Filter, Calendar, Search, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

type SortOption = 'recent' | 'oldest' | 'az' | 'za';

const normalizeEstadoTipo = (tipoestado: string | undefined): string => {
  if (!tipoestado) return 'PENDENTE';
  const lower = tipoestado.toLowerCase();
  if (lower.startsWith('aprovado')) return 'APROVADA';
  if (lower.startsWith('rejeitado')) return 'REJEITADA';
  if (lower.startsWith('pendente')) return 'PENDENTE';
  return tipoestado.toUpperCase();
};

export function Marketplace() {
  const { user, activeRole } = useAuth();
  const [searchParams] = useSearchParams();
  const [anuncios, setAnuncios] = useState<AnuncioMarketplace[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [figurinos, setFigurinos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoAluguerForm, setNovoAluguerForm] = useState({
    figurinoId: searchParams.get('figurinoId') || '',
    valor: '',
    dataanuncio: new Date().toISOString().split('T')[0],
    quantidade: '1',
  });
  const [novoAnuncioEnc, setNovoAnuncioEnc] = useState({
    figurinoId: '', figurinoNome: '', descricao: '', valor: '',
    datainicio: '', datafim: '', tipo: 'ALUGUER',
  });
  const [novoAnuncioProf, setNovoAnuncioProf] = useState({
    figurinoId: '', figurinoNome: '', valor: '', datainicio: '', datafim: '', tipo: 'ALUGUER',
  });
  const [lookup, setLookup] = useState<{ tamanhos: any[]; generos: any[]; cores: any[]; tipos: any[]; estadosUso: any[] }>({
    tamanhos: [], generos: [], cores: [], tipos: [], estadosUso: [],
  });
  const [criarNovoFigurino, setCriarNovoFigurino] = useState(false);
  const [novoFigurino, setNovoFigurino] = useState({ nome: '', tipofigurinoid: '', tamanhoid: '', corid: '', generoid: '', estadousoid: '', fotografia: '' });
  const [imagemModeNovo, setImagemModeNovo] = useState<'url' | 'ficheiro'>('url');
  const [imagemPreviewNovo, setImagemPreviewNovo] = useState('');
  const [showNovoForm, setShowNovoForm] = useState(!!searchParams.get('figurinoId'));
  const [filtroTipo, setFiltroTipo] = useState<TipoTransacao | 'TODOS'>('TODOS');
  const [filtroMeus, setFiltroMeus] = useState(false);
  const [filtroEspetaculo, setFiltroEspetaculo] = useState<string>('');
  const [filtroModalidade, setFiltroModalidade] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showReservaForm, setShowReservaForm] = useState<string | null>(null);
  const [reservaData, setReservaData] = useState({ dataInicio: '', dataFim: '', quantidade: '1' });
  const [editAnuncioId, setEditAnuncioId] = useState<string | null>(null);
  const [editAnuncioForm, setEditAnuncioForm] = useState({ valor: '', datainicio: '', datafim: '', quantidade: '' });
  const [viewMode, setViewMode] = useState<'anuncios' | 'reservas'>('anuncios');
  const [rejeitarModal, setRejeitarModal] = useState<{ id: string } | null>(null);
  const [motivoRejeicaoInput, setMotivoRejeicaoInput] = useState('');
  const [rejeitarReservaModal, setRejeitarReservaModal] = useState<{ id: string } | null>(null);
  const [rejeitarReservaMotivoInput, setRejeitarReservaMotivoInput] = useState('');

  const handleImagemFicheiroNovo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem demasiado grande (máx. 5 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagemPreviewNovo(dataUrl);
      setNovoFigurino(f => ({ ...f, fotografia: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const mapReserva = (r: any) => {
    const requerenteNome =
      r.encarregadoeducacao?.utilizador?.nome ||
      r.professor?.utilizador?.nome ||
      'Utilizador';
    const requerenteId =
      r.encarregadoeducacaoutilizadoriduser ||
      r.professorutilizadoriduser ||
      null;
    return {
      id: String(r.idtransacao),
      anunciosId: String(r.anuncioidanuncio),
      anunciosTitulo: r.anuncio?.figurino?.nomemodelo || r.anuncio?.titulo || 'Figurino',
      usuarioId: requerenteId,
      usuarioNome: requerenteNome,
      dataInicio: r.datatransacao,
      dataFim: r.datatransacao,
      status: normalizeEstadoTipo(r.estado?.tipoestado),
      criadoEm: r.datatransacao,
      motivoRejeicao: r.motivorejeicao || null,
    };
  };

  const fetchReservas = async () => {
    try {
      if (activeRole === 'DIRECAO') {
        const result = await api.getAluguerTransacoes();
        if (result.success && result.data) setReservas(result.data.map(mapReserva));
      } else {
        const result = await api.getMyReservas();
        if (result.success && result.data) setReservas(result.data.map(mapReserva));
      }
    } catch (error) {
      console.error('Error fetching reservas:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const anunciosResult = await api.getAnuncios();
        if (anunciosResult.success && anunciosResult.data) {
          setAnuncios(anunciosResult.data);
        }

        await fetchReservas();

        if (activeRole === 'DIRECAO' || activeRole === 'ENCARREGADO' || activeRole === 'PROFESSOR') {
          const [figurinosResult, lookupResult] = await Promise.all([
            api.getFigurinos(),
            api.getFigurinoLookup(),
          ]);
          if (figurinosResult.success && figurinosResult.data) setFigurinos(figurinosResult.data);
          if (lookupResult.success && lookupResult.data) {
            setLookup({
              tamanhos: lookupResult.data.tamanhos,
              generos: lookupResult.data.generos,
              cores: lookupResult.data.cores,
              tipos: lookupResult.data.tipos,
              estadosUso: lookupResult.data.estadosUso || [],
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, activeRole]);

  // Auto-refresh de anúncios a cada 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await api.getAnuncios();
        if (result.success && result.data) {
          setAnuncios(result.data);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const handleSubmitNovoAluguer = async (e: React.FormEvent) => {
    e.preventDefault();
    const { figurinoId, valor, dataanuncio, quantidade } = novoAluguerForm;
    if (!figurinoId) {
      toast.error('Selecione um figurino');
      return;
    }
    try {
      await api.registarAnuncio({
        figurinoidfigurino: parseInt(figurinoId),
        ...(valor && { valor: parseFloat(valor) }),
        dataanuncio,
        quantidade: parseInt(quantidade),
      });
      toast.success('Anúncio de aluguer criado com sucesso!');
      setShowNovoForm(false);
      setNovoAluguerForm({ figurinoId: '', valor: '', dataanuncio: new Date().toISOString().split('T')[0], quantidade: '1' });
      const res = await api.getAnuncios();
      if (res.success && res.data) setAnuncios(res.data);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar anúncio');
    }
  };

  const getAnunciosFiltrados = () => {
    let anunciosFiltrados = [...anuncios];

    if (activeRole === 'ENCARREGADO') {
      anunciosFiltrados = anunciosFiltrados.filter(a => a.vendedorId === user.id || a.status === 'APROVADO');
    }

    if (activeRole === 'PROFESSOR') {
      anunciosFiltrados = anunciosFiltrados.filter(a => a.vendedorId === user.id || a.status === 'APROVADO');
    }

    if (activeRole === 'ALUNO') {
      anunciosFiltrados = anunciosFiltrados.filter(a => a.status === 'APROVADO');
    }

    if (filtroMeus && activeRole !== 'DIRECAO') {
      anunciosFiltrados = anunciosFiltrados.filter(a => a.vendedorId === user.id);
    }

    if (filtroTipo !== 'TODOS') {
      anunciosFiltrados = anunciosFiltrados.filter(a => a.tipoTransacao === filtroTipo);
    }

    if (filtroEspetaculo) {
      anunciosFiltrados = anunciosFiltrados.filter(a => a.tipoTransacao === 'ALUGUER' && a.espetaculoNome?.includes(filtroEspetaculo));
    }

    if (filtroModalidade !== 'TODAS') {
      anunciosFiltrados = anunciosFiltrados.filter(a => a.titulo.toLowerCase().includes(filtroModalidade.toLowerCase()) || a.descricao.toLowerCase().includes(filtroModalidade.toLowerCase()));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      anunciosFiltrados = anunciosFiltrados.filter(a => a.titulo.toLowerCase().includes(query) || a.descricao.toLowerCase().includes(query) || a.vendedorNome.toLowerCase().includes(query));
    }

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

  const handleSubmitAnuncioEncarregado = async (e: React.FormEvent) => {
    e.preventDefault();
    const { figurinoId, figurinoNome, valor, datainicio, datafim } = novoAnuncioEnc;
    if (!datainicio) {
      toast.error('A data de início é obrigatória');
      return;
    }

    if (criarNovoFigurino && !figurinoNome) {
      toast.error('Nome do figurino é obrigatório');
      return;
    }
    if (!criarNovoFigurino && !figurinoId) {
      toast.error('Selecione ou crie um figurino');
      return;
    }

    const agora = new Date();
    const dataHojeStr = agora.toISOString().split('T')[0];
    const dataInicioStr = datainicio.split('T')[0];
    if (dataInicioStr < dataHojeStr) {
      toast.error('A data de início não pode ser no passado');
      return;
    }
    if (datafim && datafim <= datainicio) {
      toast.error('A data de fim deve ser posterior à data de início');
      return;
    }

    try {
      let figurinoIdFinal = figurinoId ? parseInt(figurinoId) : null;

      if (criarNovoFigurino && figurinoNome) {
        const figRes = await api.createFigurinoStock({
          nome: figurinoNome,
          tipofigurinoid: parseInt(novoFigurino.tipofigurinoid),
          tamanhoid: parseInt(novoFigurino.tamanhoid),
          corid: parseInt(novoFigurino.corid),
          generoid: parseInt(novoFigurino.generoid),
          estadousoid: novoFigurino.estadousoid ? parseInt(novoFigurino.estadousoid) : undefined,
          fotografia: novoFigurino.fotografia || undefined,
          encarregadoeducacaoutilizadoriduser: parseInt(user.id),
        });
        if (figRes.success && figRes.data?.id) {
          figurinoIdFinal = figRes.data.id;
        }
      }

      if (!figurinoIdFinal) {
        toast.error('Erro ao criar/selecionar figurino');
        return;
      }

      await api.registarAnuncio({
        figurinoidfigurino: figurinoIdFinal,
        valor: valor ? parseFloat(valor) : undefined,
        dataanuncio: new Date().toISOString().split('T')[0],
        datainicio,
        datafim: datafim || undefined,
        quantidade: 1,
        tipotransacao: novoAnuncioEnc.tipo,
        encarregadoeducacaoutilizadoriduser: parseInt(user.id),
      });
      toast.success('Anúncio enviado para aprovação!');
      setShowNovoForm(false);
      setCriarNovoFigurino(false);
      setNovoFigurino({ nome: '', tipofigurinoid: '', tamanhoid: '', corid: '', generoid: '', estadousoid: '', fotografia: '' });
      setImagemModeNovo('url');
      setImagemPreviewNovo('');
      setNovoAnuncioEnc({ figurinoId: '', figurinoNome: '', descricao: '', valor: '', datainicio: '', datafim: '', tipo: 'ALUGUER' });
      const res = await api.getAnuncios();
      if (res.success && res.data) setAnuncios(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar anúncio');
    }
  };

  const handleSubmitAnuncioProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    const { figurinoId, figurinoNome, valor, datainicio, datafim, tipo } = novoAnuncioProf;
    if (!datainicio) {
      toast.error('A data de início é obrigatória');
      return;
    }

    if (criarNovoFigurino && !figurinoNome) {
      toast.error('Nome do figurino é obrigatório');
      return;
    }
    if (!criarNovoFigurino && !figurinoId) {
      toast.error('Selecione ou crie um figurino');
      return;
    }

    const agora = new Date();
    const dataHojeStr = agora.toISOString().split('T')[0];
    const dataInicioStr = datainicio.split('T')[0];
    if (dataInicioStr < dataHojeStr) {
      toast.error('A data de início não pode ser no passado');
      return;
    }
    if (datafim && datafim <= datainicio) {
      toast.error('A data de fim deve ser posterior à data de início');
      return;
    }

    try {
      let figurinoIdFinal = figurinoId ? parseInt(figurinoId) : null;

      if (criarNovoFigurino && figurinoNome) {
        const figRes = await api.createFigurinoStock({
          nome: figurinoNome,
          tipofigurinoid: parseInt(novoFigurino.tipofigurinoid),
          tamanhoid: parseInt(novoFigurino.tamanhoid),
          corid: parseInt(novoFigurino.corid),
          generoid: parseInt(novoFigurino.generoid),
          estadousoid: novoFigurino.estadousoid ? parseInt(novoFigurino.estadousoid) : undefined,
          fotografia: novoFigurino.fotografia || undefined,
          professorutilizadoriduser: parseInt(user.id),
        });
        if (figRes.success && figRes.data?.id) {
          figurinoIdFinal = figRes.data.id;
        }
      }

      if (!figurinoIdFinal) {
        toast.error('Erro ao criar/selecionar figurino');
        return;
      }

      await api.registarAnuncio({
        figurinoidfigurino: figurinoIdFinal,
        valor: valor ? parseFloat(valor) : undefined,
        dataanuncio: new Date().toISOString().split('T')[0],
        datainicio,
        datafim: datafim || undefined,
        quantidade: 1,
        tipotransacao: tipo,
        professorutilizadoriduser: parseInt(user.id),
      });
      toast.success('Anúncio enviado para aprovação!');
      setShowNovoForm(false);
      setCriarNovoFigurino(false);
      setNovoFigurino({ nome: '', tipofigurinoid: '', tamanhoid: '', corid: '', generoid: '', estadousoid: '', fotografia: '' });
      setImagemModeNovo('url');
      setImagemPreviewNovo('');
      setNovoAnuncioProf({ figurinoId: '', figurinoNome: '', valor: '', datainicio: '', datafim: '', tipo: 'ALUGUER' });
      const res = await api.getAnuncios();
      if (res.success && res.data) setAnuncios(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar anúncio');
    }
  };

  const handleAprovar = async (anunciosId: string) => {
    try {
      await api.avaliarAnuncio(parseInt(anunciosId), 'aprovar');
      setAnuncios(anuncios.map(a => a.id === anunciosId ? { ...a, status: 'APROVADO' as AnuncioStatus } : a));
      toast.success('Anúncio aprovado com sucesso!');
    } catch (error) {
      toast.error('Erro ao aprovar anúncio');
    }
  };

  const handleRejeitar = async (anunciosId: string, motivo: string) => {
    try {
      const res = await api.avaliarAnuncio(parseInt(anunciosId), 'rejeitar', motivo || undefined);
      if (res.success) {
        setAnuncios(anuncios.map(a => a.id === anunciosId
          ? { ...a, status: 'REJEITADO' as AnuncioStatus, motivoRejeicao: motivo || null }
          : a));
        toast.info('Anúncio rejeitado.');
      }
    } catch (error) {
      toast.error('Erro ao rejeitar anúncio');
    } finally {
      setRejeitarModal(null);
      setMotivoRejeicaoInput('');
    }
  };

  const handleRessubmeter = async (id: string) => {
    try {
      const res = await api.ressubmeterAnuncio(parseInt(id));
      if (res.success && res.data) {
        setAnuncios(anuncios.map(a => a.id === id ? { ...res.data, id: String(res.data.id) } : a));
        toast.success('Anúncio ressubmetido — aguarda aprovação da direção.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao ressubmeter anúncio');
    }
  };

  const handleEditAnuncio = (anuncio: any) => {
    setEditAnuncioId(anuncio.id);
    setEditAnuncioForm({
      valor: anuncio.preco != null ? String(anuncio.preco) : '',
      datainicio: '',
      datafim: '',
      quantidade: String(anuncio.quantidade ?? ''),
    });
  };

  const handleSaveEditAnuncio = async (id: string) => {
    try {
      await api.updateAnuncio(parseInt(id), {
        valor: editAnuncioForm.valor ? parseFloat(editAnuncioForm.valor) : undefined,
        datainicio: editAnuncioForm.datainicio || undefined,
        datafim: editAnuncioForm.datafim || undefined,
        quantidade: editAnuncioForm.quantidade ? parseInt(editAnuncioForm.quantidade) : undefined,
      });
      setEditAnuncioId(null);
      const res = await api.getAnuncios();
      if (res.success && res.data) setAnuncios(res.data);
      toast.success('Anúncio atualizado');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar anúncio');
    }
  };

  const handleDeleteAnuncio = async (id: string) => {
    if (!confirm('Eliminar este anúncio?')) return;
    try {
      await api.deleteAnuncio(parseInt(id));
      setAnuncios(prev => prev.filter(a => a.id !== id));
      toast.success('Anúncio eliminado');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao eliminar anúncio');
    }
  };

  const handleSolicitarAluguer = async (anunciosId: string) => {
    if (!reservaData.dataInicio || !reservaData.dataFim) {
      toast.error('Preencha as datas de início e fim do aluguer');
      return;
    }
    
    const agora = new Date();
    const dataHojeStr = agora.toISOString().split('T')[0];
    const dataInicioStr = reservaData.dataInicio.split('T')[0];
    if (dataInicioStr < dataHojeStr) {
      toast.error('A data de início não pode ser no passado');
      return;
    }
    if (reservaData.dataFim <= reservaData.dataInicio) {
      toast.error('A data de fim deve ser posterior à data de início');
      return;
    }

    try {
      const reservaPayload: Parameters<typeof api.registarTransacao>[0] = {
        quantidade: parseInt(reservaData.quantidade) || 1,
        datatransacao: reservaData.dataInicio,
        anuncioidanuncio: parseInt(anunciosId),
      };
      if (activeRole === 'ENCARREGADO') {
        reservaPayload.encarregadoeducacaoutilizadoriduser = parseInt(user.id);
      } else if (activeRole === 'PROFESSOR') {
        reservaPayload.professorutilizadoriduser = parseInt(user.id);
      }
      await api.registarTransacao(reservaPayload);
      await fetchReservas();
      const res = await api.getAnuncios();
      if (res.success && res.data) setAnuncios(res.data);
      setShowReservaForm(null);
      setReservaData({ dataInicio: '', dataFim: '', quantidade: '1' });
      toast.success('Pedido de aluguer enviado! Aguarde aprovação da direção.');
    } catch (error) {
      toast.error('Erro ao criar reserva');
    }
  };

  const handleAprovarReserva = async (reservaId: string) => {
    try {
      const estadosResult = await api.getAluguerEstados();
      const estadoAprovado = estadosResult.data?.find((e: any) => e.tipoestado?.toLowerCase().startsWith('aprovado'));
      if (estadoAprovado) {
        await api.avaliarPedidoReserva(parseInt(reservaId), 'aprovar', estadoAprovado.idestado);
      }
      
      setReservas(reservas.map(r => r.id === reservaId ? { ...r, status: 'APROVADA' } : r));
      toast.success('Reserva aprovada!');
    } catch (error) {
      toast.error('Erro ao approve reserva');
    }
  };

  const handleRejeitarReserva = (reservaId: string) => {
    setRejeitarReservaMotivoInput('');
    setRejeitarReservaModal({ id: reservaId });
  };

  const handleConfirmarRejeitarReserva = async () => {
    if (!rejeitarReservaModal) return;
    const { id } = rejeitarReservaModal;
    try {
      const estadosResult = await api.getAluguerEstados();
      const estadoRejeitado = estadosResult.data?.find((e: any) => e.tipoestado?.toLowerCase().startsWith('rejeitado'));
      if (estadoRejeitado) {
        await api.avaliarPedidoReserva(parseInt(id), 'rejeitar', estadoRejeitado.idestado, rejeitarReservaMotivoInput || undefined);
      }
      setReservas(reservas.map(r => r.id === id ? { ...r, status: 'REJEITADA', motivoRejeicao: rejeitarReservaMotivoInput || null } : r));
      toast.info('Reserva rejeitada.');
    } catch (error) {
      toast.error('Erro ao rejeitar reserva');
    } finally {
      setRejeitarReservaModal(null);
      setRejeitarReservaMotivoInput('');
    }
  };

  const anunciosFiltrados = getAnunciosFiltrados();
  const reservasPendentes = reservas.filter(r => r.status === 'PENDENTE');

  return (
    <div className="min-h-screen bg-[#f4f9f8]">
      <Toaster position="top-right" />
      <div className="bg-[#0a1a17] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-6">
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
                {activeRole === 'ENCARREGADO' && 'Compre e venda artigos de dança'}
                {activeRole === 'DIRECAO' && 'Modere os anúncios e crie alugueres da escola'}
                {activeRole === 'PROFESSOR' && 'Crie anúncios e consulte os artigos disponíveis'}
                {activeRole === 'ALUNO' && 'Consulta os artigos disponíveis'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeRole === 'DIRECAO' && reservasPendentes.length > 0 && (
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
              {(activeRole === 'ENCARREGADO' || activeRole === 'PROFESSOR') && reservas.length > 0 && (
                <button
                  onClick={() => setViewMode(viewMode === 'anuncios' ? 'reservas' : 'anuncios')}
                  className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-lg hover:bg-orange-700 transition-colors relative"
                  style={{ fontWeight: 600 }}
                >
                  <Calendar className="w-5 h-5" />
                  {viewMode === 'anuncios' ? 'Minhas Reservas' : 'Ver Anúncios'}
                  {reservasPendentes.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      {reservasPendentes.length}
                    </span>
                  )}
                </button>
              )}

              {(activeRole === 'ENCARREGADO' || activeRole === 'PROFESSOR' || activeRole === 'DIRECAO') && (
                <button
                  onClick={() => setShowNovoForm(!showNovoForm)}
                  className="flex items-center gap-2 bg-[#c9a84c] text-[#0a1a17] px-5 py-2.5 rounded-lg hover:bg-[#e8c97a] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  <Plus className="w-5 h-5" />
                  {activeRole === 'DIRECAO' ? 'Novo Aluguer' : 'Novo Anúncio'}
                </button>
              )}
            </div>
          </div>

          {viewMode === 'anuncios' && (
            <div className="space-y-3">
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

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-white/50" />
                  <span className="text-sm text-white/50">Tipo:</span>
                </div>
                {(['TODOS', 'VENDA', 'ALUGUER'] as const).map((tipo: any) => (
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

              {activeRole !== 'DIRECAO' && activeRole !== 'ALUNO' && (
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

      {showNovoForm && activeRole === 'ENCARREGADO' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#0d6b5e]/10">
            <h2 className="text-xl mb-5 text-[#0a1a17]" style={{ fontWeight: 600 }}>Criar Novo Anúncio</h2>
            <form className="space-y-4" onSubmit={handleSubmitAnuncioEncarregado}>
              <div>
                <label className="block text-sm mb-1.5 text-[#4d7068]">Tipo de Anúncio *</label>
                <select
                  value={novoAnuncioEnc.tipo}
                  onChange={e => setNovoAnuncioEnc(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                >
                  <option value="ALUGUER">Aluguer</option>
                  <option value="VENDA">Venda</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-2 text-[#4d7068]">Figurino *</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setCriarNovoFigurino(false)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!criarNovoFigurino ? 'bg-[#0d6b5e] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Selecionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCriarNovoFigurino(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${criarNovoFigurino ? 'bg-[#0d6b5e] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Criar Novo
                  </button>
                </div>
                {!criarNovoFigurino ? (
                  <select
                    value={novoAnuncioEnc.figurinoId}
                    onChange={e => setNovoAnuncioEnc(f => ({ ...f, figurinoId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  >
                    <option value="">Selecionar figurino...</option>
                    {figurinos.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.nome} — {f.tamanho} {f.cor}</option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome do figurino *"
                      value={novoAnuncioEnc.figurinoNome}
                      onChange={e => setNovoAnuncioEnc(f => ({ ...f, figurinoNome: e.target.value }))}
                      className="col-span-2 px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    />
                    <select
                      value={novoFigurino.tipofigurinoid}
                      onChange={e => setNovoFigurino(f => ({ ...f, tipofigurinoid: e.target.value }))}
                      className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    >
                      <option value="">Tipo *</option>
                      {lookup.tipos.map((t: any) => <option key={t.idtipofigurino} value={t.idtipofigurino}>{t.tipofigurino}</option>)}
                    </select>
                    <select
                      value={novoFigurino.tamanhoid}
                      onChange={e => setNovoFigurino(f => ({ ...f, tamanhoid: e.target.value }))}
                      className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    >
                      <option value="">Tamanho</option>
                      {lookup.tamanhos.map((t: any) => <option key={t.idtamanho} value={t.idtamanho}>{t.nometamanho}</option>)}
                    </select>
                    <select
                      value={novoFigurino.corid}
                      onChange={e => setNovoFigurino(f => ({ ...f, corid: e.target.value }))}
                      className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    >
                      <option value="">Cor</option>
                      {lookup.cores.map((c: any) => <option key={c.idcor} value={c.idcor}>{c.nomecor}</option>)}
                    </select>
                    <select
                      value={novoFigurino.generoid}
                      onChange={e => setNovoFigurino(f => ({ ...f, generoid: e.target.value }))}
                      className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    >
                      <option value="">Género</option>
                      {lookup.generos.map((g: any) => <option key={g.idgenero} value={g.idgenero}>{g.nomegenero}</option>)}
                    </select>
                    <select
                      value={novoFigurino.estadousoid}
                      onChange={e => setNovoFigurino(f => ({ ...f, estadousoid: e.target.value }))}
                      className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    >
                      <option value="">Estado de Uso</option>
                      {lookup.estadosUso.map((e: any) => <option key={e.idestado} value={e.idestado}>{e.estadouso}</option>)}
                    </select>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm text-[#4d7068]">Fotografia</label>
                        <div className="flex rounded-lg overflow-hidden border border-[#0d6b5e]/20 text-xs">
                          <button type="button"
                            onClick={() => { setImagemModeNovo('url'); setImagemPreviewNovo(''); setNovoFigurino(f => ({ ...f, fotografia: '' })); }}
                            className={`px-3 py-1 transition-colors ${imagemModeNovo === 'url' ? 'bg-[#0d6b5e] text-white' : 'bg-[#f4f9f8] text-[#4d7068] hover:bg-[#deecea]'}`}>
                            URL
                          </button>
                          <button type="button"
                            onClick={() => { setImagemModeNovo('ficheiro'); setNovoFigurino(f => ({ ...f, fotografia: '' })); setImagemPreviewNovo(''); }}
                            className={`px-3 py-1 transition-colors ${imagemModeNovo === 'ficheiro' ? 'bg-[#0d6b5e] text-white' : 'bg-[#f4f9f8] text-[#4d7068] hover:bg-[#deecea]'}`}>
                            Dispositivo
                          </button>
                        </div>
                      </div>
                      {imagemModeNovo === 'url' ? (
                        <input value={novoFigurino.fotografia} onChange={e => setNovoFigurino(f => ({ ...f, fotografia: e.target.value }))}
                          className="w-full px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                          placeholder="https://…" />
                      ) : (
                        <div className="space-y-1.5">
                          <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-[#0d6b5e]/30 rounded-lg bg-[#f4f9f8] cursor-pointer hover:bg-[#deecea]/40 transition-colors">
                            <span className="text-xs text-[#4d7068]">{imagemPreviewNovo ? 'Clique para trocar imagem' : 'Clique para escolher ficheiro'}</span>
                            <span className="text-xs text-[#4d7068]/60 mt-0.5">PNG, JPG, WEBP — máx. 5 MB</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImagemFicheiroNovo} />
                          </label>
                          {imagemPreviewNovo && (
                            <div className="relative w-full h-28 rounded-lg overflow-hidden border border-[#0d6b5e]/10">
                              <img src={imagemPreviewNovo} alt="Pré-visualização" className="w-full h-full object-cover" />
                              <button type="button"
                                onClick={() => { setImagemPreviewNovo(''); setNovoFigurino(f => ({ ...f, fotografia: '' })); }}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/70">
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1.5 text-[#4d7068]">Valor (€)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={novoAnuncioEnc.valor}
                    onChange={e => setNovoAnuncioEnc(f => ({ ...f, valor: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    placeholder="Ex: 25"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5 text-[#4d7068]">Data Início *</label>
                  <input
                    type="date" required
                    value={novoAnuncioEnc.datainicio}
                    onChange={e => setNovoAnuncioEnc(f => ({ ...f, datainicio: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5 text-[#4d7068]">Data Fim</label>
                  <input
                    type="date" required
                    value={novoAnuncioEnc.datafim}
                    onChange={e => setNovoAnuncioEnc(f => ({ ...f, datafim: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" className="bg-[#0d6b5e] text-white px-6 py-2.5 rounded-lg hover:bg-[#065147] transition-colors text-sm" style={{ fontWeight: 600 }}>
                  Publicar Anúncio
                </button>
                <button type="button" onClick={() => setShowNovoForm(false)} className="px-6 py-2.5 rounded-lg border border-[#0d6b5e]/30 text-[#0d6b5e] hover:bg-[#e2f0ed] transition-colors text-sm">
                  Cancelar
                </button>
              </div>
            </form>

            <div className="mt-4 p-3.5 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800"><strong>Nota:</strong> O seu anúncio ficará pendente de aprovação pela direção.</p>
            </div>
          </div>
        </div>
      )}

      {showNovoForm && activeRole === 'PROFESSOR' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#0d6b5e]/10">
            <h2 className="text-xl mb-5 text-[#0a1a17]" style={{ fontWeight: 600 }}>Criar Novo Anúncio</h2>
            <form className="space-y-4" onSubmit={handleSubmitAnuncioProfessor}>
              <div>
                <label className="block text-sm mb-1.5 text-[#4d7068]">Tipo de Anúncio *</label>
                <select
                  value={novoAnuncioProf.tipo}
                  onChange={e => setNovoAnuncioProf(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                >
                  <option value="ALUGUER">Aluguer</option>
                  <option value="VENDA">Venda</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-2 text-[#4d7068]">Figurino *</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setCriarNovoFigurino(false)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!criarNovoFigurino ? 'bg-[#0d6b5e] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Selecionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCriarNovoFigurino(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${criarNovoFigurino ? 'bg-[#0d6b5e] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Criar Novo
                  </button>
                </div>
                {!criarNovoFigurino ? (
                  <select
                    value={novoAnuncioProf.figurinoId}
                    onChange={e => setNovoAnuncioProf(f => ({ ...f, figurinoId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  >
                    <option value="">Selecionar figurino...</option>
                    {figurinos.map((f: any) => (
                      <option key={f.id} value={f.id}>{f.nome} — {f.tamanho} {f.cor}</option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome do figurino *"
                      value={novoAnuncioProf.figurinoNome}
                      onChange={e => setNovoAnuncioProf(f => ({ ...f, figurinoNome: e.target.value }))}
                      className="col-span-2 px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    />
                    <select
                      value={novoFigurino.tipofigurinoid}
                      onChange={e => setNovoFigurino(f => ({ ...f, tipofigurinoid: e.target.value }))}
                      className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    >
                      <option value="">Tipo *</option>
                      {lookup.tipos.map((t: any) => <option key={t.idtipofigurino} value={t.idtipofigurino}>{t.tipofigurino}</option>)}
                    </select>
                    <select
                      value={novoFigurino.tamanhoid}
                      onChange={e => setNovoFigurino(f => ({ ...f, tamanhoid: e.target.value }))}
                      className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    >
                      <option value="">Tamanho</option>
                      {lookup.tamanhos.map((t: any) => <option key={t.idtamanho} value={t.idtamanho}>{t.nometamanho}</option>)}
                    </select>
                    <select
                      value={novoFigurino.corid}
                      onChange={e => setNovoFigurino(f => ({ ...f, corid: e.target.value }))}
                      className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    >
                      <option value="">Cor</option>
                      {lookup.cores.map((c: any) => <option key={c.idcor} value={c.idcor}>{c.nomecor}</option>)}
                    </select>
                    <select
                      value={novoFigurino.generoid}
                      onChange={e => setNovoFigurino(f => ({ ...f, generoid: e.target.value }))}
                      className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    >
                      <option value="">Género</option>
                      {lookup.generos.map((g: any) => <option key={g.idgenero} value={g.idgenero}>{g.nomegenero}</option>)}
                    </select>
                    <select
                      value={novoFigurino.estadousoid}
                      onChange={e => setNovoFigurino(f => ({ ...f, estadousoid: e.target.value }))}
                      className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    >
                      <option value="">Estado de Uso</option>
                      {lookup.estadosUso.map((e: any) => <option key={e.idestado} value={e.idestado}>{e.estadouso}</option>)}
                    </select>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm text-[#4d7068]">Fotografia</label>
                        <div className="flex rounded-lg overflow-hidden border border-[#0d6b5e]/20 text-xs">
                          <button type="button"
                            onClick={() => { setImagemModeNovo('url'); setImagemPreviewNovo(''); setNovoFigurino(f => ({ ...f, fotografia: '' })); }}
                            className={`px-3 py-1 transition-colors ${imagemModeNovo === 'url' ? 'bg-[#0d6b5e] text-white' : 'bg-[#f4f9f8] text-[#4d7068] hover:bg-[#deecea]'}`}>
                            URL
                          </button>
                          <button type="button"
                            onClick={() => { setImagemModeNovo('ficheiro'); setNovoFigurino(f => ({ ...f, fotografia: '' })); setImagemPreviewNovo(''); }}
                            className={`px-3 py-1 transition-colors ${imagemModeNovo === 'ficheiro' ? 'bg-[#0d6b5e] text-white' : 'bg-[#f4f9f8] text-[#4d7068] hover:bg-[#deecea]'}`}>
                            Dispositivo
                          </button>
                        </div>
                      </div>
                      {imagemModeNovo === 'url' ? (
                        <input value={novoFigurino.fotografia} onChange={e => setNovoFigurino(f => ({ ...f, fotografia: e.target.value }))}
                          className="w-full px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                          placeholder="https://…" />
                      ) : (
                        <div className="space-y-1.5">
                          <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-[#0d6b5e]/30 rounded-lg bg-[#f4f9f8] cursor-pointer hover:bg-[#deecea]/40 transition-colors">
                            <span className="text-xs text-[#4d7068]">{imagemPreviewNovo ? 'Clique para trocar imagem' : 'Clique para escolher ficheiro'}</span>
                            <span className="text-xs text-[#4d7068]/60 mt-0.5">PNG, JPG, WEBP — máx. 5 MB</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImagemFicheiroNovo} />
                          </label>
                          {imagemPreviewNovo && (
                            <div className="relative w-full h-28 rounded-lg overflow-hidden border border-[#0d6b5e]/10">
                              <img src={imagemPreviewNovo} alt="Pré-visualização" className="w-full h-full object-cover" />
                              <button type="button"
                                onClick={() => { setImagemPreviewNovo(''); setNovoFigurino(f => ({ ...f, fotografia: '' })); }}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/70">
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1.5 text-[#4d7068]">Valor (€)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={novoAnuncioProf.valor}
                    onChange={e => setNovoAnuncioProf(f => ({ ...f, valor: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                    placeholder="Ex: 25"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5 text-[#4d7068]">Data Início *</label>
                  <input
                    type="date" required
                    value={novoAnuncioProf.datainicio}
                    onChange={e => setNovoAnuncioProf(f => ({ ...f, datainicio: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1.5 text-[#4d7068]">Data Fim *</label>
                  <input
                    type="date" required
                    value={novoAnuncioProf.datafim}
                    onChange={e => setNovoAnuncioProf(f => ({ ...f, datafim: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" className="bg-[#0d6b5e] text-white px-6 py-2.5 rounded-lg hover:bg-[#065147] transition-colors text-sm" style={{ fontWeight: 600 }}>
                  Publicar Anúncio
                </button>
                <button type="button" onClick={() => setShowNovoForm(false)} className="px-6 py-2.5 rounded-lg border border-[#0d6b5e]/30 text-[#0d6b5e] hover:bg-[#e2f0ed] transition-colors text-sm">
                  Cancelar
                </button>
              </div>
            </form>

            <div className="mt-4 p-3.5 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800"><strong>Nota:</strong> O seu anúncio ficará pendente de aprovação pela direção.</p>
            </div>
          </div>
        </div>
      )}

      {showNovoForm && activeRole === 'DIRECAO' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#0d6b5e]/10">
            <h2 className="text-xl mb-4 text-[#0a1a17]" style={{ fontWeight: 600 }}>Criar Novo Anúncio de Aluguer</h2>
            <form className="space-y-4" onSubmit={handleSubmitNovoAluguer}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>
                    Figurino do Stock *
                    {figurinos.length === 0 && <span className="ml-2 text-amber-600 text-xs">(sem figurinos da escola disponíveis)</span>}
                  </label>
                  <select
                    value={novoAluguerForm.figurinoId}
                    onChange={e => setNovoAluguerForm(f => ({ ...f, figurinoId: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  >
                    <option value="">Selecione um figurino do stock…</option>
                    {figurinos.map((fig: any) => (
                      <option key={fig.id} value={fig.id}>
                        {fig.nome} — {fig.tamanho} ({fig.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>Valor do Aluguer (€)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={novoAluguerForm.valor}
                    onChange={e => setNovoAluguerForm(f => ({ ...f, valor: e.target.value }))}
                    placeholder="Ex: 25 (opcional)"
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>Quantidade</label>
                  <input
                    type="number" min="1"
                    value={novoAluguerForm.quantidade}
                    onChange={e => setNovoAluguerForm(f => ({ ...f, quantidade: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="submit" className="bg-[#0d6b5e] text-white px-6 py-2.5 rounded-lg hover:bg-[#065147] transition-colors text-sm" style={{ fontWeight: 600 }}>
                  Publicar Aluguer
                </button>
                <button type="button" onClick={() => setShowNovoForm(false)} className="bg-[#deecea] text-[#0d6b5e] px-6 py-2.5 rounded-lg hover:bg-[#c8e0dc] transition-colors text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'reservas' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-[#0d6b5e]/10">
            <h2 className="text-2xl mb-6 text-[#0a1a17]">
              {activeRole === 'DIRECAO' ? 'Aprovação de Reservas de Figurinos' : 'Minhas Reservas de Figurinos'}
            </h2>
            {reservas.length === 0 ? (
              <p className="text-center text-[#4d7068] py-8">Nenhuma reserva encontrada</p>
            ) : (
              <div className="space-y-4">
                {reservas.map(reserva => {
                  const anuncioRelacionado = anuncios.find(a => a.id === reserva.anunciosId);
                  const statusBadge = (status: string) => {
                    const map: Record<string, string> = {
                      PENDENTE: 'bg-amber-100 text-amber-800',
                      APROVADA: 'bg-teal-100 text-teal-800',
                      REJEITADA: 'bg-red-100 text-red-800',
                    };
                    const labels: Record<string, string> = { PENDENTE: 'Pendente', APROVADA: 'Aprovada', REJEITADA: 'Rejeitada' };
                    return (
                      <span className={`px-3 py-1 rounded-full text-sm ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {labels[status] ?? status}
                      </span>
                    );
                  };
                  return (
                    <div key={reserva.id} className="p-4 border border-[#0d6b5e]/10 rounded-xl hover:border-[#0d6b5e]/30 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg text-[#0a1a17] mb-1">{reserva.anunciosTitulo}</h3>
                          {activeRole === 'DIRECAO' && (
                            <p className="text-sm text-[#4d7068]">Solicitado por: <strong>{reserva.usuarioNome}</strong></p>
                          )}
                          <p className="text-sm text-[#4d7068]">Data: {new Date(reserva.dataInicio).toLocaleDateString('pt-PT')}</p>
                          {anuncioRelacionado?.espetaculoNome && (<p className="text-sm text-[#0d6b5e] mt-1">Espetáculo: {anuncioRelacionado.espetaculoNome}</p>)}
                        </div>
                        <div className="flex items-center gap-2">
                          {activeRole === 'DIRECAO' && reserva.status === 'PENDENTE' ? (
                            <>
                              <button onClick={() => handleAprovarReserva(reserva.id)} className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm">
                                <CheckCircle className="w-4 h-4" />Aprovar
                              </button>
                              <button onClick={() => handleRejeitarReserva(reserva.id)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                                <XCircle className="w-4 h-4" />Rejeitar
                              </button>
                            </>
                          ) : (
                            statusBadge(reserva.status)
                          )}
                        </div>
                      </div>
                      {reserva.motivoRejeicao && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-700"><strong>Motivo da rejeição:</strong> {reserva.motivoRejeicao}</p>
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
                    <img src={anuncio.imagem} alt={anuncio.titulo} className="w-full h-52 object-cover" />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs backdrop-blur-sm ${
                        anuncio.tipoTransacao === 'VENDA' ? 'bg-[#0d6b5e]/90 text-white' : 'bg-[#c9a84c]/90 text-[#0a1a17]'
                      }`} style={{ fontWeight: 600 }}>
                        {anuncio.tipoTransacao === 'VENDA' ? (<><ShoppingBag className="w-3 h-3" />Venda</>) : (<><Tag className="w-3 h-3" />Aluguer</>)}
                      </span>
                    </div>
                    {(activeRole === 'DIRECAO' || anuncio.vendedorId === user.id) && anuncio.status === 'PENDENTE' && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">Pendente</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg mb-2 text-[#0a1a17]">{anuncio.titulo}</h3>
                    <p className="text-[#4d7068] text-sm mb-4 line-clamp-2">{anuncio.descricao}</p>

                    {anuncio.espetaculoNome && (
                      <div className="mb-3 p-2 bg-[#e2f0ed] rounded-lg">
                        <p className="text-xs text-[#0d6b5e]"><strong>Espetáculo:</strong> {anuncio.espetaculoNome}</p>
                      </div>
                    )}

                    <div className="border-t border-[#0d6b5e]/10 pt-4 space-y-2">
                      <p className="text-sm text-[#4d7068]">
                        <strong className="text-[#0a1a17]">{anuncio.tipoTransacao === 'VENDA' ? 'Vendedor' : 'Escola'}:</strong> {anuncio.vendedorNome}
                      </p>
                      {anuncio.status === 'APROVADO' && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[#0d6b5e]" />
                          <a href={`mailto:${anuncio.vendedorEmail}`} className="text-sm text-[#0d6b5e] hover:text-[#065147] hover:underline transition-colors">{anuncio.vendedorEmail}</a>
                        </div>
                      )}
                    </div>

                    {anuncio.tipoTransacao === 'ALUGUER' && anuncio.status === 'APROVADO' && (activeRole === 'ENCARREGADO' || activeRole === 'PROFESSOR') && (
                      <div className="mt-4">
                        {(anuncio.quantidade || 0) <= 0 ? (
                          <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm cursor-not-allowed" style={{ fontWeight: 600 }}>
                            Esgotado
                          </div>
                        ) : showReservaForm === anuncio.id ? (
                          <div className="space-y-3 p-3 bg-[#f4f9f8] rounded-lg">
                            <div>
                              <label className="block text-xs text-[#4d7068] mb-1">Quantidade (disponível: {anuncio.quantidade})</label>
                              <input type="number" min="1" max={anuncio.quantidade} value={reservaData.quantidade} onChange={e => setReservaData({...reservaData, quantidade: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg" />
                            </div>
                            <div>
                              <label className="block text-xs text-[#4d7068] mb-1">Data Início</label>
                              <input type="date" value={reservaData.dataInicio} onChange={(e) => setReservaData({...reservaData, dataInicio: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg" min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                              <label className="block text-xs text-[#4d7068] mb-1">Data Fim</label>
                              <input type="date" value={reservaData.dataFim} onChange={(e) => setReservaData({...reservaData, dataFim: e.target.value})} className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg" min={reservaData.dataInicio || new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleSolicitarAluguer(anuncio.id)} className="flex-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm">Confirmar</button>
                              <button onClick={() => { setShowReservaForm(null); setReservaData({ dataInicio: '', dataFim: '', quantidade: '1' }); }} className="flex-1 bg-[#deecea] text-[#0d6b5e] px-3 py-2 rounded-lg hover:bg-[#c8e0dc] transition-colors text-sm">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setShowReservaForm(anuncio.id)} className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] text-[#0a1a17] px-4 py-2 rounded-lg hover:bg-[#e8c97a] transition-colors text-sm" style={{ fontWeight: 600 }}>
                            <Calendar className="w-4 h-4" />Solicitar Aluguer
                          </button>
                        )}
                      </div>
                    )}

                    {activeRole === 'DIRECAO' && anuncio.status === 'PENDENTE' && (
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => handleAprovar(anuncio.id)} className="flex-1 flex items-center justify-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm">
                          <CheckCircle className="w-4 h-4" />Aprovar
                        </button>
                        <button onClick={() => { setRejeitarModal({ id: anuncio.id }); setMotivoRejeicaoInput(''); }} className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                          <XCircle className="w-4 h-4" />Rejeitar
                        </button>
                      </div>
                    )}

                    {(activeRole === 'ENCARREGADO' || activeRole === 'PROFESSOR') && anuncio.vendedorId === user.id && anuncio.status === 'PENDENTE' && (
                      <>
                        <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                          <Clock className="w-4 h-4" /><span>Aguardando aprovação da direção</span>
                        </div>
                        {editAnuncioId === anuncio.id ? (
                          <div className="mt-3 space-y-2 p-3 bg-[#f4f9f8] rounded-lg border border-[#0d6b5e]/20">
                            <p className="text-xs font-semibold text-[#0d6b5e]">Editar anúncio</p>
                            <input type="number" min="0" step="0.01" placeholder="Valor (€)" value={editAnuncioForm.valor} onChange={e => setEditAnuncioForm(f => ({...f, valor: e.target.value}))} className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg bg-white" />
                            <input type="number" min="1" placeholder="Quantidade" value={editAnuncioForm.quantidade} onChange={e => setEditAnuncioForm(f => ({...f, quantidade: e.target.value}))} className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg bg-white" />
                            <input type="date" placeholder="Data início" value={editAnuncioForm.datainicio} onChange={e => setEditAnuncioForm(f => ({...f, datainicio: e.target.value}))} className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg bg-white" />
                            <input type="date" placeholder="Data fim" value={editAnuncioForm.datafim} onChange={e => setEditAnuncioForm(f => ({...f, datafim: e.target.value}))} className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg bg-white" />
                            <div className="flex gap-2">
                              <button onClick={() => handleSaveEditAnuncio(anuncio.id)} className="flex-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#065147]">Guardar</button>
                              <button onClick={() => setEditAnuncioId(null)} className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 flex gap-2">
                            <button onClick={() => handleEditAnuncio(anuncio)} className="flex-1 bg-[#e2f0ed] text-[#0d6b5e] px-3 py-2 rounded-lg text-sm hover:bg-[#c8e0dc] transition-colors">Editar</button>
                            <button onClick={() => handleDeleteAnuncio(anuncio.id)} className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors">Eliminar</button>
                          </div>
                        )}
                      </>
                    )}

                    {(activeRole === 'ENCARREGADO' || activeRole === 'PROFESSOR') && anuncio.vendedorId === user.id && anuncio.status === 'REJEITADO' && (
                      <>
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 text-sm text-red-700 font-medium mb-1">
                            <XCircle className="w-4 h-4" /><span>Anúncio rejeitado</span>
                          </div>
                          {anuncio.motivoRejeicao && (
                            <p className="text-xs text-red-600 mt-1">Motivo: {anuncio.motivoRejeicao}</p>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => handleRessubmeter(anuncio.id)} className="flex-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#065147] transition-colors">Editar e Ressubmeter</button>
                          <button onClick={() => handleDeleteAnuncio(anuncio.id)} className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors">Desistir</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {rejeitarReservaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#0a1a17] mb-1">Rejeitar reserva</h3>
            <p className="text-sm text-[#4d7068] mb-4">Indique o motivo da rejeição (opcional). O utilizador será notificado.</p>
            <textarea
              className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg bg-white resize-none"
              rows={3}
              placeholder="Motivo da rejeição..."
              value={rejeitarReservaMotivoInput}
              onChange={e => setRejeitarReservaMotivoInput(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleConfirmarRejeitarReserva}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Confirmar Rejeição
              </button>
              <button
                onClick={() => { setRejeitarReservaModal(null); setRejeitarReservaMotivoInput(''); }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {rejeitarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#0a1a17] mb-1">Rejeitar anúncio</h3>
            <p className="text-sm text-[#4d7068] mb-4">Indique o motivo da rejeição (opcional). O utilizador será notificado.</p>
            <textarea
              className="w-full px-3 py-2 text-sm border border-[#0d6b5e]/20 rounded-lg bg-white resize-none"
              rows={3}
              placeholder="Motivo da rejeição..."
              value={motivoRejeicaoInput}
              onChange={e => setMotivoRejeicaoInput(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleRejeitar(rejeitarModal.id, motivoRejeicaoInput)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Confirmar Rejeição
              </button>
              <button
                onClick={() => { setRejeitarModal(null); setMotivoRejeicaoInput(''); }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}