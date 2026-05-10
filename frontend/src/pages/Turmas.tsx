import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router';
import { Turma, TurmaStatus, NivelTurma, AlunoInscrito } from '../types';
import api from '../services/api';
import {
  ArrowLeft, Plus, Users, Clock, MapPin, Calendar, ChevronDown,
  ChevronUp, Eye, BookOpen, Pencil,
  CheckCircle, Lock, Unlock,
  Archive, Filter, X, Info, UserPlus, UserCheck, Music2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

// ── Paleta de cores ────────────────────────────────────────────────────────
const CORES_PALETA = [
  { hex: '#f9a8d4', label: 'Rosa' },
  { hex: '#f472b6', label: 'Rosa Escuro' },
  { hex: '#a78bfa', label: 'Roxo' },
  { hex: '#818cf8', label: 'Indigo' },
  { hex: '#5eead4', label: 'Verde Água' },
  { hex: '#0d6b5e', label: 'Verde Escola' },
  { hex: '#fbbf24', label: 'Dourado' },
  { hex: '#fb923c', label: 'Laranja' },
  { hex: '#f87171', label: 'Vermelho' },
  { hex: '#34d399', label: 'Verde' },
  { hex: '#60a5fa', label: 'Azul' },
  { hex: '#e879f9', label: 'Fúcsia' },
];

// Modalidades are loaded from API — see useEffect in TurmasPage
const NIVEIS: NivelTurma[] = ['Iniciante', 'Intermédio', 'Avançado', 'Todos os níveis'];
const DIAS = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const NIVEL_BADGE: Record<NivelTurma, string> = {
  'Iniciante':       'bg-green-100 text-green-800',
  'Intermédio':      'bg-blue-100 text-blue-800',
  'Avançado':        'bg-purple-100 text-purple-800',
  'Todos os níveis': 'bg-gray-100 text-gray-700',
};

function calcHoraFim(inicio: string, duracao: number): string {
  if (!inicio) return '';
  const [h, m] = inicio.split(':').map(Number);
  const total = h * 60 + m + duracao;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ── Pré-visualização do card (igual ao encarregado vê) ─────────────────────
function TurmaCardPreview({ t }: { t: Partial<Turma> }) {
  const nome      = t.nome        || 'Nome do grupo';
  const descricao = t.descricao   || 'Descrição do grupo…';
  const cor       = t.cor         || '#5eead4';
  const nivel     = (t.nivel      || 'Iniciante') as NivelTurma;
  const faixa     = t.faixaEtaria || '—';
  const modal     = t.modalidade  || 'Modalidade';
  const prof      = t.professorNome || '—';
  const estudio   = t.estudioNome   || '—';
  const dias      = (t.diasSemana ?? []).map(d => DIAS[d]).join(', ') || '—';
  const horario   = t.horaInicio ? `${t.horaInicio}–${t.horaFim || '?'}` : '—';
  const durStr    = t.duracao ? `${t.duracao} min` : '—';
  const cap       = t.lotacaoMaxima ?? 0;
  const ins       = t.alunosInscritos?.length ?? 0;
  const livres    = cap - ins;

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-black/5 max-w-sm w-full">
      <div className="h-3 w-full" style={{ background: cor }} />
      <div className="p-5">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: cor, fontWeight: 600, opacity: 0.9 }}>
            {modal}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${NIVEL_BADGE[nivel]}`} style={{ fontWeight: 500 }}>
            {nivel}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600" style={{ fontWeight: 500 }}>
            {faixa}
          </span>
        </div>
        <h3 className="text-[#0a1a17] mb-1" style={{ fontWeight: 700, fontSize: '1rem' }}>{nome}</h3>
        <p className="text-sm text-[#4d7068] mb-4 line-clamp-2">{descricao}</p>
        <div className="space-y-1.5 text-sm text-[#4d7068]">
          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-[#0d6b5e]" /><span>{dias}</span></div>
          <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[#0d6b5e]" /><span>{horario} ({durStr})</span></div>
          <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#0d6b5e]" /><span>{estudio}</span></div>
          <div className="flex items-center gap-2"><UserCheck className="w-3.5 h-3.5 text-[#0d6b5e]" /><span>Prof. {prof}</span></div>
        </div>
        {cap > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#4d7068]">{ins}/{cap} alunos</span>
              <span className={livres > 0 ? 'text-[#0d6b5e]' : 'text-red-600'} style={{ fontWeight: 600 }}>
                {livres > 0 ? `${livres} vagas livres` : 'Lotação esgotada'}
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min((ins / cap) * 100, 100)}%`, background: cor }} />
            </div>
          </div>
        )}
        <button className="mt-4 w-full py-2 rounded-lg text-sm text-white" style={{ background: cor, fontWeight: 600, opacity: 0.9 }}>
          Inscrever Aluno
        </button>
      </div>
    </div>
  );
}

