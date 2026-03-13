import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protects vendor routes — redirects unauthenticated users to login
export function VendorRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user || role !== 'vendor') return <Navigate to="/login" replace />;
  return children;
}

// Protects admin routes — redirects unauthenticated users to admin login
export function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user || role !== 'admin') return <Navigate to="/super-admin/login" replace />;
  return children;
}

// Restricts pending vendors to draft-only pages
export function ApprovedOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (user?.approvalStatus !== 'approved') return <Navigate to="/admin/waiting" replace />;
  return children;
}
