import { useEffect, useState } from 'react';
import { Mail, Phone, Music2, User, MessageSquare, Calendar } from 'lucide-react';
import api from '../services/api';

interface Contacto {
  idcontacto: number;
  nome: string;
  email: string;
  telemovel: string;
  modalidade: string | null;
  faixaetaria: string | null;
  mensagem: string | null;
  datacriacao: string;
}

export function Inscricoes() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroModalidade, setFiltroModalidade] = useState('TODOS');

  useEffect(() => {
    api.getContactos()
      .then(res => { if (res.success) setContactos(res.data); })
      .finally(() => setLoading(false));
  }, []);

  const modalidades = ['TODOS', ...Array.from(new Set(contactos.map(c => c.modalidade).filter(Boolean) as string[]))];

  const filtrados = filtroModalidade === 'TODOS'
    ? contactos
    : contactos.filter(c => c.modalidade === filtroModalidade);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl text-[#0a1a17]" style={{ fontWeight: 700 }}>Inscrições & Contactos</h1>
        <p className="text-[#0a1a17]/60 mt-1">Formulários recebidos através do site público</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {modalidades.map(m => (
            <button
              key={m}
              onClick={() => setFiltroModalidade(m)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filtroModalidade === m
                  ? 'bg-[#0a1a17] text-white'
                  : 'bg-white text-[#0a1a17]/70 border border-[#0a1a17]/20 hover:border-[#0a1a17]/40'
              }`}
            >
              {m === 'TODOS' ? `Todos (${contactos.length})` : m}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#0a1a17]/40">A carregar...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-[#0a1a17]/40">Sem inscrições recebidas.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map(c => (
            <div key={c.idcontacto} className="bg-white rounded-2xl p-5 shadow-sm border border-[#0a1a17]/5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#c9a84c]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#c9a84c]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0a1a17]">{c.nome}</p>
                    {c.faixaetaria && (
                      <p className="text-xs text-[#0a1a17]/50">{c.faixaetaria}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#0a1a17]/40">
                  <Calendar className="w-3 h-3" />
                  {new Date(c.datacriacao).toLocaleDateString('pt-PT')}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm text-[#0a1a17]/70">
                  <Mail className="w-4 h-4 shrink-0 text-[#0a1a17]/40" />
                  <a href={`mailto:${c.email}`} className="hover:text-[#0a1a17] truncate">{c.email}</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#0a1a17]/70">
                  <Phone className="w-4 h-4 shrink-0 text-[#0a1a17]/40" />
                  <a href={`tel:${c.telemovel}`} className="hover:text-[#0a1a17]">{c.telemovel}</a>
                </div>
                {c.modalidade && (
                  <div className="flex items-center gap-2 text-sm text-[#0a1a17]/70">
                    <Music2 className="w-4 h-4 shrink-0 text-[#0a1a17]/40" />
                    {c.modalidade}
                  </div>
                )}
              </div>

              {c.mensagem && (
                <div className="flex gap-2 pt-3 border-t border-[#0a1a17]/5">
                  <MessageSquare className="w-4 h-4 shrink-0 text-[#0a1a17]/30 mt-0.5" />
                  <p className="text-xs text-[#0a1a17]/60 italic">{c.mensagem}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
