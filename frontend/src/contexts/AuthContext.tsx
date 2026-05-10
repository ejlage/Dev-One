import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  activeRole: string;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setActiveRole: (role: string) => void;
  isAuthenticated: boolean;
  loading: boolean;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRoleState] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        const token = localStorage.getItem('authToken');
        
        if (storedUser && token) {
          try {
            const parsed = JSON.parse(storedUser);
            // Check if availableRoles exists and is valid (array with items)
            if (!parsed.availableRoles || !Array.isArray(parsed.availableRoles) || parsed.availableRoles.length === 0) {
              localStorage.removeItem('currentUser');
              localStorage.removeItem('authToken');
              localStorage.removeItem('activeRole');
              setLoading(false);
              return;
            }
            let parsedRole: UserRole | UserRole[] = 'UTILIZADOR';
            if (parsed.role) {
              if (Array.isArray(parsed.role)) {
                parsedRole = parsed.role.map((r: string) => r.toUpperCase()) as UserRole[];
              } else if (typeof parsed.role === 'string' && parsed.role.startsWith('[')) {
                try {
                  parsedRole = JSON.parse(parsed.role).map((r: string) => r.toUpperCase()) as UserRole[];
                } catch (_) {
                  parsedRole = parsed.role.toUpperCase() as UserRole;
                }
              } else {
                parsedRole = parsed.role.toUpperCase() as UserRole;
              }
            }
            setUser({ ...parsed, id: String(parsed.id), role: parsedRole });
            const storedActive = localStorage.getItem('activeRole');
            const userRoles = Array.isArray(parsedRole) ? parsedRole : [parsedRole];
            const activeToSet = storedActive && userRoles.includes(storedActive as UserRole) ? storedActive : userRoles[0];
            const normalizedActive = normalizeRole(activeToSet);
            setActiveRoleState(normalizedActive);
            localStorage.setItem('activeRole', normalizedActive);
            setLoading(false);
          } catch (e) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('activeRole');
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error('AuthContext init error:', e);
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const parseRole = (role: any): UserRole | UserRole[] => {
    if (!role) return 'UTILIZADOR';
    if (Array.isArray(role)) {
      return role.map((r: string) => r.toUpperCase()) as UserRole[];
    }
    if (typeof role === 'string') {
      if (role.startsWith('[')) {
        try {
          const parsed = JSON.parse(role);
          return Array.isArray(parsed) ? parsed.map((r: string) => r.toUpperCase()) as UserRole[] : role.toUpperCase() as UserRole;
        } catch (_) {
          return role.toUpperCase() as UserRole;
        }
      }
      return role.toUpperCase() as UserRole;
    }
    return 'UTILIZADOR';
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await api.login(email, password);
      if (result.success && result.user) {
        console.log('[AuthContext] Login response:', { 
          role: result.user.role, 
          availableRoles: result.user.availableRoles,
          typeOfRole: typeof result.user.role,
          typeOfAvailableRoles: typeof result.user.availableRoles
        });
        
        const roleFromApi = result.user.role;
        const parsedRole = parseRole(roleFromApi);
        const availableRolesFromApi = result.user.availableRoles;
        
        console.log('[AuthContext] parsedRole:', parsedRole);
        
        const parsedAvailableRoles = Array.isArray(availableRolesFromApi) 
          ? availableRolesFromApi.map((r: string) => r.toUpperCase()) as UserRole[]
          : typeof availableRolesFromApi === 'string' && availableRolesFromApi.startsWith('[')
            ? JSON.parse(availableRolesFromApi).map((r: string) => r.toUpperCase()) as UserRole[]
            : [roleFromApi].map(r => r?.toUpperCase() || 'UTILIZADOR') as UserRole[];
         
        console.log('[AuthContext] parsedAvailableRoles:', parsedAvailableRoles);
         
        const userData: User = {
          id: String(result.user.id),
          nome: result.user.nome,
          email: result.user.email,
          role: parsedRole,
          telemovel: result.user.telemovel,
          alunosIds: result.user.alunosIds || [],
          availableRoles: parsedAvailableRoles
        };
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        if (result.token) {
          localStorage.setItem('authToken', result.token);
        }
        const roleToSet = Array.isArray(parsedAvailableRoles) ? parsedAvailableRoles[0] : parsedRole;
        console.log('[AuthContext] roleToSet (before normalize):', roleToSet);
        const normalizedRole = normalizeRole(roleToSet);
        console.log('[AuthContext] normalizedRole:', normalizedRole);
        setActiveRoleState(normalizedRole);
        localStorage.setItem('activeRole', normalizedRole);
        return { success: true };
      }
      return { success: false, message: (result as any).message || 'Login falhou' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro ao fazer login' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeRole');
    api.logout();
  };

  const normalizeRole = (role: any): string => {
    if (!role) return 'UTILIZADOR';
    if (Array.isArray(role)) {
      return String(role[0]).toUpperCase();
    }
    if (typeof role === 'string') {
      if (role.startsWith('[')) {
        try {
          const parsed = JSON.parse(role);
          return String(parsed[0]).toUpperCase();
        } catch (_) {
          return role.replace(/^\["|"\]/g, '').split(',')[0].toUpperCase();
        }
      }
      const parts = role.split(/[;,\s]+/);
      return parts[0].trim().toUpperCase();
    }
    return String(role).toUpperCase();
  };

  const setActiveRole = (role: string) => {
    const normalized = normalizeRole(role);
    setActiveRoleState(normalized);
    localStorage.setItem('activeRole', normalized);
  };

  const hasRole = (...roles: string[]): boolean => {
    if (!user) return false;
    const checkRoles = roles.map(r => r.toUpperCase());
    return checkRoles.includes(activeRole.toUpperCase());
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      activeRole,
      login, 
      logout,
      setActiveRole,
      isAuthenticated: !!user,
      loading,
      hasRole
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