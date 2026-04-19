import { useState } from 'react';
import { SlotDisponibilidade, PedidoAula } from '../types';

const mockUsers: { id: string; nome: string; email: string; role: string }[] = [];
const mockDisponibilidades: SlotDisponibilidade[] = [];
import { Clock, MapPin, Music, CalendarDays, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';

interface DisponibilidadeProfessoresPanelProps {
  aulasExistentes: PedidoAula[];
  onMarcarSlot: (prefill: {
    professorId: string;
    estudioId: string;
    data: string;
    horaInicio: string;
    duracao: string;
  }) => void;
}

const DIAS_SEMANA = [
  { num: 1, label: 'Segunda-feira', short: 'Seg' },
  { num: 2, label: 'Terça-feira', short: 'Ter' },
  { num: 3, label: 'Quarta-feira', short: 'Qua' },
  { num: 4, label: 'Quinta-feira', short: 'Qui' },
  { num: 5, label: 'Sexta-feira', short: 'Sex' },
  { num: 6, label: 'Sábado', short: 'Sáb' },
];

const MODALIDADE_COLORS: Record<string, string> = {
  'Hip-Hop': 'bg-orange-100 text-orange-800 border-orange-200',
  'Dança Urbana': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Ballet Clássico': 'bg-pink-100 text-pink-800 border-pink-200',
  'Ballet Contemporâneo': 'bg-purple-100 text-purple-800 border-purple-200',
  'Dança Clássica': 'bg-rose-100 text-rose-800 border-rose-200',
  'Dança Contemporânea': 'bg-teal-100 text-teal-800 border-teal-200',
  'Teatro Dança': 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const PROFESSOR_AVATAR_COLORS: Record<string, string> = {
  'prof1': 'bg-orange-500',
  'prof2': 'bg-pink-500',
  'prof3': 'bg-teal-600',
};

export function DisponibilidadeProfessoresPanel({ aulasExistentes, onMarcarSlot }: DisponibilidadeProfessoresPanelProps) {
  const professores = mockUsers.filter(u => u.role === 'PROFESSOR');
  const [professorSelecionado, setProfessorSelecionado] = useState<string>('TODOS');
  const [slotExpandido, setSlotExpandido] = useState<string | null>(null);

  // Calcular próximas datas disponíveis para um slot
  const getProximasDatas = (slot: SlotDisponibilidade): { data: string; disponivel: boolean }[] => {
    const hoje = startOfDay(new Date());
    const resultados: { data: string; disponivel: boolean }[] = [];

    for (let i = 1; i <= 60 && resultados.length < 5; i++) {
      const data = addDays(hoje, i);
      const jsDia = data.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb

      if (jsDia === slot.diaSemana) {
        const dataStr = format(data, 'yyyy-MM-dd');

        // Verificar se há conflito de professor OU estúdio
        const temConflito = aulasExistentes.some(a =>
          a.data === dataStr &&
          (a.status === 'CONFIRMADA' || a.status === 'PENDENTE') &&
          (a.professorId === slot.professorId || a.estudioId === slot.estudioId) &&
          (
            (slot.horaInicio >= a.horaInicio && slot.horaInicio < a.horaFim) ||
            (slot.horaFim > a.horaInicio && slot.horaFim <= a.horaFim) ||
            (slot.horaInicio <= a.horaInicio && slot.horaFim >= a.horaFim)
          )
        );

        resultados.push({ data: dataStr, disponivel: !temConflito });
      }
    }

    return resultados;
  };

  const formatDataChip = (dataStr: string) => {
    const data = new Date(dataStr + 'T12:00:00');
    const dia = data.getDate();
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mes = meses[data.getMonth()];
    const diaSemanaShort = DIAS_SEMANA.find(d => d.num === data.getDay())?.short || '';
    return { dia, mes, diaSemanaShort };
  };

  const professoresFiltrados = professorSelecionado === 'TODOS'
    ? professores
    : professores.filter(p => p.id === professorSelecionado);

  // Agrupar slots por dia da semana para um professor
  const getSlotsPorDia = (professorId: string) => {
    const slots = mockDisponibilidades.filter(d => d.professorId === professorId);
    const porDia: Record<number, SlotDisponibilidade[]> = {};
    slots.forEach(slot => {
      if (!porDia[slot.diaSemana]) porDia[slot.diaSemana] = [];
      porDia[slot.diaSemana].push(slot);
    });
    return porDia;
  };

  // Obter modalidades únicas de um professor
  const getModalidadesProfessor = (professorId: string) => {
    const slots = mockDisponibilidades.filter(d => d.professorId === professorId);
    return [...new Set(slots.map(s => s.modalidade))];
  };

  return (
    <div className="space-y-5">
      {/* Header informativo */}
      <div className="bg-gradient-to-r from-[#0a1a17] to-[#0d3d33] p-5 rounded-2xl border border-white/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#c9a84c]/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5 text-[#c9a84c]" />
          </div>
          <div>
            <h2 className="text-white mb-1" style={{ fontWeight: 600 }}>
              Disponibilidade dos Professores
            </h2>
            <p className="text-white/50 text-sm">
              Consulte os horários e salas disponíveis de cada professor. Clique numa data para pré-preencher automaticamente o formulário de marcação.
            </p>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <div className="w-3 h-3 rounded-full bg-[#0d6b5e]" />
            Disponível
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            Ocupado
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/60">
            <div className="w-3 h-3 rounded-full bg-[#c9a84c]" />
            Clique para marcar
          </div>
        </div>
      </div>

      {/* Filtro por professor */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-[#4d7068]" style={{ fontWeight: 500 }}>Filtrar:</span>
        <button
          onClick={() => setProfessorSelecionado('TODOS')}
          className={`px-4 py-1.5 rounded-full text-sm transition-all border ${
            professorSelecionado === 'TODOS'
              ? 'bg-[#0d6b5e] text-white border-[#0d6b5e]'
              : 'bg-white text-[#4d7068] border-[#0d6b5e]/20 hover:border-[#0d6b5e]/40'
          }`}
        >
          Todos os Professores
        </button>
        {professores.map(prof => (
          <button
            key={prof.id}
            onClick={() => setProfessorSelecionado(prof.id)}
            className={`px-4 py-1.5 rounded-full text-sm transition-all border ${
              professorSelecionado === prof.id
                ? 'bg-[#0d6b5e] text-white border-[#0d6b5e]'
                : 'bg-white text-[#4d7068] border-[#0d6b5e]/20 hover:border-[#0d6b5e]/40'
            }`}
          >
            {prof.nome}
          </button>
        ))}
      </div>

      {/* Cards dos professores */}
      {professoresFiltrados.map(professor => {
        const slotsPorDia = getSlotsPorDia(professor.id);
        const modalidades = getModalidadesProfessor(professor.id);
        const diasComSlots = Object.keys(slotsPorDia).map(Number).sort();

        return (
          <div key={professor.id} className="bg-white rounded-2xl shadow-sm border border-[#0d6b5e]/10 overflow-hidden">
            {/* Header do professor */}
            <div className="bg-[#f4f9f8] px-6 py-4 border-b border-[#0d6b5e]/10">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0 ${PROFESSOR_AVATAR_COLORS[professor.id] || 'bg-[#0d6b5e]'}`}>
                  {professor.nome.charAt(0)}
                </div>
                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-[#0a1a17]" style={{ fontWeight: 600 }}>{professor.nome}</h3>
                  <p className="text-xs text-[#4d7068]">{professor.email}</p>
                  {/* Modalidades */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {modalidades.map(mod => (
                      <span
                        key={mod}
                        className={`px-2 py-0.5 rounded-full text-xs border ${MODALIDADE_COLORS[mod] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Resumo semanal */}
                <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                  {DIAS_SEMANA.map(dia => {
                    const temSlot = diasComSlots.includes(dia.num);
                    return (
                      <div
                        key={dia.num}
                        className={`flex flex-col items-center w-9 py-1.5 rounded-lg text-center ${
                          temSlot
                            ? 'bg-[#0d6b5e]/10 border border-[#0d6b5e]/20'
                            : 'bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <span className={`text-xs ${temSlot ? 'text-[#0d6b5e]' : 'text-gray-300'}`} style={{ fontWeight: 600 }}>
                          {dia.short}
                        </span>
                        {temSlot && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0d6b5e] mt-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Slots por dia */}
            <div className="divide-y divide-[#0d6b5e]/5">
              {diasComSlots.map(diaSemana => {
                const diaInfo = DIAS_SEMANA.find(d => d.num === diaSemana);
                const slots = slotsPorDia[diaSemana];

                return (
                  <div key={diaSemana} className="px-6 py-4">
                    {/* Label do dia */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#c9a84c]" />
                      <span className="text-sm text-[#0a1a17]" style={{ fontWeight: 600 }}>
                        {diaInfo?.label}
                      </span>
                    </div>

                    {/* Slots desse dia */}
                    <div className="space-y-3 ml-4">
                      {slots.map(slot => {
                        const proximasDatas = getProximasDatas(slot);
                        const isExpanded = slotExpandido === slot.id;
                        const disponiveisCount = proximasDatas.filter(d => d.disponivel).length;

                        return (
                          <div
                            key={slot.id}
                            className="border border-[#0d6b5e]/15 rounded-xl overflow-hidden hover:border-[#0d6b5e]/30 transition-colors"
                          >
                            {/* Info do slot */}
                            <button
                              onClick={() => setSlotExpandido(isExpanded ? null : slot.id)}
                              className="w-full text-left p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-wrap">
                                  {/* Hora */}
                                  <div className="flex items-center gap-1.5 text-sm text-[#0a1a17]">
                                    <Clock className="w-4 h-4 text-[#0d6b5e]" />
                                    <span style={{ fontWeight: 600 }}>{slot.horaInicio}</span>
                                    <span className="text-[#4d7068]">–</span>
                                    <span style={{ fontWeight: 600 }}>{slot.horaFim}</span>
                                    <span className="text-xs text-[#4d7068] ml-1">({slot.duracao} min)</span>
                                  </div>

                                  {/* Sala */}
                                  <div className="flex items-center gap-1.5 text-sm text-[#4d7068]">
                                    <MapPin className="w-4 h-4 text-[#0d6b5e]" />
                                    <span>{slot.estudioNome}</span>
                                  </div>

                                  {/* Modalidade */}
                                  <div className="flex items-center gap-1.5">
                                    <Music className="w-3.5 h-3.5 text-[#0d6b5e]" />
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs border ${
                                        MODALIDADE_COLORS[slot.modalidade] || 'bg-gray-100 text-gray-700 border-gray-200'
                                      }`}
                                    >
                                      {slot.modalidade}
                                    </span>
                                  </div>
                                </div>

                                {/* Status e toggle */}
                                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    disponiveisCount > 0
                                      ? 'bg-[#e2f0ed] text-[#0d6b5e]'
                                      : 'bg-red-50 text-red-700'
                                  }`}>
                                    {disponiveisCount > 0 ? `${disponiveisCount} datas livres` : 'Sem vagas'}
                                  </span>
                                  <ChevronRight
                                    className={`w-4 h-4 text-[#4d7068] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  />
                                </div>
                              </div>
                            </button>

                            {/* Datas expandidas */}
                            {isExpanded && (
                              <div className="px-4 pb-4 bg-[#f4f9f8]/50 border-t border-[#0d6b5e]/10">
                                <p className="text-xs text-[#4d7068] mt-3 mb-3" style={{ fontWeight: 500 }}>
                                  Próximas 5 ocorrências:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {proximasDatas.map(({ data, disponivel }) => {
                                    const { dia, mes, diaSemanaShort } = formatDataChip(data);
                                    return (
                                      <button
                                        key={data}
                                        onClick={() => {
                                          if (disponivel) {
                                            onMarcarSlot({
                                              professorId: slot.professorId,
                                              estudioId: slot.estudioId,
                                              data: data,
                                              horaInicio: slot.horaInicio,
                                              duracao: String(slot.duracao),
                                            });
                                          }
                                        }}
                                        disabled={!disponivel}
                                        className={`flex flex-col items-center px-3 py-2 rounded-xl border transition-all ${
                                          disponivel
                                            ? 'bg-white border-[#0d6b5e]/30 hover:bg-[#0d6b5e] hover:text-white hover:border-[#0d6b5e] group cursor-pointer shadow-sm'
                                            : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                                        }`}
                                        title={disponivel ? `Marcar aula para ${data}` : 'Data ocupada'}
                                      >
                                        <span className={`text-xs mb-0.5 ${disponivel ? 'text-[#4d7068] group-hover:text-white/80' : 'text-gray-400'}`}>
                                          {diaSemanaShort}
                                        </span>
                                        <span className={`text-sm ${disponivel ? 'text-[#0a1a17] group-hover:text-white' : 'text-gray-400'}`} style={{ fontWeight: 600 }}>
                                          {dia}
                                        </span>
                                        <span className={`text-xs ${disponivel ? 'text-[#0d6b5e] group-hover:text-white/80' : 'text-gray-400'}`}>
                                          {mes}
                                        </span>
                                        {disponivel ? (
                                          <CheckCircle2 className="w-3 h-3 text-[#0d6b5e] group-hover:text-white mt-0.5" />
                                        ) : (
                                          <AlertCircle className="w-3 h-3 text-red-400 mt-0.5" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {proximasDatas.filter(d => d.disponivel).length > 0 && (
                                  <p className="text-xs text-[#0d6b5e] mt-3 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Clique numa data disponível para pré-preencher o formulário de marcação
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
