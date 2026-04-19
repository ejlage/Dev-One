import { useState } from 'react';
import { MapPin, Phone, Mail, Send } from 'lucide-react';

export function Contactos() {
  const [form, setForm] = useState({ nome: '', email: '', mensagem: '' });
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.mensagem) {
      setErro('Preencha todos os campos');
      return;
    }
    setEnviado(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f9f8]">
      {/* Hero */}
      <section className="bg-[#0a1a17] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl mb-4">Contactos</h1>
          <p className="text-white/70 text-lg">Estamos disponíveis para esclarecer as suas dúvidas</p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#0d6b5e]/10">
              <MapPin className="w-8 h-8 text-[#0d6b5e] mb-4" />
              <h3 className="text-lg font-semibold text-[#0a1a17] mb-2">Onde estamos</h3>
              <p className="text-[#4d7068] text-sm">
                Rua Dr. Manuel de Oliveira Machado, n°21 e 23, R/Chão<br />
                4700-054 Braga
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#0d6b5e]/10">
              <Phone className="w-8 h-8 text-[#0d6b5e] mb-4" />
              <h3 className="text-lg font-semibold text-[#0a1a17] mb-2">Telefone</h3>
              <p className="text-[#4d7068] text-sm">
                (+351) 964 693 247<br />
                <span className="text-xs">(Chamada Rede Móvel Nacional PT)</span>
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#0d6b5e]/10">
              <Mail className="w-8 h-8 text-[#0d6b5e] mb-4" />
              <h3 className="text-lg font-semibold text-[#0a1a17] mb-2">Email</h3>
              <p className="text-[#4d7068] text-sm">
                geral@entartes.pt
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#0d6b5e]/10 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-[#0a1a17] mb-6">Envie-nos uma mensagem</h2>
            
            {enviado ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-[#0a1a17] mb-2">Obrigado!</h3>
                <p className="text-[#4d7068]">A sua mensagem foi enviada com sucesso!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {erro && (
                  <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {erro}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-[#4d7068] mb-1">Nome</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-lg focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="O seu nome"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#4d7068] mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-lg focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="o.seu@email.pt"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#4d7068] mb-1">Mensagem</label>
                  <textarea
                    value={form.mensagem}
                    onChange={e => setForm({ ...form, mensagem: e.target.value })}
                    className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-lg focus:outline-none focus:border-[#0d6b5e] h-32 resize-none"
                    placeholder="A sua mensagem..."
                  />
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" required className="mt-1" />
                  <span className="text-sm text-[#4d7068]">
                    Aceito os <a href="#" className="text-[#0d6b5e] underline">Termos de Serviço</a>
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0d6b5e] text-white py-3 rounded-lg hover:bg-[#0a554a] transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar Mensagem
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* mapa */}
      <section className="bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#4d7068]">Também pode encontrar-nos nas redes sociais:</p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="https://www.facebook.com/entartes.escoladedanca" target="_blank" rel="noopener noreferrer" className="text-[#0d6b5e] hover:text-[#c9a84c]">Facebook</a>
            <a href="https://www.instagram.com/entartes_escoladedanca/" target="_blank" rel="noopener noreferrer" className="text-[#0d6b5e] hover:text-[#c9a84c]">Instagram</a>
            <a href="https://www.youtube.com/@entartesescoladedanca" target="_blank" rel="noopener noreferrer" className="text-[#0d6b5e] hover:text-[#c9a84c]">YouTube</a>
          </div>
        </div>
      </section>
    </div>
  );
}