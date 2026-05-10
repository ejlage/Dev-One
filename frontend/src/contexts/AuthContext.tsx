import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await api.login(email, password);
      if (result.success && result.user) {
        const userData: User = {
          id: result.user.id,
          nome: result.user.nome,
          email: result.user.email,
          role: result.user.role?.toUpperCase(), // Normalizar para maiúsculas
          telemovel: result.user.telemovel
        };
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: result.message || 'Login falhou' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro ao fazer login' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    api.logout();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}