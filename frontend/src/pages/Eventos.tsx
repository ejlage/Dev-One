import { Link } from 'react-router';
import { Calendar, MapPin, ExternalLink, Home } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import api from '../services/api';

export function Eventos() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const res = await api.getEventos();
        if (res.success) setEventos(res.data);
      } catch (error) {
        console.error('Error fetching eventos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventos();
  }, []);

  const eventosDestaque = eventos.filter(e => e.destaque);
  const outrosEventos = eventos.filter(e => !e.destaque);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f9f8] flex items-center justify-center">
        <div className="text-[#4d7068]">A carregar eventos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f9f8]">
      {/* Header */}
      <section className="bg-[#0a1a17] text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, #c9a84c 0%, transparent 50%),
                              radial-gradient(circle at 70% 30%, #0d6b5e 0%, transparent 50%)`
          }}
        />
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-white/50">
            <Link to="/" className="hover:text-[#c9a84c] flex items-center gap-1 transition-colors">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">Eventos</span>
          </div>

          <div className="text-center">
            <span className="text-[#c9a84c] tracking-widest uppercase text-sm">Agenda</span>
            <h1 className="text-5xl md:text-6xl mt-2 mb-4">Eventos</h1>
            <p className="text-xl text-white/70">
              Acompanhe os próximos espetáculos e workshops da ENT'ARTES
            </p>
          </div>
        </div>
      </section>

      {/* Eventos em Destaque */}
      {eventosDestaque.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-0.5 bg-[#c9a84c]" />
              <h2 className="text-3xl text-[#0a1a17]">Em Destaque</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {eventosDestaque.map(evento => (
                <div
                  key={evento.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#0d6b5e]/5 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#0d6b5e]/10 cursor-pointer group"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={evento.imagem}
                      alt={evento.titulo}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#c9a84c] text-[#0a1a17] px-3 py-1 rounded-full text-xs" style={{ fontWeight: 600 }}>
                        Destaque
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl mb-3 text-[#0a1a17]">{evento.titulo}</h3>
                    <p className="text-[#4d7068] mb-4">{evento.descricao}</p>

                    <div className="space-y-2 mb-5">
                      <div className="flex items-center gap-2 text-[#0a1a17]">
                        <Calendar className="w-5 h-5 text-[#0d6b5e]" />
                        <span>
                          {format(new Date(evento.data), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#0a1a17]">
                        <MapPin className="w-5 h-5 text-[#0d6b5e]" />
                        <span>{evento.local}</span>
                      </div>
                    </div>

                    {evento.linkBilhetes && (
                      <a
                        href={evento.linkBilhetes}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#0d6b5e] text-white px-6 py-3 rounded-xl hover:bg-[#065147] transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        Comprar Bilhetes
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Outros Eventos */}
      {outrosEventos.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-0.5 bg-[#c9a84c]" />
              <h2 className="text-3xl text-[#0a1a17]">Próximos Eventos</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {outrosEventos.map(evento => (
                <div
                  key={evento.id}
                  className="bg-[#f4f9f8] rounded-2xl overflow-hidden border border-[#0d6b5e]/5 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-[#0d6b5e]/10 cursor-pointer group"
                >
                  <div className="overflow-hidden">
                    <img
                      src={evento.imagem}
                      alt={evento.titulo}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl mb-2 text-[#0a1a17]">{evento.titulo}</h3>
                    <p className="text-[#4d7068] text-sm mb-4 line-clamp-2">{evento.descricao}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-[#0a1a17]">
                        <Calendar className="w-4 h-4 text-[#0d6b5e]" />
                        <span>
                          {format(new Date(evento.data), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#0a1a17]">
                        <MapPin className="w-4 h-4 text-[#0d6b5e]" />
                        <span className="line-clamp-1">{evento.local}</span>
                      </div>
                    </div>

                    {evento.linkBilhetes && (
                      <a
                        href={evento.linkBilhetes}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[#0d6b5e] hover:text-[#065147] transition-colors text-sm"
                        style={{ fontWeight: 600 }}
                      >
                        Ver Detalhes
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}