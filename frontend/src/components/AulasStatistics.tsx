import { PedidoAula } from '../types';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

interface AulasStatisticsProps {
  aulas: PedidoAula[];
}

export function AulasStatistics({ aulas }: AulasStatisticsProps) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const estatisticas = {
    pendentes:  aulas.filter(a => a.status === 'PENDENTE').length,
    confirmadas:aulas.filter(a => a.status === 'CONFIRMADA').length,
    rejeitadas: aulas.filter(a => a.status === 'REJEITADA').length,
    proximaSemana: aulas.filter(a => {
      const dataAula = new Date(a.data);
      const umaSemana = new Date(hoje);
      umaSemana.setDate(umaSemana.getDate() + 7);
      return (
        dataAula >= hoje &&
        dataAula <= umaSemana &&
        (a.status === 'CONFIRMADA' || a.status === 'PENDENTE')
      );
    }).length
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-amber-700" />
          <p className="text-xs text-amber-700" style={{ fontWeight: 600 }}>
            Pendentes
          </p>
        </div>
        <p className="text-2xl text-amber-900" style={{ fontWeight: 700 }}>
          {estatisticas.pendentes}
        </p>
      </div>

      <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-teal-700" />
          <p className="text-xs text-teal-700" style={{ fontWeight: 600 }}>
            Confirmadas
          </p>
        </div>
        <p className="text-2xl text-teal-900" style={{ fontWeight: 700 }}>
          {estatisticas.confirmadas}
        </p>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="w-4 h-4 text-red-700" />
          <p className="text-xs text-red-700" style={{ fontWeight: 600 }}>
            Rejeitadas
          </p>
        </div>
        <p className="text-2xl text-red-900" style={{ fontWeight: 700 }}>
          {estatisticas.rejeitadas}
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-blue-700" />
          <p className="text-xs text-blue-700" style={{ fontWeight: 600 }}>
            Próx. 7 dias
          </p>
        </div>
        <p className="text-2xl text-blue-900" style={{ fontWeight: 700 }}>
          {estatisticas.proximaSemana}
        </p>
      </div>
    </div>
  );
}
