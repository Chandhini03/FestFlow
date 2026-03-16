import { useState, useEffect } from 'react';

export default function VendorPOS() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const fetchOrders = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/orders/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
      else throw new Error(data.error);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchOrders();
      else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const placed = orders.filter((o) => o.status === 'Awaiting Verification');
  const preparing = orders.filter((o) => o.status === 'Preparing');

  return (
    <div className="page-wide" style={{ padding: '2rem' }}>
      <h1 className="page-title" style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--cherry-cola)' }}>📋 Live POS</h1>
      <p className="page-subtitle" style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
        Orders update every 3 seconds · <span style={{ color: 'var(--cherry-cola)' }}>{orders.length} active orders</span>
      </p>

      {error && <div className="error-msg">{error}</div>}

      <div className="kanban" style={{ marginTop: '2rem' }}>
        {/* Column: New Orders */}
        <div className="kanban-col" style={{ border: '2px solid var(--cherry-cola)', background: 'white' }}>
          <div className="kanban-col-title" style={{ color: 'var(--cherry-cola)', fontWeight: '900' }}>
            🔔 New ({placed.length})
          </div>
          {placed.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No new orders</p>
          )}
          {placed.map((order) => (
            <div className="kanban-card" key={order._id} style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--cherry-cola)' }}>
                  #{order._id.slice(-6).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '1rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--cherry-dark)' }}>{item.quantity}× {item.name}</span>
                    <span style={{ color: 'var(--cherry-cola)', fontWeight: '800' }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed var(--cherry-cola)', paddingTop: '1rem' }}>
                <span style={{ fontWeight: 900, color: 'var(--cherry-cola)', fontSize: '1.2rem' }}>₹{order.totalAmount}</span>
                <button className="btn btn-success" style={{ padding: '0.5rem 1rem', borderRadius: '50px' }} onClick={() => updateStatus(order._id, 'Preparing')}>
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Column: Preparing */}
        <div className="kanban-col" style={{ border: '2px solid var(--cherry-cola)', background: 'white' }}>
          <div className="kanban-col-title" style={{ color: 'var(--cherry-cola)', fontWeight: '900' }}>
            🔥 Kitchen ({preparing.length})
          </div>
          {preparing.map((order) => (
            <div className="kanban-card" key={order._id} style={{ border: '1px solid var(--cherry-cola)', background: 'var(--cream-vanilla)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 900, color: 'var(--cherry-cola)' }}>
                  #{order._id.slice(-6).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                  📱 {order.customerPhone}
                </span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontWeight: '800', color: 'var(--cherry-dark)' }}>{item.quantity}× {item.name}</div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed var(--cherry-cola)', paddingTop: '1rem' }}>
                <span style={{ fontWeight: 900, color: 'var(--cherry-cola)' }}>₹{order.totalAmount}</span>
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '50px' }} onClick={() => updateStatus(order._id, 'Ready')}>
                  Ready
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
