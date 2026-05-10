import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Shield, Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const ENTIDADES = ['Todas', 'PedidoAula', 'Evento', 'Anuncio', 'Figurino', 'TransacaoFigurino', 'Utilizador', 'Grupo'];
const ACOES = ['Todas', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'CANCEL', 'LOGIN'];

const ACTION_BADGES: Record<string, { bg: string; text: string }> = {
  CREATE:  { bg: 'bg-green-100', text: 'text-green-800' },
  UPDATE:  { bg: 'bg-blue-100', text: 'text-blue-800' },
  DELETE:  { bg: 'bg-red-100', text: 'text-red-800' },
  APPROVE: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  REJECT:  { bg: 'bg-orange-100', text: 'text-orange-800' },
  CANCEL:  { bg: 'bg-rose-100', text: 'text-rose-800' },
  LOGIN:   { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const DEFAULT_BADGE = { bg: 'bg-gray-100', text: 'text-gray-800' };
const ITEMS_PER_PAGE = 20;

export function Auditoria() {
  const { user } = useAuth();

  const [entidade, setEntidade] = useState('Todas');
  const [acao, setAcao] = useState('Todas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [utilizadorNome, setUtilizadorNome] = useState('');

  const [appliedEntidade, setAppliedEntidade] = useState('Todas');
  const [appliedAcao, setAppliedAcao] = useState('Todas');
  const [appliedDataInicio, setAppliedDataInicio] = useState('');
  const [appliedDataFim, setAppliedDataFim] = useState('');

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const filters: any = { limit: 500 };
      if (appliedAcao !== 'Todas') filters.acao = appliedAcao;
      if (appliedEntidade !== 'Todas') filters.entidade = appliedEntidade;
      if (appliedDataInicio) filters.dataInicio = appliedDataInicio;
      if (appliedDataFim) filters.dataFim = appliedDataFim;

      const res = await api.getAuditLogs(filters);
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [appliedEntidade, appliedAcao, appliedDataInicio, appliedDataFim]);

  const handleFiltrar = () => {
    setCurrentPage(1);
    setAppliedEntidade(entidade);
    setAppliedAcao(acao);
    setAppliedDataInicio(dataInicio);
    setAppliedDataFim(dataFim);
  };

  const handleLimpar = () => {
    setEntidade('Todas');
    setAcao('Todas');
    setDataInicio('');
    setDataFim('');
    setUtilizadorNome('');
    setCurrentPage(1);
    setAppliedEntidade('Todas');
    setAppliedAcao('Todas');
    setAppliedDataInicio('');
    setAppliedDataFim('');
  };

  const logsFiltrados = useMemo(() => {
    if (!utilizadorNome.trim()) return logs;
    const q = utilizadorNome.toLowerCase().trim();
    return logs.filter(l => l.utilizadorNome.toLowerCase().includes(q));
  }, [logs, utilizadorNome]);

  const totalFiltered = logsFiltrados.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
  const paginatedLogs = logsFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('pt-PT'),
      time: d.toISOString().substring(11, 16),
    };
  };

  const getBadge = (a: string) => ACTION_BADGES[a] || DEFAULT_BADGE;

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-[#0a1a17]/5 rounded-xl">
          <Shield className="w-6 h-6 text-[#0a1a17]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0a1a17]">Registo de Auditoria</h1>
          <p className="text-gray-500 text-sm mt-1">Consultar o histórico de ações no sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Entidade</label>
            <select
              value={entidade}
              onChange={e => setEntidade(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
            >
              {ENTIDADES.map(e => (
                <option key={e} value={e}>{e === 'Todas' ? 'Todas as Entidades' : e}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Ação</label>
            <select
              value={acao}
              onChange={e => setAcao(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
            >
              {ACOES.map(a => (
                <option key={a} value={a}>{a === 'Todas' ? 'Todas as Ações' : a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Data início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Data fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Utilizador</label>
            <input
              type="text"
              placeholder="Nome do utilizador"
              value={utilizadorNome}
              onChange={e => setUtilizadorNome(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 w-48"
            />
          </div>

          <button
            onClick={handleFiltrar}
            className="flex items-center gap-2 bg-[#0a1a17] text-white px-4 py-2 rounded-lg hover:bg-[#1a2a27] transition-colors text-sm"
          >
            <Search className="w-4 h-4" />
            Filtrar
          </button>
          <button
            onClick={handleLimpar}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar Filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : paginatedLogs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Shield className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">Nenhum registo de auditoria encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#0a1a17]">
              Registos de Auditoria
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({totalFiltered} registos)
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Utilizador</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ação</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Entidade</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map(log => {
                  const { date, time } = formatDateTime(log.data);
                  const badge = getBadge(log.acao);
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        <span className="block">{date}</span>
                        <span className="text-xs text-gray-400">{time}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{log.utilizadorNome}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {log.acao}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{log.entidade}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{log.entidadeId ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.detalhes || ''}>
                        {log.detalhes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, totalFiltered)} de {totalFiltered} registos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span className="text-sm text-gray-600 px-2">
                {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Seguinte
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
