import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockUsers, mockPedidosAulas, mockTurmas } from '../data/mockData';
import { PedidoAula } from '../types';
import { AlertCircle, Info, Lock, Users } from 'lucide-react';
import { toast } from 'sonner';

interface NovaAulaFormProps {
  onSuccess: (aula: PedidoAula) => void;
  onCancel: () => void;
  aulasExistentes: PedidoAula[];
  prefill?: {
    professorId?: string;
    estudioId?: string; // mantido para compatibilidade, não usado no form
    data?: string;
    horaInicio?: string;
    duracao?: string;
  };
}

type TipoAula = 'individual' | 'privada';

export function NovaAulaForm({ onSuccess, onCancel, aulasExistentes, prefill }: NovaAulaFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    alunoId: '',
    professorId: user?.role === 'PROFESSOR' ? user.id : '',
    data: '',
    horaInicio: '',
    duracao: '60',
    modalidade: '',
    observacoes: '',
    tipoAula: 'individual' as TipoAula,
    turmaId: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (prefill) {
      setFormData(prev => ({
        ...prev,
        professorId: prefill.professorId ?? (user?.role === 'PROFESSOR' ? user.id : prev.professorId),
        data: prefill.data ?? prev.data,
        horaInicio: prefill.horaInicio ?? prev.horaInicio,
        duracao: prefill.duracao ?? prev.duracao,
      }));
    }
  }, [prefill]);

  if (!user) return null;

  const calcularHoraFim = (horaInicio: string, duracao: number): string => {
    if (!horaInicio) return '';
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + duracao;
    const horasFim = Math.floor(totalMinutos / 60);
    const minutosFim = totalMinutos % 60;
    return `${String(horasFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}`;
  };

  const validarConflitosProfessor = (
    professorId: string,
    data: string,
    horaInicio: string,
    horaFim: string
  ): string[] => {
    const erros: string[] = [];
    const aulasAtivas = aulasExistentes.filter(
      a => a.status === 'CONFIRMADA' || a.status === 'PENDENTE'
    );
    const conflitoProf = aulasAtivas.find(a =>
      a.professorId === professorId &&
      a.data === data &&
      (
        (horaInicio >= a.horaInicio && horaInicio < a.horaFim) ||
        (horaFim > a.horaInicio && horaFim <= a.horaFim) ||
        (horaInicio <= a.horaInicio && horaFim >= a.horaFim)
      )
    );
    if (conflitoProf) {
      erros.push(`O professor já tem uma aula agendada das ${conflitoProf.horaInicio} às ${conflitoProf.horaFim}`);
    }
    return erros;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const novosErros: string[] = [];
    if (!formData.alunoId) novosErros.push('Selecione um aluno');
    if (!formData.professorId) novosErros.push('Selecione um professor');
    if (!formData.data) novosErros.push('Selecione uma data');
    if (!formData.horaInicio) novosErros.push('Selecione o horário de início');
    if (!formData.modalidade) novosErros.push('Selecione a modalidade');
    if (formData.tipoAula === 'privada' && !formData.turmaId) {
      novosErros.push('Selecione o grupo para a aula privada');
    }

    const duracao = parseInt(formData.duracao);
    if (duracao < 30 || duracao > 120) {
      novosErros.push('A duração deve estar entre 30 e 120 minutos');
    }

    const dataAula = new Date(formData.data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataAula < hoje) {
      novosErros.push('A data não pode ser no passado');
    }

    if (novosErros.length > 0) {
      setErrors(novosErros);
      toast.error('Corrija os erros no formulário');
      return;
    }

    const horaFim = calcularHoraFim(formData.horaInicio, duracao);

    const conflitoErros = validarConflitosProfessor(
      formData.professorId,
      formData.data,
      formData.horaInicio,
      horaFim
    );
    if (conflitoErros.length > 0) {
      setErrors(conflitoErros);
      toast.error('Conflito de horário detectado');
      return;
    }

    const aluno = mockUsers.find(u => u.id === formData.alunoId);
    const professor = mockUsers.find(u => u.id === formData.professorId);
    const turma = formData.turmaId ? mockTurmas.find(t => t.id === formData.turmaId) : undefined;

    if (!aluno || !professor) {
      toast.error('Erro ao buscar dados');
      return;
    }

    const novoPedido: PedidoAula = {
      id: `aula-${Date.now()}`,
      alunoId: formData.alunoId,
      alunoNome: aluno.nome,
      encarregadoId: user.id,
      professorId: formData.professorId,
      professorNome: professor.nome,
      estudioId: turma?.estudioId ?? '',
      estudioNome: turma?.estudioNome ?? 'A definir pela direção',
      modalidade: formData.modalidade,
      data: formData.data,
      horaInicio: formData.horaInicio,
      horaFim: horaFim,
      duracao: duracao,
      status: 'PENDENTE',
      observacoes: [
        formData.observacoes,
        formData.tipoAula === 'privada' && turma ? `Aula privada — Grupo: ${turma.nome}` : '',
        formData.tipoAula === 'privada' && !turma ? 'Aula privada' : '',
      ].filter(Boolean).join(' · '),
      criadoEm: new Date().toISOString(),
    };

    onSuccess(novoPedido);
    toast.success('Pedido de aula criado com sucesso! Aguardando aprovação da direção.');

    setFormData({
      alunoId: '',
      professorId: user?.role === 'PROFESSOR' ? user.id : '',
      data: '',
      horaInicio: '',
      duracao: '60',
      modalidade: '',
      observacoes: '',
      tipoAula: 'individual',
      turmaId: '',
    });
  };

  const alunosDisponiveis = user.role === 'ENCARREGADO'
    ? mockUsers.filter(u => u.encarregadoId === user.id)
    : mockUsers.filter(u => u.role === 'ALUNO');

  const professores = mockUsers.filter(u => u.role === 'PROFESSOR');

  // Turmas do professor selecionado (para aula privada)
  const turmasDoProf = formData.professorId
    ? mockTurmas.filter(t => t.professorId === formData.professorId && t.status !== 'ARQUIVADA')
    : [];

  if (user.role === 'ENCARREGADO' && alunosDisponiveis.length === 1 && !formData.alunoId) {
    setFormData(prev => ({ ...prev, alunoId: alunosDisponiveis[0].id }));
  }

  const horaFimCalculada = formData.horaInicio && formData.duracao
    ? calcularHoraFim(formData.horaInicio, parseInt(formData.duracao))
    : '';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-[#0d6b5e]/10">
      <h2 className="text-xl mb-5 text-[#0a1a17]" style={{ fontWeight: 600 }}>
        Solicitar Nova Aula
      </h2>

      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-red-800" style={{ fontWeight: 600 }}>Erros encontrados:</p>
              <ul className="mt-2 space-y-1">
                {errors.map((erro, idx) => (
                  <li key={idx} className="text-sm text-red-700">• {erro}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Tipo de aula ── */}
        <div>
          <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>
            Tipo de Aula *
          </label>
          <div className="flex gap-3">
            {/* Individual */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, tipoAula: 'individual', turmaId: '' })}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                formData.tipoAula === 'individual'
                  ? 'border-[#0d6b5e] bg-[#e2f0ed]'
                  : 'border-[#0d6b5e]/15 bg-[#f4f9f8] hover:border-[#0d6b5e]/35'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                formData.tipoAula === 'individual' ? 'bg-[#0d6b5e]' : 'bg-[#0d6b5e]/15'
              }`}>
                <Users className={`w-4 h-4 ${formData.tipoAula === 'individual' ? 'text-white' : 'text-[#0d6b5e]'}`} />
              </div>
              <div className="text-left">
                <p className="text-sm text-[#0a1a17]" style={{ fontWeight: 600 }}>Individual</p>
                <p className="text-xs text-[#4d7068]">Aula aberta, estúdio a definir</p>
              </div>
              {formData.tipoAula === 'individual' && (
                <div className="ml-auto w-4 h-4 rounded-full bg-[#0d6b5e] flex items-center justify-center">
                  <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                    <path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>

            {/* Privada */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, tipoAula: 'privada' })}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                formData.tipoAula === 'privada'
                  ? 'border-[#c9a84c] bg-[#c9a84c]/10'
                  : 'border-[#c9a84c]/20 bg-[#f4f9f8] hover:border-[#c9a84c]/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                formData.tipoAula === 'privada' ? 'bg-[#c9a84c]' : 'bg-[#c9a84c]/20'
              }`}>
                <Lock className={`w-4 h-4 ${formData.tipoAula === 'privada' ? 'text-white' : 'text-[#c9a84c]'}`} />
              </div>
              <div className="text-left">
                <p className="text-sm text-[#0a1a17]" style={{ fontWeight: 600 }}>Privada</p>
                <p className="text-xs text-[#4d7068]">Aula para um grupo específico</p>
              </div>
              {formData.tipoAula === 'privada' && (
                <div className="ml-auto w-4 h-4 rounded-full bg-[#c9a84c] flex items-center justify-center">
                  <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                    <path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* ── Seletor de grupo (só se privada) ── */}
        {formData.tipoAula === 'privada' && (
          <div className="p-4 bg-[#c9a84c]/8 border border-[#c9a84c]/25 rounded-xl">
            <label className="block text-sm mb-2 text-[#7a5e1a]" style={{ fontWeight: 500 }}>
              Grupo *
            </label>
            {!formData.professorId ? (
              <p className="text-sm text-[#4d7068] italic">Selecione primeiro um professor para ver os grupos disponíveis.</p>
            ) : turmasDoProf.length === 0 ? (
              <p className="text-sm text-[#4d7068] italic">Este professor não tem grupos ativos.</p>
            ) : (
              <div className="space-y-2">
                {turmasDoProf.map(turma => (
                  <button
                    key={turma.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, turmaId: turma.id })}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      formData.turmaId === turma.id
                        ? 'border-[#c9a84c] bg-[#c9a84c]/15'
                        : 'border-[#c9a84c]/20 bg-white hover:border-[#c9a84c]/50'
                    }`}
                  >
                    <div
                      className="w-3 h-10 rounded-full shrink-0"
                      style={{ background: turma.cor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0a1a17] truncate" style={{ fontWeight: 600 }}>{turma.nome}</p>
                      <p className="text-xs text-[#4d7068]">
                        {turma.modalidade} · {turma.nivel} · {turma.faixaEtaria}
                      </p>
                      <p className="text-xs text-[#4d7068]">
                        {turma.alunosInscritos.length}/{turma.lotacaoMaxima} alunos ·{' '}
                        <span className={turma.status === 'ABERTA' ? 'text-[#0d6b5e]' : 'text-amber-600'}>
                          {turma.status === 'ABERTA' ? 'Aberta' : 'Fechada'}
                        </span>
                      </p>
                    </div>
                    {formData.turmaId === turma.id && (
                      <div className="w-5 h-5 rounded-full bg-[#c9a84c] flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                          <path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Aluno + Professor ── */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>
              Aluno *
            </label>
            <select
              value={formData.alunoId}
              onChange={(e) => setFormData({ ...formData, alunoId: e.target.value })}
              className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] focus:ring-2 focus:ring-[#0d6b5e]/10 transition-colors"
              required
            >
              <option value="">Selecione um aluno</option>
              {alunosDisponiveis.map(aluno => (
                <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>
              Professor *
            </label>
            <select
              value={formData.professorId}
              onChange={(e) => setFormData({ ...formData, professorId: e.target.value, turmaId: '' })}
              className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] focus:ring-2 focus:ring-[#0d6b5e]/10 transition-colors"
              required
              disabled={user.role === 'PROFESSOR'}
            >
              <option value="">Selecione um professor</option>
              {professores.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.nome}</option>
              ))}
            </select>
            {user.role === 'PROFESSOR' && (
              <p className="mt-1 text-xs text-[#0d6b5e]">Marcado automaticamente como professor</p>
            )}
          </div>

          {/* Modalidade */}
          <div>
            <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>
              Modalidade *
            </label>
            <select
              value={formData.modalidade}
              onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
              className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] focus:ring-2 focus:ring-[#0d6b5e]/10 transition-colors"
              required
            >
              <option value="">Selecione a modalidade</option>
              {['Ballet', 'Ballet Clássico', 'Hip-Hop', 'Jazz', 'Contemporâneo', 'Dança Urbana', 'Teatro Dança', 'Outra'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>
              Data *
            </label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] focus:ring-2 focus:ring-[#0d6b5e]/10 transition-colors"
              required
            />
          </div>

          {/* Hora Início */}
          <div>
            <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>
              Hora de Início *
            </label>
            <input
              type="time"
              value={formData.horaInicio}
              onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
              className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] focus:ring-2 focus:ring-[#0d6b5e]/10 transition-colors"
              required
            />
          </div>

          {/* Duração */}
          <div>
            <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>
              Duração *
            </label>
            <select
              value={formData.duracao}
              onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
              className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] focus:ring-2 focus:ring-[#0d6b5e]/10 transition-colors"
              required
            >
              <option value="30">30 minutos</option>
              <option value="60">60 minutos (1 hora)</option>
              <option value="90">90 minutos (1h30)</option>
              <option value="120">120 minutos (2 horas)</option>
            </select>
            {horaFimCalculada && (
              <p className="mt-1 text-sm text-[#0d6b5e]">
                Término previsto: <span style={{ fontWeight: 600 }}>{horaFimCalculada}</span>
              </p>
            )}
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm mb-2 text-[#4d7068]" style={{ fontWeight: 500 }}>
            Observações
          </label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] focus:ring-2 focus:ring-[#0d6b5e]/10 transition-colors resize-none"
            rows={3}
            placeholder="Informações adicionais sobre a aula (opcional)…"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="bg-[#0d6b5e] text-white px-6 py-2.5 rounded-lg hover:bg-[#065147] transition-colors"
            style={{ fontWeight: 600 }}
          >
            Solicitar Aula
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#deecea] text-[#0d6b5e] px-6 py-2.5 rounded-lg hover:bg-[#c8e0dc] transition-colors"
            style={{ fontWeight: 600 }}
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Nota informativa */}
      <div className="mt-5 p-4 bg-[#e2f0ed] rounded-xl border border-[#0d6b5e]/20">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-[#0d6b5e] mt-0.5 shrink-0" />
          <div className="text-sm text-[#0d6b5e]">
            <p style={{ fontWeight: 600 }} className="mb-1">Informações importantes:</p>
            <ul className="space-y-1">
              <li>• O estúdio será atribuído pela direção após aprovação</li>
              <li>• As aulas devem ter entre 30 e 120 minutos</li>
              <li>• O pedido fica pendente até aprovação da direção</li>
              <li>• Conflitos de horário do professor são validados automaticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
