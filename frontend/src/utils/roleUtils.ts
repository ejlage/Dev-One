import { UserRole } from '../types';

export const hasRole = (userRole: UserRole | UserRole[], role: string): boolean => {
  const userRoles = Array.isArray(userRole) ? userRole : [userRole];
  return userRoles.includes(role.toUpperCase() as UserRole);
};

export const hasAnyRole = (userRole: UserRole | UserRole[], roles: string[]): boolean => {
  const userRoles = Array.isArray(userRole) ? userRole : [userRole];
  return roles.some(r => userRoles.includes(r.toUpperCase() as UserRole));
};

export const getMainRole = (userRole: UserRole | UserRole[]): string => {
  const roles = Array.isArray(userRole) ? userRole : [userRole];
  const priority = ['DIRECAO', 'PROFESSOR', 'ENCARREGADO', 'ALUNO', 'UTILIZADOR'];
  return roles.find(r => priority.includes(r)) || roles[0];
};

export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'DIRECAO': 'Direção',
    'PROFESSOR': 'Professor',
    'ENCARREGADO': 'Encarregado',
    'ALUNO': 'Aluno',
    'UTILIZADOR': 'Utilizador'
  };
  return labels[role.toUpperCase()] || role;
};

export const hasMultipleRoles = (userRole: UserRole | UserRole[]): boolean => {
  return Array.isArray(userRole) && userRole.length > 1;
};

export const getAvailableRoles = (userRole: UserRole | UserRole[], availableRoles?: UserRole[]): UserRole[] => {
  if (availableRoles && availableRoles.length > 0) {
    return availableRoles;
  }
  return Array.isArray(userRole) ? userRole : [userRole];
};
