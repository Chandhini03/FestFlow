import { useState, useEffect } from 'react';
import apiFetch from '../api';

export default function LivePOS() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const data = await apiFetch('/orders/active');
      setOrders(data);
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
      await apiFetch(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const placed = orders.filter((o) => o.status === 'placed');
  const approved = orders.filter((o) => o.status === 'approved');

  return (
    <div className="page-wide">
      <h1 className="page-title">📋 Live POS</h1>
      <p className="page-subtitle">
        Orders update every 3 seconds · {orders.length} active order{orders.length !== 1 ? 's' : ''}
      </p>

      {error && <div className="error-msg">{error}</div>}

      <div className="kanban">
        {/* Column: New Orders */}
        <div className="kanban-col">
          <div className="kanban-col-title">🔔 New Orders ({placed.length})</div>
          {placed.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
              No new orders
            </p>
          )}
          {placed.map((order) => (
            <div className="kanban-card" key={order._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-light)' }}>
                  #{order._id.slice(-6).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(order.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantity}× {item.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{order.total}</span>
                <button className="btn btn-success btn-sm" onClick={() => updateStatus(order._id, 'approved')}>
                  ✓ Approve
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Column: Preparing */}
        <div className="kanban-col">
          <div className="kanban-col-title">🔥 Preparing ({approved.length})</div>
          {approved.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
              No orders preparing
            </p>
          )}
          {approved.map((order) => (
            <div className="kanban-card" key={order._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-light)' }}>
                  #{order._id.slice(-6).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  📱 {order.customerWhatsApp}
                </span>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '0.9rem' }}>
                    {item.quantity}× {item.name}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>₹{order.total}</span>
                <button className="btn btn-primary btn-sm" onClick={() => updateStatus(order._id, 'ready')}>
                  🎉 Ready
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
