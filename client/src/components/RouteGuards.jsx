import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useAdminAuth } from '../context/AuthContext';
import { PageSpinner } from './ui';
import Navbar from './Navbar';
import Footer from './Footer';

// Pages that need a logged-in customer
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

// Admin panel pages
export function RequireAdmin({ children }) {
  const { user, loading } = useAdminAuth();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

// Opens every new page at the top
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function ShopLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
