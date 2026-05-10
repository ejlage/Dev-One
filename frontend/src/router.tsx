import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Home } from './pages/Home';
import { Eventos } from './pages/Eventos';
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Aulas } from './pages/Aulas';
import { Turmas } from './pages/Turmas';
import { Marketplace } from './pages/Marketplace';
import { Stock } from './pages/Stock';
import { Utilizadores } from './pages/Utilizadores';

const NotFound = () => <Navigate to="/" replace />;

function Root() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    Component: Root,
    children: [
      {
        path: '/',
        Component: PublicLayout,
        children: [
          { index: true, Component: Home },
          { path: 'eventos', Component: Eventos },
        ],
      },
      {
        path: '/login',
        Component: Login,
      },
      {
        path: '/reset-password',
        Component: ResetPassword,
      },
      {
        path: '/dashboard',
        Component: DashboardLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: 'aulas', Component: Aulas },
          { path: 'grupos', Component: Turmas },
          { path: 'marketplace', Component: Marketplace },
          { path: 'stock', Component: Stock },
          { path: 'utilizadores', Component: Utilizadores },
        ],
      },
      {
        path: '*',
        Component: NotFound,
      },
    ],
  },
]);