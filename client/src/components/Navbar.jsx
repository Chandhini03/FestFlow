import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isApproved = user.approvalStatus === 'approved';

  return (
    <nav className="navbar">
      <Link to={role === 'admin' ? '/super-admin' : '/admin'} className="navbar-brand">
        <span className="brand-icon">⚡</span> Stally
      </Link>

      <div className="navbar-links">
        {role === 'vendor' && (
          <>
            <Link to="/admin/menu" className="nav-link">
              Menu Builder
            </Link>
            {isApproved && (
              <>
                <Link to="/admin/pos" className="nav-link">
                  POS
                </Link>
                <Link to="/admin/history" className="nav-link">
                  History
                </Link>
              </>
            )}
          </>
        )}
        {role === 'admin' && (
          <>
            <Link to="/super-admin" className="nav-link">
              Dashboard
            </Link>
          </>
        )}
        <button className="nav-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