// ── Card gestão (professor / direção) ──────────────────────────────────────
function TurmaGerirCard({
  turma, todosAlunos, onToggleStatus, onArchive, onEdit, onRemoveAluno, onInscreverAluno,
}: {
  turma: Turma;
  todosAlunos: { id: string; nome: string }[];
  onToggleStatus: (id: string) => void;
  onArchive: (id: string) => void;
  onEdit: (t: Turma) => void;
  onRemoveAluno?: (turmaId: string, alunoId: string) => void;
  onInscreverAluno?: (turmaId: string, alunoId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showInscrever, setShowInscrever] = useState(false);
  const [alunoSel, setAlunoSel] = useState('');
  const inscritos = turma.alunosInscritos?.length ?? 0;
  const cap       = turma.lotacaoMaxima ?? 0;
  const livres    = turma.status === 'FECHADA' ? 0 : Math.max(0, cap - inscritos);
  const pct       = cap > 0 ? (inscritos / cap) * 100 : 0;
  const dias      = (turma.diasSemana || []).map(d => DIAS[d]).join(' / ');

  const inscritosIds      = (turma.alunosInscritos || []).map(a => a.alunoId);
  const alunosDisponiveis = todosAlunos.filter(u => !inscritosIds.includes(u.id));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#0d6b5e]/5 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-2 w-full" style={{ background: turma.cor }} />
      <div className="p-5">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-[#0a1a17]" style={{ fontWeight: 700 }}>{turma.nome}</h3>
              {turma.status === 'ABERTA' && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                  <Unlock className="w-3 h-3" /> Aberta
                </span>
              )}
              {turma.status === 'FECHADA' && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                  <Lock className="w-3 h-3" /> Fechada
                </span>
              )}
              {turma.status === 'ARQUIVADA' && (
                <span className="flex items-center gap-1 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
                  <Archive className="w-3 h-3" /> Arquivada
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-[#4d7068] flex-wrap">
              <span className="flex items-center gap-1"><Music2 className="w-3.5 h-3.5 text-[#0d6b5e]" />{turma.modalidade}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#0d6b5e]" />{dias}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#0d6b5e]" />{turma.horaInicio}–{turma.horaFim}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#0d6b5e]" />{turma.estudioNome}</span>
            </div>
          </div>
          {/* Botões de ação */}
          <div className="flex items-center gap-1.5 shrink-0">
            {turma.status !== 'ARQUIVADA' && (
              <>
                <button onClick={() => onEdit(turma)} title="Editar"
                  className="p-2 text-[#4d7068] hover:text-[#0d6b5e] hover:bg-[#f4f9f8] rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onToggleStatus(turma.id)}
                  title={turma.status === 'ABERTA' ? 'Fechar inscrições' : 'Abrir inscrições'}
                  className={`p-2 rounded-lg transition-colors ${turma.status === 'ABERTA' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>
                  {turma.status === 'ABERTA' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <button onClick={() => onArchive(turma.id)} title="Arquivar"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <Archive className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Barra de lotação */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-[#4d7068]">{turma.alunosInscritos?.length || 0} aluno{(turma.alunosInscritos?.length || 0) !== 1 ? 's' : ''} inscritos</span>
            <span className="text-[#4d7068]">{livres} vaga{livres !== 1 ? 's' : ''} livre{livres !== 1 ? 's' : ''} / {turma.lotacaoMaxima || 0} total</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: turma.cor }} />
          </div>
        </div>

        {/* Ações de gestão de alunos */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {turma.alunosInscritos?.length || 0 > 0 && (
            <button onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-sm text-[#0d6b5e] hover:text-[#065147] transition-colors"
              style={{ fontWeight: 500 }}>
              <Users className="w-4 h-4" />
              {expanded ? 'Ocultar' : 'Ver'} alunos
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          {onInscreverAluno && turma.status !== 'ARQUIVADA' && livres > 0 && alunosDisponiveis.length > 0 && (
            <button onClick={() => { setShowInscrever(!showInscrever); setAlunoSel(''); }}
              className="flex items-center gap-1.5 text-sm bg-[#c9a84c] text-[#0a1a17] px-3 py-1.5 rounded-lg hover:bg-[#e8c97a] transition-colors"
              style={{ fontWeight: 600 }}>
              <UserPlus className="w-4 h-4" />
              Inscrever Aluno
            </button>
          )}
        </div>

        {/* Painel inline: inscrever aluno (professor) */}
        {showInscrever && onInscreverAluno && (
          <div className="mt-3 p-3 bg-[#f4f9f8] rounded-xl border border-[#0d6b5e]/10">
            <p className="text-sm text-[#0a1a17] mb-2" style={{ fontWeight: 600 }}>Selecione o aluno a inscrever:</p>
            <div className="flex gap-2 flex-wrap">
              <select value={alunoSel} onChange={e => setAlunoSel(e.target.value)}
                className="flex-1 px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-white text-sm focus:outline-none focus:border-[#0d6b5e]">
                <option value="">Escolher aluno���</option>
                {(alunosDisponiveis || []).map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
              <button
                onClick={() => { if (alunoSel) { onInscreverAluno(turma.id, alunoSel); setShowInscrever(false); setAlunoSel(''); } }}
                disabled={!alunoSel}
                className="px-4 py-2 bg-[#0d6b5e] text-white rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#065147] transition-colors"
                style={{ fontWeight: 600 }}>
                Confirmar
              </button>
              <button onClick={() => { setShowInscrever(false); setAlunoSel(''); }}
                className="px-3 py-2 text-sm text-[#4d7068] hover:bg-white rounded-lg transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de alunos expandida */}
        {expanded && (
          <div className="mt-3 space-y-2">
            {(turma.alunosInscritos || []).map(a => (
              <div key={a.alunoId} className="flex items-center justify-between bg-[#f4f9f8] rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm text-[#0a1a17]" style={{ fontWeight: 500 }}>{a.alunoNome}</p>
                  <p className="text-xs text-[#4d7068]">Inscrito em {format(new Date(a.inscritoEm), 'dd/MM/yyyy')}</p>
                </div>
                {onRemoveAluno && (
                  <button onClick={() => onRemoveAluno(turma.id, a.alunoId)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card para encarregado ──────────────────────────────────────────────────
function TurmaEncarregadoCard({
  turma, meusAlunosIds, todosUsuarios, onInscrever,
}: {
  turma: Turma;
  meusAlunosIds: string[];
  todosUsuarios: { id: string; nome: string }[];
  onInscrever: (turmaId: string, alunoId: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [alunoSel, setAlunoSel] = useState('');
  const inscritos = turma.alunosInscritos?.length ?? 0;
  const cap       = turma.lotacaoMaxima ?? 0;
  const livres    = turma.status === 'FECHADA' ? 0 : Math.max(0, cap - inscritos);
  const pct       = cap > 0 ? (inscritos / cap) * 100 : 0;
  const dias       = (turma.diasSemana || []).map(d => DIAS[d]).join(' / ');
  const inscritosIds = (turma.alunosInscritos || []).map(a => a.alunoId);
  const disponiveis  = todosUsuarios.filter(u => meusAlunosIds.includes(u.id) && !inscritosIds.includes(u.id));
  const jaInscritos  = todosUsuarios.filter(u => meusAlunosIds.includes(u.id) && inscritosIds.includes(u.id));

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-black/5">
      <div className="h-3" style={{ background: turma.cor }} />
      <div className="p-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs px-2.5 py-0.5 rounded-full text-white" style={{ background: turma.cor, fontWeight: 600 }}>
            {turma.modalidade}
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full ${NIVEL_BADGE[turma.nivel]}`} style={{ fontWeight: 500 }}>
            {turma.nivel}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600" style={{ fontWeight: 500 }}>
            {turma.faixaEtaria}
          </span>
          {turma.status === 'FECHADA' && (
            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
              <Lock className="w-3 h-3" /> Inscrições fechadas
            </span>
          )}
        </div>

        <h3 className="text-[#0a1a17] mb-1" style={{ fontWeight: 700, fontSize: '1.05rem' }}>{turma.nome}</h3>
        <p className="text-sm text-[#4d7068] mb-4">{turma.descricao}</p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-[#4d7068] mb-4">
          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#0d6b5e]" />{dias}</div>
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#0d6b5e]" />{turma.horaInicio}–{turma.horaFim}</div>
          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#0d6b5e]" />{turma.estudioNome}</div>
          <div className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-[#0d6b5e]" />Prof. {turma.professorNome}</div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#4d7068]">{turma.alunosInscritos?.length || 0}/{turma.lotacaoMaxima || 0} alunos</span>
            <span className={
              turma.status === 'FECHADA'
                ? 'text-amber-600'
                : livres > 0 ? 'text-[#0d6b5e]' : 'text-red-600'
            } style={{ fontWeight: 600 }}>
              {turma.status === 'FECHADA'
                ? '0 vagas disponíveis'
                : livres > 0 ? `${livres} vagas livres` : 'Lotação esgotada'}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: turma.cor }} />
          </div>
        </div>

        {turma.requisitos && (
          <div className="mb-4 p-3 bg-[#f4f9f8] rounded-xl border border-[#0d6b5e]/10 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#0d6b5e] mt-0.5 shrink-0" />
            <p className="text-xs text-[#4d7068]">{turma.requisitos}</p>
          </div>
        )}

        {jaInscritos.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(jaInscritos || []).map(a => (
              <span key={a.id} className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
                <CheckCircle className="w-3 h-3" /> {a.nome} — inscrito
              </span>
            ))}
          </div>
        )}

        {turma.status === 'ABERTA' && livres > 0 && disponiveis.length > 0 && (
          <>
            <button onClick={() => setShowForm(!showForm)}
              className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
              style={{ background: turma.cor, fontWeight: 700, color: '#fff' }}>
              <Users className="w-4 h-4" />
              Inscrever Aluno
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showForm ? 'rotate-180' : ''}`} />
            </button>
            {showForm && (
              <div className="mt-3 p-3 bg-[#f4f9f8] rounded-xl border border-[#0d6b5e]/10">
                <p className="text-sm text-[#0a1a17] mb-2" style={{ fontWeight: 600 }}>Selecione o aluno:</p>
                <div className="flex gap-2 flex-wrap">
                  <select value={alunoSel} onChange={e => setAlunoSel(e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-white text-sm focus:outline-none focus:border-[#0d6b5e]">
                    <option value="">Escolher…</option>
                    {(disponiveis || []).map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                  <button
                    onClick={() => { if (alunoSel) { onInscrever(turma.id, alunoSel); setShowForm(false); setAlunoSel(''); } }}
                    disabled={!alunoSel}
                    className="px-4 py-2 bg-[#0d6b5e] text-white rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#065147] transition-colors"
                    style={{ fontWeight: 600 }}>
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {turma.status === 'ABERTA' && livres > 0 && disponiveis.length === 0 && jaInscritos.length > 0 && (
          <div className="w-full py-2 rounded-xl text-sm text-center text-green-700 bg-green-50 border border-green-200">
            Todos os seus educandos já estão inscritos
          </div>
        )}
        {(turma.status === 'FECHADA' || livres <= 0) && (
          <div className="w-full py-2 rounded-xl text-sm text-center text-amber-700 bg-amber-50 border border-amber-200">
            {turma.status === 'FECHADA' ? 'Inscrições fechadas pelo professor' : 'Lotação esgotada'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Formulário criar / editar turma ───────────────────────────────────────
const FORM_VAZIO = {
  nome: '', modalidade: '', descricao: '', nivel: 'Iniciante' as NivelTurma,
  faixaEtaria: '', estudioId: '', diasSemana: [] as number[],
  horaInicio: '', duracao: 60, lotacaoMaxima: 15,
  dataInicio: '', dataFim: '', status: 'ABERTA' as TurmaStatus,
  cor: '#5eead4', requisitos: '',
};

function NovaTurmaForm({
  user, salas, modalidades, onSave, onCancel, editando,
}: {
  user: { id: string; nome: string };
  salas: { id: string; nome: string; capacidade: number }[];
  modalidades: string[];
  onSave: () => void;
  onCancel: () => void;
  editando: Turma | null;
}) {
  const [form, setForm] = useState(editando ? {
    nome: editando.nome, modalidade: editando.modalidade, descricao: editando.descricao,
    nivel: editando.nivel, faixaEtaria: editando.faixaEtaria, estudioId: editando.estudioId,
    diasSemana: editando.diasSemana, horaInicio: editando.horaInicio, duracao: editando.duracao,
    lotacaoMaxima: editando.lotacaoMaxima,
    dataInicio: editando.dataInicio, dataFim: editando.dataFim ?? '',
    status: editando.status, cor: editando.cor, requisitos: editando.requisitos ?? '',
  } : { ...FORM_VAZIO });

  const estudio  = salas.find(e => e.id === form.estudioId);
  const horaFim  = calcHoraFim(form.horaInicio, form.duracao);

  const toggleDia = (d: number) =>
    setForm(f => ({
      ...f,
      diasSemana: f.diasSemana.includes(d)
        ? f.diasSemana.filter(x => x !== d)
        : [...f.diasSemana, d].sort(),
    }));

  const handleSubmit = async () => {
    if (!form.nome || !form.modalidade || !form.descricao || !form.estudioId || !form.horaInicio || form.diasSemana.length === 0) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    const payload = {
      nomegrupo: form.nome,
      status: form.status,
      descricao: form.descricao,
      modalidade: form.modalidade,
      nivel: form.nivel,
      faixaEtaria: form.faixaEtaria,
      professorId: user.id,
      estudioId: form.estudioId,
      diasSemana: form.diasSemana,
      horaInicio: form.horaInicio,
      horaFim,
      duracao: form.duracao,
      lotacaoMaxima: form.lotacaoMaxima,
      dataInicio: form.dataInicio || new Date().toISOString().split('T')[0],
      dataFim: form.dataFim || undefined,
      cor: form.cor,
      requisitos: form.requisitos || undefined,
    };
    try {
      if (editando) {
        await api.updateTurma(parseInt(editando.id), payload);
      } else {
        await api.createTurma(payload);
      }
      onSave();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao guardar grupo');
    }
  };

  const preview: Partial<Turma> = {
    nome: form.nome, modalidade: form.modalidade, descricao: form.descricao,
    nivel: form.nivel as NivelTurma, faixaEtaria: form.faixaEtaria,
    cor: form.cor, diasSemana: form.diasSemana, horaInicio: form.horaInicio,
    horaFim, duracao: form.duracao, lotacaoMaxima: form.lotacaoMaxima,
    requisitos: form.requisitos, status: form.status,
    professorNome: user.nome, estudioNome: estudio?.nome,
    alunosInscritos: editando?.alunosInscritos ?? [],
  };

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8">
      {/* Formulário */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#0d6b5e]/5 p-6 space-y-6">
        <h2 className="text-xl text-[#0a1a17]" style={{ fontWeight: 700 }}>
          {editando ? 'Editar Grupo' : 'Criar Novo Grupo'}
        </h2>

        {/* Informações básicas */}
        <section>
          <h3 className="text-sm text-[#0d6b5e] mb-3" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Informações Básicas
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>Nome do Grupo *</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Ballet Infantil — Iniciantes"
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e]" />
            </div>
            <div>
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>Modalidade *</label>
              <select value={form.modalidade} onChange={e => setForm(f => ({ ...f, modalidade: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e]">
                <option value="">Selecionar…</option>
                {modalidades.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>Nível</label>
              <select value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value as NivelTurma }))}
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e]">
                {NIVEIS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>Faixa Etária</label>
              <input value={form.faixaEtaria} onChange={e => setForm(f => ({ ...f, faixaEtaria: e.target.value }))}
                placeholder="Ex: 6-10 anos, Adultos, Todas as idades"
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>
                Descrição * <span className="text-[#4d7068]/60">(aparece no card para encarregados)</span>
              </label>
              <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                rows={3} placeholder="Descreva o grupo de forma apelativa para os encarregados…"
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e] resize-none" />
            </div>
          </div>
        </section>

        {/* Horário */}
        <section>
          <h3 className="text-sm text-[#0d6b5e] mb-3" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Horário
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-[#4d7068] mb-2" style={{ fontWeight: 500 }}>Dias da Semana *</label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map(d => (
                  <button key={d} type="button" onClick={() => toggleDia(d)}
                    className={`w-12 h-10 rounded-lg text-sm transition-colors ${form.diasSemana.includes(d) ? 'bg-[#0d6b5e] text-white' : 'bg-[#f4f9f8] text-[#4d7068] border border-[#0d6b5e]/15 hover:border-[#0d6b5e]/40'}`}
                    style={{ fontWeight: form.diasSemana.includes(d) ? 600 : 400 }}>
                    {DIAS[d]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>Hora de Início *</label>
              <input type="time" value={form.horaInicio} onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e]" />
            </div>
            <div>
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>Duração</label>
              <select value={form.duracao} onChange={e => setForm(f => ({ ...f, duracao: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e]">
                {[30, 45, 60, 75, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
              {horaFim && <p className="mt-1 text-xs text-[#0d6b5e]">Término: {horaFim}</p>}
            </div>
            <div>
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>Estúdio *</label>
              <select value={form.estudioId} onChange={e => setForm(f => ({ ...f, estudioId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e]">
                <option value="">Selecionar…</option>
                {salas.map(e => <option key={e.id} value={e.id}>{e.nome} (cap. {e.capacidade})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>Lotação Máxima</label>
              <input type="number" min={1} max={estudio?.capacidade ?? 100} value={form.lotacaoMaxima}
                onChange={e => setForm(f => ({ ...f, lotacaoMaxima: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e]" />
              {estudio && <p className="mt-1 text-xs text-[#4d7068]">Cap. do estúdio: {estudio.capacidade}</p>}
            </div>
          </div>
        </section>

        {/* Datas */}
        <section>
          <h3 className="text-sm text-[#0d6b5e] mb-3" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Datas
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>Data de Início</label>
              <input type="date" value={form.dataInicio} onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e]" />
            </div>
            <div>
              <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>Data de Fim <span className="text-[#4d7068]/50">(opcional)</span></label>
              <input type="date" value={form.dataFim} onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e]" />
            </div>
          </div>
        </section>

        {/* Aparência */}
        <section>
          <h3 className="text-sm text-[#0d6b5e] mb-3" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Aparência do Card
          </h3>
          <label className="block text-sm text-[#4d7068] mb-2" style={{ fontWeight: 500 }}>Cor do Banner</label>
          <div className="flex gap-2 flex-wrap">
            {CORES_PALETA.map(c => (
              <button key={c.hex} type="button" title={c.label}
                onClick={() => setForm(f => ({ ...f, cor: c.hex }))}
                className={`w-9 h-9 rounded-full transition-all border-2 ${form.cor === c.hex ? 'border-[#0a1a17] scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                style={{ background: c.hex }} />
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm text-[#4d7068] mb-1.5" style={{ fontWeight: 500 }}>
              Requisitos / Notas <span className="text-[#4d7068]/50">(visíveis ao encarregado)</span>
            </label>
            <textarea value={form.requisitos} onChange={e => setForm(f => ({ ...f, requisitos: e.target.value }))}
              rows={2} placeholder="Ex: Trazer collant e sapatilhas. Cabelo preso obrigatório."
              className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-sm focus:outline-none focus:border-[#0d6b5e] resize-none" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm text-[#4d7068]" style={{ fontWeight: 500 }}>Estado inicial:</label>
            <div className="flex gap-2">
              {(['ABERTA', 'FECHADA'] as TurmaStatus[]).map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${form.status === s ? 'bg-[#0d6b5e] text-white' : 'bg-[#f4f9f8] text-[#4d7068] border border-[#0d6b5e]/20 hover:border-[#0d6b5e]'}`}
                  style={{ fontWeight: 500 }}>
                  {s === 'ABERTA' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {s === 'ABERTA' ? 'Aberta' : 'Fechada'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleSubmit}
            className="bg-[#0d6b5e] text-white px-6 py-2.5 rounded-lg hover:bg-[#065147] transition-colors text-sm"
            style={{ fontWeight: 600 }}>
            {editando ? 'Guardar Alterações' : 'Criar Grupo'}
          </button>
          <button onClick={onCancel}
            className="bg-[#deecea] text-[#0d6b5e] px-6 py-2.5 rounded-lg hover:bg-[#c8e0dc] transition-colors text-sm"
            style={{ fontWeight: 600 }}>
            Cancelar
          </button>
        </div>
      </div>

      {/* Preview ao vivo */}
      <div className="space-y-4">
        <div className="sticky top-24">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-[#0d6b5e]" />
            <h3 className="text-[#0a1a17]" style={{ fontWeight: 700 }}>Pré-visualização</h3>
            <span className="text-xs text-[#4d7068] bg-[#f4f9f8] px-2 py-0.5 rounded-full">como o encarregado vê</span>
          </div>
          <TurmaCardPreview t={preview} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Página principal
// ══════════════════════════════════════════════════════════════════════════════
export function Turmas() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [salas, setSalas] = useState<{ id: string; nome: string; capacidade: number }[]>([]);
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Turma | null>(null);
  const [filtroModalidade, setFiltroModalidade] = useState('TODAS');
  const [filtroNivel, setFiltroNivel] = useState('TODOS');
  const [filtroProf, setFiltroProf] = useState('TODOS');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [turmasRes, usersRes, salasRes, modalidadesRes] = await Promise.all([
          api.getTurmas(),
          api.getUsers(),
          api.getSalas(),
          api.getModalidades(),
        ]);
        if (turmasRes.success && turmasRes.data) setTurmas(turmasRes.data);
        if (usersRes.success && usersRes.data) setUsers(usersRes.data);
        if (salasRes.success && salasRes.data) setSalas(salasRes.data);
        if (modalidadesRes.success && modalidadesRes.data) setModalidades(modalidadesRes.data.map((m: any) => m.nome));
      } catch (error) {
        console.error('Error fetching turmas data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!user) return null;

  const todasModalidades = Array.from(new Set((turmas || []).map(t => t.modalidade))).sort();
  const todosAlunos      = users.filter(u => u.role === 'ALUNO');
  const todosProfessores = users.filter(u => u.role === 'PROFESSOR');

const turmasFiltradas = (turmas || []).filter(t => {
    if (user.role === 'PROFESSOR' && t.professorId !== user.id) return false;
    if (filtroModalidade !== 'TODAS' && t.modalidade !== filtroModalidade) return false;
    if (filtroNivel !== 'TODOS' && t.nivel !== filtroNivel) return false;
    if (user.role === 'DIRECAO' && filtroProf !== 'TODOS' && t.professorId !== filtroProf) return false;
    return true;
  });

  const turmasParaEnc = (turmas || []).filter(t => {
    if (t.status === 'ARQUIVADA') return false;
    if (filtroModalidade !== 'TODAS' && t.modalidade !== filtroModalidade) return false;
    if (filtroNivel !== 'TODOS' && t.nivel !== filtroNivel) return false;
    return true;
  });

  const handleSave = async () => {
    try {
      const res = await api.getTurmas();
      if (res.success && res.data) setTurmas(res.data);
    } catch (_) {}
    setShowForm(false);
    setEditando(null);
    toast.success(editando ? 'Grupo atualizado com sucesso!' : 'Grupo criado com sucesso!');
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.closeTurma(parseInt(id));
      setTurmas(prev => (prev || []).map(t => {
        if (t.id !== id) return t;
        const novo: TurmaStatus = t.status === 'ABERTA' ? 'FECHADA' : 'ABERTA';
        toast.success(`Inscrições ${novo === 'ABERTA' ? 'abertas' : 'fechadas'} para "${t.nome}"`);
        return { ...t, status: novo };
      }));
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar estado do grupo');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.archiveTurma(parseInt(id));
      setTurmas(prev => (prev || []).map(t => t.id === id ? { ...t, status: 'ARQUIVADA' } : t));
      toast.info('Grupo arquivado.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar grupo');
    }
  };

  const handleRemoveAluno = async (turmaId: string, alunoId: string) => {
    try {
      await api.removeAluno(parseInt(turmaId), parseInt(alunoId));
      setTurmas(prev => (prev || []).map(t => t.id !== turmaId ? t : {
        ...t, alunosInscritos: (t.alunosInscritos || []).filter(a => a.alunoId !== alunoId),
      }));
      toast.info('Aluno removido do grupo.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover aluno');
    }
  };

  const handleInscrever = async (turmaId: string, alunoId: string) => {
    const aluno = users.find(u => u.id === alunoId);
    if (!aluno) return;
    try {
      await api.enrollAluno(parseInt(turmaId), parseInt(alunoId));
      setTurmas(prev => (prev || []).map(t => {
        if (t.id !== turmaId) return t;
        const nova: AlunoInscrito = {
          alunoId, alunoNome: aluno.nome,
          encarregadoId: aluno.encarregadoId ?? user.id,
          inscritoEm: new Date().toISOString(),
        };
        return { ...t, alunosInscritos: [...(t.alunosInscritos || []), nova] };
      }));
      toast.success(`${aluno.nome} inscrito com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao inscrever aluno');
    }
  };

  const isProfOrDir = user.role === 'PROFESSOR' || user.role === 'DIRECAO';

  return (
    <div className="min-h-screen bg-[#f4f9f8]">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-[#0a1a17] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-white/50">
            <Link to="/dashboard" className="hover:text-[#c9a84c] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-white/80">Grupos</span>
          </div>

          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-3xl text-white mb-1">Grupos</h1>
              <p className="text-white/50 text-sm">
                {user.role === 'PROFESSOR'   && 'Crie e gira os seus grupos. Defina como aparecem para os encarregados.'}
                {user.role === 'ENCARREGADO' && 'Inscreva os seus educandos nos grupos disponíveis.'}
                {user.role === 'DIRECAO'     && 'Visão geral de todos os grupos da escola.'}
                {user.role === 'ALUNO'       && 'Grupos em que está inscrito.'}
              </p>
            </div>
            {user.role === 'PROFESSOR' && !showForm && (
              <button onClick={() => { setEditando(null); setShowForm(true); }}
                className="flex items-center gap-2 bg-[#c9a84c] text-[#0a1a17] px-5 py-2.5 rounded-lg hover:bg-[#e8c97a] transition-colors"
                style={{ fontWeight: 600 }}>
                <Plus className="w-5 h-5" /> Novo Grupo
              </button>
            )}
          </div>

          {/* Filtros */}
          {!showForm && (
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-white/40" />
              <button onClick={() => setFiltroModalidade('TODAS')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filtroModalidade === 'TODAS' ? 'bg-[#c9a84c] text-[#0a1a17]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                Todas as modalidades
              </button>
              {todasModalidades.map(m => (
                <button key={m} onClick={() => setFiltroModalidade(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filtroModalidade === m ? 'bg-[#c9a84c] text-[#0a1a17]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                  {m}
                </button>
              ))}
              <span className="text-white/20 mx-1">|</span>
              <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white border border-white/20 focus:outline-none focus:border-[#c9a84c]">
                <option value="TODOS">Todos os níveis</option>
                {NIVEIS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {user.role === 'DIRECAO' && (
                <select value={filtroProf} onChange={e => setFiltroProf(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-white border border-white/20 focus:outline-none focus:border-[#c9a84c]">
                  <option value="TODOS">Todos os professores</option>
                  {todosProfessores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Formulário */}
        {showForm && (
          <div className="mb-8">
            <NovaTurmaForm
              user={{ id: user.id, nome: user.nome }}
              salas={salas}
              modalidades={modalidades}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditando(null); }}
              editando={editando}
            />
          </div>
        )}

        {/* PROFESSOR / DIREÇÃO */}
        {isProfOrDir && !showForm && (
          <>
            {turmasFiltradas.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-[#0d6b5e]/5">
                <BookOpen className="w-16 h-16 text-[#0d6b5e]/20 mx-auto mb-4" />
                <p className="text-[#4d7068] mb-2">
                  {user.role === 'PROFESSOR' ? 'Ainda não criou nenhum grupo.' : 'Nenhum grupo encontrado.'}
                </p>
                {user.role === 'PROFESSOR' && (
                  <button onClick={() => setShowForm(true)}
                    className="mt-2 flex items-center gap-2 bg-[#c9a84c] text-[#0a1a17] px-5 py-2.5 rounded-lg hover:bg-[#e8c97a] transition-colors mx-auto text-sm"
                    style={{ fontWeight: 600 }}>
                    <Plus className="w-4 h-4" /> Criar Primeiro Grupo
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex gap-3 mb-6 flex-wrap">
                  {(['ABERTA', 'FECHADA', 'ARQUIVADA'] as TurmaStatus[]).map(s => {
                    const count = turmasFiltradas.filter(t => t.status === s).length;
                    if (count === 0) return null;
                    const colors = { ABERTA: 'bg-green-100 text-green-800', FECHADA: 'bg-amber-100 text-amber-800', ARQUIVADA: 'bg-gray-100 text-gray-600' };
                    return (
                      <span key={s} className={`text-sm px-3 py-1 rounded-full ${colors[s]}`} style={{ fontWeight: 600 }}>
                        {count} {s.charAt(0) + s.slice(1).toLowerCase()}{count !== 1 ? 's' : ''}
                      </span>
                    );
                  })}
                  <span className="text-sm px-3 py-1 rounded-full bg-[#e2f0ed] text-[#0d6b5e]" style={{ fontWeight: 600 }}>
                    {turmasFiltradas.reduce((acc, t) => acc + (t.alunosInscritos?.length || 0), 0)} alunos inscritos
                  </span>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {(turmasFiltradas || []).map(t => (
                    <TurmaGerirCard
                      key={t.id}
                      turma={t}
                      todosAlunos={todosAlunos}
                      onToggleStatus={handleToggleStatus}
                      onArchive={handleArchive}
                      onEdit={tt => { setEditando(tt); setShowForm(true); }}
                      onRemoveAluno={handleRemoveAluno}
                      onInscreverAluno={user.role === 'PROFESSOR' ? handleInscrever : undefined}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ENCARREGADO */}
        {user.role === 'ENCARREGADO' && (
          <>
            {turmasParaEnc.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-[#0d6b5e]/5">
                <BookOpen className="w-16 h-16 text-[#0d6b5e]/20 mx-auto mb-4" />
                <p className="text-[#4d7068]">Nenhuma turma disponível de momento.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-[#4d7068] mb-5">
                  <span style={{ fontWeight: 600 }}>{turmasParaEnc.filter(t => t.status === 'ABERTA').length}</span> turmas com inscrições abertas ·{' '}
                  <span style={{ fontWeight: 600 }}>{turmasParaEnc.filter(t => t.status === 'ABERTA').reduce((acc, t) => acc + ((t.lotacaoMaxima || 0) - (t.alunosInscritos?.length || 0)), 0)}</span> vagas disponíveis no total
                </p>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {(turmasParaEnc || []).map(t => (
                    <TurmaEncarregadoCard
                      key={t.id}
                      turma={t}
                      meusAlunosIds={user.alunosIds ?? []}
                      todosUsuarios={users}
                      onInscrever={handleInscrever}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ALUNO */}
        {user.role === 'ALUNO' && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {(turmas || []).filter(t => (t.alunosInscritos || []).some(a => a.alunoId === user.id)).map(t => (
              <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-[#0d6b5e]/5 overflow-hidden">
                <div className="h-3" style={{ background: t.cor }} />
                <div className="p-5">
                  <div className="flex gap-2 flex-wrap mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full text-white" style={{ background: t.cor, fontWeight: 600 }}>{t.modalidade}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full ${NIVEL_BADGE[t.nivel]}`} style={{ fontWeight: 500 }}>{t.nivel}</span>
                  </div>
                  <h3 className="text-[#0a1a17] mb-1" style={{ fontWeight: 700 }}>{t.nome}</h3>
                  <p className="text-sm text-[#4d7068] mb-3">{t.descricao}</p>
                  <div className="space-y-1 text-sm text-[#4d7068]">
                    <div className="flex gap-2"><Calendar className="w-3.5 h-3.5 text-[#0d6b5e] mt-0.5" />{(t.diasSemana || []).map(d => DIAS[d]).join(' / ')}</div>
                    <div className="flex gap-2"><Clock className="w-3.5 h-3.5 text-[#0d6b5e] mt-0.5" />{t.horaInicio}–{t.horaFim}</div>
                    <div className="flex gap-2"><UserCheck className="w-3.5 h-3.5 text-[#0d6b5e] mt-0.5" />Prof. {t.professorNome}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg w-fit">
                    <CheckCircle className="w-3.5 h-3.5" /> Inscrito
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}