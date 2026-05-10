import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { User, Mail, Phone, Music2, CheckCircle2, ChevronDown } from 'lucide-react';
import api from '../services/api';

const MODALIDADES_FALLBACK = ['Ballet Clássico', 'Hip-Hop', 'Contemporâneo', 'Jazz', 'Danças Latinas', 'Sapateado'];

const FAIXAS_ETARIAS = [
  'Criança (4–9 anos)',
  'Jovem (10–17 anos)',
  'Adulto (18+)',
];

export function Experimentar() {
  type ContactForm = {
    nome: string;
    email: string;
    telemovel: string;
    modalidade: string;
    faixaEtaria: string;
    mensagem: string;
  };
  
  const [modalidades, setModalidades] = useState<string[]>(MODALIDADES_FALLBACK);
  const [form, setForm] = useState<ContactForm>({
    nome: '',
    email: '',
    telemovel: '',
    modalidade: '',
    faixaEtaria: '',
    mensagem: '',
  });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.getModalidadesPublicas()
      .then(res => { if (res.success && res.data.length) setModalidades(res.data.map(m => m.nome)); })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.submitContact({
        nome: form.nome,
        email: form.email,
        telemovel: form.telemovel,
        mensagem: form.mensagem || undefined,
        ...(form.modalidade && { modalidade: form.modalidade }),
        ...(form.faixaEtaria && { faixaEtaria: form.faixaEtaria }),
        tipo: 'experimental',
      });
      if (res.success) setEnviado(true);
      else setErro('Erro ao enviar. Por favor tenta novamente.');
    } catch {
      setErro('Erro ao enviar. Por favor tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1a17]">
      {/* Hero */}
      <div className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 60%, #c9a84c 0%, transparent 45%),
                              radial-gradient(circle at 75% 40%, #0d6b5e 0%, transparent 45%)`
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="text-[#c9a84c] tracking-[0.3em] uppercase text-xs mb-4 block">Escola de Dança & Artes Performativas</span>
          <h1 className="text-4xl md:text-6xl text-white mb-4" style={{ fontWeight: 700 }}>
            Vem Experimentar
          </h1>
          <p className="text-xl text-white/60">
            A primeira aula é por nossa conta. Preenche o formulário e entraremos em contacto para agendar a tua aula experimental.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="max-w-2xl mx-auto px-4 pb-24">
        {enviado ? (
          <div className="bg-[#162e28] rounded-2xl p-12 text-center border border-[#c9a84c]/20">
            <div className="w-20 h-20 bg-[#0d6b5e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#c9a84c]" />
            </div>
            <h2 className="text-3xl text-white mb-3">Pedido recebido!</h2>
            <p className="text-white/60 mb-8">
              Obrigado, <strong className="text-white">{form.nome.split(' ')[0]}</strong>! Entraremos em contacto em breve para confirmar a tua aula experimental.
            </p>
            <Link
              to="/"
              className="inline-block bg-[#c9a84c] text-[#0a1a17] px-8 py-3 rounded-full hover:bg-[#e8c97a] transition-colors"
              style={{ fontWeight: 600 }}
            >
              Voltar ao Início
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#162e28] rounded-2xl p-8 md:p-10 border border-white/5 space-y-6">
            {erro && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
                {erro}
              </div>
            )}

            {/* Nome + Email */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">Nome completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a84c]/60" />
                  <input
                    name="nome"
                    type="text"
                    required
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="O teu nome"
                    className="w-full pl-10 pr-4 py-3 bg-[#0a1a17] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a84c]/60" />
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@exemplo.pt"
                    className="w-full pl-10 pr-4 py-3 bg-[#0a1a17] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Telefone + Faixa etária */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">Telemóvel *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a84c]/60" />
                  <input
                    name="telemovel"
                    type="tel"
                    required
                    value={form.telemovel}
                    onChange={handleChange}
                    placeholder="9xx xxx xxx"
                    className="w-full pl-10 pr-4 py-3 bg-[#0a1a17] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-2">Faixa etária</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a84c]/60 pointer-events-none" />
                  <select
                    name="faixaEtaria"
                    value={form.faixaEtaria}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#0a1a17] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#c9a84c]/50 transition-colors appearance-none"
                  >
                    <option value="">Selecionar...</option>
                    {FAIXAS_ETARIAS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Modalidade */}
            <div>
              <label className="block text-sm text-white/50 mb-2">Modalidade de interesse</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[...modalidades, 'Ainda não sei'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, modalidade: f.modalidade === m ? '' : m }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      form.modalidade === m
                        ? 'bg-[#c9a84c] border-[#c9a84c] text-[#0a1a17]'
                        : 'bg-transparent border-white/10 text-white/60 hover:border-[#c9a84c]/40 hover:text-white/80'
                    }`}
                    style={{ fontWeight: form.modalidade === m ? 600 : 400 }}
                  >
                    <Music2 className="w-3.5 h-3.5 shrink-0" />
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm text-white/50 mb-2">Mensagem (opcional)</label>
              <textarea
                name="mensagem"
                rows={3}
                value={form.mensagem}
                onChange={handleChange}
                placeholder="Alguma informação extra que queiras partilhar..."
                className="w-full px-4 py-3 bg-[#0a1a17] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c9a84c] text-[#0a1a17] py-4 rounded-xl hover:bg-[#e8c97a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 700, fontSize: '1rem' }}
            >
              {loading ? 'A enviar...' : 'Quero Experimentar!'}
            </button>

            <p className="text-center text-xs text-white/30">
              Entraremos em contacto no prazo de 24 horas úteis.
            </p>
          </form>
        )}

        <div className="text-center mt-8">
          <Link to="/" className="text-sm text-white/40 hover:text-white/70 transition-colors">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
