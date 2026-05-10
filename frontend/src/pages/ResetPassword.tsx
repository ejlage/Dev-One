import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

type Step = 'email' | 'nova-password' | 'sucesso';

const BG_STYLE = {
  backgroundImage: `radial-gradient(circle at 20% 50%, rgba(13,107,94,0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 50%, rgba(201,168,76,0.15) 0%, transparent 50%)`
};

export function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setResetToken(res.token);
      setStep('nova-password');
    } catch (err: any) {
      setErro(err.message || 'Erro ao processar pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (password !== confirmar) {
      setErro('As passwords não coincidem.');
      return;
    }
    if (password.length < 6) {
      setErro('A password deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(resetToken, password);
      setStep('sucesso');
    } catch (err: any) {
      setErro(err.message || 'Erro ao redefinir password.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'sucesso') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a1a17]" style={BG_STYLE}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-[#e2f0ed] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#0d6b5e]" />
          </div>
          <h2 className="text-2xl mb-4 text-[#0a1a17]">Password Alterada!</h2>
          <p className="text-[#4d7068] mb-8">
            A sua password foi redefinida com sucesso.<br />
            Pode iniciar sessão com as novas credenciais.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-block bg-[#0d6b5e] text-white px-8 py-3 rounded-xl hover:bg-[#065147] transition-colors"
            style={{ fontWeight: 600 }}
          >
            Ir para o Login
          </button>
        </div>
      </div>
    );
  }

  if (step === 'nova-password') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a1a17]" style={BG_STYLE}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl mb-3 text-[#c9a84c]">Nova Password</h1>
            <p className="text-[#4d7068]">
              Conta encontrada para <strong className="text-[#0a1a17]">{email}</strong>.<br />
              Escolha uma nova password.
            </p>
          </div>

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm mb-2 text-[#0a1a17]">Nova Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0d6b5e]/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-[#0d6b5e]/20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0d6b5e]/50 hover:text-[#0d6b5e]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-[#0a1a17]">Confirmar Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0d6b5e]/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-[#0d6b5e]/20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
                  placeholder="Repita a password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c9a84c] text-white py-3.5 rounded-xl hover:bg-[#b8943e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 600 }}
            >
              {loading ? 'A guardar...' : 'Definir Nova Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setStep('email'); setErro(''); setPassword(''); setConfirmar(''); }}
              className="text-sm text-[#4d7068] hover:text-[#0d6b5e] transition-colors"
            >
              ← Usar outro email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a1a17]" style={BG_STYLE}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl mb-3 text-[#c9a84c]">Recuperar Password</h1>
          <p className="text-[#4d7068]">
            Insira o seu email para receber<br />instruções de recuperação
          </p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleRequestReset} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm mb-2 text-[#0a1a17]">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0d6b5e]/50" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#0d6b5e]/20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]"
                placeholder="seu.email@exemplo.pt"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9a84c] text-white py-3.5 rounded-xl hover:bg-[#b8943e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontWeight: 600 }}
          >
            {loading ? 'A verificar...' : 'Recuperar Password'}
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
