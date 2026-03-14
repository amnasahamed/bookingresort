import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeStorage } from '@/lib/storage';
import LandingPage from '@/pages/LandingPage';
import AdminDashboard from '@/pages/AdminDashboard';
import PropertyPage from '@/pages/PropertyPage';
import SuperadminLogin from '@/pages/SuperadminLogin';
import SuperadminDashboard from '@/pages/SuperadminDashboard';
import NotFound from '@/pages/NotFound';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import './App.css';

// Protected route component for admins
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Authenticating...</div>;
  return user && (user.role === 'admin' || user.role === 'superadmin') ? <>{children}</> : <Navigate to="/?admin=true" replace />;
}

// Protected route component for superadmin
function ProtectedSuperadminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Authenticating...</div>;
  return user && user.role === 'superadmin' ? <>{children}</> : <Navigate to="/superadmin/login" replace />;
}

function App() {
  useEffect(() => {
    initializeStorage();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/superadmin"
              element={
                <ProtectedSuperadminRoute>
                  <SuperadminDashboard />
                </ProtectedSuperadminRoute>
              }
            />
            <Route path="/superadmin/login" element={<SuperadminLogin />} />
            <Route path="/p/:slug" element={<PropertyPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
