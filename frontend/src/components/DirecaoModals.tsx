import { useState } from 'react';
import { XCircle, RefreshCw, Clock, MapPin, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { PedidoAula } from '../types';
import { mockDisponibilidades, mockEstudios } from '../data/mockData';
import { SlotDisponibilidade } from '../types';
import { format, addDays, startOfDay } from 'date-fns';

interface DirecaoModalsProps {
  direcaoCancelarModal: string | null;
  setDirecaoCancelarModal: (id: string | null) => void;
  aulas: PedidoAula[];
  handleRejeitar: (id: string) => void;
  onRemarcar?: (aulaId: string, novaData: string, novoHoraInicio: string, novoHoraFim: string, novoEstudioId: string, novoEstudioNome: string) => void;
}

const DIAS_SEMANA = [
  { num: 1, label: 'Segunda-feira', short: 'Seg' },
  { num: 2, label: 'Terça-feira',   short: 'Ter' },
  { num: 3, label: 'Quarta-feira',  short: 'Qua' },
  { num: 4, label: 'Quinta-feira',  short: 'Qui' },
  { num: 5, label: 'Sexta-feira',   short: 'Sex' },
  { num: 6, label: 'Sábado',        short: 'Sáb' },
];

function getProximasDatas(slot: SlotDisponibilidade, aulasExistentes: PedidoAula[], ignorarAulaId?: string) {
  const hoje = startOfDay(new Date());
  const resultados: { data: string; disponivel: boolean }[] = [];
  for (let i = 1; i <= 90 && resultados.length < 5; i++) {
    const data = addDays(hoje, i);
    const jsDia = data.getDay();
    if (jsDia === slot.diaSemana) {
      const dataStr = format(data, 'yyyy-MM-dd');
      const temConflito = aulasExistentes.some(a =>
        a.id !== ignorarAulaId &&
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
}

function formatDataChip(dataStr: string) {
  const data = new Date(dataStr + 'T12:00:00');
  const dia = data.getDate();
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const mes = meses[data.getMonth()];
  const diaSemanaNum = data.getDay();
  const diaSemanaShort = DIAS_SEMANA.find(d => d.num === diaSemanaNum)?.short || '';
  return { dia, mes, diaSemanaShort };
}

export function DirecaoModals({
  direcaoCancelarModal,
  setDirecaoCancelarModal,
  aulas,
  handleRejeitar,
  onRemarcar,
}: DirecaoModalsProps) {
  const [opcao, setOpcao] = useState<'escolha' | 'remarcar' | null>('escolha');
  const [slotExpandido, setSlotExpandido] = useState<string | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<{ slot: SlotDisponibilidade; data: string } | null>(null);

  const fecharModal = () => {
    setDirecaoCancelarModal(null);
    setOpcao('escolha');
    setSlotExpandido(null);
    setDataSelecionada(null);
  };

  // Reset quando abre modal
  const handleOpen = (id: string | null) => {
    if (id) {
      setOpcao('escolha');
      setSlotExpandido(null);
      setDataSelecionada(null);
    }
    setDirecaoCancelarModal(id);
  };

  if (!direcaoCancelarModal) return null;

  const aulaOriginal = aulas.find(a => a.id === direcaoCancelarModal);
  if (!aulaOriginal) return null;

  // Slots do professor desta aula
  const slotsDoProf = mockDisponibilidades.filter(s => s.professorId === aulaOriginal.professorId);
  const slotsPorDia: Record<number, SlotDisponibilidade[]> = {};
  slotsDoProf.forEach(slot => {
    if (!slotsPorDia[slot.diaSemana]) slotsPorDia[slot.diaSemana] = [];
    slotsPorDia[slot.diaSemana].push(slot);
  });
  const diasComSlots = Object.keys(slotsPorDia).map(Number).sort();

  const handleConfirmarRemarcacao = () => {
    if (!dataSelecionada || !onRemarcar) return;
    const { slot, data } = dataSelecionada;
    const estudio = mockEstudios.find(e => e.id === slot.estudioId);
    onRemarcar(
      aulaOriginal.id,
      data,
      slot.horaInicio,
      slot.horaFim,
      slot.estudioId,
      estudio?.nome ?? slot.estudioNome
    );
    fecharModal();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${opcao === 'remarcar' ? 'bg-[#c9a84c]/15' : 'bg-amber-50'}`}>
              {opcao === 'remarcar'
                ? <RefreshCw className="w-6 h-6 text-[#c9a84c]" />
                : <XCircle className="w-6 h-6 text-amber-500" />
              }
            </div>
            <div>
              <h3 className="text-lg text-[#0a1a17]" style={{ fontWeight: 700 }}>
                {opcao === 'remarcar' ? 'Remarcar Aula' : 'Cancelar Aula'}
              </h3>
              <p className="text-sm text-[#0d6b5e]">
                {aulaOriginal.alunoNome} — {aulaOriginal.modalidade} — Prof. {aulaOriginal.professorNome}
              </p>
            </div>
          </div>
        </div>

        {/* Body scrollável */}
        <div className="overflow-y-auto flex-1">

          {/* Ecrã de escolha */}
          {opcao === 'escolha' && (
            <div className="p-6 space-y-3">
              <p className="text-sm text-[#4d7068] mb-4">
                Selecione uma opção para esta aula:
              </p>

              {/* Card Remarcar */}
              <button
                onClick={() => setOpcao('remarcar')}
                className="w-full p-5 rounded-2xl border-2 border-[#c9a84c]/40 bg-[#c9a84c]/5 hover:bg-[#c9a84c]/10 hover:border-[#c9a84c]/70 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#c9a84c]/15 group-hover:bg-[#c9a84c]/25 rounded-xl flex items-center justify-center transition-colors shrink-0">
                    <RefreshCw className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                  <div>
                    <p className="text-[#0a1a17]" style={{ fontWeight: 700 }}>Remarcar</p>
                    <p className="text-sm text-[#4d7068] mt-0.5">Escolher uma nova data disponível do professor</p>
                  </div>
                </div>
              </button>

              {/* Card Cancelar */}
              <button
                onClick={() => {
                  handleRejeitar(aulaOriginal.id);
                  fecharModal();
                }}
                className="w-full p-5 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center transition-colors shrink-0">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[#0a1a17]" style={{ fontWeight: 700 }}>Cancelar</p>
                    <p className="text-sm text-[#4d7068] mt-0.5">Rejeitar definitivamente esta marcação</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Ecrã de remarcação */}
          {opcao === 'remarcar' && (
            <div className="p-6">
              <p className="text-sm text-[#4d7068] mb-4">
                Selecione um horário disponível do professor. As próximas 5 datas de cada horário serão apresentadas.
              </p>

              {diasComSlots.length === 0 ? (
                <div className="text-center py-8 text-[#4d7068] text-sm">
                  Este professor não tem disponibilidades definidas.
                </div>
              ) : (
                <div className="space-y-4">
                  {diasComSlots.map(diaSemana => {
                    const diaInfo = DIAS_SEMANA.find(d => d.num === diaSemana);
                    const slots = slotsPorDia[diaSemana];
                    return (
                      <div key={diaSemana} className="border border-[#0d6b5e]/10 rounded-2xl overflow-hidden">
                        {/* Cabeçalho do dia */}
                        <div className="bg-[#f4f9f8] px-5 py-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#c9a84c]" />
                          <span className="text-sm text-[#0a1a17]" style={{ fontWeight: 600 }}>
                            {diaInfo?.label}
                          </span>
                        </div>

                        {/* Slots */}
                        <div className="divide-y divide-[#0d6b5e]/5">
                          {slots.map(slot => {
                            const proximasDatas = getProximasDatas(slot, aulas, aulaOriginal.id);
                            const isExpanded = slotExpandido === slot.id;
                            const disponiveisCount = proximasDatas.filter(d => d.disponivel).length;

                            return (
                              <div key={slot.id}>
                                <button
                                  onClick={() => setSlotExpandido(isExpanded ? null : slot.id)}
                                  className="w-full text-left px-5 py-4 hover:bg-[#f4f9f8]/50 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-wrap">
                                      <div className="flex items-center gap-1.5 text-sm text-[#0a1a17]">
                                        <Clock className="w-4 h-4 text-[#0d6b5e]" />
                                        <span style={{ fontWeight: 600 }}>{slot.horaInicio}</span>
                                        <span className="text-[#4d7068]">–</span>
                                        <span style={{ fontWeight: 600 }}>{slot.horaFim}</span>
                                        <span className="text-xs text-[#4d7068] ml-1">({slot.duracao} min)</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-sm text-[#4d7068]">
                                        <MapPin className="w-4 h-4 text-[#0d6b5e]" />
                                        <span>{slot.estudioNome}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className={`text-xs px-2.5 py-1 rounded-full ${disponiveisCount > 0 ? 'bg-[#e2f0ed] text-[#0d6b5e]' : 'bg-red-50 text-red-700'}`}>
                                        {disponiveisCount > 0 ? `${disponiveisCount} datas livres` : 'Sem vagas'}
                                      </span>
                                      <ChevronRight className={`w-4 h-4 text-[#4d7068] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    </div>
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="px-5 pb-5 bg-[#f4f9f8]/40 border-t border-[#0d6b5e]/5">
                                    <p className="text-xs text-[#4d7068] mt-3 mb-3" style={{ fontWeight: 500 }}>
                                      Próximas 5 ocorrências:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {proximasDatas.map(({ data, disponivel }) => {
                                        const { dia, mes, diaSemanaShort } = formatDataChip(data);
                                        const isSelected = dataSelecionada?.data === data && dataSelecionada?.slot.id === slot.id;
                                        return (
                                          <button
                                            key={data}
                                            disabled={!disponivel}
                                            onClick={() => {
                                              if (disponivel) {
                                                setDataSelecionada(isSelected ? null : { slot, data });
                                              }
                                            }}
                                            className={`flex flex-col items-center px-3 py-2 rounded-xl border transition-all ${
                                              isSelected
                                                ? 'bg-[#0d6b5e] border-[#0d6b5e] text-white shadow-md'
                                                : disponivel
                                                  ? 'bg-white border-[#0d6b5e]/30 hover:bg-[#0d6b5e] hover:text-white hover:border-[#0d6b5e] group cursor-pointer shadow-sm'
                                                  : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                                            }`}
                                          >
                                            <span className={`text-xs mb-0.5 ${isSelected ? 'text-white/80' : disponivel ? 'text-[#4d7068]' : 'text-gray-400'}`}>
                                              {diaSemanaShort}
                                            </span>
                                            <span className={`text-sm ${isSelected ? 'text-white' : disponivel ? 'text-[#0a1a17]' : 'text-gray-400'}`} style={{ fontWeight: 700 }}>
                                              {dia}
                                            </span>
                                            <span className={`text-xs ${isSelected ? 'text-white/80' : disponivel ? 'text-[#0d6b5e]' : 'text-gray-400'}`}>
                                              {mes}
                                            </span>
                                            {disponivel
                                              ? <CheckCircle2 className={`w-3 h-3 mt-0.5 ${isSelected ? 'text-white' : 'text-[#0d6b5e]'}`} />
                                              : <AlertCircle className="w-3 h-3 mt-0.5 text-red-400" />
                                            }
                                          </button>
                                        );
                                      })}
                                    </div>
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
              )}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="p-6 border-t border-gray-100 shrink-0">
          {opcao === 'escolha' && (
            <button
              onClick={fecharModal}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#4d7068] hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
          )}

          {opcao === 'remarcar' && (
            <div className="flex gap-3">
              <button
                onClick={() => { setOpcao('escolha'); setDataSelecionada(null); setSlotExpandido(null); }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-[#4d7068] hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRemarcacao}
                disabled={!dataSelecionada}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0d6b5e] text-white px-4 py-3 rounded-xl hover:bg-[#065147] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                style={{ fontWeight: 600 }}
              >
                <RefreshCw className="w-4 h-4" />
                Confirmar Remarcação
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
