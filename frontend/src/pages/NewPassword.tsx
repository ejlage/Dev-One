import { useState, useEffect, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const API_URL = 'http://localhost:3000/api';

export function NewPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de recuperação inválido ou expirado');
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As passwords não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.error || 'Erro ao redefinir password');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 bg-[#0a1a17]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(13,107,94,0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 50%, rgba(201,168,76,0.15) 0%, transparent 50%)`
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-[#e2f0ed] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#0d6b5e]" />
          </div>
          <h2 className="text-2xl mb-4 text-[#0a1a17]">Password Alterada!</h2>
          <p className="text-[#4d7068] mb-8">
            A sua password foi redefinida com sucesso.<br />
            Vai ser redirecionado para o login...
          </p>
          <Link
            to="/login"
            className="inline-block bg-[#0d6b5e] text-white px-8 py-3 rounded-xl hover:bg-[#065147] transition-colors"
            style={{ fontWeight: 600 }}
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-[#0a1a17]"
      style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(13,107,94,0.3) 0%, transparent 50%),
                          radial-gradient(circle at 80% 50%, rgba(201,168,76,0.15) 0%, transparent 50%)`
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-3 text-[#c9a84c]">Nova Password</h1>
          <p className="text-[#4d7068]">
            Insira a sua nova password
          </p>
        </div>

        {error && !token && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm mb-2 text-[#0a1a17]">
              Nova Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0d6b5e]/50" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-[#0d6b5e]/20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
                placeholder="••••••••"
                required
                disabled={!token}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0d6b5e]/50 hover:text-[#0d6b5e]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm mb-2 text-[#0a1a17]">
              Confirmar Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0d6b5e]/50" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#0d6b5e]/20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
                placeholder="••••••••"
                required
                disabled={!token}
              />
            </div>
          </div>

          {error && token && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-[#c9a84c] text-white py-3.5 rounded-xl hover:bg-[#b8943e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontWeight: 600 }}
          >
            {loading ? 'A redefinir...' : 'Alterar Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-[#4d7068] hover:text-[#0d6b5e] transition-colors"
          >
            ← Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  );
}