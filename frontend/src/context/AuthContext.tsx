import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

const mockUsers: User[] = [
  { id: '1', nome: 'direcao', email: 'direcao@entartes.pt', role: 'DIRECAO' },
  { id: '2', nome: 'Prof. João', email: 'joao.santos@entartes.pt', role: 'PROFESSOR' },
  { id: '3', nome: 'Pedro Oliveira', email: 'pedro.oliveira@email.pt', role: 'ENCARREGADO' },
  { id: '4', nome: 'Miguel Oliveira', email: 'miguel.oliveira@email.pt', role: 'ALUNO' },
  
];

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    // Mock login - em produção seria validado no backend
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password === 'password123') {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user 
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
