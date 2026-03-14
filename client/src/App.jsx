import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Signup from './pages/Signup';
import PendingDashboard from './pages/PendingDashboard';
import SuperAdminDash from './pages/SuperAdminDash';
import VendorPOS from './pages/VendorPOS';
import VendorHistory from './pages/VendorHistory';
import Storefront from './pages/Storefront';
import CustomerOrders from './components/CustomerOrders';
import './index.css';

// Inline simple state management to save files
export function VendorRoute({ children }) {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/signup" replace />;
  const user = JSON.parse(userStr);
  if (user.role !== 'vendor') return <Navigate to="/signup" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/signup" replace />;
  const user = JSON.parse(userStr);
  if (user.role !== 'admin') return <Navigate to="/signup" replace />;
  return children;
}

export function ApprovedOnly({ children }) {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/signup" replace />;
  const user = JSON.parse(userStr);
  if (user.approvalStatus !== 'approved') return <Navigate to="/admin" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Navbar />
      <CustomerOrders />
      <main className="main-content">
        <Routes>
          {/* Unified Auth Page */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Navigate to="/signup" replace />} />
          <Route path="/super-admin/login" element={<Navigate to="/signup?mode=admin" replace />} />

          {/* Vendor Draft Mode / Menu Builder */}
          <Route
            path="/admin"
            element={
              <VendorRoute>
                <PendingDashboard />
              </VendorRoute>
            }
          />
          <Route
            path="/admin/waiting"
            element={
              <VendorRoute>
                <PendingDashboard />
              </VendorRoute>
            }
          />
          
          {/* Vendor Approved Pages */}
          <Route
            path="/admin/pos"
            element={
              <VendorRoute>
                <ApprovedOnly>
                  <VendorPOS />
                </ApprovedOnly>
              </VendorRoute>
            }
          />
          <Route
            path="/admin/history"
            element={
              <VendorRoute>
                <ApprovedOnly>
                  <VendorHistory />
                </ApprovedOnly>
              </VendorRoute>
            }
          />

          {/* Super Admin */}
          <Route
            path="/super-admin"
            element={
              <AdminRoute>
                <SuperAdminDash />
              </AdminRoute>
            }
          />

          {/* B2C Storefront */}
          <Route path="/store/:slug" element={<Storefront />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/signup" replace />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
