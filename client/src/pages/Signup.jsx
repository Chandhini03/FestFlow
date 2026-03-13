import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [stallName, setStallName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(stallName, upiId, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">⚡ Create Your Stall</h1>
        <p className="auth-subtitle">Sign up to start building your menu</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Stall Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="The Brownie Boys"
              value={stallName}
              onChange={(e) => setStallName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">UPI ID</label>
            <input
              className="form-input"
              type="text"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Stall'}
          </button>
        </form>

        <p className="auth-link">
          Already have a stall? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
