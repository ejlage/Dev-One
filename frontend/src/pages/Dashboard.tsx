import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router';
import { Calendar, Clock, CheckCircle2, AlertCircle, ChevronRight, ShoppingBag, Users, BookOpen, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PrintAulasModal } from '../components/PrintAulasModal';

export function Dashboard() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [aulas, setAulas] = useState<any[]>([]);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5;

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
    status: estado,
    professorId: professor.iduser ? String(professor.iduser) : '',
    professorNome: professor.nome || 'Professor',
    estudioNome: sala.nomesala ? `Sala ${sala.nomesala}` : 'Sem sala',
    alunoId: alunos[0]?.aluno?.utilizador?.iduser
      ? String(alunos[0].aluno.utilizador.iduser)
      : '',
    alunoNome: alunos.length
      ? alunos.map((a: any) => a.aluno?.utilizador?.nome).filter(Boolean).join(', ')
      : 'Sem alunos',
    encarregadoId: encarregado.iduser ? String(encarregado.iduser) : '',
  };
};

  useEffect(() => {
  const fetchData = async () => {
    try {
      const aulasRes = await api.getAulas();
      const aulasMapeadas = (aulasRes.aulas || []).map(mapAulaFromApi);

      setAulas(aulasMapeadas);

      // Ainda sem backend para estas secções
      setAnuncios([]);
      setTurmas([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setAulas([]);
      setAnuncios([]);
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  if (!user) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 19) return 'Boa tarde';
    return 'Boa noite';
  };

  const getFilteredAulas = () => {
    if (user.role === 'ALUNO') return aulas.filter(a => a.alunoId === String(user.iduser));
    if (user.role === 'PROFESSOR') return aulas.filter(a => a.professorId === String(user.iduser));
    if (user.role === 'ENCARREGADO') return aulas.filter(a => a.encarregadoId === String(user.iduser));
    return aulas;
  };

  const allAulas = getFilteredAulas();

  const getFilteredAnuncios = () => {
    if (user.role === 'DIRECAO') return anuncios;
    if (user.role === 'ENCARREGADO') return anuncios.filter(a => a.vendedorId === user.id);
    return [];
  };

  const meusAnuncios = getFilteredAnuncios();

  const getStatistics = () => {
    const pendentes  = allAulas.filter(a => a.status === 'PENDENTE').length;
    const agendadas  = allAulas.filter(a => a.status === 'CONFIRMADA').length;
    const rejeitadas = allAulas.filter(a => a.status === 'REJEITADA').length;
    const realizadas = allAulas.filter(a => a.status === 'REALIZADA').length;

    const anunciosPendentes  = meusAnuncios.filter(a => a.status === 'PENDENTE').length;
    const anunciosAprovados  = meusAnuncios.filter(a => a.status === 'APROVADO').length;
    const anunciosRejeitados = meusAnuncios.filter(a => a.status === 'REJEITADO').length;

    // Turmas do professor
    const minhasTurmas = turmas.filter(t => t.professorId === user.id);
    const turmasAbertas = minhasTurmas.filter(t => t.status === 'ABERTA').length;
    const totalAlunosTurmas = minhasTurmas.reduce((acc, t) => acc + t.alunosInscritos.length, 0);

    return {
      pendentes, agendadas, rejeitadas, realizadas,
      anunciosPendentes, anunciosAprovados, anunciosRejeitados,
      turmasAbertas, totalAlunosTurmas,
    };
  };

  const stats = getStatistics();

  const proximasAulas = allAulas
    .filter(a => new Date(a.data) >= new Date() && a.status === 'CONFIRMADA')
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 3);

  const aulasRecentes = [...allAulas].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const totalPages  = Math.ceil(aulasRecentes.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const paginatedAulas = aulasRecentes.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const getStatusBadge = (status: string) => {
    const cfg: Record<string, { bg: string; text: string; label: string; icon: any }> = {
      PENDENTE:   { bg: 'bg-amber-100',    text: 'text-amber-700',    label: 'Pendente',   icon: Clock },
      CONFIRMADA: { bg: 'bg-teal-100',     text: 'text-teal-700',     label: 'Agendada',   icon: CheckCircle2 },
      REALIZADA:  { bg: 'bg-[#e2f0ed]',   text: 'text-[#0d6b5e]',   label: 'Realizada',  icon: CheckCircle2 },
      CANCELADA:  { bg: 'bg-red-100',      text: 'text-red-700',      label: 'Cancelada',  icon: AlertCircle },
      REJEITADA:  { bg: 'bg-red-100',      text: 'text-red-700',      label: 'Rejeitada',  icon: AlertCircle },
    };
    const c = cfg[status] || cfg.PENDENTE;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${c.bg} ${c.text}`}>
        <Icon className="w-4 h-4" />{c.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f9f8] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-[#4d7068]">
          <Link to="/" className="hover:text-[#0d6b5e] transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[#0a1a17]">Dashboard</span>
        </div>

        {/* Saudação */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <h1 className="text-3xl md:text-4xl text-[#0a1a17] mb-2">
            {getGreeting()}, <span className="text-[#0d6b5e]">{user.nome.split(' ')[0]}</span>!
          </h1>
          {(user.role === 'PROFESSOR' || user.role === 'DIRECAO') && (
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#0d6b5e]/20 text-[#0d6b5e] rounded-xl hover:bg-[#e2f0ed] hover:border-[#0d6b5e]/40 transition-all shadow-sm shrink-0 text-sm"
              style={{ fontWeight: 500 }}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir Aulas Realizadas</span>
              <span className="sm:hidden">Imprimir</span>
            </button>
          )}
        </div>

        {/* ── Estatísticas ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* DIREÇÃO */}
          {user.role === 'DIRECAO' && (
            <>
              <div className="bg-white p-6 rounded-2xl border border-[#0d6b5e]/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-[#0d6b5e]">{stats.pendentes}</div>
                  <div className="w-12 h-12 bg-[#e2f0ed] rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#0d6b5e]" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Pedidos de Aulas</div>
                <div className="text-sm text-[#4d7068]">Pendentes</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#c9a84c]/20 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-[#c9a84c]">{stats.anunciosPendentes}</div>
                  <div className="w-12 h-12 bg-[#c9a84c]/10 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Anúncios Marketplace</div>
                <div className="text-sm text-[#4d7068]">Pendentes</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#0d6b5e]/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-[#1a9885]">{stats.agendadas}</div>
                  <div className="w-12 h-12 bg-[#e2f0ed] rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#1a9885]" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Aulas</div>
                <div className="text-sm text-[#4d7068]">Agendadas</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-red-600">{stats.rejeitadas}</div>
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Aulas</div>
                <div className="text-sm text-[#4d7068]">Rejeitadas</div>
              </div>
            </>
          )}

          {/* PROFESSOR */}
          {user.role === 'PROFESSOR' && (
            <>
              <div className="bg-white p-6 rounded-2xl border border-[#0d6b5e]/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-[#0d6b5e]">{stats.pendentes}</div>
                  <div className="w-12 h-12 bg-[#e2f0ed] rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#0d6b5e]" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Aulas</div>
                <div className="text-sm text-[#4d7068]">Pendentes</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#0d6b5e]/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-[#1a9885]">{stats.agendadas}</div>
                  <div className="w-12 h-12 bg-[#e2f0ed] rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#1a9885]" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Aulas</div>
                <div className="text-sm text-[#4d7068]">Confirmadas</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#0d6b5e]/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-[#c9a84c]">{stats.turmasAbertas}</div>
                  <div className="w-12 h-12 bg-[#c9a84c]/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Grupos</div>
                <div className="text-sm text-[#4d7068]">Abertas</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-red-600">{stats.rejeitadas}</div>
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Aulas</div>
                <div className="text-sm text-[#4d7068]">Rejeitadas</div>
              </div>
            </>
          )}

          {/* ENCARREGADO / ALUNO */}
          {(user.role === 'ENCARREGADO' || user.role === 'ALUNO') && (
            <>
              <div className="bg-white p-6 rounded-2xl border border-[#0d6b5e]/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-[#0d6b5e]">{stats.pendentes}</div>
                  <div className="w-12 h-12 bg-[#e2f0ed] rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#0d6b5e]" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Pedidos</div>
                <div className="text-sm text-[#4d7068]">Pendentes</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#0d6b5e]/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-[#1a9885]">{stats.agendadas}</div>
                  <div className="w-12 h-12 bg-[#e2f0ed] rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-[#1a9885]" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Aulas</div>
                <div className="text-sm text-[#4d7068]">Aprovadas</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl text-red-600">{stats.rejeitadas}</div>
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">Pedidos</div>
                <div className="text-sm text-[#4d7068]">Rejeitados</div>
              </div>
              {user.role === 'ENCARREGADO' && meusAnuncios.length > 0 && (
                <>
                  <div className="bg-white p-6 rounded-2xl border border-[#c9a84c]/20 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-4xl text-[#c9a84c]">{stats.anunciosPendentes}</div>
                      <div className="w-12 h-12 bg-[#c9a84c]/10 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-[#c9a84c]" />
                      </div>
                    </div>
                    <div className="text-sm text-[#4d7068]">Anúncios</div>
                    <div className="text-sm text-[#4d7068]">Pendentes</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-[#0d6b5e]/10 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-4xl text-[#0d6b5e]">{stats.anunciosAprovados}</div>
                      <div className="w-12 h-12 bg-[#e2f0ed] rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-[#0d6b5e]" />
                      </div>
                    </div>
                    <div className="text-sm text-[#4d7068]">Anúncios</div>
                    <div className="text-sm text-[#4d7068]">Aprovados</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-4xl text-red-600">{stats.anunciosRejeitados}</div>
                      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                    <div className="text-sm text-[#4d7068]">Anúncios</div>
                    <div className="text-sm text-[#4d7068]">Rejeitados</div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Turmas do professor (resumo) ─────────────────────────────────── */}
        {user.role === 'PROFESSOR' && (
          (() => {
            const minhasTurmas = turmas.filter(t => t.professorId === user.id && t.status !== 'ARQUIVADA');
            if (minhasTurmas.length === 0) return null;
            return (
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-[#0d6b5e]/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-[#0a1a17]">Os Meus Grupos</h2>
                  <Link to="/dashboard/turmas"
                    className="flex items-center gap-1 text-sm text-[#0d6b5e] hover:text-[#065147] transition-colors"
                    style={{ fontWeight: 500 }}>
                    Ver todas <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {minhasTurmas.slice(0, 3).map(t => {
                    const livres = t.lotacaoMaxima - t.alunosInscritos.length;
                    const pct = t.lotacaoMaxima > 0 ? (t.alunosInscritos.length / t.lotacaoMaxima) * 100 : 0;
                    return (
                      <div key={t.id} className="rounded-xl overflow-hidden border border-[#0d6b5e]/5">
                        <div className="h-1.5" style={{ background: t.cor }} />
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-[#0a1a17]" style={{ fontWeight: 600 }}>{t.nome}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${t.status === 'ABERTA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                              style={{ fontWeight: 500 }}>
                              {t.status === 'ABERTA' ? 'Aberta' : 'Fechada'}
                            </span>
                          </div>
                          <p className="text-xs text-[#4d7068] mb-3">{t.modalidade} · {t.nivel}</p>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#4d7068]">{t.alunosInscritos.length}/{t.lotacaoMaxima} alunos</span>
                            <span className={livres > 0 ? 'text-[#0d6b5e]' : 'text-red-500'} style={{ fontWeight: 500 }}>
                              {livres > 0 ? `${livres} vagas` : 'Esgotado'}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: t.cor }} />
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-xs text-[#4d7068]">
                            <Users className="w-3 h-3" />
                            {t.alunosInscritos.length} aluno{t.alunosInscritos.length !== 1 ? 's' : ''} inscrito{t.alunosInscritos.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()
        )}

        {/* ── Histórico de aulas ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#0d6b5e]/10">
          <h2 className="text-xl text-[#0a1a17] mb-4">
            {user.role === 'PROFESSOR' ? 'As Minhas Aulas' : 'Aulas Recentes'}
          </h2>

          {/* Tabela Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#0d6b5e]/10 text-left">
                  <th className="pb-3 text-sm text-[#4d7068]">Data</th>
                  <th className="pb-3 text-sm text-[#4d7068]">
                    {user.role === 'PROFESSOR' ? 'Aluno' : 'Professor'}
                  </th>
                  <th className="pb-3 text-sm text-[#4d7068]">Sala</th>
                  <th className="pb-3 text-sm text-[#4d7068]">Estado</th>
                  <th className="pb-3 text-sm text-[#4d7068]"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedAulas.map(aula => (
                  <tr key={aula.id} className="border-b border-[#0d6b5e]/5 hover:bg-[#f4f9f8] transition-colors">
                    <td className="py-4">
                      <div className="text-sm text-[#0a1a17]">{formatDate(aula.data)}</div>
                      <div className="text-sm text-[#4d7068]">{aula.horaInicio} – {aula.horaFim}</div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#e2f0ed] rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-[#0d6b5e]" />
                        </div>
                        <span className="text-sm text-[#0a1a17]">
                          {user.role === 'PROFESSOR' ? aula.alunoNome : aula.professorNome}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-[#0a1a17]">{aula.estudioNome}</td>
                    <td className="py-4">{getStatusBadge(aula.status)}</td>
                    <td className="py-4">
                      <button className="text-[#0d6b5e]/30 hover:text-[#0d6b5e] transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards Mobile */}
          <div className="md:hidden space-y-4">
            {paginatedAulas.map(aula => (
              <div key={aula.id} className="p-4 border border-[#0d6b5e]/10 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-[#0a1a17]">{formatDate(aula.data)}</div>
                  {getStatusBadge(aula.status)}
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#e2f0ed] rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#0d6b5e]" />
                  </div>
                  <div>
                    <div className="text-sm text-[#0a1a17]">
                      {user.role === 'PROFESSOR' ? aula.alunoNome : aula.professorNome}
                    </div>
                    <div className="text-sm text-[#4d7068]">{aula.estudioNome}</div>
                  </div>
                </div>
                <div className="text-sm text-[#4d7068]">{aula.horaInicio} – {aula.horaFim}</div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#0d6b5e]/10">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm text-[#4d7068] hover:text-[#0d6b5e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Anterior
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${currentPage === page ? 'bg-[#0d6b5e] text-white' : 'text-[#4d7068] hover:bg-[#e2f0ed]'}`}>
                    {page}
                  </button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm text-[#4d7068] hover:text-[#0d6b5e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de impressão */}
      {showPrintModal && (
        <PrintAulasModal
          currentUser={user}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}