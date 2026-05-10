import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PedidoAula } from '../types';
import api from '../services/api';
import {
  Calendar, Clock, Download, Filter, BarChart3, CheckCircle,
  XCircle, Clock8, Ban, Award
} from 'lucide-react';
import { Link } from 'react-router';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  PENDENTE:   { label: 'Pendente',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  CONFIRMADA: { label: 'Confirmada', color: 'text-green-700',  bg: 'bg-green-100' },
  REALIZADA:  { label: 'Realizada',  color: 'text-blue-700',   bg: 'bg-blue-100' },
  REJEITADA:  { label: 'Rejeitada',  color: 'text-red-700',    bg: 'bg-red-100' },
  CANCELADA:  { label: 'Cancelada',  color: 'text-gray-600',   bg: 'bg-gray-100' },
};

function getStatusStyle(status: string) {
  return statusLabels[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100' };
}

export function Extrato() {
  const { user, activeRole } = useAuth();
  const [aulas, setAulas] = useState<PedidoAula[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  useEffect(() => {
    if (!user || !activeRole) return;
    const fetchAulas = async () => {
      try {
        const role = activeRole;
        const aulasEndpoint =
          role === 'ALUNO' ? api.getAlunoAulas() :
          role === 'ENCARREGADO' ? api.getEncarregadoAulas() :
          role === 'PROFESSOR' ? api.getProfessorAulas() :
          role === 'DIRECAO' ? api.getDirecaoAulas() :
          api.getMyAulas();
        const res = await aulasEndpoint;
        if (res.success && res.data) setAulas(res.data);
      } catch (err) {
        console.error('Erro ao carregar extrato:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAulas();
  }, [user, activeRole]);

  const aulasFiltradas = useMemo(() => {
    const prefixoMes = String(mes).padStart(2, '0');
    return aulas.filter(a => {
      if (!a.data) return false;
      const [aAno, aMes] = a.data.split('-');
      if (aAno !== String(ano) || aMes !== prefixoMes) return false;
      if (filtroStatus !== 'TODOS' && a.status !== filtroStatus) return false;
      return true;
    });
  }, [aulas, ano, mes, filtroStatus]);

  const resumo = useMemo(() => {
    const total = aulasFiltradas.length;
    const horas = aulasFiltradas.reduce((acc, a) => acc + (a.duracao || 0), 0);
    const porStatus: Record<string, number> = {};
    aulasFiltradas.forEach(a => {
      porStatus[a.status] = (porStatus[a.status] || 0) + 1;
    });
    return { total, horas, porStatus, horasFormat: `${Math.floor(horas / 60)}h ${horas % 60}m` };
  }, [aulasFiltradas]);

  const exportCSV = () => {
    const linhas = [
      ['Data', 'Hora', 'Duração', 'Modalidade', 'Professor', 'Sala', 'Estado'].join(',')
    ];
    aulasFiltradas.forEach(a => {
      linhas.push([
        a.data, a.horaInicio, `${a.duracao || 60}min`,
        a.modalidade, a.professorNome, a.estudioNome, a.status
      ].join(','));
    });
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato-${ano}-${String(mes).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user || !activeRole) return null;

  const anosDisponiveis = Array.from(
    new Set(aulas.map(a => a.data?.split('-')[0]).filter(Boolean))
  ).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0a1a17]">Extrato de Aulas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Consulte o resumo mensal das suas aulas
          </p>
        </div>
        <Link
          to="/dashboard/aulas"
          className="flex items-center gap-2 text-sm text-[#0d6b5e] hover:text-[#065147] transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Voltar às Aulas
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Ano</label>
            <select
              value={ano}
              onChange={e => setAno(parseInt(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
            >
              {anosDisponiveis.length > 0 ? anosDisponiveis.map(a => (
                <option key={a} value={a}>{a}</option>
              )) : <option value={ano}>{ano}</option>}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Mês</label>
            <select
              value={mes}
              onChange={e => setMes(parseInt(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
            >
              {meses.map((nome, i) => (
                <option key={i + 1} value={i + 1}>{nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Estado</label>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
            >
              <option value="TODOS">Todos</option>
              <option value="PENDENTE">Pendente</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="REALIZADA">Realizada</option>
              <option value="REJEITADA">Rejeitada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-[#0a1a17] text-white px-4 py-2 rounded-lg hover:bg-[#1a2a27] transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : (
        <>
          {/* Cartões de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0a1a17]/5 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-[#0a1a17]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Aulas</p>
                  <p className="text-2xl font-bold text-[#0a1a17]">{resumo.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Horas Totais</p>
                  <p className="text-2xl font-bold text-[#0a1a17]">{resumo.horasFormat}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Confirmadas</p>
                  <p className="text-2xl font-bold text-green-600">{resumo.porStatus['CONFIRMADA'] || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Clock8 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600">{resumo.porStatus['PENDENTE'] || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#0a1a17]">
                Aulas de {meses[mes - 1]} {ano}
              </h2>
            </div>
            {aulasFiltradas.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                Nenhuma aula encontrada para este período.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hora</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Duração</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Modalidade</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Professor</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Sala</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aulasFiltradas.map(a => {
                      const st = getStatusStyle(a.status);
                      return (
                        <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(a.data + 'T00:00:00').toLocaleDateString('pt-PT')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{a.horaInicio}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{a.duracao || 60} min</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{a.modalidade}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{a.professorNome}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{a.estudioNome}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.bg} ${st.color}`}>
                              {a.status === 'CONFIRMADA' && <CheckCircle className="w-3 h-3" />}
                              {a.status === 'REALIZADA' && <Award className="w-3 h-3" />}
                              {a.status === 'REJEITADA' && <XCircle className="w-3 h-3" />}
                              {a.status === 'CANCELADA' && <Ban className="w-3 h-3" />}
                              {a.status === 'PENDENTE' && <Clock8 className="w-3 h-3" />}
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
