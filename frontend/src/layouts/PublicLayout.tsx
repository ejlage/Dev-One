import { Outlet, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function PublicLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <nav className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl text-white" style={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              ENT'<span className="text-[#c9a84c]">ARTES</span>
            </Link>

            <div className="flex items-center gap-6">
              <Link
                to="/eventos"
                className="text-white/80 hover:text-[#c9a84c] transition-colors"
              >
                Eventos
              </Link>
              <Link
                to="/contactos"
                className="text-white/80 hover:text-[#c9a84c] transition-colors"
              >
                Contactos
              </Link>
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-[#c9a84c] text-[#0a1a17] px-6 py-2 rounded-full hover:bg-[#e8c97a] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  Área Pessoal
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-[#c9a84c] text-[#0a1a17] px-6 py-2 rounded-full hover:bg-[#e8c97a] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <Outlet />

      {/* Footer */}
      <footer className="bg-[#070f0d] text-white py-14 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="text-2xl mb-3" style={{ fontWeight: 700 }}>
                ENT'<span className="text-[#c9a84c]">ARTES</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                Escola de Dança e Artes Performativas.<br />
                A arte de mover, a arte de sentir.
              </p>
            </div>

            <div>
              <h4 className="text-[#c9a84c] tracking-widest uppercase text-xs mb-5">Contactos</h4>
              <div className="space-y-2 text-white/60 text-sm">
                <p>Email: <a href="mailto:entartes@atomicmail.io" className="hover:text-[#c9a84c] transition-colors">entartes@atomicmail.io</a></p>
                <p>Telefone: (+351) 964 693 247</p>
                <p>Morada: Rua Dr. Manuel de Oliveira Machado, n°21 e 23, R/ Chão, 4700-054 Braga</p>
                <Link to="/contactos" className="inline-block mt-2 text-[#c9a84c] hover:text-[#e8c97a] transition-colors">
                  Página de Contactos →
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-[#c9a84c] tracking-widest uppercase text-xs mb-5">Horário</h4>
              <div className="space-y-2 text-white/60 text-sm">
                <p>Segunda a Sexta: 10h - 22h</p>
                <p>Sábado: 9h - 18h</p>
                <p>Domingo: Fechado</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-white/30 text-sm">
            <p>&copy; 2026 ENT'ARTES. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
