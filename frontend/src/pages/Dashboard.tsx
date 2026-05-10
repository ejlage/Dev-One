import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router';
import { Calendar, Clock, CheckCircle2, AlertCircle, ChevronRight, ShoppingBag, Users, BookOpen, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PrintAulasModal } from '../components/PrintAulasModal';
import api from '../services/api';

export function Dashboard() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [aulas, setAulas] = useState<any[]>([]);
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const fetchPromises = [
          api.getAulas(),
          api.getAnuncios(),
          api.getTurmas()
        ];
        
        if (user.role === 'PROFESSOR') {
          fetchPromises.push(api.getProfessorDisponibilidades());
        }
        
        const results = await Promise.all(fetchPromises);
        
        if (results[0].success) setAulas(results[0].data || []);
        if (results[1].success) setAnuncios(results[1].data || []);
        if (results[2].success) setTurmas(results[2].data || []);
        if (user.role === 'PROFESSOR' && results[3]?.success) {
          setDisponibilidades(results[3].data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (!user) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 19) return 'Boa tarde';
    return 'Boa noite';
  };

  const getFilteredAulas = () => {
    if (user.role === 'ALUNO') return aulas.filter(a => a.alunoId === user.id);
    if (user.role === 'PROFESSOR') return aulas.filter(a => a.professorId === user.id);
    if (user.role === 'ENCARREGADO') return aulas.filter(a => a.encarregadoId === user.id);
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

    const turmasAbertas = turmas.filter(t => t.status === 'ABERTA').length;
    const totalAlunosTurmas = turmas.reduce((acc: number, t: any) => acc + (t.alunosInscritos?.length || 0), 0);

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

        {user.role === 'PROFESSOR' && disponibilidades.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-[#0d6b5e]/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-[#0a1a17]">As Minhas Disponibilidades</h2>
              <Link to="/dashboard/disponibilidades"
                className="flex items-center gap-1 text-sm text-[#0d6b5e] hover:text-[#065147] transition-colors"
                style={{ fontWeight: 500 }}>
                Gerir <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {disponibilidades.slice(0, 6).map(d => (
                <div key={d.id} className="p-4 rounded-xl border border-[#0d6b5e]/10 bg-[#f4f9f8]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#0d6b5e] rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#0a1a17]">{d.diaSemana}</div>
                      <div className="text-xs text-[#4d7068]">{d.horaInicio} - {d.horaFim}</div>
                    </div>
                  </div>
                  <div className="text-xs text-[#4d7068]">
                    {d.modalidadeNome}
                  </div>
                </div>
              ))}
            </div>
          </div>
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