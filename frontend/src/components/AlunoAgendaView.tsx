import { PedidoAula } from '../types';
import { Calendar, Clock, MapPin, User, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlunoAgendaViewProps {
  aulas: PedidoAula[];
  nomeAluno: string;
}

export function AlunoAgendaView({ aulas, nomeAluno }: AlunoAgendaViewProps) {
  // Separar aulas por status
  const aulasPendentes   = aulas.filter(a => a.status === 'PENDENTE');
  const aulasConfirmadas = aulas.filter(a => a.status === 'CONFIRMADA');
  const aulasRejeitadas  = aulas.filter(a => a.status === 'REJEITADA');

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const proximasAulas = aulasConfirmadas
    .filter(a => new Date(a.data) >= hoje)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const aulasPassadas = aulasConfirmadas
    .filter(a => new Date(a.data) < hoje)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const getStatusBadge = (status: PedidoAula['status']) => {
    const styles: Record<string, string> = {
      PENDENTE:  'bg-amber-100 text-amber-800 border-amber-200',
      CONFIRMADA:'bg-teal-100 text-teal-800 border-teal-200',
      REJEITADA: 'bg-red-100 text-red-800 border-red-200',
      REALIZADA: 'bg-[#e2f0ed] text-[#0d6b5e] border-[#0d6b5e]/20',
    };
    
    const labels: Record<string, string> = {
      PENDENTE:  'Aguardando Aprovação',
      CONFIRMADA:'Confirmada',
      REJEITADA: 'Rejeitada',
      REALIZADA: 'Realizada',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs border ${styles[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
        {labels[status] ?? status}
      </span>
    );
  };

  const semAulas = aulas.length === 0;

  return (
    <div className="space-y-6">
      {/* Bem-vindo */}
      <div className="bg-gradient-to-br from-[#0d6b5e] to-[#0a4f45] rounded-2xl p-6 text-white">
        <h2 className="text-2xl mb-2" style={{ fontWeight: 600 }}>
          Olá, {nomeAluno}!
        </h2>
        <p className="text-white/80">
          {semAulas
            ? 'Ainda não tens aulas agendadas. Pede ao teu encarregado para marcar a primeira aula.'
            : 'Aqui está a tua agenda de aulas. Apenas o teu encarregado pode solicitar novas aulas.'}
        </p>
      </div>

      {/* Estado vazio — sem nenhuma aula */}
      {semAulas && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#0d6b5e]/20 p-12 text-center">
          <Calendar className="w-16 h-16 text-[#0d6b5e]/20 mx-auto mb-4" />
          <p className="text-[#0a1a17] text-lg mb-2" style={{ fontWeight: 600 }}>
            Nenhuma aula agendada
          </p>
          <p className="text-[#4d7068] text-sm max-w-sm mx-auto">
            Quando o teu encarregado marcar uma aula, ela aparecerá aqui. Podes pedir-lhe para entrar em
            contacto com a escola.
          </p>
        </div>
      )}

      {/* Estatísticas rápidas — só quando há aulas */}
      {!semAulas && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#0d6b5e]/10">
            <p className="text-sm text-[#4d7068] mb-1">Pendentes</p>
            <p className="text-3xl text-[#0a1a17]" style={{ fontWeight: 700 }}>
              {aulasPendentes.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#0d6b5e]/10">
            <p className="text-sm text-[#4d7068] mb-1">Confirmadas</p>
            <p className="text-3xl text-[#0d6b5e]" style={{ fontWeight: 700 }}>
              {aulasConfirmadas.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-200">
            <p className="text-sm text-[#4d7068] mb-1">Rejeitadas</p>
            <p className="text-3xl text-red-600" style={{ fontWeight: 700 }}>
              {aulasRejeitadas.length}
            </p>
          </div>
        </div>
      )}

      {/* Próximas Aulas */}
      {proximasAulas.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#0d6b5e]/10">
          <h3 className="text-xl text-[#0a1a17] mb-4" style={{ fontWeight: 600 }}>
            📅 Próximas Aulas
          </h3>
          <div className="space-y-3">
            {proximasAulas.map(aula => {
              const dataAula = new Date(aula.data);
              const diasAte = Math.ceil((dataAula.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div
                  key={aula.id}
                  className="p-4 bg-[#f4f9f8] rounded-xl border border-[#0d6b5e]/10 hover:border-[#0d6b5e]/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[#0a1a17]" style={{ fontWeight: 600 }}>
                          {format(dataAula, "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </h4>
                        {diasAte === 0 && (
                          <span className="px-2 py-0.5 bg-[#c9a84c] text-[#0a1a17] rounded text-xs" style={{ fontWeight: 600 }}>
                            HOJE
                          </span>
                        )}
                        {diasAte === 1 && (
                          <span className="px-2 py-0.5 bg-[#0d6b5e] text-white rounded text-xs" style={{ fontWeight: 600 }}>
                            AMANHÃ
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#4d7068]">
                        {diasAte > 1 && `Falta${diasAte > 1 ? 'm' : ''} ${diasAte} dia${diasAte > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    {getStatusBadge(aula.status)}
                  </div>

                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-[#4d7068]">
                      <Clock className="w-4 h-4 text-[#0d6b5e]" />
                      <span>{aula.horaInicio} - {aula.horaFim}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#4d7068]">
                      <User className="w-4 h-4 text-[#0d6b5e]" />
                      <span>Prof. {aula.professorNome}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#4d7068]">
                      <MapPin className="w-4 h-4 text-[#0d6b5e]" />
                      <span>{aula.estudioNome}</span>
                    </div>
                  </div>

                  {aula.observacoes && (
                    <div className="mt-3 p-2 bg-white rounded-lg border border-[#0d6b5e]/10">
                      <p className="text-xs text-[#4d7068]">
                        <strong className="text-[#0a1a17]">Obs:</strong> {aula.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aulas Pendentes */}
      {aulasPendentes.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-amber-200">
          <h3 className="text-xl text-[#0a1a17] mb-4" style={{ fontWeight: 600 }}>
            ⏳ A Aguardar Aprovação
          </h3>
          <div className="space-y-3">
            {aulasPendentes
              .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
              .map(aula => {
                const dataAula = new Date(aula.data);
                return (
                  <div key={aula.id} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-[#0a1a17]" style={{ fontWeight: 600 }}>
                        {format(dataAula, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}
                      </h4>
                      {getStatusBadge(aula.status)}
                    </div>
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-[#4d7068]">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>{aula.horaInicio} - {aula.horaFim}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#4d7068]">
                        <User className="w-4 h-4 text-amber-500" />
                        <span>Prof. {aula.professorNome}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#4d7068]">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <span>{aula.estudioNome}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Aulas Passadas */}
      {aulasPassadas.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#0d6b5e]/10">
          <h3 className="text-xl text-[#0a1a17] mb-4" style={{ fontWeight: 600 }}>
            ✅ Aulas Realizadas
          </h3>
          <div className="space-y-3">
            {aulasPassadas.map(aula => {
              const dataAula = new Date(aula.data);
              return (
                <div key={aula.id} className="p-4 bg-[#f4f9f8] rounded-xl border border-[#0d6b5e]/10">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-[#0a1a17]" style={{ fontWeight: 600 }}>
                      {format(dataAula, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}
                    </h4>
                    {getStatusBadge(aula.status)}
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-[#4d7068]">
                      <Clock className="w-4 h-4 text-[#0d6b5e]" />
                      <span>{aula.horaInicio} - {aula.horaFim}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#4d7068]">
                      <User className="w-4 h-4 text-[#0d6b5e]" />
                      <span>Prof. {aula.professorNome}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#4d7068]">
                      <MapPin className="w-4 h-4 text-[#0d6b5e]" />
                      <span>{aula.estudioNome}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Aulas Rejeitadas */}
      {aulasRejeitadas.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-red-100">
          <h3 className="text-xl text-[#0a1a17] mb-4" style={{ fontWeight: 600 }}>
            ❌ Aulas Rejeitadas
          </h3>
          <div className="space-y-3">
            {aulasRejeitadas
              .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
              .map(aula => {
                const dataAula = new Date(aula.data);
                return (
                  <div key={aula.id} className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-[#0a1a17]" style={{ fontWeight: 600 }}>
                        {format(dataAula, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}
                      </h4>
                      {getStatusBadge(aula.status)}
                    </div>
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-[#4d7068]">
                        <Clock className="w-4 h-4 text-red-400" />
                        <span>{aula.horaInicio} - {aula.horaFim}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#4d7068]">
                        <User className="w-4 h-4 text-red-400" />
                        <span>Prof. {aula.professorNome}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#4d7068]">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span>{aula.estudioNome}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Informação sobre permissões */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p style={{ fontWeight: 600 }} className="mb-1">Modo de Visualização</p>
            <p>
              Como aluno, tem acesso apenas de leitura à sua agenda.
              Para solicitar novas aulas ou fazer alterações, entre em contacto com o seu encarregado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
