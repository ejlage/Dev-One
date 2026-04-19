import { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Home, Calendar, ShoppingBag, Package, Users, BookOpen } from 'lucide-react';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const roleLabel: Record<string, string> = {
    DIRECAO: 'Direção',
    PROFESSOR: 'Professor',
    ENCARREGADO: 'Encarregado',
    ALUNO: 'Aluno',
  };

  const navItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Início',
      roles: ['ALUNO', 'ENCARREGADO', 'PROFESSOR', 'DIRECAO']
    },
    {
      path: '/dashboard/aulas',
      icon: Calendar,
      label: 'Aulas',
      roles: ['ALUNO', 'ENCARREGADO', 'PROFESSOR', 'DIRECAO']
    },
    {
      path: '/dashboard/turmas',
      icon: BookOpen,
      label: 'Grupos',
      roles: ['ALUNO', 'ENCARREGADO', 'PROFESSOR', 'DIRECAO']
    },
    {
      path: '/dashboard/marketplace',
      icon: ShoppingBag,
      label: 'Marketplace',
      roles: ['ALUNO', 'ENCARREGADO', 'PROFESSOR', 'DIRECAO']
    },
    {
      path: '/dashboard/stock',
      icon: Package,
      label: 'Stock',
      roles: ['DIRECAO']
    },
    {
      path: '/dashboard/utilizadores',
      icon: Users,
      label: 'Utilizadores',
      roles: ['DIRECAO']
    }
  ].filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#f4f9f8]">
      {/* Top Navigation */}
      <nav className="bg-[#0a1a17] shadow-lg sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="text-xl text-white" style={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                ENT'<span className="text-[#c9a84c]">ARTES</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-white/20">|</span>
                <span className="text-xs text-white/50">{user.nome}</span>
                <span className="text-xs bg-[#c9a84c]/20 text-[#c9a84c] px-2 py-0.5 rounded-full">
                  {roleLabel[user.role]}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                        isActive(item.path)
                          ? 'bg-[#c9a84c] text-[#0a1a17]'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors ml-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline text-sm">Sair</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex gap-1 pb-3 overflow-x-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
                    isActive(item.path)
                      ? 'bg-[#c9a84c] text-[#0a1a17]'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <Outlet />
    </div>
  );
}