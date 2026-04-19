import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router';
import api from '../services/api';
import {
  Calendar, Clock, MapPin, User, CheckCircle, XCircle,
  Plus, Filter, ArrowLeft, Users, UserPlus, ChevronDown, Music2, Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { NovaAulaForm } from '../components/NovaAulaForm';
import { AlunoAgendaView } from '../components/AlunoAgendaView';
import { DisponibilidadeProfessoresPanel } from '../components/DisponibilidadeProfessoresPanel';
import { DirecaoModals } from '../components/DirecaoModals';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

// Cores por modalidade
const MODALIDADE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Ballet':         { bg: 'bg-pink-100',    text: 'text-pink-800',    dot: 'bg-pink-400' },
  'Ballet Clássico':{ bg: 'bg-pink-100',    text: 'text-pink-800',    dot: 'bg-pink-400' },
  'Hip-Hop':        { bg: 'bg-purple-100',  text: 'text-purple-800',  dot: 'bg-purple-500' },
  'Contemporâneo':  { bg: 'bg-teal-100',    text: 'text-teal-800',    dot: 'bg-teal-500' },
  'Dança Contemporânea': { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' },
  'Jazz':           { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-400' },
  'Dança Urbana':   { bg: 'bg-indigo-100',  text: 'text-indigo-800',  dot: 'bg-indigo-500' },
  'Teatro Dança':   { bg: 'bg-orange-100',  text: 'text-orange-800',  dot: 'bg-orange-500' },
};

const getModalidadeStyle = (modalidade: string) =>
  MODALIDADE_COLORS[modalidade] ?? { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };

export function Aulas() {
  const { user } = useAuth();
  const [aulas, setAulas] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('ATIVAS');
  const [filtroProfessor, setFiltroProfessor] = useState<string>('TODOS');
  const [filtroEstudio, setFiltroEstudio] = useState<string>('TODOS');
  const [filtroModalidade, setFiltroModalidade] = useState<string>('TODAS');
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'marcar' | 'agenda'>('marcar');
  const [agendaSubTab, setAgendaSubTab] = useState<'minhas' | 'abertas'>('minhas');
  const [prefillForm, setPrefillForm] = useState<{
    professorId?: string; estudioId?: string; data?: string;
    horaInicio?: string; duracao?: string;
  } | undefined>(undefined);
  const [joinAulaId, setJoinAulaId] = useState<string | null>(null);
  const [joinAlunoSelecionado, setJoinAlunoSelecionado] = useState<string>('');
  const [direcaoCancelarModal, setDirecaoCancelarModal] = useState<string | null>(null);

  //add ultimoaulaid para facilitar ordenação e evitar problemas de aulas com data/hora iguais em ultimo
  const mapAulaFromApi = (aula: any) => {
  const pedido = aula.pedidodeaula || {};
  const disponibilidade = pedido.disponibilidade || {};
  const professor = disponibilidade.professor?.utilizador || {};
  const encarregado = pedido.encarregadoeducacao?.utilizador || {};
  const sala = aula.sala || pedido.sala || {};
  const estado = aula.estadoaula?.nomeestadoaula || 'PENDENTE';
  const alunos = aula.alunoaula || [];

  const data = pedido.data ? new Date(pedido.data) : null;
  const horaInicioDate = pedido.horainicio ? new Date(pedido.horainicio) : null;
  const duracaoDate = pedido.duracaoaula ? new Date(pedido.duracaoaula) : null;

  const horaInicio = horaInicioDate
    ? horaInicioDate.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    : '';

  const duracaoMin = duracaoDate
    ? duracaoDate.getUTCHours() * 60 + duracaoDate.getUTCMinutes()
    : 0;

  const horaFim =
    horaInicioDate && duracaoMin
      ? new Date(horaInicioDate.getTime() + duracaoMin * 60000).toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

  return {
    id: String(aula.idaula),
    data: data ? data.toISOString() : '',
    horaInicio,
    horaFim,
    duracao: duracaoMin,
    status: estado,
    professorId: professor.iduser ? String(professor.iduser) : '',
    professorNome: professor.nome || 'Professor',
    estudioId: sala.idsala ? String(sala.idsala) : '',
    estudioNome: sala.nomesala ? `Sala ${sala.nomesala}` : 'Sem sala',
    alunoId: alunos[0]?.aluno?.utilizador?.iduser
      ? String(alunos[0].aluno.utilizador.iduser)
      : '',
    alunoNome: alunos.length
      ? alunos.map((a: any) => a.aluno?.utilizador?.nome).filter(Boolean).join(', ')
      : 'Sem alunos',
    encarregadoId: encarregado.iduser ? String(encarregado.iduser) : '',
    modalidade: disponibilidade.modalidadeprofessor?.modalidade?.nome || 'Sem modalidade',
    participantes: alunos.map((a: any) => ({
      alunoId: a.aluno?.utilizador?.iduser ? String(a.aluno.utilizador.iduser) : '',
      alunoNome: a.aluno?.utilizador?.nome || '',
    })),
    observacoes: '',
    motivoRejeicao: '',
  };
};

  useEffect(() => {
  const fetchData = async () => {
    try {
      const aulasRes = await api.getAulas();
      const aulasMapeadas = (aulasRes.aulas || []).map(mapAulaFromApi);

      setAulas(aulasMapeadas);

      // Ainda não há backend para estas listas
      setSalas([]);
      setUsers([]);
    } catch (error) {
      console.error('Error fetching aulas data:', error);
      setAulas([]);
      setSalas([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  if (!user) return null;

  // Lista de modalidades únicas nos dados
  const todasModalidades = Array.from(new Set(aulas.map(a => a.modalidade))).sort();

  // ── Filtros ──────────────────────────────────────────────────────────────

  const applyFilters = (lista: PedidoAula[]) => {
    let f = [...lista];
    if (filtroStatus === 'ATIVAS') {
      f = f.filter(a => a.status === 'PENDENTE' || a.status === 'CONFIRMADA' || a.status === 'REJEITADA');
    } else if (filtroStatus !== 'TODAS') {
      f = f.filter(a => a.status === filtroStatus);
    }
    if (filtroModalidade !== 'TODAS') f = f.filter(a => a.modalidade === filtroModalidade);
    if (filtroProfessor !== 'TODOS') f = f.filter(a => a.professorId === filtroProfessor);
    if (filtroEstudio !== 'TODOS')   f = f.filter(a => a.estudioId === filtroEstudio);
    return f.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  };

  const getAulasFiltradas = (): PedidoAula[] => {
    let base = [...aulas];
    if (user.role === 'ALUNO') base = base.filter(a => a.alunoId === user.id);
    else if (user.role === 'ENCARREGADO') {
      const meus = user.alunosIds ?? [];
      // "minhas" = aulas em que algum dos meus alunos é o criador principal
      base = base.filter(a => meus.includes(a.alunoId));
    } else if (user.role === 'PROFESSOR') {
      base = base.filter(a => a.professorId === user.id);
    }
    return applyFilters(base);
  };

  const getAulasDisponiveisParaInscricao = (): PedidoAula[] => {
    if (user.role !== 'ENCARREGADO') return [];
    const meus = user.alunosIds ?? [];
    const disponiveis = aulas.filter(aula => {
      if (aula.status !== 'PENDENTE') return false;
      if (meus.includes(aula.alunoId)) return false;       // já é "minha"
      if (getLivres(aula) <= 0) return false;               // sem vagas
      const ids = aula.participantes?.map(p => p.alunoId) ?? [aula.alunoId];
      return meus.some(id => !ids.includes(id));            // pelo menos 1 aluno meu pode entrar
    });
    return applyFilters(disponiveis);
  };

  // ── Lotação ───────────────────────────────────────────────────────────────

  const getCapacidade = (aula: any) =>
    salas.find(e => e.id === aula.estudioId)?.capacidade ?? 0;

  const getOcupacao = (aula: PedidoAula) =>
    aula.participantes?.length ? aula.participantes.length : 1;

  const getLivres = (aula: PedidoAula) => getCapacidade(aula) - getOcupacao(aula);

  const getLotacaoColor = (ocupados: number, cap: number) => {
    const p = cap > 0 ? ocupados / cap : 0;
    if (p >= 1)    return { bar: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50 border-red-200' };
    if (p >= 0.75) return { bar: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' };
    return         { bar: 'bg-[#0d6b5e]',         text: 'text-[#0d6b5e]', bg: 'bg-[#e2f0ed] border-[#0d6b5e]/20' };
  };

  // ── Juntar-se ─────────────────────────────────────────────────────────────

  const getAlunosDisponiveis = (aula: any) => {
    if (user.role !== 'ENCARREGADO') return [];
    const ids = aula.participantes?.map((p: any) => p.alunoId) ?? [aula.alunoId];
    return users.filter(u => (user.alunosIds ?? []).includes(u.id) && !ids.includes(u.id));
  };

  const podeJuntar = (aula: any): boolean => {
    if (aula.status !== 'PENDENTE') return false;
    if (getLivres(aula) <= 0) return false;
    if (user.role === 'DIRECAO' || user.role === 'PROFESSOR') return false;
    if (user.role === 'ALUNO') {
      const ids = aula.participantes?.map(p => p.alunoId) ?? [aula.alunoId];
      return !ids.includes(user.id);
    }
    return getAlunosDisponiveis(aula).length > 0;
  };

  const handleJuntar = (aulaId: string) => {
    const aula = aulas.find(a => a.id === aulaId);
    if (!aula) return;
    let novo: { alunoId: string; alunoNome: string; encarregadoId?: string } | null = null;
    if (user.role === 'ALUNO') {
      novo = { alunoId: user.id, alunoNome: user.nome };
    } else if (user.role === 'ENCARREGADO') {
      const aluno = users.find(u => u.id === joinAlunoSelecionado);
      if (!aluno) { toast.error('Selecione um aluno.'); return; }
      novo = { alunoId: aluno.id, alunoNome: aluno.nome, encarregadoId: user.id };
    }
    if (!novo) return;
    const atual = aula.participantes ?? [{ alunoId: aula.alunoId, alunoNome: aula.alunoNome, encarregadoId: aula.encarregadoId }];
    setAulas(aulas.map(a => a.id === aulaId ? { ...a, participantes: [...atual, novo!] } : a));
    setJoinAulaId(null);
    setJoinAlunoSelecionado('');
    toast.success('Aluno adicionado à aula com sucesso!');
  };

  // ── Acções de gestão ─────────────────────────────────────────────────────

  const handleNovaAula = (novaAula: PedidoAula) => {
    setAulas([novaAula, ...aulas]);
    setShowNovoForm(false);
    setPrefillForm(undefined);
  };

  const handleAprovar = (id: string) => {
    setAulas(aulas.map(a => a.id === id ? { ...a, status: 'CONFIRMADA' as AulaStatus } : a));
    toast.success('Aula aprovada com sucesso!');
  };

  const handleRejeitar = (id: string) => {
    const motivo = prompt('Motivo da rejeição:');
    if (motivo) {
      setAulas(aulas.map(a => a.id === id ? { ...a, status: 'REJEITADA' as AulaStatus, motivoRejeicao: motivo } : a));
      toast.info('Aula rejeitada.');
    }
  };



  const handleConfirmarRealizacao = (id: string) => {
    setAulas(aulas.map(a => a.id === id ? { ...a, status: 'REALIZADA' as AulaStatus } : a));
    toast.success('Aula confirmada como realizada!');
  };

  const handleRemarcar = (
    aulaId: string,
    novaData: string,
    novoHoraInicio: string,
    novoHoraFim: string,
    novoEstudioId: string,
    novoEstudioNome: string
  ) => {
    setAulas(aulas.map(a => a.id === aulaId
      ? { ...a, data: novaData, horaInicio: novoHoraInicio, horaFim: novoHoraFim, estudioId: novoEstudioId, estudioNome: novoEstudioNome, status: 'PENDENTE' as AulaStatus }
      : a
    ));
    toast.success('Aula remarcada com sucesso!');
  };

  const handleMarcarSlot = (prefill: {
    professorId: string; estudioId: string; data: string; horaInicio: string; duracao: string
  }) => {
    setPrefillForm(prefill);
    setShowNovoForm(true);
    setTimeout(() => document.getElementById('nova-aula-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    toast.success('Horário selecionado! Complete os restantes campos.');
  };

  // ── Helpers visuais ───────────────────────────────────────────────────────

  const getStatusBadge = (status: AulaStatus) => {
    const map: Record<AulaStatus, [string, string]> = {
      PENDENTE:   ['bg-amber-100 text-amber-800', 'Pendente'],
      CONFIRMADA: ['bg-teal-100 text-teal-800',   'Confirmada'],
      REJEITADA:  ['bg-red-100 text-red-800',      'Rejeitada'],
      REALIZADA:  ['bg-[#e2f0ed] text-[#0d6b5e]', 'Realizada'],
    };
    const [cls, label] = map[status];
    return <span className={`px-3 py-1 rounded-full text-sm ${cls}`}>{label}</span>;
  };

  const getModalidadeBadge = (modalidade: string) => {
    const { bg, text, dot } = getModalidadeStyle(modalidade);
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${bg} ${text}`} style={{ fontWeight: 600 }}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {modalidade}
      </span>
    );
  };

  // ── Card reutilizável ─────────────────────────────────────────────────────

  const renderAulaCard = (aula: PedidoAula, isDisponivel = false) => {
    const capacidade = getCapacidade(aula);
    const ocupados   = getOcupacao(aula);
    const livres     = getLivres(aula);
    const pct        = capacidade > 0 ? Math.min((ocupados / capacidade) * 100, 100) : 0;
    const cores      = getLotacaoColor(ocupados, capacidade);
    const isActive   = aula.status === 'PENDENTE' || aula.status === 'CONFIRMADA';
    const mostrarJuntar = podeJuntar(aula);
    const isJoining  = joinAulaId === aula.id;
    const alunosDisp = getAlunosDisponiveis(aula);

    return (
      <div
        key={aula.id}
        className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
          isDisponivel ? 'border-2 border-[#c9a84c]/40' : 'border border-[#0d6b5e]/5'
        }`}
      >
        {isDisponivel && (
          <div className="bg-[#c9a84c]/10 border-b border-[#c9a84c]/30 px-6 py-2 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#c9a84c]" />
            <span className="text-sm text-[#8a6a1a]" style={{ fontWeight: 600 }}>
              Grupo aberto — pode inscrever os seus educandos
            </span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            {/* Info principal */}
            <div className="flex-1 min-w-0">
              {/* Cabeçalho: nome + badges */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <h3 className="text-xl text-[#0a1a17]">{aula.alunoNome}</h3>
                {getStatusBadge(aula.status)}
                {getModalidadeBadge(aula.modalidade)}
              </div>

              {/* Grelha de detalhes */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-[#4d7068]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0d6b5e] shrink-0" />
                  <span className="truncate">Prof. {aula.professorNome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0d6b5e] shrink-0" />
                  <span className="truncate">{aula.estudioNome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0d6b5e] shrink-0" />
                  <span>{format(new Date(aula.data), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0d6b5e] shrink-0" />
                  <span>{aula.horaInicio}–{aula.horaFim} ({aula.duracao} min)</span>
                </div>
              </div>

              {/* Lotação */}
              {isActive && capacidade > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4 text-[#0d6b5e]" />
                      <span className="text-[#4d7068]">Lotação:</span>
                      <span className={`${cores.text}`} style={{ fontWeight: 600 }}>
                        {ocupados}/{capacidade} alunos
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cores.bg} ${cores.text}`} style={{ fontWeight: 500 }}>
                      {livres > 0
                        ? `${livres} lugar${livres !== 1 ? 'es' : ''} livre${livres !== 1 ? 's' : ''}`
                        : 'Lotação esgotada'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${cores.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  {aula.participantes && aula.participantes.length > 1 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {aula.participantes.map(p => (
                        <span key={p.alunoId} className="text-xs bg-[#f4f9f8] border border-[#0d6b5e]/15 text-[#4d7068] px-2 py-0.5 rounded-full">
                          {p.alunoNome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {aula.observacoes && (
                <div className="mt-3 p-3 bg-[#f4f9f8] rounded-xl border border-[#0d6b5e]/10">
                  <p className="text-sm text-[#4d7068]">
                    <strong className="text-[#0a1a17]">Obs:</strong> {aula.observacoes}
                  </p>
                </div>
              )}
              {aula.motivoRejeicao && (
                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm text-red-700">
                    <strong>Motivo:</strong> {aula.motivoRejeicao}
                  </p>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2 shrink-0 items-end">
              {/* DIRECAO — só Aprovar/Rejeitar em PENDENTE */}
              {user.role === 'DIRECAO' && aula.status === 'PENDENTE' && (
                <>
                  <button onClick={() => handleAprovar(aula.id)} className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm whitespace-nowrap">
                    <CheckCircle className="w-4 h-4" /> Aprovar
                  </button>
                  <button onClick={() => setDirecaoCancelarModal(aula.id)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap">
                    <XCircle className="w-4 h-4" /> Cancelar
                  </button>
                </>
              )}
              {/* PROFESSOR — Aceitar/Rejeitar marcação em PENDENTE */}
              {user.role === 'PROFESSOR' && aula.status === 'PENDENTE' && (
                <>
                  <button onClick={() => handleAprovar(aula.id)} className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm whitespace-nowrap">
                    <CheckCircle className="w-4 h-4" /> Aceitar
                  </button>
                  <button onClick={() => handleRejeitar(aula.id)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap">
                    <XCircle className="w-4 h-4" /> Rejeitar
                  </button>
                </>
              )}
              {/* PROFESSOR — Confirmar realização (em CONFIRMADA) */}
              {user.role === 'PROFESSOR' && aula.status === 'CONFIRMADA' && (
                <button onClick={() => handleConfirmarRealizacao(aula.id)} className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm whitespace-nowrap">
                  <CheckCircle className="w-4 h-4" /> Confirmar Realização
                </button>
              )}
              {mostrarJuntar && (
                <button
                  onClick={() => {
                    if (user.role === 'ALUNO') { handleJuntar(aula.id); }
                    else { setJoinAulaId(isJoining ? null : aula.id); setJoinAlunoSelecionado(''); }
                  }}
                  className="flex items-center gap-1.5 bg-[#c9a84c] text-[#0a1a17] px-3 py-2 rounded-lg hover:bg-[#e8c97a] transition-colors text-sm whitespace-nowrap"
                  style={{ fontWeight: 600 }}
                >
                  <UserPlus className="w-4 h-4" />
                  Juntar-se
                  {user.role === 'ENCARREGADO' && (
                    <ChevronDown className={`w-3 h-3 transition-transform ${isJoining ? 'rotate-180' : ''}`} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Painel inline para escolher aluno */}
          {isJoining && user.role === 'ENCARREGADO' && (
            <div className="mt-4 pt-4 border-t border-[#0d6b5e]/10">
              <p className="text-sm text-[#0a1a17] mb-3" style={{ fontWeight: 600 }}>
                Selecione o aluno para juntar à aula:
              </p>
              {alunosDisp.length === 0 ? (
                <p className="text-sm text-[#4d7068]">Todos os seus educandos já estão nesta aula.</p>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={joinAlunoSelecionado}
                    onChange={e => setJoinAlunoSelecionado(e.target.value)}
                    className="px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm text-[#0a1a17] focus:outline-none focus:border-[#0d6b5e]"
                  >
                    <option value="">Escolher aluno…</option>
                    {alunosDisp.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                  <button
                    onClick={() => handleJuntar(aula.id)}
                    disabled={!joinAlunoSelecionado}
                    className="flex items-center gap-1.5 bg-[#0d6b5e] text-white px-4 py-2 rounded-lg hover:bg-[#065147] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                    style={{ fontWeight: 600 }}
                  >
                    <UserPlus className="w-4 h-4" /> Confirmar
                  </button>
                  <button onClick={() => { setJoinAulaId(null); setJoinAlunoSelecionado(''); }}
                    className="px-4 py-2 rounded-lg text-sm text-[#4d7068] hover:bg-[#f4f9f8] transition-colors">
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Dados calculados ──────────────────────────────────────────────────────

  const aulasFiltradas = getAulasFiltradas();
  const aulasDisponiveisParaInscricao = getAulasDisponiveisParaInscricao();
  const professores = users.filter(u => u.role === 'PROFESSOR');

  const showSubTabs = user.role === 'ENCARREGADO';

  // ── Filtro barra (Agenda) ─────────────────────────────────────────────────

  const FilterBar = () => (
    <div className="space-y-3 mt-4">
      {/* Status */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-white/50 text-sm">
          <Filter className="w-4 h-4" /> Status:
        </div>
        {(['ATIVAS', 'TODAS', 'PENDENTE', 'CONFIRMADA', 'REALIZADA'] as const).map(s => (
          <button key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filtroStatus === s ? 'bg-[#c9a84c] text-[#0a1a17]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            {s === 'ATIVAS' ? 'Ativas' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Modalidade */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-white/50 text-sm">
          <Music2 className="w-4 h-4" /> Modalidade:
        </div>
        <button onClick={() => setFiltroModalidade('TODAS')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filtroModalidade === 'TODAS' ? 'bg-[#c9a84c] text-[#0a1a17]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
        >
          Todas
        </button>
        {todasModalidades.map(m => {
          const { dot } = getModalidadeStyle(m);
          return (
            <button key={m} onClick={() => setFiltroModalidade(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${filtroModalidade === m ? 'bg-[#c9a84c] text-[#0a1a17]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              <span className={`w-2 h-2 rounded-full ${filtroModalidade === m ? 'bg-[#0a1a17]/50' : dot}`} />
              {m}
            </button>
          );
        })}
      </div>

      {/* Professor + Estúdio */}
      {(user.role === 'DIRECAO' || user.role === 'ENCARREGADO') && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-white/50">Professor:</span>
          <select value={filtroProfessor} onChange={e => setFiltroProfessor(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white border border-white/20 focus:outline-none focus:border-[#c9a84c]">
            <option value="TODOS">Todos</option>
            {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <span className="text-sm text-white/50">Estúdio:</span>
          <select value={filtroEstudio} onChange={e => setFiltroEstudio(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white border border-white/20 focus:outline-none focus:border-[#c9a84c]">
            <option value="TODOS">Todos</option>
            {salas.map(e => <option key={e.id} value={e.id}>{e.nomesala}</option>)}
          </select>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f4f9f8]">
      <Toaster position="top-right" />

      {/* ── Modais da Direção ── */}
      <DirecaoModals
        direcaoCancelarModal={direcaoCancelarModal}
        setDirecaoCancelarModal={setDirecaoCancelarModal}
        aulas={aulas}
        handleRejeitar={handleRejeitar}
        onRemarcar={handleRemarcar}
      />

      {/* ── Header ── */}
      <div className="bg-[#0a1a17] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm text-white/50">
            <Link to="/dashboard" className="hover:text-[#c9a84c] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-white/80">Aulas</span>
          </div>

          {/* Título + botão nova aula */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl text-white mb-1">Gestão de Aulas</h1>
              <p className="text-white/50 text-sm">
                {user.role === 'ALUNO'       && 'Consulte as suas aulas agendadas'}
                {user.role === 'ENCARREGADO' && 'Gerencie as aulas dos seus educandos'}
                {user.role === 'PROFESSOR'   && 'Suas aulas e confirmações'}
                {user.role === 'DIRECAO'     && 'Gestão de todos os pedidos de aulas'}
              </p>
            </div>
            {(user.role === 'ENCARREGADO' || user.role === 'PROFESSOR') && activeTab === 'marcar' && (
              <button
                onClick={() => { setShowNovoForm(!showNovoForm); if (showNovoForm) setPrefillForm(undefined); }}
                className="flex items-center gap-2 bg-[#c9a84c] text-[#0a1a17] px-5 py-2.5 rounded-lg hover:bg-[#e8c97a] transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-5 h-5" /> Nova Aula
              </button>
            )}
          </div>

          {/* Abas principais */}
          {user.role !== 'ALUNO' && (
            <div className="flex items-center gap-2">
              {(['marcar', 'agenda'] as const).map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg transition-colors ${activeTab === tab ? 'bg-[#c9a84c] text-[#0a1a17]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                  style={{ fontWeight: activeTab === tab ? 600 : 400 }}
                >
                  {tab === 'marcar' ? 'Marcar Aulas' : 'Agenda de Aulas'}
                </button>
              ))}
            </div>
          )}

          {/* Filtros da agenda */}
          {activeTab === 'agenda' && user.role !== 'ALUNO' && <FilterBar />}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {user.role === 'ALUNO' ? (
          <AlunoAgendaView aulas={aulasFiltradas} nomeAluno={user.nome} />
        ) : (
          <>
            {/* Aba: Marcar Aulas */}
            {activeTab === 'marcar' && (
              <div className="space-y-6">
                {showNovoForm && (
                  <div id="nova-aula-form">
                    <NovaAulaForm
                      onSuccess={handleNovaAula}
                      onCancel={() => { setShowNovoForm(false); setPrefillForm(undefined); }}
                      aulasExistentes={aulas}
                      prefill={prefillForm}
                    />
                  </div>
                )}

                {/* Pedidos pendentes de aprovação (só Direção, no tab Marcar) */}
                {user.role === 'DIRECAO' && (() => {
                  const pendentes = aulas
                    .filter(a => a.status === 'PENDENTE')
                    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
                  if (pendentes.length === 0 && !showNovoForm) return (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-[#0d6b5e]/5">
                      <CheckCircle className="w-16 h-16 text-[#0d6b5e]/20 mx-auto mb-4" />
                      <p className="text-[#4d7068] mb-1">Sem pedidos pendentes</p>
                      <p className="text-sm text-[#4d7068]/60">Todos os pedidos de aula foram processados</p>
                    </div>
                  );
                  if (pendentes.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Bell className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg text-[#0a1a17]" style={{ fontWeight: 600 }}>
                          Pedidos de Aula Pendentes
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-sm" style={{ fontWeight: 600 }}>
                          {pendentes.length}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {pendentes.map(a => renderAulaCard(a, false))}
                      </div>
                    </div>
                  );
                })()}

                {user.role !== 'DIRECAO' && (
                  <DisponibilidadeProfessoresPanel aulasExistentes={aulas} onMarcarSlot={handleMarcarSlot} />
                )}
              </div>
            )}

            {/* Aba: Agenda de Aulas */}
            {activeTab === 'agenda' && (
              <div className="space-y-6">
                {/* Sub-abas (só Encarregado) */}
                {showSubTabs && (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#0d6b5e]/10 w-fit shadow-sm">
                    <button
                      onClick={() => setAgendaSubTab('minhas')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-sm ${
                        agendaSubTab === 'minhas'
                          ? 'bg-[#0d6b5e] text-white shadow-sm'
                          : 'text-[#4d7068] hover:bg-[#f4f9f8]'
                      }`}
                      style={{ fontWeight: agendaSubTab === 'minhas' ? 600 : 400 }}
                    >
                      <Calendar className="w-4 h-4" />
                      As Minhas Aulas
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${agendaSubTab === 'minhas' ? 'bg-white/20' : 'bg-[#0d6b5e]/10 text-[#0d6b5e]'}`}
                        style={{ fontWeight: 600 }}>
                        {aulasFiltradas.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setAgendaSubTab('abertas')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all text-sm ${
                        agendaSubTab === 'abertas'
                          ? 'bg-[#c9a84c] text-[#0a1a17] shadow-sm'
                          : 'text-[#4d7068] hover:bg-[#f4f9f8]'
                      }`}
                      style={{ fontWeight: agendaSubTab === 'abertas' ? 600 : 400 }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Grupos Abertos
                      {aulasDisponiveisParaInscricao.length > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${agendaSubTab === 'abertas' ? 'bg-[#0a1a17]/20' : 'bg-[#c9a84c] text-[#0a1a17]'}`}
                          style={{ fontWeight: 700 }}>
                          {aulasDisponiveisParaInscricao.length}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Conteúdo da sub-aba */}
                {(!showSubTabs || agendaSubTab === 'minhas') && (
                  <>
                    {aulasFiltradas.length === 0 ? (
                      <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-[#0d6b5e]/5">
                        <Calendar className="w-16 h-16 text-[#0d6b5e]/20 mx-auto mb-4" />
                        <p className="text-[#4d7068] mb-1">Nenhuma aula encontrada</p>
                        <p className="text-sm text-[#4d7068]/60">Tente ajustar os filtros</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {aulasFiltradas.map(a => renderAulaCard(a, false))}
                      </div>
                    )}
                  </>
                )}

                {showSubTabs && agendaSubTab === 'abertas' && (
                  <>
                    <p className="text-sm text-[#4d7068] -mt-2">
                      Aulas criadas por outros encarregados com vagas disponíveis. Pode inscrever os seus educandos diretamente nestes grupos.
                    </p>
                    {aulasDisponiveisParaInscricao.length === 0 ? (
                      <div className="bg-white p-12 rounded-2xl border border-dashed border-[#0d6b5e]/20 text-center">
                        <Users className="w-12 h-12 text-[#0d6b5e]/20 mx-auto mb-4" />
                        <p className="text-[#4d7068] mb-1">Nenhum grupo aberto disponível</p>
                        <p className="text-sm text-[#4d7068]/60">
                          {filtroModalidade !== 'TODAS'
                            ? `Não há grupos abertos de ${filtroModalidade} com vagas`
                            : 'De momento não há grupos pendentes com vagas para os seus educandos'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {aulasDisponiveisParaInscricao.map(a => renderAulaCard(a, true))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}