import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Bell, X, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { Notificacao } from '../types';

const NOTIFICACAO_LINK: Record<string, string> = {
  AULA_CONFIRMADA: '/dashboard/aulas',
  AULA_APROVADA: '/dashboard/aulas',
  AULA_REJEITADA: '/dashboard/aulas',
  AULA_CANCELADA: '/dashboard/aulas',
  AULA_REALIZADA: '/dashboard/aulas',
  AULA_REMARCADA: '/dashboard/aulas',
  PEDIDO_REJEITADO_AUTO: '/dashboard/aulas',
  SUGESTAO_REMARCACAO_DIRECAO: '/dashboard/aulas',
  SUGESTAO_REMARCACAO_EE: '/dashboard/aulas',
  SUGESTAO_REMARCACAO_PROFESSOR: '/dashboard/aulas',
  REMARCACAO_REJEITADA_PROFESSOR: '/dashboard/aulas',
  SUGESTAO_EXPIRADA: '/dashboard/aulas',
  GRUPO_INSCRICAO: '/dashboard/turmas',
  GRUPO_REMOCAO: '/dashboard/turmas',
  GRUPO_FECHADO: '/dashboard/turmas',
  GRUPO_ABERTO: '/dashboard/turmas',
  GRUPO_ARQUIVADO: '/dashboard/turmas',
  ANUNCIO_APROVADO: '/dashboard/marketplace',
  ANUNCIO_REJEITADO: '/dashboard/marketplace',
  ANUNCIO_PENDENTE: '/dashboard/marketplace',
  ALUGUER_RESERVA: '/dashboard/marketplace',
  EVENTO_PUBLICADO: '/eventos',
  EVENTO_REMARCADO: '/eventos',
};

export function NotificacoesBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchCount = async () => {
    const res = await api.getNotificacoesNaoLidas();
    if (res.success) setNaoLidas(res.data.length);
  };

  const fetchAll = async () => {
    const res = await api.getNotificacoes();
    if (res.success) {
      setNotificacoes(res.data as Notificacao[]);
      setNaoLidas((res.data as Notificacao[]).filter(n => !n.lida).length);
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchAll();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarcarLida = async (id: number) => {
    await api.marcarNotificacaoLida(id);
    setNotificacoes(prev => prev.map(n => n.idnotificacao === id ? { ...n, lida: true } : n));
    setNaoLidas(prev => Math.max(0, prev - 1));
  };

  const handleMarcarTodas = async () => {
    await api.marcarTodasNotificacoesLidas();
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setNaoLidas(0);
  };

  const handleClicarNotificacao = async (n: Notificacao) => {
    const link = NOTIFICACAO_LINK[n.tipo] ?? '/dashboard';
    if (!n.lida) {
      await api.marcarNotificacaoLida(n.idnotificacao);
      setNotificacoes(prev => prev.map(x => x.idnotificacao === n.idnotificacao ? { ...x, lida: true } : x));
      setNaoLidas(prev => Math.max(0, prev - 1));
    }
    setOpen(false);
    navigate(link);
  };

  const handleEliminar = async (id: number) => {
    const notif = notificacoes.find(n => n.idnotificacao === id);
    await api.deleteNotificacao(id);
    setNotificacoes(prev => prev.filter(n => n.idnotificacao !== id));
    if (notif && !notif.lida) setNaoLidas(prev => Math.max(0, prev - 1));
  };

  const formatTime = (date: string) => {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `há ${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `há ${diffH}h`;
    return new Date(date).toLocaleDateString('pt-PT');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        title="Notificações"
      >
        <Bell className="w-5 h-5" />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-0.5" style={{ fontWeight: 700 }}>
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-[#0d6b5e]/10 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#0d6b5e]/10">
            <span className="text-sm text-[#0a1a17]" style={{ fontWeight: 600 }}>
              Notificações
              {naoLidas > 0 && (
                <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{naoLidas} novas</span>
              )}
            </span>
            {naoLidas > 0 && (
              <button
                onClick={handleMarcarTodas}
                className="flex items-center gap-1 text-xs text-[#0d6b5e] hover:text-[#065147] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-[#0d6b5e]/20 mx-auto mb-2" />
                <p className="text-sm text-[#4d7068]">Sem notificações</p>
              </div>
            ) : (
              notificacoes.map(n => {
                return (
                <div
                  key={n.idnotificacao}
                  className={`flex gap-2 px-4 py-3 border-b border-[#0d6b5e]/5 last:border-0 transition-colors cursor-pointer ${n.lida ? 'bg-white hover:bg-gray-50' : 'bg-[#e2f0ed] hover:bg-[#d4ebe5]'}`}
                  onClick={() => handleClicarNotificacao(n)}
                >
                  <div className="flex-1 min-w-0 pt-0.5">
                    {!n.lida && (
                      <span className="inline-block w-2 h-2 bg-[#0d6b5e] rounded-full mr-1.5 mb-0.5 align-middle shrink-0" />
                    )}
                    <p className="text-sm text-[#0a1a17] leading-snug">{n.mensagem}</p>
                    <p className="text-xs text-[#4d7068] mt-0.5">{formatTime(n.datanotificacao)}<span className="ml-1.5 text-[#0d6b5e]">→ ver</span></p>
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                    {!n.lida && (
                      <button
                        onClick={() => handleMarcarLida(n.idnotificacao)}
                        className="p-1 rounded text-[#0d6b5e] hover:bg-[#0d6b5e]/10 transition-colors"
                        title="Marcar como lida"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminar(n.idnotificacao)}
                      className="p-1 rounded text-[#4d7068] hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
