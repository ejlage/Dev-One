import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Email ou password incorretos');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a1a17] flex items-center justify-center px-4"
      style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(13,107,94,0.3) 0%, transparent 50%),
                          radial-gradient(circle at 80% 50%, rgba(201,168,76,0.15) 0%, transparent 50%)`
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2 text-[#0d6b5e]">
            ENT'<span className="text-[#c9a84c]">ARTES</span>
          </h1>
          <p className="text-[#4d7068]">Iniciar sessão</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm mb-2 text-[#4d7068]">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0d6b5e]/50" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:ring-2 focus:ring-[#0d6b5e]/30 focus:border-[#0d6b5e]"
                placeholder="seu.email@exemplo.pt"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-2 text-[#4d7068]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0d6b5e]/50" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:ring-2 focus:ring-[#0d6b5e]/30 focus:border-[#0d6b5e]"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/reset-password"
              className="text-sm text-[#0d6b5e] hover:text-[#065147] transition-colors"
            >
              Esqueceu a password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0d6b5e] text-white py-3.5 rounded-xl hover:bg-[#065147] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontWeight: 600 }}
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-[#e2f0ed] rounded-xl border border-[#0d6b5e]/20">
          <p className="text-sm text-[#0a1a17] mb-2">
            <strong>Contas de teste:</strong>
          </p>
          <div className="space-y-1 text-xs text-[#0d6b5e]">
            <p>• <strong>Direção:</strong> direcao@entartes.pt</p>
            <p>• <strong>Professor:</strong> joao.santos@entartes.pt</p>
            <p>• <strong>Encarregado:</strong> pedro.oliveira@email.pt</p>
            <p>• <strong>Aluno:</strong> miguel.oliveira@email.pt</p>
            <p className="mt-2 text-[#4d7068]">Password para todos: <strong className="text-[#0a1a17]">password123</strong></p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-[#4d7068] hover:text-[#0d6b5e] transition-colors">
            ← Voltar ao Site
          </Link>
        </div>
      </div>
    </div>
  );
}