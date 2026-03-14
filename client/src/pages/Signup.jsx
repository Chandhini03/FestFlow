import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'admin' ? 'admin' : 'signup';
  
  const [mode, setMode] = useState(initialMode); // 'signup', 'login', 'admin'
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let url = '';
    let body = {};
    if (mode === 'signup') {
      url = '/api/vendors/signup';
      body = { name, upiId, password };
    } else if (mode === 'login') {
      url = '/api/vendors/login';
      body = { name, password };
    } else if (mode === 'admin') {
      url = '/api/admin/login';
      body = { password };
    }

    try {
      const res = await fetch(`http://${window.location.hostname}:5005${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authenication failed');

      // Store in localStorage
      localStorage.setItem('token', data.token);
      if (mode === 'admin') {
        localStorage.setItem('user', JSON.stringify({ ...data.admin, role: 'admin' }));
        navigate('/super-admin');
      } else {
        localStorage.setItem('user', JSON.stringify({ ...data.vendor, role: 'vendor' }));
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">
          {mode === 'signup' && '⚡ Create Your Stall'}
          {mode === 'login' && '🔑 Vendor Login'}
          {mode === 'admin' && '🛡️ Super Admin'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'signup' && 'Sign up to start building your menu'}
          {mode === 'login' && 'Welcome back, vendor!'}
          {mode === 'admin' && 'Enter the secret passcode'}
        </p>

        {error && <div className="error-msg" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode !== 'admin' && (
            <div className="form-group" style={{marginBottom: '10px'}}>
              <label className="form-label">Stall Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="The Brownie Boys"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          {mode === 'signup' && (
            <div className="form-group" style={{marginBottom: '10px'}}>
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
          )}
          <div className="form-group" style={{marginBottom: '10px'}}>
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
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{width: '100%', padding: '10px', marginTop: '10px', cursor: 'pointer'}}>
            {loading ? 'Processing...' : (mode === 'signup' ? 'Create Stall' : 'Login')}
          </button>
        </form>

        <div style={{marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
          {mode === 'signup' ? (
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Already have a stall? Log in</a>
          ) : mode === 'login' ? (
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); }}>Need a stall? Sign up</a>
          ) : (
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Back to Vendor Login</a>
          )}
          {mode !== 'admin' && (
            <a href="#" onClick={(e) => { e.preventDefault(); setMode('admin'); }}>Admin Login</a>
          )}
        </div>
      </div>
    </div>
  );
}
