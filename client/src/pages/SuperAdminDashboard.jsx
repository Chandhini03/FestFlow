import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../api';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [eventCode, setEventCode] = useState(user?.managedEventCodes?.[0] || '');
  const [applications, setApplications] = useState([]);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('applications'); // 'applications' | 'analytics'

  const fetchApplications = async () => {
    if (!eventCode) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/admin/applications/${eventCode}`);
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!eventCode) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/admin/orders/${eventCode}`);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventCode) {
      if (tab === 'applications') fetchApplications();
      if (tab === 'analytics') fetchOrders();
    }
  }, [eventCode, tab]);

  const handleApprove = async (appId, status) => {
    setError('');
    setMessage('');
    try {
      const data = await apiFetch(`/admin/approve/${appId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setMessage(data.message);
      fetchApplications();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-wide">
      <h1 className="page-title">🎛️ Super Admin Dashboard</h1>
      <p className="page-subtitle">Manage events, review vendors, and view analytics</p>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      {/* Event Code Selector */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Event Code:</label>
          <input
            className="form-input"
            type="text"
            placeholder="CEG26"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value.toUpperCase())}
            style={{ flex: 1, maxWidth: '200px' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn ${tab === 'applications' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setTab('applications')}
            >
              Applications
            </button>
            <button
              className={`btn ${tab === 'analytics' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setTab('analytics')}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="loading-screen">Loading...</div>}

      {/* Applications Tab */}
      {!loading && tab === 'applications' && (
        <>
          {applications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No applications found for {eventCode || '...'}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.map((app) => (
                <div className="card" key={app._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                        {app.vendorId?.stallName || 'Unknown Vendor'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        UPI: <span style={{ color: 'var(--accent-light)' }}>{app.vendorId?.upiId}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Slug: /{app.vendorId?.slug}
                      </div>
                      {/* Menu Preview */}
                      {app.vendorId?.inventory?.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                            Menu Preview
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {app.vendorId.inventory.map((item, i) => (
                              <span key={i} style={{
                                padding: '0.25rem 0.6rem',
                                background: 'var(--bg-input)',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                              }}>
                                {item.name} · ₹{item.price}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge badge-${app.status}`}>{app.status}</span>
                      {app.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(app._id, 'approved')}>
                            ✓ Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleApprove(app._id, 'rejected')}>
                            ✕ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Analytics Tab */}
      {!loading && tab === 'analytics' && orders && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Event Revenue
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
                ₹{orders.totalRevenue?.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total Orders
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                {orders.totalOrders}
              </div>
            </div>
          </div>

          {orders.orders?.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Order ID</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.orders.map((o) => (
                    <tr key={o._id}>
                      <td style={{ fontWeight: 600 }}>{o.vendorId?.stallName || '—'}</td>
                      <td style={{ color: 'var(--accent-light)' }}>#{o._id.slice(-6).toUpperCase()}</td>
                      <td>{o.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{o.total}</td>
                      <td><span className={`badge badge-${o.status === 'completed' || o.status === 'ready' ? 'approved' : 'pending'}`}>{o.status}</span></td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
