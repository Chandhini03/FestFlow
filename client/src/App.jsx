import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VendorRoute, AdminRoute, ApprovedOnly } from './components/Guards';
import Navbar from './components/Navbar';

// Auth pages
import Signup from './pages/Signup';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';

// Vendor pages
import WaitingRoom from './pages/WaitingRoom';
import MenuBuilder from './pages/MenuBuilder';
import LivePOS from './pages/LivePOS';
import History from './pages/History';

// Admin pages
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Public pages
import Storefront from './pages/Storefront';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Auth */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/super-admin/login" element={<AdminLogin />} />

            {/* Vendor Dashboard — Waiting Room (accessible to all vendors) */}
            <Route
              path="/admin"
              element={
                <VendorRoute>
                  <WaitingRoom />
                </VendorRoute>
              }
            />
            <Route
              path="/admin/waiting"
              element={
                <VendorRoute>
                  <WaitingRoom />
                </VendorRoute>
              }
            />

            {/* Vendor Dashboard — Menu Builder (accessible to all vendors, even pending) */}
            <Route
              path="/admin/menu"
              element={
                <VendorRoute>
                  <MenuBuilder />
                </VendorRoute>
              }
            />

            {/* Vendor Dashboard — Approved Only */}
            <Route
              path="/admin/pos"
              element={
                <VendorRoute>
                  <ApprovedOnly>
                    <LivePOS />
                  </ApprovedOnly>
                </VendorRoute>
              }
            />
            <Route
              path="/admin/history"
              element={
                <VendorRoute>
                  <ApprovedOnly>
                    <History />
                  </ApprovedOnly>
                </VendorRoute>
              }
            />

            {/* Super Admin */}
            <Route
              path="/super-admin"
              element={
                <AdminRoute>
                  <SuperAdminDashboard />
                </AdminRoute>
              }
            />

            {/* B2C Storefront */}
            <Route path="/store/:slug" element={<Storefront />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
