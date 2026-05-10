import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Instagram, Youtube, Facebook, CheckCircle2, ExternalLink } from 'lucide-react';
import api from '../services/api';

export function Contactos() {
  const [form, setForm] = useState({ nome: '', email: '', telemovel: '', mensagem: '' });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.submitContact(form);
      if (res.success) setEnviado(true);
      else setErro('Erro ao enviar. Por favor tenta novamente.');
    } catch {
      setErro('Erro ao enviar. Por favor tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f9f8]">
      {/* Hero */}
      <div className="bg-[#0a1a17] pt-32 pb-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #c9a84c 0%, transparent 45%),
                              radial-gradient(circle at 80% 50%, #0d6b5e 0%, transparent 45%)`
          }}
        />
        <div className="relative z-10">
          <span className="text-[#c9a84c] tracking-[0.3em] uppercase text-xs mb-3 block">Fala Connosco</span>
          <h1 className="text-4xl md:text-5xl text-white" style={{ fontWeight: 700 }}>Contactos</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">

          {/* Coluna esquerda — info + mapa */}
          <div className="space-y-8">

            {/* Cards de contacto */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#0d6b5e]/10 space-y-6">
              <a
                href="https://maps.google.com/?q=Rua+Dr.+Manuel+de+Oliveira+Machado+21+Braga"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 group"
              >
                <div className="w-10 h-10 bg-[#e2f0ed] rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#0d6b5e]" />
                </div>
                <div>
                  <p className="text-xs text-[#4d7068] uppercase tracking-widest mb-1">Morada</p>
                  <p className="text-[#0a1a17] group-hover:text-[#0d6b5e] transition-colors">
                    Rua Dr. Manuel de Oliveira Machado, n.º 21 e 23, R/C
                  </p>
                  <p className="text-[#4d7068] text-sm">4700-054 Braga</p>
                  <span className="inline-flex items-center gap-1 text-xs text-[#0d6b5e] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver no mapa <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>

              <div className="h-px bg-[#0d6b5e]/10" />

              <a href="tel:+351964693247" className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-[#e2f0ed] rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-[#0d6b5e]" />
                </div>
                <div>
                  <p className="text-xs text-[#4d7068] uppercase tracking-widest mb-1">Telefone</p>
                  <p className="text-[#0a1a17] group-hover:text-[#0d6b5e] transition-colors">(+351) 964 693 247</p>
                </div>
              </a>

              <div className="h-px bg-[#0d6b5e]/10" />

              <a href="mailto:entartes@atomicmail.io" className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-[#e2f0ed] rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-[#0d6b5e]" />
                </div>
                <div>
                  <p className="text-xs text-[#4d7068] uppercase tracking-widest mb-1">Email</p>
                  <p className="text-[#0a1a17] group-hover:text-[#0d6b5e] transition-colors">entartes@atomicmail.io</p>
                </div>
              </a>

              <div className="h-px bg-[#0d6b5e]/10" />

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#e2f0ed] rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#0d6b5e]" />
                </div>
                <div>
                  <p className="text-xs text-[#4d7068] uppercase tracking-widest mb-2">Horário</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-8">
                      <span className="text-[#4d7068]">Segunda a Sexta</span>
                      <span className="text-[#0a1a17]" style={{ fontWeight: 500 }}>10h – 22h</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-[#4d7068]">Sábado</span>
                      <span className="text-[#0a1a17]" style={{ fontWeight: 500 }}>9h – 18h</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-[#4d7068]">Domingo</span>
                      <span className="text-red-500" style={{ fontWeight: 500 }}>Fechado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Redes sociais */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#0d6b5e]/10">
              <p className="text-xs text-[#4d7068] uppercase tracking-widest mb-4">Redes Sociais</p>
              <div className="flex gap-3">
                <a
                  href="https://facebook.com/entartes.escoladedanca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f4f9f8] hover:bg-[#e2f0ed] border border-[#0d6b5e]/10 transition-colors text-sm text-[#0a1a17]"
                  style={{ fontWeight: 500 }}
                >
                  <Facebook className="w-4 h-4 text-[#1877f2]" /> Facebook
                </a>
                <a
                  href="https://instagram.com/entartes_escoladedanca/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f4f9f8] hover:bg-[#e2f0ed] border border-[#0d6b5e]/10 transition-colors text-sm text-[#0a1a17]"
                  style={{ fontWeight: 500 }}
                >
                  <Instagram className="w-4 h-4 text-[#e1306c]" /> Instagram
                </a>
                <a
                  href="https://youtube.com/@entartesescoladedanca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f4f9f8] hover:bg-[#e2f0ed] border border-[#0d6b5e]/10 transition-colors text-sm text-[#0a1a17]"
                  style={{ fontWeight: 500 }}
                >
                  <Youtube className="w-4 h-4 text-[#ff0000]" /> YouTube
                </a>
              </div>
            </div>

            {/* Mapa embed */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-[#0d6b5e]/10 h-56">
              <iframe
                title="Localização ENT'ARTES"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022!2d-8.4270!3d41.5510!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sRua+Dr.+Manuel+de+Oliveira+Machado+21+Braga!5e0!3m2!1spt!2spt!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>

          {/* Coluna direita — formulário */}
          <div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#0d6b5e]/10">
              <h2 className="text-2xl text-[#0a1a17] mb-1" style={{ fontWeight: 700 }}>Envia-nos uma mensagem</h2>
              <p className="text-[#4d7068] text-sm mb-8">Responderemos no prazo de 24 horas úteis.</p>

              {enviado ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[#e2f0ed] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#0d6b5e]" />
                  </div>
                  <h3 className="text-xl text-[#0a1a17] mb-2">Mensagem enviada!</h3>
                  <p className="text-[#4d7068] text-sm">Obrigado pelo contacto. Responderemos em breve.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {erro && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {erro}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#4d7068] mb-1.5">Nome *</label>
                      <input
                        name="nome"
                        type="text"
                        required
                        value={form.nome}
                        onChange={handleChange}
                        placeholder="O seu nome"
                        className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-xl bg-[#f4f9f8] text-[#0a1a17] placeholder-[#4d7068]/50 focus:outline-none focus:ring-2 focus:ring-[#0d6b5e]/20 focus:border-[#0d6b5e] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#4d7068] mb-1.5">Telemóvel *</label>
                      <input
                        name="telemovel"
                        type="tel"
                        required
                        value={form.telemovel}
                        onChange={handleChange}
                        placeholder="9xx xxx xxx"
                        className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-xl bg-[#f4f9f8] text-[#0a1a17] placeholder-[#4d7068]/50 focus:outline-none focus:ring-2 focus:ring-[#0d6b5e]/20 focus:border-[#0d6b5e] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#4d7068] mb-1.5">Email *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="email@exemplo.pt"
                      className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-xl bg-[#f4f9f8] text-[#0a1a17] placeholder-[#4d7068]/50 focus:outline-none focus:ring-2 focus:ring-[#0d6b5e]/20 focus:border-[#0d6b5e] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#4d7068] mb-1.5">Mensagem *</label>
                    <textarea
                      name="mensagem"
                      rows={5}
                      required
                      value={form.mensagem}
                      onChange={handleChange}
                      placeholder="Em que podemos ajudar?"
                      className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-xl bg-[#f4f9f8] text-[#0a1a17] placeholder-[#4d7068]/50 focus:outline-none focus:ring-2 focus:ring-[#0d6b5e]/20 focus:border-[#0d6b5e] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0d6b5e] text-white py-3.5 rounded-xl hover:bg-[#065147] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontWeight: 600 }}
                  >
                    {loading ? 'A enviar...' : 'Enviar Mensagem'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
