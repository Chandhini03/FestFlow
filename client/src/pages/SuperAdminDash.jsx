import { useState, useEffect } from 'react';

export default function SuperAdminDash() {
  const adminRaw = localStorage.getItem('user');
  const user = adminRaw ? JSON.parse(adminRaw) : null;
  
  const [eventCode, setEventCode] = useState(user?.managedEventCodes?.[0] || '');
  const [applications, setApplications] = useState([]);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('applications'); // 'applications' | 'analytics'
  const token = localStorage.getItem('token');

  const fetchApplications = async () => {
    if (!eventCode) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://${window.location.hostname}:5005/api/admin/applications/${eventCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
      const res = await fetch(`http://${window.location.hostname}:5005/api/admin/orders/${eventCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
  }, [eventCode, tab, token]);

  const handleApprove = async (appId, status) => {
    setError('');
    setMessage('');
    try {
      const res = await fetch(`http://${window.location.hostname}:5005/api/admin/approve/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      fetchApplications();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-wide" style={{padding: '2rem'}}>
      <h1 className="page-title" style={{fontSize: '2rem', marginBottom: '0.5rem'}}>🎛️ Super Admin Dashboard</h1>
      <p className="page-subtitle" style={{color: '#666', marginBottom: '2rem'}}>Manage events, review vendors, and view analytics</p>

      {error && <div className="error-msg" style={{color: 'red', padding: '10px', background: '#fee', borderRadius: '5px', marginBottom: '1rem'}}>{error}</div>}
      {message && <div className="success-msg" style={{color: 'green', padding: '10px', background: '#efe', borderRadius: '5px', marginBottom: '1rem'}}>{message}</div>}

      {/* Event Code Selector */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Event Code:</label>
          <input
            className="form-input" type="text" placeholder="CEG26" value={eventCode}
            onChange={(e) => setEventCode(e.target.value.toUpperCase())}
            style={{ flex: 1, maxWidth: '200px', padding: '0.5rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn" style={{padding: '0.5rem 1rem', background: tab==='applications' ? '#007bff' : '#f8f9fa', color: tab==='applications' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer'}} onClick={() => setTab('applications')}>
              Applications
            </button>
            <button className="btn" style={{padding: '0.5rem 1rem', background: tab==='analytics' ? '#007bff' : '#f8f9fa', color: tab==='analytics' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer'}} onClick={() => setTab('analytics')}>
              Analytics
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="loading-screen" style={{textAlign: 'center', padding: '2rem'}}>Loading...</div>}

      {/* Applications Tab */}
      {!loading && tab === 'applications' && (
        <>
          {applications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#888', border: '1px dashed #ccc', borderRadius: '8px' }}>
              No applications found for {eventCode || '...'}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.map((app) => (
                <div className="card" key={app._id} style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                        {app.vendorId?.name || 'Unknown Vendor'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                        UPI: <span style={{ color: '#0066cc' }}>{app.vendorId?.upiId}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                        Slug: /{app.vendorId?.slug}
                      </div>
                      {app.vendorId?.inventory?.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                            Menu Preview
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {app.vendorId.inventory.map((item, i) => (
                              <span key={i} style={{ padding: '0.25rem 0.6rem', background: '#f8f9fa', borderRadius: '6px', fontSize: '0.8rem', color: '#555', border: '1px solid #eee' }}>
                                {item.name} · ₹{item.price}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', background: app.status==='approved'?'#d4edda':(app.status==='rejected'?'#f8d7da':'#fff3cd'), color: app.status==='approved'?'#155724':(app.status==='rejected'?'#721c24':'#856404')}}>
                        {app.status}
                      </span>
                      {app.status === 'pending' && (
                        <>
                          <button className="btn" style={{padding: '0.3rem 0.8rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'}} onClick={() => handleApprove(app._id, 'approved')}>
                            ✓ Approve
                          </button>
                          <button className="btn" style={{padding: '0.3rem 0.8rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'}} onClick={() => handleApprove(app._id, 'rejected')}>
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
          <div className="card" style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '3rem', flexWrap: 'wrap', background: '#f8f9fa' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'bold' }}>Event Revenue</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'green' }}>₹{orders.totalRevenue?.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'bold' }}>Total Orders</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#333' }}>{orders.totalOrders}</div>
            </div>
          </div>

          {orders.orders?.length > 0 && (
            <div className="table-wrapper" style={{background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                <thead style={{background: '#f1f3f5', borderBottom: '2px solid #ddd'}}>
                  <tr>
                    <th style={{padding: '1rem'}}>Vendor</th>
                    <th style={{padding: '1rem'}}>Order ID</th>
                    <th style={{padding: '1rem'}}>Items</th>
                    <th style={{padding: '1rem'}}>Total</th>
                    <th style={{padding: '1rem'}}>Status</th>
                    <th style={{padding: '1rem'}}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.orders.map((o) => (
                    <tr key={o._id} style={{borderBottom: '1px solid #eee'}}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{o.vendorId?.name || '—'}</td>
                      <td style={{ padding: '1rem', color: '#0066cc' }}>#{o._id.slice(-6).toUpperCase()}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{o.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}</td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'green' }}>₹{o.totalAmount}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', background: (o.status === 'Completed' || o.status === 'Ready') ? '#d4edda' : '#fff3cd', color: (o.status === 'Completed' || o.status === 'Ready') ? '#155724' : '#856404'}}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: '#888' }}>{new Date(o.createdAt).toLocaleString()}</td>
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
