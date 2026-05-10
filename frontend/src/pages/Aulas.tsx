import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router';
import { PedidoAula, AulaStatus } from '../types';
import api from '../services/api';
import {
  Calendar, Clock, MapPin, User, CheckCircle, XCircle,
  Filter, ArrowLeft, Users, UserPlus, ChevronDown, Music2, Bell,
  CalendarOff
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
  const { user, activeRole } = useAuth();
  const [aulas, setAulas] = useState<PedidoAula[]>([]);
  const [gruposAbertos, setGruposAbertos] = useState<PedidoAula[]>([]);
  const [estudios, setEstudios] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<AulaStatus | 'TODAS' | 'ATIVAS'>('ATIVAS');
  const [filtroProfessor, setFiltroProfessor] = useState<string>('TODOS');
  const [filtroEstudio, setFiltroEstudio] = useState<string>('TODOS');
  const [filtroModalidade, setFiltroModalidade] = useState<string>('TODAS');
  const [showNovoForm, setShowNovoForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'marcar' | 'agenda' | 'historico'>('marcar');
  const [agendaSubTab, setAgendaSubTab] = useState<'minhas' | 'abertas'>('minhas');
  const [prefillForm, setPrefillForm] = useState<{
    professorId?: string; estudioId?: string; data?: string;
    horaInicio?: string; duracao?: string; maxDuracao?: string;
    modalidade?: string; modalidadeId?: string; disponibilidadeId?: string;
  } | undefined>(undefined);
  const [joinAulaId, setJoinAulaId] = useState<string | null>(null);
  const [joinAlunoSelecionado, setJoinAlunoSelecionado] = useState<string>('');
  const [direcaoCancelarModal, setDirecaoCancelarModal] = useState<string | null>(null);
  const [sugerirRemarcacaoModal, setSugerirRemarcacaoModal] = useState<string | null>(null);
  const [novaDataRemarcacao, setNovaDataRemarcacao] = useState('');
  const [aprovarModal, setAprovarModal] = useState<{ aulaId: string; salaId: string } | null>(null);
  const [proporDataDirecaoModal, setProporDataDirecaoModal] = useState<{ aulaId: string; novaData: string } | null>(null);
  const [rejeitarAulaModal, setRejeitarAulaModal] = useState<{ id: string } | null>(null);
  const [rejeitarAulaMotivoInput, setRejeitarAulaMotivoInput] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const role = activeRole;
        const aulasEndpoint = 
          role === 'ALUNO' ? api.getAlunoAulas() :
          role === 'ENCARREGADO' ? api.getEncarregadoAulas() :
          role === 'PROFESSOR' ? api.getProfessorAulas() :
          role === 'DIRECAO' ? api.getDirecaoAulas() :
          api.getMyAulas();
        const promises: Promise<any>[] = [aulasEndpoint, api.getSalas(), api.getUsers()];
        if (role === 'ENCARREGADO') promises.push(api.getEncarregadoAulasOpen());
        const [aulasRes, salasRes, usersRes, gruposRes] = await Promise.all(promises);
        if (aulasRes.success && aulasRes.data) setAulas(aulasRes.data);
        if (salasRes.success && salasRes.data) setEstudios(salasRes.data);
        if (usersRes.success && usersRes.data) setUsers(usersRes.data);
        if (gruposRes?.success && gruposRes.data) setGruposAbertos(gruposRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, activeRole]);

  if (!user || !activeRole) return null;

  // Lista de modalidades únicas nos dados
  const todasModalidades = Array.from(new Set(aulas.map(a => a.modalidade))).sort();

  // ── Filtros ──────────────────────────────────────────────────────────────

  const applyFilters = (lista: PedidoAula[]) => {
    let f = [...lista];
    if (filtroStatus === 'ATIVAS') {
      f = f.filter(a => a.status === 'PENDENTE' || a.status === 'CONFIRMADA');
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
    if (activeRole === 'ALUNO') base = base.filter(a => String(a.alunoId) === String(user.id));
    else if (activeRole === 'PROFESSOR') {
      base = base.filter(a => a.professorId === user.id);
    }
    
    if (activeTab === 'historico') {
      base = base.filter(a => a.status === 'REALIZADA');
    }
    
    return applyFilters(base);
  };

  const getAulasDisponiveisParaInscricao = (): PedidoAula[] => {
    if (activeRole !== 'ENCARREGADO') return [];
    return gruposAbertos;
  };

  // ── Lotação ───────────────────────────────────────────────────────────────

  const getCapacidade = (aula: PedidoAula) =>
    aula.maxParticipantes ?? 0;

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

  const getAlunosDisponiveis = (aula: PedidoAula) => {
    if (activeRole !== 'ENCARREGADO') return [];
    const ids = aula.participantes?.map(p => p.alunoId) ?? [aula.alunoId];
    return users.filter(u => (user.alunosIds ?? []).includes(u.id) && !ids.includes(u.id));
  };

  const podeJuntar = (aula: PedidoAula): boolean => {
    if (aula.status !== 'PENDENTE') return false;
    if (getLivres(aula) <= 0) return false;
    if (activeRole !== 'ENCARREGADO') return false;
    return getAlunosDisponiveis(aula).length > 0;
  };

  const handleCancelarParticipacao = async (aulaId: string) => {
    if (!confirm('Tem a certeza que deseja cancelar a sua participação nesta aula?')) return;
    try {
      await api.cancelarParticipacaoAula(parseInt(aulaId));
      toast.success('Participação cancelada com sucesso.');
      const res = await api.getEncarregadoAulas();
      if (res.success && res.data) setAulas(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar participação');
    }
  };

  const handleJuntar = async (aulaId: string) => {
    const aula = aulas.find(a => a.id === aulaId);
    if (!aula) return;

    if (activeRole === 'ENCARREGADO') {
      const aluno = users.find(u => u.id === joinAlunoSelecionado);
      if (!aluno) { toast.error('Selecione um aluno.'); return; }
      try {
        await api.marcarAula(parseInt(aulaId), parseInt(aluno.id));
        const atual = aula.participantes ?? [{ alunoId: aula.alunoId, alunoNome: aula.alunoNome, encarregadoId: aula.encarregadoId }];
        setAulas(aulas.map(a => a.id === aulaId ? { ...a, participantes: [...atual, { alunoId: aluno.id, alunoNome: aluno.nome, encarregadoId: user.id }] } : a));
        toast.success('Pedido enviado! Aguarda aprovação.');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao enviar pedido');
        return;
      }
    }

    setJoinAulaId(null);
    setJoinAlunoSelecionado('');
  };

  // ── Acções de gestão ─────────────────────────────────────────────────────

  const handleNovaAula = async (novaAula: PedidoAula) => {
    if (activeRole === 'ENCARREGADO') {
      try {
        const disponibilidadeId = prefillForm?.disponibilidadeId ? parseInt(prefillForm.disponibilidadeId) : undefined;
        const professorId = prefillForm?.professorId ? parseInt(prefillForm.professorId) : undefined;
        await api.submeterPedidoAula({
          data: novaAula.data,
          horainicio: novaAula.horaInicio,
          duracaoaula: String(novaAula.duracao),
          disponibilidade_mensal_id: disponibilidadeId,
          professor_utilizador_id: professorId,
          salaidsala: parseInt(novaAula.estudioId || prefillForm?.estudioId || '1') || 1,
          privacidade: novaAula.privacidade ?? false,
          alunoutilizadoriduser: novaAula.alunoId ? parseInt(novaAula.alunoId) : undefined,
        });
        toast.success('Aula marcada com sucesso!');
        const res = await api.getEncarregadoAulas();
        if (res.success && res.data) setAulas(res.data);
      } catch (error: any) {
        console.error('Erro ao criar aula:', error);
        toast.error(error.message || 'Erro ao criar aula. Tente novamente.');
        return;
      }
    }
    setShowNovoForm(false);
    setPrefillForm(undefined);
  };

  const handleAprovar = async (id: string, salaId?: number) => {
    try {
      await api.approveDirecaoAula(parseInt(id), salaId);
      setAulas(aulas.map(a => {
        if (a.id !== id) return a;
        const estudio = salaId ? estudios.find(e => e.id === String(salaId)) : estudios.find(e => e.id === a.estudioId);
        return {
          ...a,
          status: 'CONFIRMADA' as AulaStatus,
          ...(estudio && { estudioId: String(salaId ?? a.estudioId), estudioNome: estudio.nome }),
        };
      }));
      toast.success('Aula aprovada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao aprovar aula');
    }
  };

  const handleRejeitar = (id: string) => {
    setRejeitarAulaMotivoInput('');
    setRejeitarAulaModal({ id });
  };

  const handleConfirmarRejeitarAula = async () => {
    if (!rejeitarAulaModal) return;
    const { id } = rejeitarAulaModal;
    try {
      await api.rejectDirecaoAula(parseInt(id), rejeitarAulaMotivoInput);
      setAulas(aulas.map(a => a.id === id ? { ...a, status: 'REJEITADA' as AulaStatus } : a));
      toast.info('Aula rejeitada.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao rejeitar aula');
    } finally {
      setRejeitarAulaModal(null);
      setRejeitarAulaMotivoInput('');
    }
  };



  const handleConfirmarRealizacao = async (id: string) => {
    try {
      await api.confirmarRealizacaoAula(parseInt(id));
      setAulas(aulas.map(a => a.id === id ? { ...a, status: 'REALIZADA' as AulaStatus } : a));
      toast.success('Aula confirmada como realizada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao confirmar realização');
    }
  };

  const handleSugerirRemarcacao = async () => {
    if (!sugerirRemarcacaoModal || !novaDataRemarcacao) {
      toast.error('Selecione uma nova data');
      return;
    }
    
    const agora = new Date();
    const dataHojeStr = agora.toISOString().split('T')[0];
    const dataInputStr = novaDataRemarcacao.split('T')[0];
    
    if (dataInputStr < dataHojeStr) {
      toast.error('A data não pode ser no passado');
      return;
    }
    
    if (dataInputStr === dataHojeStr) {
      const [horaH, horaM] = novaDataRemarcacao.split('T')[1].split(':').map(Number);
      const horaInput = horaH * 60 + horaM;
      const horaAtual = agora.getHours() * 60 + agora.getMinutes();
      if (horaInput <= horaAtual) {
        toast.error('A hora deve ser posterior à hora atual');
        return;
      }
    }
    
    try {
      const result = await api.sugerirNovaDataAula(Number(sugerirRemarcacaoModal), novaDataRemarcacao);
      if (result.success) {
        toast.success('Sugestão de remarcação enviada à direção!');
        setSugerirRemarcacaoModal(null);
        setNovaDataRemarcacao('');
      }
    } catch (error) {
      toast.error('Erro ao enviar sugestão');
    }
  };

  const handleRemarcar = async (
    aulaId: string,
    novaData: string,
    novoHoraInicio: string,
    novoHoraFim: string,
    novoEstudioId: string,
    novoEstudioNome: string
  ) => {
    const agora = new Date();
    const dataInputStr = novaData.split('T')[0];
    const dataHojeStr = agora.toISOString().split('T')[0];
    
    if (dataInputStr < dataHojeStr) {
      toast.error('A data não pode ser no passado');
      return;
    }
    
    if (dataInputStr === dataHojeStr && novoHoraInicio) {
      const [horaH, horaM] = novoHoraInicio.split(':').map(Number);
      const horaInput = horaH * 60 + horaM;
      const horaAtual = agora.getHours() * 60 + agora.getMinutes();
      if (horaInput <= horaAtual) {
        toast.error('A hora deve ser posterior à hora atual');
        return;
      }
    }
    
    try {
      await api.remarcarAula(Number(aulaId), novaData, novoHoraInicio);
      setAulas(aulas.map(a => a.id === aulaId
        ? { ...a, data: novaData, horaInicio: novoHoraInicio, horaFim: novoHoraFim, estudioId: novoEstudioId, estudioNome: novoEstudioNome, status: 'PENDENTE' as AulaStatus, sugestaoestado: 'AGUARDA_PROFESSOR', novaData: novaData, novadata: novaData }
        : a
      ));
      toast.success('Aula remarcada! A aguardar confirmação do professor.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remarcar aula');
    }
  };

  const handleResponderSugestaoDirecao = async (aulaId: string, aceitar: boolean, novaData?: string) => {
    try {
      await api.responderSugestaoDirecao(Number(aulaId), aceitar, novaData);
      if (aceitar) {
        setAulas(aulas.map(a => a.id === aulaId
          ? { ...a, sugestaoestado: 'AGUARDA_EE', novaData: novaData || a.novaData, novadata: novaData || a.novadata }
          : a
        ));
        toast.success('Aprovado. A aguardar confirmação do encarregado.');
      } else {
        setAulas(aulas.map(a => a.id === aulaId ? { ...a, sugestaoestado: null, novadata: undefined, novaData: undefined } : a));
        toast.info('Rejeitado. Professor notificado.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao responder à sugestão');
    }
  };

  const handlePedirRemarcacao = async (id: string) => {
    try {
      await api.pedirRemarcacao(Number(id));
      setAulas(aulas.map(a => a.id === id ? { ...a, sugestaoestado: 'AGUARDA_DIRECAO', novaData: undefined, novadata: undefined } : a));
      toast.success('Pedido de remarcação enviado à direção.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao pedir remarcação');
    }
  };

  const handleResponderSugestaoProfessor = async (aulaId: string, aceitar: boolean) => {
    try {
      await api.responderSugestaoProfessor(Number(aulaId), aceitar);
      if (aceitar) {
        setAulas(aulas.map(a => a.id === aulaId ? { ...a, sugestaoestado: 'AGUARDA_EE' } : a));
        toast.success('Sugestão aceite. A aguardar confirmação do encarregado.');
      } else {
        setAulas(aulas.map(a => a.id === aulaId ? { ...a, sugestaoestado: null } : a));
        toast.info('Data recusada. Direção pode propor nova data.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao responder à sugestão');
    }
  };

  const handleResponderSugestaoEE = async (aulaId: string, aceitar: boolean) => {
    try {
      await api.responderSugestaoEE(Number(aulaId), aceitar);
      if (aceitar) {
        toast.success('Nova data aceite. Aula confirmada!');
        const res = await api.getEncarregadoAulas();
        if (res.success && res.data) setAulas(res.data);
      } else {
        setAulas(aulas.map(a => a.id === aulaId ? { ...a, sugestaoestado: null, status: 'REJEITADA' as AulaStatus } : a));
        toast.info('Nova data recusada. Aula cancelada.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao responder à sugestão');
    }
  };

  const handleMarcarSlot = (prefill: {
    professorId: string; estudioId?: string; data: string; horaInicio: string; duracao: string; maxDuracao?: string; modalidade?: string; modalidadeId?: string; disponibilidadeId?: string;
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
      CANCELADA:  ['bg-gray-100 text-gray-600',   'Cancelada'],
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
                <h3 className="text-xl text-[#0a1a17]">{aula.alunoNome || aula.modalidade || 'Aula'}</h3>
                {getStatusBadge(aula.status)}
                {getModalidadeBadge(aula.modalidade)}
              </div>

              {/* Grelha de detalhes */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-[#4d7068]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0d6b5e] shrink-0" />
                  <span className="truncate">
                    Prof. {aula.professorNome || <span className="italic text-[#4d7068]/60">A definir</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#0d6b5e] shrink-0" />
                  <span className="truncate">{aula.estudioNome || 'A definir'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0d6b5e] shrink-0" />
                  <span>{format(new Date(aula.data), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0d6b5e] shrink-0" />
                  <span>{aula.horaInicio}–{aula.horaFim || '?'} ({aula.duracao} min)</span>
                </div>
                {activeRole !== 'ALUNO' && aula.alunoNome && (
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#0d6b5e] shrink-0" />
                    <span className="truncate">Aluno: {aula.alunoNome}</span>
                  </div>
                )}
                {activeRole === 'DIRECAO' && aula.encarregadoNome && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Users className="w-4 h-4 text-[#0d6b5e] shrink-0" />
                    <span className="truncate">EE: {aula.encarregadoNome}</span>
                  </div>
                )}
              </div>

              {/* Lotação — só mostrar para aulas de grupo (cap > 1) */}
              {isActive && capacidade > 1 && (
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

              {aula.sugestaoestado && (
                <div className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200 flex items-start gap-2">
                  <CalendarOff className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800 space-y-0.5">
                    <p>
                      <strong>Remarcação em curso</strong> —{' '}
                      {aula.sugestaoestado === 'AGUARDA_DIRECAO'
                        ? 'Professor sugeriu nova data · a aguardar aprovação da direção'
                        : aula.sugestaoestado === 'AGUARDA_PROFESSOR'
                        ? 'Direção propôs nova data · a aguardar resposta do professor'
                        : 'Professor e Direção já confirmaram · a aguardar resposta do encarregado'}
                    </p>
                    {(aula.novadata || aula.novaData) && (
                      <p className="text-orange-700" style={{ fontWeight: 600 }}>
                        Nova data proposta: {aula.novadata || aula.novaData}
                      </p>
                    )}
                  </div>
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
              {/* DIRECAO — Aprovar/Rejeitar em PENDENTE sem sugestão ativa */}
              {activeRole === 'DIRECAO' && aula.status === 'PENDENTE' && !aula.sugestaoestado && (
                <>
                  <button onClick={() => setAprovarModal({ aulaId: aula.id, salaId: aula.estudioId || '' })} className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm whitespace-nowrap">
                    <CheckCircle className="w-4 h-4" /> Aprovar
                  </button>
                  <button onClick={() => setDirecaoCancelarModal(aula.id)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap">
                    <XCircle className="w-4 h-4" /> Cancelar
                  </button>
                </>
              )}
              {/* DIRECAO — Responder a AGUARDA_DIRECAO: com ou sem data proposta pelo Professor */}
              {activeRole === 'DIRECAO' && aula.sugestaoestado === 'AGUARDA_DIRECAO' && (
                <div className="flex flex-col gap-1 items-end">
                  {(aula.novadata || aula.novaData) ? (
                    <>
                      <span className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200 mb-1">
                        Professor propôs: {aula.novadata || aula.novaData}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => handleResponderSugestaoDirecao(aula.id, true)} className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm whitespace-nowrap">
                          <CheckCircle className="w-4 h-4" /> Aprovar
                        </button>
                        <button onClick={() => handleResponderSugestaoDirecao(aula.id, false)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap">
                          <XCircle className="w-4 h-4" /> Rejeitar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200 mb-1">
                        Professor pediu remarcação
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setProporDataDirecaoModal({ aulaId: aula.id, novaData: '' })} className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm whitespace-nowrap">
                          <CheckCircle className="w-4 h-4" /> Propor Data
                        </button>
                        <button onClick={() => handleResponderSugestaoDirecao(aula.id, false)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap">
                          <XCircle className="w-4 h-4" /> Rejeitar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* PROFESSOR — Confirmar realização (em CONFIRMADA) */}
              {activeRole === 'PROFESSOR' && aula.status === 'CONFIRMADA' && !aula.sugestaoestado && (
                <div className="flex flex-col gap-2 items-end">
                  <button onClick={() => handleConfirmarRealizacao(aula.id)} className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm whitespace-nowrap">
                    <CheckCircle className="w-4 h-4" /> Confirmar Realização
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => setSugerirRemarcacaoModal(aula.id)} className="flex items-center gap-1 bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm whitespace-nowrap">
                      <CalendarOff className="w-4 h-4" /> Sugerir Data
                    </button>
                    <button onClick={() => handlePedirRemarcacao(aula.id)} className="flex items-center gap-1 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm whitespace-nowrap">
                      <CalendarOff className="w-4 h-4" /> Pedir Remarcação
                    </button>
                  </div>
                </div>
              )}
              {/* PROFESSOR — Responder à sugestão de remarcação da Direção */}
              {activeRole === 'PROFESSOR' && aula.sugestaoestado === 'AGUARDA_PROFESSOR' && (
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200 mb-1">
                    Nova data proposta: {aula.novadata || aula.novaData}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleResponderSugestaoProfessor(aula.id, true)} className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm whitespace-nowrap">
                      <CheckCircle className="w-4 h-4" /> Aceitar
                    </button>
                    <button onClick={() => handleResponderSugestaoProfessor(aula.id, false)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap">
                      <XCircle className="w-4 h-4" /> Recusar
                    </button>
                  </div>
                </div>
              )}
              {/* ENCARREGADO — Responder à sugestão de remarcação aceite pelo Professor */}
              {activeRole === 'ENCARREGADO' && aula.sugestaoestado === 'AGUARDA_EE' && (
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200 mb-1">
                    Nova data proposta: {aula.novadata || aula.novaData}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleResponderSugestaoEE(aula.id, true)} className="flex items-center gap-1 bg-[#0d6b5e] text-white px-3 py-2 rounded-lg hover:bg-[#065147] transition-colors text-sm whitespace-nowrap">
                      <CheckCircle className="w-4 h-4" /> Aceitar
                    </button>
                    <button onClick={() => handleResponderSugestaoEE(aula.id, false)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap">
                      <XCircle className="w-4 h-4" /> Recusar
                    </button>
                  </div>
                </div>
              )}
              {mostrarJuntar && (
                <button
                  onClick={() => { setJoinAulaId(isJoining ? null : aula.id); setJoinAlunoSelecionado(''); }}
                  className="flex items-center gap-1.5 bg-[#c9a84c] text-[#0a1a17] px-3 py-2 rounded-lg hover:bg-[#e8c97a] transition-colors text-sm whitespace-nowrap"
                  style={{ fontWeight: 600 }}
                >
                  <UserPlus className="w-4 h-4" />
                  Juntar-se
                  {activeRole === 'ENCARREGADO' && (
                    <ChevronDown className={`w-3 h-3 transition-transform ${isJoining ? 'rotate-180' : ''}`} />
                  )}
                </button>
              )}
              {/* ENCARREGADO — Cancelar participação (RF17) */}
              {activeRole === 'ENCARREGADO' && (aula.status === 'PENDENTE' || aula.status === 'CONFIRMADA') && !aula.sugestaoestado && (
                <button
                  onClick={() => handleCancelarParticipacao(aula.id)}
                  className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm whitespace-nowrap border border-red-200"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar Participação
                </button>
              )}
            </div>
          </div>

          {/* Painel inline para escolher aluno */}
          {isJoining && activeRole === 'ENCARREGADO' && (
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

  const showSubTabs = activeRole === 'ENCARREGADO';

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
      {(activeRole === 'DIRECAO' || activeRole === 'ENCARREGADO') && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-white/50">Professor:</span>
          <select value={filtroProfessor} onChange={e => setFiltroProfessor(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white border border-white/20 focus:outline-none focus:border-[#c9a84c] text-white">
            <option value="TODOS">Todos</option>
            {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <span className="text-sm text-white/50">Estúdio:</span>
          <select value={filtroEstudio} onChange={e => setFiltroEstudio(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white border border-white/20 focus:outline-none focus:border-[#c9a84c] text-white">
            <option value="TODOS">Todos</option>
            {estudios.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
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
        estudios={estudios}
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
                {activeRole === 'ALUNO'       && 'Consulte as suas aulas agendadas'}
                {activeRole === 'ENCARREGADO' && 'Gerencie as aulas dos seus educandos'}
                {activeRole === 'PROFESSOR'   && 'Suas aulas e confirmações'}
                {activeRole === 'DIRECAO'     && 'Gestão de todos os pedidos de aulas'}
              </p>
            </div>

          </div>

          {/* Abas principais */}
          {activeRole !== 'ALUNO' && (
            <div className="flex items-center gap-2">
              {activeRole === 'PROFESSOR' ? (
                <>
                  {(['marcar', 'agenda', 'historico'] as const).map(tab => (
                    <button key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2 rounded-lg transition-colors ${activeTab === tab ? 'bg-[#c9a84c] text-[#0a1a17]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                      style={{ fontWeight: activeTab === tab ? 600 : 400 }}
                    >
                      {tab === 'marcar' ? 'Marcar' : tab === 'agenda' ? 'Agenda' : 'Histórico'}
                    </button>
                  ))}
                </>
              ) : (
                (['marcar', 'agenda'] as const).map(tab => (
                  <button key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-lg transition-colors ${activeTab === tab ? 'bg-[#c9a84c] text-[#0a1a17]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                    style={{ fontWeight: activeTab === tab ? 600 : 400 }}
                  >
                    {tab === 'marcar' ? 'Marcar Aulas' : 'Agenda de Aulas'}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Filtros da agenda */}
          {activeTab === 'agenda' && activeRole !== 'ALUNO' && <FilterBar />}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeRole === 'ALUNO' ? (
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
                {activeRole === 'DIRECAO' && (() => {
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

                {activeRole !== 'DIRECAO' && (
                  <DisponibilidadeProfessoresPanel
                    aulasExistentes={aulas}
                    onMarcarSlot={activeRole === 'ENCARREGADO' ? (prefill) => handleMarcarSlot({ ...prefill, estudioId: prefill.estudioId || '' }) : undefined}
                  />
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

            {activeTab === 'historico' && activeRole === 'PROFESSOR' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#0d6b5e]/5">
                  <h2 className="text-xl font-semibold text-[#0d1b19] mb-2">Histórico de Aulas Lecionadas</h2>
                  <p className="text-sm text-[#4d7068]">Aulas que já foram realizadas</p>
                </div>
                
                {aulasFiltradas.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-[#0d6b5e]/5">
                    <Calendar className="w-16 h-16 text-[#0d6b5e]/20 mx-auto mb-4" />
                    <p className="text-[#4d7068] mb-1">Nenhuma aula realizada</p>
                    <p className="text-sm text-[#4d7068]/60">O histórico de aulas lecionadas aparecerá aqui</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aulasFiltradas.map(a => renderAulaCard(a, false))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {proporDataDirecaoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-[#0d1b19] mb-2">Propor Nova Data</h3>
            <p className="text-sm text-[#4d7068] mb-4">
              O professor pediu remarcação. Proponha uma data que será enviada ao encarregado para confirmação.
            </p>
            <label className="block text-sm font-medium text-[#0d1b19] mb-1">Nova data e hora</label>
            <input
              type="datetime-local"
              value={proporDataDirecaoModal.novaData}
              onChange={(e) => setProporDataDirecaoModal({ ...proporDataDirecaoModal, novaData: e.target.value })}
              className="w-full p-3 border border-[#0d6b5e]/20 rounded-lg mb-5 text-[#0d1b19]"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setProporDataDirecaoModal(null)}
                className="px-4 py-2 text-[#4d7068] hover:bg-[#f0f5f4] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!proporDataDirecaoModal.novaData) { toast.error('Selecione uma data'); return; }
                  const { aulaId, novaData } = proporDataDirecaoModal;
                  setProporDataDirecaoModal(null);
                  await handleResponderSugestaoDirecao(aulaId, true, novaData);
                }}
                className="px-4 py-2 bg-[#0d6b5e] text-white rounded-lg hover:bg-[#065147] transition-colors"
              >
                Enviar ao Encarregado
              </button>
            </div>
          </div>
        </div>
      )}

      {aprovarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-[#0d1b19] mb-2">Aprovar Aula</h3>
            <p className="text-sm text-[#4d7068] mb-4">
              Pode manter o espaço original ou atribuir um diferente antes de confirmar.
            </p>
            <label className="block text-sm font-medium text-[#0d1b19] mb-1">Espaço</label>
            <select
              value={aprovarModal.salaId}
              onChange={(e) => setAprovarModal({ ...aprovarModal, salaId: e.target.value })}
              className="w-full p-3 border border-[#0d6b5e]/20 rounded-lg mb-5 text-[#0d1b19]"
            >
              {estudios.map(e => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAprovarModal(null)}
                className="px-4 py-2 text-[#4d7068] hover:bg-[#f0f5f4] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const { aulaId, salaId } = aprovarModal;
                  setAprovarModal(null);
                  await handleAprovar(aulaId, salaId ? parseInt(salaId) : undefined);
                }}
                className="px-4 py-2 bg-[#0d6b5e] text-white rounded-lg hover:bg-[#065147] transition-colors"
              >
                Confirmar Aprovação
              </button>
            </div>
          </div>
        </div>
      )}

      {rejeitarAulaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-[#0d1b19] mb-1">Rejeitar Aula</h3>
            <p className="text-sm text-[#4d7068] mb-4">Indique o motivo da rejeição (opcional). O encarregado será notificado.</p>
            <textarea
              className="w-full p-3 border border-[#0d6b5e]/20 rounded-lg text-[#0d1b19] resize-none"
              rows={3}
              placeholder="Motivo da rejeição..."
              value={rejeitarAulaMotivoInput}
              onChange={e => setRejeitarAulaMotivoInput(e.target.value)}
            />
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => { setRejeitarAulaModal(null); setRejeitarAulaMotivoInput(''); }}
                className="px-4 py-2 text-[#4d7068] hover:bg-[#f0f5f4] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRejeitarAula}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {sugerirRemarcacaoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-[#0d1b19] mb-4">Sugerir Nova Data</h3>
            <p className="text-sm text-[#4d7068] mb-4">
              Selecione uma nova data para a aula. A direção receberá a sua sugestão eirá analisar.
            </p>
            <input
              type="datetime-local"
              value={novaDataRemarcacao}
              onChange={(e) => setNovaDataRemarcacao(e.target.value)}
              className="w-full p-3 border border-[#0d6b5e]/20 rounded-lg mb-4 text-[#0d1b19]"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setSugerirRemarcacaoModal(null); setNovaDataRemarcacao(''); }}
                className="px-4 py-2 text-[#4d7068] hover:bg-[#f0f5f4] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSugerirRemarcacao}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Enviar Sugestão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}