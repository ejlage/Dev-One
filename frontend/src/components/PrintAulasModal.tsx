import { useState, useRef, useEffect } from 'react';
import { X, Printer, ChevronDown, User, CalendarDays } from 'lucide-react';
import api from '../services/api';
import { User as UserType, PedidoAula } from '../types';

interface Props {
  currentUser: UserType;
  onClose: () => void;
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${DAYS[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function fmtDur(min: number) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h${m > 0 ? String(m).padStart(2,'0') + 'm' : ''}`;
  }
  return `${min}m`;
}

export function PrintAulasModal({ currentUser, onClose }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [aulas, setAulas] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, aulasRes] = await Promise.all([
        api.getUsers(),
        api.getAulas()
      ]);
      if (usersRes.success) setUsers(usersRes.data || []);
      if (aulasRes.success) setAulas(aulasRes.data || []);
    };
    fetchData();
  }, []);

  const professors = users.filter(u => u.role === 'PROFESSOR');

  const [selectedProfId, setSelectedProfId] = useState<string>(
    currentUser.role === 'PROFESSOR' ? currentUser.id : ''
  );
  const [step, setStep] = useState<'select' | 'preview'>(
    currentUser.role === 'PROFESSOR' ? 'preview' : 'select'
  );

  // Range de datas — default: primeiro dia do mês atual até hoje
  const today = new Date();
  const defaultFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-01`;
  const defaultTo   = today.toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState<string>(defaultFrom);
  const [dateTo,   setDateTo]   = useState<string>(defaultTo);

  const printRef = useRef<HTMLDivElement>(null);

  const selectedProf = users.find(u => u.id === selectedProfId);

  // Todas as aulas realizadas do professor, filtradas pelo range
  const aulasRealizadas: PedidoAula[] = aulas
    .filter(a => {
      if (a.status !== 'REALIZADA' || String(a.professorId) !== selectedProfId) return false;
      if (dateFrom && a.data < dateFrom) return false;
      if (dateTo   && a.data > dateTo)   return false;
      return true;
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const totalMinutos = aulasRealizadas.reduce((acc, a) => acc + a.duracao, 0);

  const periodoLabel = dateFrom || dateTo
    ? `${dateFrom ? formatDateShort(dateFrom) : '—'} a ${dateTo ? formatDateShort(dateTo) : '—'}`
    : 'Todas as datas';

  const handlePrint = () => {
    const conteudo = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=960,height=720');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <title>Aulas Realizadas — ${selectedProf?.nome ?? ''} — ${periodoLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0a1a17; padding: 32px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #0d6b5e; color: #fff; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
    tbody tr:nth-child(even) { background: #f4f9f8; }
    tbody td { padding: 9px 12px; font-size: 12px; color: #0a1a17; border-bottom: 1px solid #e2f0ed; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>${conteudo}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const handleSelectProf = (id: string) => {
    setSelectedProfId(id);
    setDateFrom(defaultFrom);
    setDateTo(defaultTo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,26,23,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#0d6b5e]/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e2f0ed] flex items-center justify-center">
              <Printer className="w-5 h-5 text-[#0d6b5e]" />
            </div>
            <div>
              <h2 className="text-base text-[#0a1a17]" style={{ fontWeight: 600 }}>
                Imprimir Aulas Realizadas
              </h2>
              <p className="text-xs text-[#4d7068]">
                {step === 'select'
                  ? 'Selecione o professor'
                  : `${selectedProf?.nome} · ${periodoLabel}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#f4f9f8] flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-[#4d7068]" />
          </button>
        </div>

        {/* Step 1 — Selecionar professor */}
        {step === 'select' && (
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-sm text-[#4d7068] mb-4">
              Escolha o professor cujas aulas realizadas pretende imprimir:
            </p>
            <div className="space-y-2">
              {professors.map(prof => {
                const count = aulas.filter(a => String(a.professorId) === prof.id && a.status === 'REALIZADA').length;
                return (
                  <button
                    key={prof.id}
                    onClick={() => handleSelectProf(prof.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      selectedProfId === prof.id
                        ? 'border-[#0d6b5e] bg-[#e2f0ed]'
                        : 'border-[#0d6b5e]/10 bg-white hover:border-[#0d6b5e]/30 hover:bg-[#f4f9f8]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0d6b5e] flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#0a1a17]" style={{ fontWeight: 600 }}>{prof.nome}</p>
                      <p className="text-xs text-[#4d7068]">{prof.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl text-[#0d6b5e]" style={{ fontWeight: 700 }}>{count}</p>
                      <p className="text-xs text-[#4d7068]">aula{count !== 1 ? 's' : ''} realizada{count !== 1 ? 's' : ''}</p>
                    </div>
                    {selectedProfId === prof.id && (
                      <div className="w-5 h-5 rounded-full bg-[#0d6b5e] flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep('preview')}
                disabled={!selectedProfId}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0d6b5e] text-white rounded-xl hover:bg-[#065147] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                style={{ fontWeight: 500 }}
              >
                Ver pré-visualização <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Preview */}
        {step === 'preview' && (
          <>
            <div className="flex-1 overflow-y-auto">

              {/* Filtro de datas */}
              <div className="px-6 pt-4 pb-4 border-b border-[#0d6b5e]/10 bg-[#f4f9f8]">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-4 h-4 text-[#0d6b5e]" />
                  <span className="text-xs text-[#4d7068]" style={{ fontWeight: 600 }}>PERÍODO</span>
                  {currentUser.role === 'DIRECAO' && (
                    <button
                      onClick={() => setStep('select')}
                      className="ml-auto flex items-center gap-1 text-xs text-[#0d6b5e] hover:text-[#065147] transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <ChevronDown className="w-3.5 h-3.5 rotate-90" /> Mudar professor
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#4d7068]">De</label>
                    <input
                      type="date"
                      value={dateFrom}
                      max={dateTo || undefined}
                      onChange={e => setDateFrom(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#0d6b5e]/20 bg-white text-sm text-[#0a1a17] focus:outline-none focus:border-[#0d6b5e] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#4d7068]">Até</label>
                    <input
                      type="date"
                      value={dateTo}
                      min={dateFrom || undefined}
                      onChange={e => setDateTo(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-[#0d6b5e]/20 bg-white text-sm text-[#0a1a17] focus:outline-none focus:border-[#0d6b5e] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1 mt-auto">
                    <button
                      onClick={() => { setDateFrom(''); setDateTo(''); }}
                      className="px-3 py-2 rounded-xl border border-[#0d6b5e]/15 bg-white text-xs text-[#4d7068] hover:text-[#0d6b5e] hover:border-[#0d6b5e]/40 transition-colors"
                    >
                      Limpar datas
                    </button>
                  </div>
                  <div className="ml-auto flex items-end pb-0.5">
                    <span className="text-sm text-[#4d7068]">
                      <span className="text-[#0d6b5e]" style={{ fontWeight: 700 }}>{aulasRealizadas.length}</span>
                      {' '}aula{aulasRealizadas.length !== 1 ? 's' : ''} encontrada{aulasRealizadas.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conteúdo a imprimir */}
              <div className="p-6">
                <div ref={printRef}>
                  {/* Cabeçalho */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', borderBottom:'2px solid #0d6b5e', paddingBottom:'14px' }}>
                    <div>
                      <div style={{ fontSize:'22px', fontWeight:700, color:'#0d6b5e', letterSpacing:'1px' }}>ENT'ARTES</div>
                      <div style={{ fontSize:'11px', color:'#4d7068', marginTop:'2px' }}>Escola de Dança · Relatório Interno</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:'15px', fontWeight:600, color:'#0a1a17' }}>Relatório de Aulas Realizadas</div>
                      <div style={{ fontSize:'11px', color:'#4d7068', marginTop:'2px' }}>
                        Período: <strong>{periodoLabel}</strong>
                      </div>
                      <div style={{ fontSize:'11px', color:'#4d7068', marginTop:'1px' }}>
                        Gerado em {formatDate(new Date().toISOString())}
                      </div>
                    </div>
                  </div>

                  {/* Info professor */}
                  <div style={{ background:'#f4f9f8', border:'1px solid #d1e8e4', borderRadius:'8px', padding:'10px 16px', marginBottom:'16px', display:'flex', gap:'32px', flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontSize:'10px', color:'#4d7068', textTransform:'uppercase', letterSpacing:'.5px' }}>Professor</div>
                      <div style={{ fontSize:'14px', fontWeight:600, color:'#0a1a17' }}>{selectedProf?.nome}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:'10px', color:'#4d7068', textTransform:'uppercase', letterSpacing:'.5px' }}>Email</div>
                      <div style={{ fontSize:'13px', color:'#0a1a17' }}>{selectedProf?.email}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:'10px', color:'#4d7068', textTransform:'uppercase', letterSpacing:'.5px' }}>Período</div>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'#0d6b5e' }}>{periodoLabel}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:'10px', color:'#4d7068', textTransform:'uppercase', letterSpacing:'.5px' }}>Aulas no período</div>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'#0d6b5e' }}>{aulasRealizadas.length}</div>
                    </div>
                  </div>

                  {/* Tabela */}
                  {aulasRealizadas.length === 0 ? (
                    <div className="text-center py-10 text-[#4d7068] text-sm">
                      Nenhuma aula realizada no período selecionado.
                    </div>
                  ) : (
                    <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'14px', fontSize:'12px' }}>
                      <thead>
                        <tr style={{ background:'#0d6b5e', color:'#fff' }}>
                          {['Data','Horário','Duração','Aluno','Estúdio','Modalidade'].map(h => (
                            <th key={h} style={{ padding:'9px 10px', textAlign:'left', fontSize:'10px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.5px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aulasRealizadas.map((aula, idx) => (
                          <tr key={aula.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f4f9f8' }}>
                            <td style={{ padding:'7px 10px', borderBottom:'1px solid #e2f0ed', color:'#0a1a17' }}>{formatDate(aula.data)}</td>
                            <td style={{ padding:'7px 10px', borderBottom:'1px solid #e2f0ed', color:'#0a1a17' }}>{aula.horaInicio} – {aula.horaFim}</td>
                            <td style={{ padding:'7px 10px', borderBottom:'1px solid #e2f0ed', color:'#4d7068' }}>{fmtDur(aula.duracao)}</td>
                            <td style={{ padding:'7px 10px', borderBottom:'1px solid #e2f0ed', color:'#0a1a17', fontWeight:500 }}>{aula.alunoNome}</td>
                            <td style={{ padding:'7px 10px', borderBottom:'1px solid #e2f0ed', color:'#4d7068' }}>{aula.estudioNome}</td>
                            <td style={{ padding:'7px 10px', borderBottom:'1px solid #e2f0ed' }}>
                              <span style={{ background:'#e2f0ed', color:'#0d6b5e', padding:'2px 8px', borderRadius:'999px', fontSize:'10px', fontWeight:600 }}>
                                {aula.modalidade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Resumo */}
                  {aulasRealizadas.length > 0 && (
                    <div style={{ display:'flex', gap:'10px', marginTop:'12px' }}>
                      {[
                        { val: String(aulasRealizadas.length), lbl: 'Aulas realizadas', color: '#0d6b5e' },
                        { val: fmtDur(totalMinutos), lbl: 'Total de horas', color: '#0d6b5e' },
                      ].map(s => (
                        <div key={s.lbl} style={{ flex:1, border:'1px solid #d1e8e4', borderRadius:'8px', padding:'10px 12px', textAlign:'center' }}>
                          <div style={{ fontSize:'20px', fontWeight:700, color: s.color }}>{s.val}</div>
                          <div style={{ fontSize:'9px', color:'#4d7068', marginTop:'3px', textTransform:'uppercase', letterSpacing:'.5px' }}>{s.lbl}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rodapé */}
                  <div style={{ marginTop:'24px', borderTop:'1px solid #e2f0ed', paddingTop:'10px', fontSize:'10px', color:'#4d7068', display:'flex', justifyContent:'space-between' }}>
                    <span>ENT'ARTES — Escola de Dança · Documento gerado automaticamente</span>
                    <span style={{ color:'#c9a84c', fontWeight:600 }}>Confidencial</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#0d6b5e]/10 flex items-center justify-between bg-[#f4f9f8]">
              <p className="text-xs text-[#4d7068]">
                <span style={{ fontWeight: 600 }}>{aulasRealizadas.length}</span> aula{aulasRealizadas.length !== 1 ? 's' : ''}
                {' · '}
                <span style={{ fontWeight: 600 }}>{fmtDur(totalMinutos)}</span>
              </p>
              <button
                onClick={handlePrint}
                disabled={aulasRealizadas.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0d6b5e] text-white rounded-xl hover:bg-[#065147] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                style={{ fontWeight: 500 }}
              >
                <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}