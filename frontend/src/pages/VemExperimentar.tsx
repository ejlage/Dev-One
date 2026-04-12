import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import api from '../services/api';

export function VemExperimentar() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telemovel: '',
    mensagem: 'Gostaria de marcar uma aula experimental.'
  });
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    
    try {
      const response = await api.submitContact(form);
      if (response.success) {
        setEnviado(true);
      } else {
        setErro('Erro ao enviar. Tente novamente.');
      }
    } catch (err) {
      setErro('Erro ao enviar. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f9f8]">
      <section className="bg-[#0a1a17] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl mb-4">Vem Experimentar as Nossas Aulas</h1>
          <p className="text-white/70 text-lg">
            Marque a sua aula experimental gratuita!
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-[#0d6b5e]/10 p-8">
            <h2 className="text-2xl font-semibold text-[#0a1a17] mb-2">Pedir Aula Experimental</h2>
            <p className="text-[#4d7068] mb-6">
              A primeira aula é gratuita! Preencha e entraremos em contacto.
            </p>
            
            {enviado ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#0a1a17] mb-2">Obrigado!</h3>
                <p className="text-[#4d7068]">
                  Recebemos o seu pedido. Entraremos em contacto em breve.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {erro && (
                  <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {erro}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-[#4d7068] mb-1">Nome *</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-lg focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="O seu nome completo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#4d7068] mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-lg focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="o.seu@email.pt"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#4d7068] mb-1">Telemóvel *</label>
                  <input
                    type="tel"
                    value={form.telemovel}
                    onChange={e => setForm({ ...form, telemovel: e.target.value })}
                    className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-lg focus:outline-none focus:border-[#0d6b5e]"
                    placeholder="912 345 678"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#4d7068] mb-1">Mensagem</label>
                  <textarea
                    value={form.mensagem}
                    onChange={e => setForm({ ...form, mensagem: e.target.value })}
                    className="w-full px-4 py-3 border border-[#0d6b5e]/20 rounded-lg focus:outline-none focus:border-[#0d6b5e] h-24 resize-none"
                    placeholder="O que procura..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0d6b5e] text-white py-3 rounded-lg hover:bg-[#0a554a] transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar Pedido
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}